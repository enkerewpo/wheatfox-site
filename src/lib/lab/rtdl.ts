/**
 * ============================================================================
 *  RTDL 树的显示
 * ============================================================================
 *
 *  只负责画。校验、op_id 分配、展开、执行、失败处理 —— 全是服务器上
 *  pilot 和 executor 的职责，浏览器一概不碰。这里拿到什么就画什么。
 *
 *  类型照 `system/pilot/rtdl_protocol.md` 的线上格式，字段名不改，
 *  这样 PilotEvent 推过来可以直接渲染，不需要中间层转换。
 */

/* ========================================================================== */
/* 类型 —— 对齐线上格式                                                        */
/* ========================================================================== */

export type NodeStatus =
  | 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'canceled';

type Common = {
  /** pilot 用全局计数器分配 */
  op_id: number;
  /** 模型自己的话。树里最该被读到的就是这一行 */
  description: string;
  /** executor 报回来的状态 */
  status?: NodeStatus;
  error?: string;
};

export type RtdlNode =
  | (Common & { op: 'sequence' | 'parallel'; children: RtdlNode[] })
  | (Common & { op: 'do'; cap: string; args: Record<string, unknown>; ms?: number });

/** pilot 一轮的完整输出 */
export type RtdlEnvelope = {
  content: string;
  rtdl_description: string;
  rtdl: RtdlNode;
  task_update: {
    goal: string;
    success_criterion: string;
    status: 'in_progress' | 'succeeded' | 'failed';
  };
};

/* ========================================================================== */
/* 渲染                                                                        */
/* ========================================================================== */

const GLYPH: Record<NodeStatus, string> = {
  pending:   '·',
  running:   '▶',
  succeeded: '✓',
  failed:    '✗',
  skipped:   '–',
  canceled:  '⊘',
};

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/**
 * 参数摘要。
 *
 * 契约用的是 ROS 消息，线上长这样：
 *   goal={"header":{"frame_id":"room","stamp":{"sec":0,"nanosec":0}},"pose":{...}}
 * 整条铺出来占满一行却几乎没有信息量 —— 真正要看的是「去哪、抓什么、
 * 哪个关节动到多少」。所以这里把常见的几种消息压成人能读的形式。
 *
 * 只动显示，不动内容：压不出名堂的照原样截断输出，绝不悄悄丢掉一个参数。
 */
function fmtArgs(args: Record<string, unknown>): string {
  const num = (v: unknown) => (typeof v === 'number' ? (Math.round(v * 100) / 100).toString() : String(v));

  const one = (k: string, v: any): string | null => {
    // ROS 的 header / stamp 是协议噪音，树上没人看
    if (k === 'header' || k === 'stamp') return null;
    // 空数组的 velocity / effort 同理
    if ((k === 'velocity' || k === 'effort') && Array.isArray(v) && v.every((x) => !x)) return null;

    // PoseStamped / Pose —— 只报位置，必要时报朝向
    const pose = v?.pose ?? (v?.position ? v : null);
    if (pose?.position) {
      const p = pose.position;
      const q = pose.orientation;
      const yaw = q && (q.w || q.z)
        ? `, yaw ${num((Math.atan2(2 * (q.w * q.z), 1 - 2 * q.z * q.z) * 180) / Math.PI)}°`
        : '';
      return `${k}=(${num(p.x)}, ${num(p.y)}${p.z ? `, ${num(p.z)}` : ''})${yaw}`;
    }

    // JointState —— 名字和位置配对，比两个平行数组好读得多
    if (Array.isArray(v) && k === 'name' && Array.isArray((args as any).position)) {
      const pos = (args as any).position as unknown[];
      return v.map((n, i) => `${n}=${num(pos[i])}`).join(' ');
    }
    if (k === 'position' && Array.isArray((args as any).name)) return null;   // 上面一并处理了

    // MoveCommand —— 只报非零的那几项
    if (k === 'command' && v && typeof v === 'object') {
      const parts = Object.entries(v)
        .filter(([, x]) => typeof x === 'number' && x !== 0)
        .map(([kk, x]) => `${kk}=${num(x)}`);
      return parts.length ? parts.join(' ') : `${k}=(no motion)`;
    }

    let str = typeof v === 'string' ? v : JSON.stringify(v);
    if (str && str.length > 44) str = str.slice(0, 41) + '…';
    return `${k}=${str}`;
  };

  return Object.entries(args ?? {})
    .map(([k, v]) => one(k, v))
    .filter((x): x is string => !!x)
    .join(' ');
}

/**
 * 画一棵树。用 tree(1) 那种连接线 —— 等宽字符、零依赖，
 * 而且和站点其它地方的排版语言一致，不需要引入一套图形库。
 *
 * @param node    要画的节点
 * @param prefix  这一层的前缀（连接线），递归时累加
 * @param isLast  是不是父节点的最后一个孩子
 */
export function renderNode(node: RtdlNode, prefix = '', isLast = true, isRoot = true): string {
  const status = node.status ?? 'pending';
  const branch = isRoot ? '' : isLast ? '└─ ' : '├─ ';

  // 控制流节点标出并发/顺序，do 节点不标
  const opTag =
    node.op === 'parallel' ? '<span class="rt-op rt-par">parallel</span>'
    : node.op === 'sequence' ? '<span class="rt-op rt-seq">sequence</span>'
    : '';

  const capTag =
    node.op === 'do'
      ? `<span class="rt-cap">${esc(node.cap)}</span>` +
        (fmtArgs(node.args) ? ` <span class="rt-args">${esc(fmtArgs(node.args))}</span>` : '')
      : '';

  const timing = node.op === 'do' && node.ms != null
    ? `<span class="rt-ms">${(node.ms / 1000).toFixed(1)}s</span>` : '';

  let html =
    `<div class="rt-row is-${status}">` +
      `<span class="rt-tree">${esc(prefix + branch)}</span>` +
      `<span class="rt-glyph">${GLYPH[status]}</span>` +
      `<span class="rt-desc">${esc(node.description)}</span>` +
      (opTag ? ` ${opTag}` : '') +
      (capTag ? ` ${capTag}` : '') +
      timing +
    `</div>`;

  if (node.error) {
    const pad = prefix + (isRoot ? '' : isLast ? '   ' : '│  ');
    html += `<div class="rt-error"><span class="rt-tree">${esc(pad)}</span>${esc(node.error)}</div>`;
  }

  if (node.op !== 'do') {
    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
    node.children.forEach((c, i) => {
      html += renderNode(c, childPrefix, i === node.children.length - 1, false);
    });
  }
  return html;
}

/** 整个信封：一句话 + 树 + 目标 */
export function renderEnvelope(env: RtdlEnvelope): string {
  const done = countStatus(env.rtdl, 'succeeded');
  const total = countLeaves(env.rtdl);
  return (
    `<p class="rt-say">${esc(env.content)}</p>` +
    `<div class="rt-head">` +
      `<span class="rt-summary">${esc(env.rtdl_description)}</span>` +
      `<span class="rt-progress">${done}/${total}</span>` +
    `</div>` +
    `<div class="rt-tree-body">${renderNode(env.rtdl)}</div>` +
    `<p class="rt-goal"><span>goal</span> ${esc(env.task_update.goal)}</p>`
  );
}

export function countLeaves(n: RtdlNode): number {
  return n.op === 'do' ? 1 : n.children.reduce((a, c) => a + countLeaves(c), 0);
}

/* ========================================================================== */
/* 服务器推过来的计划                                                          */
/* ========================================================================== */

/**
 * pilot 的 Plan 在线上是**扁平的**：一个节点数组 + 一个根下标，孩子用下标引用。
 * 上面的渲染器要的是嵌套结构，所以在这里转一次。
 *
 * 刻意不在这里做任何解释或美化 —— 描述、能力名、参数全部是模型和 executor
 * 自己产生的，原样画出来。这个面板的价值就在于它是真的。
 */
export type WirePlanNode = {
  kind: string;
  children: number[];
  op_id: string;
  description: string;
  call: { provider_id: string; contract_id: string; args: string } | null;
};

export type WirePlan = {
  plan_id: string;
  round: number;
  root: number;
  nodes: WirePlanNode[];
};

const WIRE_STATE: Record<string, NodeStatus> = {
  PENDING: 'pending', RUNNING: 'running', SUCCEEDED: 'succeeded',
  FAILED: 'failed', CANCELED: 'canceled', TIMEOUT: 'failed', PAUSED: 'pending',
};

export function fromWirePlan(plan: WirePlan): RtdlNode | null {
  const seen = new Set<number>();

  const build = (i: number): RtdlNode | null => {
    const n = plan.nodes[i];
    // 环和越界都不该出现，但真出现了也不能把页面挂掉
    if (!n || seen.has(i)) return null;
    seen.add(i);

    const common = { op_id: Number(n.op_id) || i, description: n.description || '(no description)' };

    if (n.kind === 'do') {
      let args: Record<string, unknown> = {};
      try { args = n.call?.args ? JSON.parse(n.call.args) : {}; } catch { /* 原样留空 */ }
      return {
        ...common, op: 'do',
        // 契约 id 的最后一段就是 pilot 目录里的短名，画长的会撑爆
        cap: n.call?.contract_id?.replace(/^robonix\//, '') ?? '(no capability)',
        args,
      };
    }
    return {
      ...common,
      op: n.kind === 'parallel' ? 'parallel' : 'sequence',
      children: n.children.map(build).filter((c): c is RtdlNode => c !== null),
    };
  };

  return build(plan.root);
}

/** 把一条 node_state 事件打到树上。按 op_id 找，因为下标只在本轮有效 */
export function applyNodeState(
  root: RtdlNode,
  ev: { op_id: string; state: string; detail?: string;
        result?: { success: boolean; output: string; error: string } },
): boolean {
  const id = Number(ev.op_id);
  const walk = (n: RtdlNode): boolean => {
    if (n.op_id === id) {
      n.status = WIRE_STATE[ev.state] ?? 'pending';
      const err = ev.result?.error || (n.status === 'failed' ? ev.detail : '');
      if (err) n.error = err;
      return true;
    }
    return n.op !== 'do' && n.children.some(walk);
  };
  return walk(root);
}

function countStatus(n: RtdlNode, s: NodeStatus): number {
  if (n.op === 'do') return n.status === s ? 1 : 0;
  return n.children.reduce((a, c) => a + countStatus(c, s), 0);
}
