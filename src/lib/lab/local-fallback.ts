/**
 * ============================================================================
 *  本地兜底 —— 只在真 Robonix 连不上时使用
 * ============================================================================
 *
 *  正常情况下，计划由服务器上的 **pilot**（调 qwen3.8-max）产出，
 *  由 **executor** 执行，浏览器只提供能力并显示 RTDL 树。
 *
 *  但页面不能因为后端挂了就变成一块死屏。所以这里放一个最小的本地替身：
 *    · planLocally()  —— 规则匹配，产出**格式完全一致**的 RTDL 信封
 *    · runLocally()   —— 走一遍树，调同一组能力
 *
 *  刻意保持简陋：它不是要取代 pilot，只是让页面在离线时仍然可看。
 *  RTDL 格式和能力调用两端完全一致，所以接上真运行时之后，
 *  查看器和能力实现一行都不用改。
 */

import type { RtdlEnvelope, RtdlNode, NodeStatus } from './rtdl';
import type { PrimitiveTable, CapName } from './primitives';
import { OBJECTS, PLACES, RECIPES, type ObjectId, type PlaceId } from './scene-spec';

/* ========================================================================== */
/* 规划                                                                        */
/* ========================================================================== */

let opCounter = 1;
const nextId = () => opCounter++;

const doNode = (description: string, cap: CapName, args: Record<string, string> = {}): RtdlNode =>
  ({ op: 'do', op_id: nextId(), description, cap, args, status: 'pending' });

const seq = (description: string, children: RtdlNode[]): RtdlNode =>
  ({ op: 'sequence', op_id: nextId(), description, children, status: 'pending' });

const par = (description: string, children: RtdlNode[]): RtdlNode =>
  ({ op: 'parallel', op_id: nextId(), description, children, status: 'pending' });

/** 去某处拿起某物：导航 → 看见 → 抓 */
function fetch(obj: ObjectId, from: PlaceId): RtdlNode {
  /*
    「抓取」不是一个 primitive —— 标准契约里夹爪是 joint_command 上的
    一个具名关节。所以拿起一个东西是四步：导航、在语义地图里定位、
    末端到位、夹爪合拢。这正是 skill 存在的理由。
  */
  return seq(`pick up ${OBJECTS[obj].label} from ${PLACES[from].label}`, [
    doNode(`navigate to ${PLACES[from].label}`, 'navigation.navigate', { goal: from }),
    doNode(`locate ${OBJECTS[obj].label} in the scene graph`, 'scene.get_object_context', { object: obj }),
    doNode('move the end effector to it', 'arm.pos_command', { object: obj }),
    doNode('close the gripper', 'arm.joint_command', { name: 'gripper_finger_joint', position: '0.0' }),
  ]);
}

/** 把某物搬到某处 */
function carry(obj: ObjectId, from: PlaceId, to: PlaceId): RtdlNode {
  return seq(`move ${OBJECTS[obj].label} to ${PLACES[to].label}`, [
    fetch(obj, from),
    doNode(`carry it to ${PLACES[to].label}`, 'navigation.navigate', { goal: to }),
    doNode('open the gripper', 'arm.joint_command', { name: 'gripper_finger_joint', position: '0.045' }),
  ]);
}

export type WorldSnapshot = { at: string; holding: string | null; where: Record<string, string> };

/** 物体现在在哪（不知道就退回它的默认位置） */
function whereIs(snap: WorldSnapshot, obj: ObjectId): PlaceId {
  const p = snap.where[obj];
  return (p && p !== 'held' ? p : OBJECTS[obj].home) as PlaceId;
}

const say = (text: string) => doNode(`say “${text}”`, 'speech.speak', { text });

/**
 * 自然语言 → RTDL。规则匹配，覆盖演示需要的几类家务。
 * 真 pilot 上线后这个函数不再被调用。
 */
export function planLocally(task: string, snap: WorldSnapshot): RtdlEnvelope | null {
  const t = task.toLowerCase().trim();
  opCounter = 1;

  const findObj = (): ObjectId | null => {
    for (const id of Object.keys(OBJECTS) as ObjectId[]) {
      if (t.includes(id)) return id;
    }
    if (/wrapper|rubbish|garbage|litter/.test(t)) return 'trash';
    if (/cup(?!board)/.test(t)) return 'mug';
    return null;
  };
  const findPlace = (): PlaceId | null => {
    for (const id of Object.keys(PLACES) as PlaceId[]) {
      if (t.includes(id.replace('-', ' ')) || t.includes(id)) return id;
    }
    if (/dining/.test(t)) return 'table';
    if (/couch/.test(t)) return 'sofa';
    if (/trash|rubbish|garbage/.test(t)) return 'bin';
    return null;
  };

  const env = (content: string, summary: string, root: RtdlNode, goal: string): RtdlEnvelope => ({
    content,
    rtdl_description: summary,
    rtdl: root,
    task_update: { goal, success_criterion: goal, status: 'in_progress' },
  });

  /* ---- 做饭 ---- */
  // 「做顿饭」这种没点名菜式的说法，给个默认菜，别直接说不会
  const wantsFood = /cook|make me|prepare|dinner|lunch|breakfast|food|hungry|meal|eat/.test(t);
  const dish = /noodle/.test(t) ? 'noodles'
             : /tomato|egg|stir|fry/.test(t) ? 'tomato-egg'
             : wantsFood ? 'tomato-egg' : null;
  if (wantsFood && dish) {
    const r = RECIPES[dish];
    const steps: RtdlNode[] = [say(`Cooking ${r.label}. Getting the ingredients.`)];
    for (const ing of r.needs) steps.push(carry(ing, whereIs(snap, ing), 'stove'));
    steps.push(doNode(`cook ${r.label}`, 'kitchen.cook', { dish }));
    steps.push(carry('plate', whereIs(snap, 'plate'), 'table'));
    steps.push(say(`${r.label} is ready. It's on the table.`));
    return env(
      `I'll cook ${r.label} and put it on the table.`,
      `cook ${r.label}`,
      seq(`cook ${r.label} and serve it`, steps),
      `${r.label} is cooked and served on the dining table`,
    );
  }

  /* ---- 收拾：把所有不在原位的东西归位 ---- */
  if (/tidy|clean up|clean the|put.*away|straighten|mess/.test(t)) {
    const misplaced = (Object.keys(OBJECTS) as ObjectId[])
      .filter((o) => {
        const at = snap.where[o];
        return at && at !== 'held' && at !== OBJECTS[o].home;
      });
    if (!misplaced.length) {
      return env('Everything is already where it belongs.', 'nothing to tidy',
        seq('report that the room is tidy', [say('Everything is already tidy.')]),
        'the user is told the room is already tidy');
    }
    const steps: RtdlNode[] = [say(`Tidying up. ${misplaced.length} things are out of place.`)];
    for (const o of misplaced) steps.push(carry(o, whereIs(snap, o), OBJECTS[o].home));
    steps.push(say('All tidy.'));
    return env(
      `${misplaced.length} things are out of place. I'll put them back.`,
      `tidy up ${misplaced.length} items`,
      seq('put everything back where it belongs', steps),
      'every object is back in its home location',
    );
  }

  /* ---- 洗碗 ---- */
  if (/wash|dishes|dirty/.test(t)) {
    const steps = [
      say('I will wash up.'),
      carry('plate', whereIs(snap, 'plate'), 'sink'),
      doNode('run the tap', 'kitchen.wash'),
      carry('plate', 'sink', 'shelf'),
      say('Dishes done.'),
    ];
    return env("I'll wash the dishes and put them away.", 'wash up',
      seq('wash the dishes and put them back', steps),
      'the plate is washed and back on the shelf');
  }

  /* ---- 浇花 ---- */
  if (/water|plant|flower/.test(t)) {
    const at = whereIs(snap, 'plant');
    return env("I'll water the plant.", 'water the plant',
      seq('water the plant', [
        doNode(`navigate to ${PLACES[at].label}`, 'navigation.navigate', { goal: at }),
        doNode('locate the plant', 'scene.get_object_context', { object: 'plant' }),
        doNode('water it', 'houseplant.water'),
        say('The plant has been watered.'),
      ]),
      'the plant has been watered');
  }

  /* ---- 收拾餐桌 ---- */
  if (/clear the table|set the table/.test(t)) {
    const onTable = (Object.keys(OBJECTS) as ObjectId[]).filter((o) => snap.where[o] === 'table');
    if (onTable.length) {
      const steps = [say('Clearing the table.'), ...onTable.map((o) => carry(o, 'table', OBJECTS[o].home)), say('Table cleared.')];
      return env("I'll clear the table.", 'clear the table',
        seq('take everything off the dining table', steps), 'the dining table is empty');
    }
  }

  /* ---- 扔垃圾 ---- */
  if (/throw|bin|trash|rubbish/.test(t)) {
    const at = whereIs(snap, 'trash');
    return env("I'll throw it away.", 'take out the rubbish',
      seq('put the wrapper in the bin', [carry('trash', at, 'bin'), say('Thrown away.')]),
      'the wrapper is in the bin');
  }

  /* ---- 把 X 放到 Y ---- */
  const obj = findObj();
  const place = findPlace();
  if (obj && place) {
    return env(`I'll put ${OBJECTS[obj].label} on ${PLACES[place].label}.`,
      `${obj} → ${place}`,
      carry(obj, whereIs(snap, obj), place),
      `${obj} is on ${place}`);
  }

  /* ---- 只说拿某个东西 ---- */
  if (obj && /bring|fetch|get|grab|pick|hand|give/.test(t)) {
    const at = whereIs(snap, obj);
    return env(`I'll bring you ${OBJECTS[obj].label}.`, `bring the ${obj}`,
      seq(`bring ${OBJECTS[obj].label} to the sofa`, [
        fetch(obj, at),
        doNode('bring it over to the sofa', 'chassis.move', { target: 'sofa' }),
        // 松手就是把夹爪关节张开 —— 契约里没有独立的 release 能力
        doNode('open the gripper', 'arm.joint_command',
          { name: 'gripper_finger_joint', position: '0.045' }),
        say(`Here is ${OBJECTS[obj].label}.`),
      ]),
      `${obj} has been brought to the sofa`);
  }

  /* ---- 打个招呼 ---- */
  if (/hello|hi\b|hey|who are you|什么/.test(t)) {
    return env('Hello.', 'greet the user',
      seq('greet', [say("Hello. I'm the Robonix demo robot. Ask me to cook, tidy up, or fetch something.")]),
      'the user has been greeted');
  }

  return null;
}

/* ========================================================================== */
/* 执行                                                                        */
/* ========================================================================== */

export type RunEvents = {
  onUpdate?: () => void;
  onDone?: (ok: boolean, error?: string) => void;
};

/**
 * 走一遍 RTDL 树。
 * sequence 顺序执行、失败即停；parallel 并发、单个分支失败不取消兄弟。
 * 和 executor 的语义一致，这样离线时看到的行为和在线时是同一套。
 */
export async function runLocally(
  root: RtdlNode,
  prims: PrimitiveTable,
  ev: RunEvents = {},
): Promise<{ ok: boolean; error?: string }> {
  const set = (n: RtdlNode, s: NodeStatus, err?: string) => {
    n.status = s;
    if (err) n.error = err;
    ev.onUpdate?.();
  };

  const walk = async (n: RtdlNode): Promise<boolean> => {
    set(n, 'running');

    if (n.op === 'do') {
      const fn = (prims as Record<string, (a: any) => Promise<any>>)[n.cap];
      if (!fn) { set(n, 'failed', `no such capability: ${n.cap}`); return false; }
      const t0 = performance.now();
      const res = await fn(n.args ?? {});
      n.ms = performance.now() - t0;
      if (!res?.success) { set(n, 'failed', res?.message ?? 'failed'); return false; }
      set(n, 'succeeded');
      return true;
    }

    if (n.op === 'sequence') {
      for (const c of n.children) {
        const ok = await walk(c);
        if (!ok) {
          // 后面的全部标记跳过，让树上一眼看出停在哪
          for (const rest of n.children) {
            if (rest.status === 'pending') markSkipped(rest);
          }
          set(n, 'failed');
          return false;
        }
      }
      set(n, 'succeeded');
      return true;
    }

    // parallel：一个分支失败不取消兄弟分支
    const results = await Promise.all(n.children.map(walk));
    const ok = results.every(Boolean);
    set(n, ok ? 'succeeded' : 'failed');
    return ok;
  };

  const markSkipped = (n: RtdlNode) => {
    n.status = 'skipped';
    if (n.op !== 'do') n.children.forEach(markSkipped);
  };

  const ok = await walk(root);
  const err = ok ? undefined : findError(root);
  ev.onDone?.(ok, err);
  return { ok, error: err };
}

function findError(n: RtdlNode): string | undefined {
  if (n.error) return n.error;
  if (n.op === 'do') return undefined;
  for (const c of n.children) {
    const e = findError(c);
    if (e) return e;
  }
  return undefined;
}
