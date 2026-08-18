/**
 * ============================================================================
 *  Agent 客户端 —— 把一句话交给 pilot
 * ============================================================================
 *
 *  和 robonix-link 的方向相反：那三条是服务器调浏览器（身体在网页里），
 *  这一条是浏览器调服务器。中间是 agent_gateway，一层薄的
 *  WebSocket → gRPC 转接，把 PilotEvent 原样转成 JSON。
 *
 *  收到什么就显示什么。计划树、每个节点的状态、失败原因，全部来自
 *  pilot 和 executor —— 在这里加工就等于把这个 demo 的意义抹掉了。
 */

export type AgentEvent =
  | { kind: 'ready'; session: string; per_ip_per_hour: number }
  | { kind: 'text'; text: string }
  | { kind: 'status'; message: string; state?: number }
  | { kind: 'plan'; plan_id: string; round: number; root: number; nodes: any[] }
  | { kind: 'node'; plan_id: string; index: number; node_kind: string; op_id: string;
      state: string; description: string; detail: string;
      result?: { provider_id: string; contract_id: string; success: boolean; output: string; error: string } }
  | { kind: 'task'; goal: string; criterion: string; status: string }
  | { kind: 'batch'; round: number; any_failed: boolean; count: number }
  | { kind: 'final'; text: string }
  | { kind: 'error'; message: string }
  | { kind: 'idle' };

export type AgentState = 'connecting' | 'online' | 'offline';

export class AgentClient {
  private ws: WebSocket | null = null;
  private retry = 0;
  private closed = false;
  private timer: number | null = null;

  /** 每小时还能提几次任务 —— gateway 在 ready 里告诉我们 */
  quotaPerHour = 0;

  constructor(
    private url: string,
    private onEvent: (e: AgentEvent) => void,
    private onState: (s: AgentState, detail?: string) => void,
  ) {}

  connect() {
    if (this.closed) return;
    this.onState('connecting');
    let ws: WebSocket;
    try { ws = new WebSocket(this.url); }
    catch (e) { this.scheduleRetry(String(e)); return; }
    this.ws = ws;

    ws.onopen = () => { this.retry = 0; this.onState('online'); };
    ws.onmessage = (ev) => {
      let m: AgentEvent;
      try { m = JSON.parse(ev.data as string); } catch { return; }
      if (m.kind === 'ready') this.quotaPerHour = m.per_ip_per_hour;
      this.onEvent(m);
    };
    ws.onclose = () => { this.ws = null; this.scheduleRetry('connection closed'); };
    ws.onerror = () => { /* onclose 随后就到 */ };
  }

  get online() { return this.ws?.readyState === WebSocket.OPEN; }

  submit(task: string): boolean {
    if (!this.online) return false;
    this.ws!.send(JSON.stringify({ task }));
    return true;
  }

  private scheduleRetry(detail: string) {
    if (this.closed) return;
    this.onState('offline', detail);
    const wait = Math.min(15000, 800 * 2 ** Math.min(this.retry++, 5));
    this.timer = window.setTimeout(() => this.connect(), wait);
  }

  close() {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }
}
