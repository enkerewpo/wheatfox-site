/**
 * ============================================================================
 *  Robonix Lab —— 能力运行时
 * ============================================================================
 *
 *  照搬 Robonix 自己的三层包结构（syswonder 里就是这么分的）：
 *
 *    primitive/*   硬件能力。chassis、arm、camera、speaker。
 *                  每个对应一段预置动画。
 *    service/*     共享服务，不是硬件。navigation、speech、scene、planner。
 *                  内部会去调 primitive。
 *    skill/*       组合行为。fetch、put、cook、tidy_up。
 *                  由 primitive 和 service 拼出来。
 *
 *  最关键的一条：**VLM 只能产出计划，不能绕过运行时**。
 *  模型输出的每一步都要过 validate()：能力存在吗、参数在定义域里吗、
 *  前置条件满足吗。任何一条不过就拒绝执行并把原因回给模型。
 *  这就是「把模型当服务、由系统编排」的实际含义。
 */

/* ========================================================================== */
/* 世界状态                                                                    */
/* ========================================================================== */

export const PLACES = [
  'living-room',
  'counter',   // 料理台
  'stove',     // 灶台
  'fridge',    // 冰箱
  'sink',      // 水槽
  'shelf',     // 架子
] as const;
export type Place = (typeof PLACES)[number];

export const OBJECTS = [
  'tomato',
  'egg',
  'noodles',
  'pan',
  'plate',
  'cup',
  'book',
] as const;
export type ObjectId = (typeof OBJECTS)[number];

/** 每个物体「应该」在哪 —— tidy_up 靠这个判断什么东西乱放了 */
export const HOME_OF: Record<ObjectId, Place> = {
  tomato: 'fridge',
  egg: 'fridge',
  noodles: 'shelf',
  pan: 'stove',
  plate: 'shelf',
  cup: 'shelf',
  book: 'living-room',
};

export type WorldState = {
  at: Place;
  where: Record<ObjectId, Place>;
  holding: ObjectId | null;
  /** 当前位置看见过的东西。换地方就清空 —— 没看见就不许抓 */
  detected: Set<ObjectId>;
  /** 灶台上正在做的菜 */
  cooking: string | null;
  /** 已经做好的菜 */
  served: string[];
};

export function initialWorld(): WorldState {
  return {
    at: 'living-room',
    where: {
      tomato: 'fridge',
      egg: 'fridge',
      noodles: 'shelf',
      pan: 'stove',
      plate: 'shelf',
      cup: 'counter',   // 故意放错位置，给 tidy_up 留活
      book: 'counter',  // 同上
    },
    holding: null,
    detected: new Set(),
    cooking: null,
    served: [],
  };
}

/* ========================================================================== */
/* 能力定义                                                                    */
/* ========================================================================== */

export type Layer = 'primitive' | 'service' | 'skill';

export type CapResult = { ok: true; detail: string } | { ok: false; error: string };

export type Param = { name: string; domain: readonly string[] | 'string' };

export type Capability = {
  /** 完整名字，例如 primitive/chassis.move */
  id: string;
  layer: Layer;
  params: Param[];
  returns: string;
  /** 一句话说明，展示给用户也喂给 VLM */
  doc: string;
  /**
   * 前置条件。不满足就直接失败，不进入动画。
   * 返回 null 表示可以执行。
   */
  pre?: (w: WorldState, args: string[]) => string | null;
  /** 对世界状态的影响。动画播完之后才调用 */
  effect?: (w: WorldState, args: string[]) => void;
  /** skill 层：展开成更底层的步骤 */
  expand?: (w: WorldState, args: string[]) => Step[];
};

export type Step = { cap: string; args: string[] };

/* -------------------------------------------------------- primitive 层 */

const primitives: Capability[] = [
  {
    id: 'primitive/chassis.move',
    layer: 'primitive',
    params: [{ name: 'to', domain: PLACES }],
    returns: 'Pose',
    doc: 'Drive the base to a place. Low level — prefer service/navigation.',
    effect(w, [to]) {
      w.at = to as Place;
      w.detected.clear();
    },
  },
  {
    id: 'primitive/camera.detect',
    layer: 'primitive',
    params: [{ name: 'object', domain: OBJECTS }],
    returns: 'Detection { found, pose }',
    doc: 'Look for an object at the current location.',
    pre: (w, [o]) =>
      w.where[o as ObjectId] === w.at ? null : `${o} is not at ${w.at}`,
    effect(w, [o]) {
      w.detected.add(o as ObjectId);
    },
  },
  {
    id: 'primitive/arm.grasp',
    layer: 'primitive',
    params: [{ name: 'object', domain: OBJECTS }],
    returns: 'Grasp { success }',
    doc: 'Close the gripper on an object. Must be detected first.',
    pre(w, [o]) {
      const obj = o as ObjectId;
      if (w.holding) return `gripper busy: already holding ${w.holding}`;
      if (!w.detected.has(obj)) return `${o} not detected — call camera.detect first`;
      if (w.where[obj] !== w.at) return `${o} is out of reach (it is at ${w.where[obj]})`;
      return null;
    },
    effect(w, [o]) {
      w.holding = o as ObjectId;
    },
  },
  {
    id: 'primitive/arm.release',
    layer: 'primitive',
    params: [{ name: 'target', domain: PLACES }],
    returns: 'Release { success }',
    doc: 'Open the gripper, putting whatever is held onto the target surface.',
    pre(w, [target]) {
      if (!w.holding) return 'gripper is empty';
      if (w.at !== target) return `not at ${target} (currently at ${w.at})`;
      return null;
    },
    effect(w, [target]) {
      w.where[w.holding!] = target as Place;
      w.holding = null;
    },
  },
  {
    id: 'primitive/speaker.say',
    layer: 'primitive',
    params: [{ name: 'text', domain: 'string' }],
    returns: 'void',
    doc: 'Speak a short line out loud (speech bubble + TTS).',
  },
];

/* ---------------------------------------------------------- service 层 */

const services: Capability[] = [
  {
    id: 'service/navigation.goto',
    layer: 'service',
    params: [{ name: 'place', domain: PLACES }],
    returns: 'Pose',
    doc: 'Plan a collision-free path and drive there. Use this, not chassis.move.',
    expand: (_w, [place]) => [{ cap: 'primitive/chassis.move', args: [place] }],
  },
  {
    id: 'service/speech.say',
    layer: 'service',
    params: [{ name: 'text', domain: 'string' }],
    returns: 'void',
    doc: 'Say something to the user.',
    expand: (_w, [text]) => [{ cap: 'primitive/speaker.say', args: [text] }],
  },
  {
    id: 'service/scene.locate',
    layer: 'service',
    params: [{ name: 'object', domain: OBJECTS }],
    returns: 'Place',
    doc: 'Ask the semantic map where an object is, without going there.',
    // 查地图不需要在现场，也不改变世界
  },
];

/* ------------------------------------------------------------ skill 层 */

/** 菜谱：做一道菜需要哪些食材 */
export const RECIPES: Record<string, ObjectId[]> = {
  'tomato-egg': ['tomato', 'egg'],
  'noodles': ['noodles', 'egg'],
};

const skills: Capability[] = [
  {
    id: 'skill/fetch',
    layer: 'skill',
    params: [{ name: 'object', domain: OBJECTS }],
    returns: 'Holding',
    doc: 'Go wherever the object is, look at it, and pick it up.',
    expand(w, [o]) {
      const obj = o as ObjectId;
      const at = w.where[obj];
      return [
        { cap: 'service/navigation.goto', args: [at] },
        { cap: 'primitive/camera.detect', args: [obj] },
        { cap: 'primitive/arm.grasp', args: [obj] },
      ];
    },
  },
  {
    id: 'skill/put',
    layer: 'skill',
    params: [
      { name: 'object', domain: OBJECTS },
      { name: 'target', domain: PLACES },
    ],
    returns: 'Placed',
    doc: 'Put an object onto a surface. Fetches it first if not already held.',
    expand(w, [o, target]) {
      const obj = o as ObjectId;
      const steps: Step[] = [];
      if (w.holding !== obj) steps.push({ cap: 'skill/fetch', args: [obj] });
      steps.push({ cap: 'service/navigation.goto', args: [target] });
      steps.push({ cap: 'primitive/arm.release', args: [target] });
      return steps;
    },
  },
  {
    id: 'skill/cook',
    layer: 'skill',
    params: [{ name: 'dish', domain: Object.keys(RECIPES) }],
    returns: 'Served',
    doc: 'Collect the ingredients for a dish, cook it on the stove, and serve.',
    expand(_w, [dish]) {
      const steps: Step[] = [
        { cap: 'service/speech.say', args: [`Cooking ${dish}. Getting the ingredients.`] },
      ];
      for (const ing of RECIPES[dish] ?? []) {
        steps.push({ cap: 'skill/put', args: [ing, 'stove'] });
      }
      steps.push({ cap: 'primitive/stove.cook', args: [dish] });
      steps.push({ cap: 'service/speech.say', args: [`${dish} is ready.`] });
      return steps;
    },
  },
  {
    id: 'skill/tidy_up',
    layer: 'skill',
    params: [],
    returns: 'Tidied',
    doc: 'Find everything that is not where it belongs and put it back.',
    expand(w) {
      const misplaced = (Object.keys(w.where) as ObjectId[]).filter(
        (o) => w.where[o] !== HOME_OF[o],
      );
      if (!misplaced.length) {
        return [{ cap: 'service/speech.say', args: ['Everything is already tidy.'] }];
      }
      const steps: Step[] = [
        { cap: 'service/speech.say', args: [`Tidying up ${misplaced.length} things.`] },
      ];
      for (const o of misplaced) steps.push({ cap: 'skill/put', args: [o, HOME_OF[o]] });
      return steps;
    },
  },
];

/** 灶台是个 primitive，但只在 cook 里用到，单独放这儿 */
const stove: Capability = {
  id: 'primitive/stove.cook',
  layer: 'primitive',
  params: [{ name: 'dish', domain: Object.keys(RECIPES) }],
  returns: 'Dish',
  doc: 'Turn on the stove and cook whatever is on it.',
  pre(w, [dish]) {
    const need = RECIPES[dish] ?? [];
    const missing = need.filter((i) => w.where[i] !== 'stove');
    if (w.at !== 'stove') return 'not at the stove';
    if (missing.length) return `missing ingredients on the stove: ${missing.join(', ')}`;
    return null;
  },
  effect(w, [dish]) {
    for (const i of RECIPES[dish] ?? []) delete (w.where as any)[i];
    w.cooking = null;
    w.served.push(dish);
  },
};

/* ========================================================================== */
/* 注册表                                                                      */
/* ========================================================================== */

export const REGISTRY: Record<string, Capability> = Object.fromEntries(
  [...primitives, stove, ...services, ...skills].map((c) => [c.id, c]),
);

/** 展示用签名：service/navigation.goto(place: living-room|counter|…) -> Pose */
export function signature(c: Capability): string {
  const ps = c.params
    .map((p) => `${p.name}: ${p.domain === 'string' ? 'string' : p.domain.join('|')}`)
    .join(', ');
  return `${c.id}(${ps}) -> ${c.returns}`;
}

/**
 * 校验一个步骤。VLM 产出的计划先过这里 ——
 * 能力名瞎编的、参数个数不对的、取值不在定义域里的，全部挡掉。
 */
export function validate(step: Step): string | null {
  const cap = REGISTRY[step.cap];
  if (!cap) return `unknown capability: ${step.cap}`;
  if (step.args.length !== cap.params.length) {
    return `${step.cap} takes ${cap.params.length} arg(s), got ${step.args.length}`;
  }
  for (let i = 0; i < cap.params.length; i++) {
    const p = cap.params[i];
    if (p.domain === 'string') continue;
    if (!p.domain.includes(step.args[i])) {
      return `${step.cap}: ${p.name} must be one of ${p.domain.join(' | ')} (got "${step.args[i]}")`;
    }
  }
  return null;
}

/**
 * 把一个步骤递归展开成 primitive 序列。
 * skill 展开成 service + primitive，service 再展开成 primitive。
 * 展开时会读当前世界状态（比如 fetch 要知道东西在哪），
 * 所以必须在执行前一刻展开，不能提前全部摊平。
 */
export function expand(w: WorldState, step: Step, depth = 0): Step[] {
  if (depth > 8) return [step]; // 防御性：避免 skill 互相递归
  const cap = REGISTRY[step.cap];
  if (!cap?.expand) return [step];
  return cap.expand(w, step.args).flatMap((s) => expand(w, s, depth + 1));
}

/** 给 VLM 看的能力清单 */
export function capabilityManifest(): string {
  const byLayer = (l: Layer) =>
    Object.values(REGISTRY)
      .filter((c) => c.layer === l)
      .map((c) => `  ${signature(c)}\n    ${c.doc}`)
      .join('\n');
  return [
    'PRIMITIVES (hardware):',
    byLayer('primitive'),
    '',
    'SERVICES (shared, prefer these over primitives):',
    byLayer('service'),
    '',
    'SKILLS (composed behaviours, prefer these when they fit):',
    byLayer('skill'),
  ].join('\n');
}
