/**
 * ============================================================================
 *  Robonix 链路 —— 浏览器这一侧
 * ============================================================================
 *
 *  服务器上有三个 provider 进程，各自开一个反向 WebSocket 端口等着。
 *  这个文件把它们连起来，然后把收到的 op 派到 LabWorld 上执行，回执发回去。
 *
 *  为什么是**反向**（服务端在服务器、浏览器主动连）：浏览器没有可路由的
 *  地址，Atlas 也不该存访客的 IP。provider 把自己的端口注册给 Atlas，
 *  谁连上来谁就是那具身体。
 *
 *  三条线而不是一条，是因为 Robonix 的 SDK 一个包就是一个 provider 实例：
 *  primitive、navigation service、scene service 是三个独立进程，各连各的。
 *  分开也有好处 —— scene 查询不会被一段正在跑的导航堵住。
 *
 *  线协议，一问一答，用 id 关联：
 *
 *      →  {"id": 7, "op": "chassis.move", "args": {"forward_m": 0.8}}
 *      ←  {"id": 7, "ok": true,  "result": {...}}
 *      ←  {"id": 7, "ok": false, "error": "out of reach: ..."}
 *
 *  失败**如实回报**。executor 收到 error 会把那个 RTDL 节点标红，pilot 再
 *  把原因喂回给 VLM 让它改计划 —— 这正是这套系统好玩的地方，所以绝不能
 *  在这里把错误吞掉换成一句 success。
 */

import type { LabWorld } from './world';
import { PLACES, OBJECTS, type PlaceId } from './scene-spec';
import { poseFromSim, type Pose } from './pose';
import {
  allNodes, findNode, relationsOf, nearbyOf, goalNear, robotArea,
  surfaceNodes, objectNodes,
} from './semantic-map';

export type LinkState = 'connecting' | 'online' | 'offline' | 'busy';

export type LinkEvents = {
  /** 某条线的状态变了 */
  onState?: (which: string, state: LinkState, detail?: string) => void;
  /** 服务器调了一个能力 —— 用来在界面上滚动显示 */
  onCall?: (op: string, args: unknown) => void;
  /** 一次调用的结果 */
  onResult?: (op: string, ok: boolean, payload: unknown) => void;
};

type Handler = (args: Record<string, any>) => Promise<unknown> | unknown;

/* -------------------------------------------------------------------------- */
/* op 表                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * 每个 op 对应一个契约能力。名字和 sim_bridge / sim_nav / sim_scene 里
 * `bridge.call(...)` 的第一个参数**必须**一一对应，改一边就要改另一边。
 */
export function makeHandlers(world: LabWorld): Record<string, Handler> {
  const view = () => world.worldView();

  /** 把语义地图里的一个节点变成 geometry_msgs/Pose */
  const nodePose = (id: string): Pose | null => {
    const n = findNode(view(), id);
    return n ? poseFromSim(n.x, n.y, n.z, n.yaw) : null;
  };

  return {
    /* ---------------------------------------------------- primitive */

    'chassis.move': (a) => world.chassisMove({
      forward_m: Number(a.forward_m) || 0,
      rotate_deg: Number(a.rotate_deg) || 0,
      duration_sec: Number(a.duration_sec) || 0,
    }),

    'chassis.stop': () => world.chassisStop(),

    'arm.pos_command': async (a) => {
      const target: Pose = {
        // 线上传的是 ROS 约定：x 向右、y 向前、z 向上
        position: { x: Number(a.x) || 0, y: Number(a.y) || 0, z: Number(a.z) || 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      };
      return world.armTo(target);
    },

    'arm.joint_command': async (a) => {
      const names: string[] = Array.isArray(a.name) ? a.name : [a.name];
      const pos: number[] = Array.isArray(a.position)
        ? a.position.map(Number) : [Number(a.position)];
      return world.jointCommand(names, pos);
    },

    'arm.end_pose': () => {
      const p = world.endPoseMetric();
      return { x: p.position.x, y: p.position.y, z: p.position.z };
    },

    /* ---------------------------------------------------- navigation */

    'navigation.navigate': (a) => world.navigate({
      x: Number(a.x) || 0, y: Number(a.y) || 0,
      yaw: a.yaw === undefined ? undefined : Number(a.yaw),
    }),

    'navigation.status': (a) => world.navStatus(String(a.run_id ?? '')),
    'navigation.cancel': (a) => world.navCancel(String(a.run_id ?? '')),

    /* --------------------------------------------------------- scene */

    'scene.list_objects': () => ({
      objects: allNodes(view()).map((n) => ({
        id: n.id, label: n.label, x: n.x, y: n.y, z: n.z, yaw: n.yaw,
      })),
    }),

    'scene.get_object_context': async (a) => {
      const id = String(a.object_id ?? '');
      const v = view();
      const n = findNode(v, id);
      if (!n) {
        const known = allNodes(v).map((x) => x.id).join(', ');
        throw new Error(`no node called "${id}" in the semantic map. Known: ${known}`);
      }
      // 查到了就在 3D 里高亮一下，让「找到了」这件事看得见
      if (id in OBJECTS) await world.highlight(id as any).catch(() => {});
      return {
        object: { id: n.id, label: n.label, caption: n.caption, x: n.x, y: n.y, z: n.z },
        relations: relationsOf(v, id),
        nearby: nearbyOf(v, id).map((o) => ({
          id: o.id, label: o.label, x: o.x, y: o.y, z: o.z,
        })),
      };
    },

    'scene.get_robot_context': () => {
      const v = view();
      const area = robotArea(v);
      return {
        x: v.robot.x, y: v.robot.z, yaw: v.robot.yaw,
        room_id: area.id, room_name: area.name,
        area_ids: [area.id], area_names: [area.name],
        holding: v.holding,
        nearby: [...objectNodes(v), ...surfaceNodes()]
          .filter((n) => Math.hypot(n.x - v.robot.x, n.y - v.robot.z) < 1.6)
          .map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y, z: n.z })),
      };
    },

    'scene.goal_near': (a) => goalNear(
      view(), String(a.object_id ?? ''),
      (place: PlaceId) => world.standFor(place),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* 一条线                                                                      */
/* -------------------------------------------------------------------------- */

class Line {
  private ws: WebSocket | null = null;
  private retry = 0;
  private closed = false;
  private timer: number | null = null;

  constructor(
    readonly name: string,
    readonly url: string,
    private handlers: Record<string, Handler>,
    private events: LinkEvents,
  ) {}

  connect() {
    if (this.closed) return;
    this.events.onState?.(this.name, 'connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch (e) {
      this.scheduleRetry(String(e));
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      this.events.onState?.(this.name, 'online');
    };

    ws.onmessage = async (ev) => {
      let msg: any;
      try { msg = JSON.parse(ev.data as string); }
      catch { return; }

      // provider 说这具身体已经被别人占了
      if (msg.event === 'busy') {
        this.events.onState?.(this.name, 'busy', msg.message);
        return;
      }

      const { id, op, args } = msg;
      if (typeof id !== 'number' || typeof op !== 'string') return;

      this.events.onCall?.(op, args);
      const fn = this.handlers[op];
      if (!fn) {
        this.reply(id, false, undefined, `unknown op "${op}"`);
        this.events.onResult?.(op, false, `unknown op "${op}"`);
        return;
      }
      try {
        const result = await fn(args || {});
        this.reply(id, true, result);
        this.events.onResult?.(op, true, result);
      } catch (e) {
        // 如实回报。这条错误会一路走到 VLM 面前，让它自己改计划。
        const message = e instanceof Error ? e.message : String(e);
        this.reply(id, false, undefined, message);
        this.events.onResult?.(op, false, message);
      }
    };

    ws.onclose = () => { this.ws = null; this.scheduleRetry('connection closed'); };
    ws.onerror = () => { /* onclose 随后就到，重连逻辑只写一处 */ };
  }

  private reply(id: number, ok: boolean, result?: unknown, error?: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(ok ? { id, ok, result } : { id, ok, error }));
  }

  private scheduleRetry(detail: string) {
    if (this.closed) return;
    this.events.onState?.(this.name, 'offline', detail);
    // 指数退避，封顶 15s —— 服务器重启时不要把它打死
    const wait = Math.min(15000, 800 * 2 ** Math.min(this.retry++, 5));
    this.timer = window.setTimeout(() => this.connect(), wait);
  }

  close() {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }
}

/* -------------------------------------------------------------------------- */
/* 三条线                                                                      */
/* -------------------------------------------------------------------------- */

export type LinkConfig = {
  /** WebSocket 基址，例如 wss://www.oscommunity.cn/robonix */
  base: string;
};

export class RobonixLink {
  private lines: Line[] = [];
  readonly states = new Map<string, LinkState>();

  constructor(world: LabWorld, cfg: LinkConfig, events: LinkEvents = {}) {
    const handlers = makeHandlers(world);
    const wrapped: LinkEvents = {
      ...events,
      onState: (which, state, detail) => {
        this.states.set(which, state);
        events.onState?.(which, state, detail);
      },
    };
    // 路径和 nginx 里的三个 location 对应
    for (const name of ['sim', 'nav', 'scene']) {
      this.lines.push(new Line(name, `${cfg.base}/${name}`, handlers, wrapped));
    }
  }

  start() { for (const l of this.lines) l.connect(); }
  stop() { for (const l of this.lines) l.close(); }

  /** 三条都在线才算这具身体真的接上了 */
  get online(): boolean {
    return ['sim', 'nav', 'scene'].every((n) => this.states.get(n) === 'online');
  }
}

/** 从当前页面推出 WebSocket 基址 —— 同源，走 nginx 反代 */
export function defaultLinkBase(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/robonix`;
}
