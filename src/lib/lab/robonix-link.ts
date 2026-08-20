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
import { makeSkills } from './skills';

export type LinkState = 'connecting' | 'online' | 'offline' | 'busy';

/** 正在开机器人的那个人 —— 只有身份，没有任何对话内容 */
export type SeatHolder = {
  name: string;
  hue: number;
  shape: number;
  country?: string;
  country_code?: string;
  held_s?: number;
  max_hold_s?: number;
};

/**
 * 这个标签页的会话 id。
 *
 * 四个 provider 是四个独立进程，各自判断「谁在开」。没有共同的身份标识就会
 * 打架：同一个访客拿到两条线、另一个人拿到另外两条，两边都以为自己连上了。
 * 所以由浏览器自报一个 id，四边按它认人。
 *
 * 放 sessionStorage：刷新页面还是同一个人（座位不用重排），关掉标签页就没了。
 */
function sessionId(): string {
  const KEY = 'robonix-session';
  try {
    let v = sessionStorage.getItem(KEY);
    if (!v) {
      v = (crypto.randomUUID?.() ?? String(Math.random())).slice(0, 32);
      sessionStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return String(Math.random()).slice(2, 18);   // 隐私模式下 storage 会抛
  }
}

export type LinkEvents = {
  /** 某条线的状态变了 */
  onState?: (which: string, state: LinkState, detail?: string) => void;
  /** 角色定了：开车还是旁观 */
  onRole?: (role: 'driver' | 'spectator', holder: SeatHolder | null,
            waiting: number, message?: string) => void;
  /** 某一条线报了角色（内部用来汇总「四条是否一致」） */
  onLineRole?: (which: string, role: 'driver' | 'spectator') => void;
  /**
   * 世界状态。
   * `isRestore` 为真表示这是接手/刷新时服务端交回来的那一份 —— 即使自己是
   * 司机也要照单接收，否则刷新后机器人会退回初始状态。
   */
  onWorldState?: (snapshot: any, action?: string | null, isRestore?: boolean) => void;
  /** 座位被别人占着 —— 告诉界面是谁、还有几个人在等 */
  onSeatBusy?: (holder: SeatHolder | null, waiting: number) => void;
  /** 自己的座位快到期了 */
  onSeatExpiring?: (secondsLeft: number, waiting: number) => void;
  /** 座位被收走了 */
  onSeatLost?: (message: string) => void;
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
export function makeHandlers(
  world: LabWorld,
  speak: (text: string) => Promise<{ ok: boolean; detail: string }>,
): Record<string, Handler> {
  const view = () => world.worldView();
  const skills = makeSkills(world);

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

    /* -------------------------------------------------------- camera */

    /**
     * robonix/primitive/camera/snapshot
     *
     * 这一帧是**真的会进模型**的：pilot 认 sensor_msgs/Image 的形状，
     * 把 base64 转成一条 vision 消息发给 VLM，工具历史里只留一行占位。
     * 所以质量压到 0.6、尺寸交给渲染目标（512×384）—— 够看清屋里有什么，
     * 又不至于让每次调用都传半兆。
     */
    'camera.snapshot': () => {
      const url = world.captureRobotView(0.6);
      return {
        data: url.split(',')[1] ?? '',
        format: 'jpeg',
        width: 512,
        height: 384,
      };
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

    /* --------------------------------------------------------- skill
       任务级行为。这些不是「把整个任务封成一步」—— pick 和 place 仍然分开，
       做饭还是要规划器自己想清楚先拿什么、再上灶。组合归它，可靠性归系统。 */

    'skill.pick':  (a) => skills.pick(String(a.object_id ?? '')),
    'skill.place': (a) => skills.place(String(a.destination_id ?? '')),
    'skill.cook':  (a) => skills.cook(String(a.dish ?? '')),
    'skill.wash':  () => skills.wash(),
    'skill.water': (a) => skills.water(String(a.plant_id ?? 'plant')),

    /* --------------------------------------------------------- speech
       机器人说话是一个**能力**，不是界面装饰。规划器可以把它编进计划，
       于是「说了什么、什么时候说」都在树上看得见。 */

    'speech.speak': (a) => speak(String(a.text ?? '')),
    'speech.list_speakers': () => ({
      speakers_json: JSON.stringify([{
        provider_id: 'browser_sim',
        namespace: 'robonix/primitive/audio',
        description: "the visitor's browser — a speech bubble plus synthesised audio",
      }]),
    }),
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
  /** 上一次断开是因为座位被占，而不是网络问题 */
  private wasBusy = false;
  /** 服务端分配的角色。旁观者不接能力调用。 */
  role: 'driver' | 'spectator' = 'spectator';

  constructor(
    readonly name: string,
    readonly url: string,
    readonly session: string,
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
      // 先自报家门，四个 provider 才能认出这是同一个访客
      ws.send(JSON.stringify({ event: 'hello', session: this.session }));
      this.events.onState?.(this.name, 'online');
    };

    ws.onmessage = async (ev) => {
      let msg: any;
      try { msg = JSON.parse(ev.data as string); }
      catch { return; }

      if (msg.event === 'role') {
        this.role = msg.role;
        this.events.onLineRole?.(this.name, msg.role);
        this.events.onRole?.(msg.role, msg.holder ?? null,
                             Number(msg.waiting) || 0, msg.message);
        // 接手时把上一个人留下的世界原样接过来，不重置
        if (msg.restore) this.events.onWorldState?.(msg.restore, null, true);
        return;
      }
      if (msg.event === 'state') {
        this.events.onWorldState?.(msg.snapshot, msg.action);
        return;
      }
      if (msg.event === 'seat') {
        this.events.onSeatBusy?.(msg.holder?.name ? msg.holder : null,
                                 Number(msg.waiting) || 0);
        return;
      }
      if (msg.event === 'expiring') {
        this.events.onSeatExpiring?.(Number(msg.seconds_left) || 0, Number(msg.waiting) || 0);
        return;
      }
      if (msg.event === 'handover') {
        this.events.onSeatLost?.(String(msg.message ?? 'the robot went to someone else'));
        return;
      }
      // provider 说这具身体已经被别人占了
      if (msg.event === 'busy') {
        /*
          记下来。provider 说完 busy 就会关掉连接，紧接着的 onclose 会把状态
          改写成 offline —— 于是界面显示「连不上」，而真相是「有人在用」。
          这个标志让 onclose 知道刚才发生了什么。
        */
        this.wasBusy = true;
        this.events.onSeatBusy?.(msg.holder?.name ? msg.holder : null, Number(msg.waiting) || 0);
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

  /** 往这条线发一条不带 id 的事件消息 */
  send(payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
  }

  private reply(id: number, ok: boolean, result?: unknown, error?: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(ok ? { id, ok, result } : { id, ok, error }));
  }

  private scheduleRetry(detail: string) {
    if (this.closed) return;

    if (this.wasBusy) {
      /*
        座位被别人占着。这种情况**必须慢慢等**：provider 说完 busy 就关连接，
        照常规退避重连的话第一次只等 0.8 秒，于是变成每秒十几次的重连风暴 ——
        既刷爆日志，也让状态在 busy/offline 之间反复横跳，界面最后停在
        「连不上」。等 5 秒问一次就够了，人也不会一直盯着。
      */
      this.wasBusy = false;
      this.events.onState?.(this.name, 'busy', detail);
      this.timer = window.setTimeout(() => this.connect(), 5000);
      return;
    }

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

/** 四个 provider 各一条线，名字和 nginx 里的 location 一一对应 */
const LINES = ['sim', 'nav', 'scene', 'skills', 'speech'] as const;

export class RobonixLink {
  private lines: Line[] = [];
  readonly states = new Map<string, LinkState>();

  constructor(
    world: LabWorld,
    cfg: LinkConfig,
    events: LinkEvents = {},
    speak: (text: string) => Promise<{ ok: boolean; detail: string }> =
      async () => ({ ok: false, detail: 'no speech output wired up' }),
  ) {
    const handlers = makeHandlers(world, speak);
    const wrapped: LinkEvents = {
      ...events,
      onState: (which, state, detail) => {
        this.states.set(which, state);
        if (state !== 'online') this.roles.delete(which);
        events.onState?.(which, state, detail);
      },
      onLineRole: (which, role) => { this.roles.set(which, role); },
    };
    // 路径和 nginx 里的三个 location 对应
    const session = sessionId();
    for (const name of LINES) {
      this.lines.push(new Line(name, `${cfg.base}/${name}`, session, handlers, wrapped));
    }
  }

  start() {
    for (const l of this.lines) l.connect();
    /*
      这里**故意不监听 pagehide**。

      曾经在 pagehide 里主动断开，想让关掉的标签页立刻让出座位。在桌面上没
      问题，在 iOS Safari 上是灾难：切换 App、页面进 bfcache 都会触发 pagehide，
      于是用户只是看了一眼别的应用，机器人的连接就被自己人掐断，正在跑的能力
      调用当场失败（1001 going away）。

      改由服务端判断：心跳 8 秒，加上 10 秒的重连宽限，真正关掉的页面最多
      十几秒就会让出座位 —— 慢一点，但不会误伤还在用的人。
    */
  }

  stop() { for (const l of this.lines) l.close(); }

  /**
   * 我是不是司机。
   *
   * **四条线都得是**。四个 provider 各自判断座位，短暂的不一致是可能的
   * （一条线的旧连接还没清干净）。只要有一条说我不是司机，能力调用就会
   * 发到别人那儿去，这时候让我以为自己在开是最糟的 —— 界面能输入，
   * 指令却半数发不出去。
   */
  get driving(): boolean {
    return LINES.every((n) => this.roles.get(n) === 'driver');
  }

  readonly roles = new Map<string, 'driver' | 'spectator'>();

  /**
   * 上报世界状态。只有司机需要发 —— 服务器转播给所有旁观者，
   * 这样一台机器人在所有人屏幕上是同一个状态。
   * 只走 sim 这一条线，四条都发纯属浪费。
   */
  pushState(snapshot: unknown, action?: string | null) {
    this.lines[0]?.send({ event: 'state', snapshot, action });
  }

  /** 四条都连上了（不论是开车还是旁观） */
  get online(): boolean {
    return LINES.every((n) => this.states.get(n) === 'online');
  }

  /** 有 provider 说「已经被别人占了」—— 排队，不是连不上 */
  get busy(): boolean {
    return LINES.some((n) => this.states.get(n) === 'busy');
  }
}

/** 从当前页面推出 WebSocket 基址 —— 同源，走 nginx 反代 */
export function defaultLinkBase(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/robonix`;
}
