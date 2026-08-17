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

function fmtArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args ?? {});
  if (!entries.length) return '';
  return entries
    .map(([k, v]) => {
      let s = typeof v === 'string' ? v : JSON.stringify(v);
      // 图片这类长参数不能整个铺出来
      if (s.length > 42) s = s.slice(0, 39) + '…';
      return `${k}=${s}`;
    })
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

function countStatus(n: RtdlNode, s: NodeStatus): number {
  if (n.op === 'do') return n.status === s ? 1 : 0;
  return n.children.reduce((a, c) => a + countStatus(c, s), 0);
}
