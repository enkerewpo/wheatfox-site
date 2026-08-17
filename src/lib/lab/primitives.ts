/**
 * ============================================================================
 *  能力实现 —— 浏览器作为 Robonix 的 provider
 * ============================================================================
 *
 *  **契约名全部取自 Robonix 仓库 capabilities/ 下真实存在的定义**，不自造。
 *  之前我写的 `camera.detect` / `arm.grasp` / `stove.cook` / `watering.water`
 *  在标准契约里根本不存在。真实结构是这样的：
 *
 *    primitive（硬件）
 *      robonix/primitive/chassis/move        有界底盘运动
 *      robonix/primitive/arm/pos_command     末端目标位姿
 *      robonix/primitive/arm/joint_command   关节指令（夹爪也是一个具名关节）
 *      robonix/primitive/arm/end_pose        末端当前位姿
 *      robonix/primitive/camera/snapshot     取一帧
 *      robonix/primitive/audio/speaker       扬声器
 *
 *    service（共享服务）
 *      robonix/service/navigation/navigate   带路径规划的导航
 *      robonix/service/speech/speak          说话
 *
 *    system（系统服务）
 *      robonix/system/scene/get_robot_context   机器人当前上下文
 *      robonix/system/scene/list_objects        场景里有哪些物体
 *      robonix/system/scene/get_object_context  某个物体的位置与近邻
 *
 *  注意「抓取」不是 primitive —— 契约注释里写得很清楚：夹爪通过
 *  joint_command 当作一个额外的具名关节来控制。所以 grasp 是**技能**，
 *  由 pos_command + joint_command 组合而成，由 executor 编排。
 */

import type { LabWorld } from './world';
import type { PlaceId, ObjectId } from './scene-spec';
import { PLACES, OBJECTS } from './scene-spec';

export type CapReply =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; message: string };

/** 夹爪在 joint_command 里的关节名 */
const GRIPPER_JOINT = 'gripper_finger_joint';

export function makePrimitives(world: LabWorld) {
  /** pos_command 收的是位姿；演示里用地点名代替完整 6D 位姿 */
  let armTarget: ObjectId | null = null;

  const table = {
    /* ------------------------------------------------ primitive/chassis */

    /**
     * robonix/primitive/chassis/move
     * 契约本意是「无全局路径规划的有界运动」。这里保持语义：
     * 直接开过去，不做规划 —— 规划是 navigation 服务的事。
     */
    async 'chassis.move'(a: { target: string }): Promise<CapReply> {
      if (!(a.target in PLACES)) return { success: false, message: `unknown place "${a.target}"` };
      await world.move(a.target as PlaceId);
      return { success: true, status: 'arrived', at: world.snapshot().at };
    },

    /* -------------------------------------------------- primitive/arm */

    /**
     * robonix/primitive/arm/pos_command
     * 末端目标位姿。演示里以物体为目标，等价于「把末端移到该物体处」。
     */
    async 'arm.pos_command'(a: { object: string }): Promise<CapReply> {
      if (!(a.object in OBJECTS)) return { success: false, message: `unknown object "${a.object}"` };
      const ok = await world.reachFor(a.object as ObjectId);
      if (!ok) return { success: false, message: `${a.object} is out of reach from here` };
      armTarget = a.object as ObjectId;
      return { success: true };
    },

    /**
     * robonix/primitive/arm/joint_command
     * 关节指令。夹爪是一个具名关节 —— 契约注释里就是这么规定的：
     * position 小 = 合拢（抓住），大 = 张开（放下）。
     */
    async 'arm.joint_command'(a: { name: string; position: number | string }): Promise<CapReply> {
      const pos = typeof a.position === 'string' ? parseFloat(a.position) : a.position;
      if (a.name !== GRIPPER_JOINT) {
        return { success: false, message: `this arm only exposes "${GRIPPER_JOINT}"` };
      }
      if (Number.isNaN(pos)) return { success: false, message: 'position must be a number' };

      if (pos <= 0.02) {
        // 合拢 = 抓住末端当前对准的物体
        if (!armTarget) return { success: false, message: 'nothing under the gripper — send arm/pos_command first' };
        const ok = await world.closeGripper(armTarget);
        if (!ok) return { success: false, message: `failed to grasp ${armTarget}` };
        return { success: true, holding: armTarget };
      }
      // 张开 = 松手，落到当前所在台面
      const released = await world.openGripper();
      armTarget = null;
      if (!released) return { success: false, message: 'the gripper is already empty' };
      return { success: true, released };
    },

    /** robonix/primitive/arm/end_pose —— 末端当前位姿 */
    async 'arm.end_pose'(): Promise<CapReply> {
      return { success: true, ...world.endPose() };
    },

    /* ----------------------------------------------- primitive/camera */

    /** robonix/primitive/camera/snapshot —— 这一帧会被 pilot 塞进 VLM 对话 */
    async 'camera.snapshot'(): Promise<CapReply> {
      const url = world.captureRobotView(0.7);
      return { success: true, image_base64: url.split(',')[1], format: 'jpeg' };
    },

    /* ------------------------------------------------ primitive/audio */

    /** robonix/primitive/audio/speaker */
    async 'audio.speaker'(a: { text: string }): Promise<CapReply> {
      await world.say(a.text);
      return { success: true };
    },

    /* -------------------------------------------- service/navigation */

    /**
     * robonix/service/navigation/navigate
     * 和 chassis/move 的区别正是契约的区别：这个**带路径规划**。
     * 浏览器这侧用 A* 在占用栅格上求路，再交给底盘执行。
     */
    async 'navigation.navigate'(a: { goal: string }): Promise<CapReply> {
      if (!(a.goal in PLACES)) return { success: false, message: `unknown goal "${a.goal}"` };
      try {
        await world.move(a.goal as PlaceId);
      } catch (e) {
        return { success: false, message: String((e as Error).message ?? e) };
      }
      return { success: true, status: 'succeeded', at: world.snapshot().at };
    },

    /* ----------------------------------------------- service/speech */

    /** robonix/service/speech/speak */
    async 'speech.speak'(a: { text: string }): Promise<CapReply> {
      await world.say(a.text);
      return { success: true };
    },

    /* ------------------------------------------------- system/scene */

    /** robonix/system/scene/get_robot_context */
    async 'scene.get_robot_context'(): Promise<CapReply> {
      return { success: true, ...world.snapshot() };
    },

    /** robonix/system/scene/list_objects */
    async 'scene.list_objects'(): Promise<CapReply> {
      const snap = world.snapshot();
      return {
        success: true,
        objects: Object.values(OBJECTS).map((o) => ({
          id: o.id, label: o.label, at: snap.where[o.id] ?? o.home,
        })),
      };
    },

    /* ---------------------------------------------------------- skill 层
       技能是**部署自定义**的包（仓库里就是 skill-*-rbnx），
       所以可以有自己的契约 id —— primitive / service 才必须用标准契约。
       下面三个是这个厨房部署特有的。 */

    /** robonix/skill/kitchen/cook */
    async 'kitchen.cook'(a: { dish: string }): Promise<CapReply> {
      if (world.snapshot().at !== 'stove') return { success: false, message: 'not standing at the stove' };
      await world.cook(a.dish);
      return { success: true, dish: a.dish };
    },

    /** robonix/skill/kitchen/wash */
    async 'kitchen.wash'(): Promise<CapReply> {
      if (world.snapshot().at !== 'sink') return { success: false, message: 'not standing at the sink' };
      await world.wash();
      return { success: true };
    },

    /** robonix/skill/houseplant/water */
    async 'houseplant.water'(): Promise<CapReply> {
      await world.water();
      return { success: true };
    },

    /**
     * robonix/system/scene/get_object_context
     * 语义地图查询：某个物体在哪、旁边有什么。这才是「找东西」的正确出口 ——
     * 相机 primitive 只负责取图，识别属于场景服务。
     */
    async 'scene.get_object_context'(a: { object: string }): Promise<CapReply> {
      if (!(a.object in OBJECTS)) return { success: false, message: `unknown object "${a.object}"` };
      const snap = world.snapshot();
      const at = snap.where[a.object] ?? OBJECTS[a.object as ObjectId].home;
      const nearby = Object.values(OBJECTS)
        .filter((o) => o.id !== a.object && (snap.where[o.id] ?? o.home) === at)
        .map((o) => o.id);
      // 顺便在 3D 里高亮一下，让「查到了」这件事看得见
      await world.highlight(a.object as ObjectId);
      return { success: true, object: a.object, at, nearby };
    },
  };
  return table;
}

export type PrimitiveTable = ReturnType<typeof makePrimitives>;
export type CapName = keyof PrimitiveTable;

/**
 * 能力目录。`contract` 是仓库里真实存在的契约 id；
 * `cap` 是 pilot 目录里的短名（provider_id + "." + area_leaf），
 * VLM 在 RTDL 里抄的就是这个。
 */
export const CATALOG: {
  cap: CapName;
  contract: string;
  layer: 'primitive' | 'service' | 'system' | 'skill';
  params: { name: string; domain?: readonly string[] }[];
  doc: string;
}[] = [
  { cap: 'chassis.move', contract: 'robonix/primitive/chassis/move', layer: 'primitive',
    params: [{ name: 'target', domain: Object.keys(PLACES) }],
    doc: 'Bounded chassis motion to a named place, no global path planning. Prefer navigation.navigate.' },

  { cap: 'arm.pos_command', contract: 'robonix/primitive/arm/pos_command', layer: 'primitive',
    params: [{ name: 'object', domain: Object.keys(OBJECTS) }],
    doc: 'Move the end effector to an object. Must be within reach of where the robot is standing.' },

  { cap: 'arm.joint_command', contract: 'robonix/primitive/arm/joint_command', layer: 'primitive',
    params: [{ name: 'name' }, { name: 'position' }],
    doc: `Command a named joint. The gripper is "${GRIPPER_JOINT}": position 0 closes (grasps), 0.045 opens (releases).` },

  { cap: 'arm.end_pose', contract: 'robonix/primitive/arm/end_pose', layer: 'primitive',
    params: [], doc: 'Current end-effector pose and whether something is held.' },

  { cap: 'camera.snapshot', contract: 'robonix/primitive/camera/snapshot', layer: 'primitive',
    params: [], doc: 'Capture one frame from the head camera.' },

  { cap: 'audio.speaker', contract: 'robonix/primitive/audio/speaker', layer: 'primitive',
    params: [{ name: 'text' }], doc: 'Low-level speaker output. Prefer speech.speak.' },

  { cap: 'navigation.navigate', contract: 'robonix/service/navigation/navigate', layer: 'service',
    params: [{ name: 'goal', domain: Object.keys(PLACES) }],
    doc: 'Plan a collision-free path to a named place and drive there.' },

  { cap: 'speech.speak', contract: 'robonix/service/speech/speak', layer: 'service',
    params: [{ name: 'text' }], doc: 'Say a line out loud.' },

  { cap: 'scene.get_robot_context', contract: 'robonix/system/scene/get_robot_context', layer: 'system',
    params: [], doc: 'Where the robot is and what it is holding.' },

  { cap: 'scene.list_objects', contract: 'robonix/system/scene/list_objects', layer: 'system',
    params: [], doc: 'Every object in the scene and where it currently is.' },

  { cap: 'scene.get_object_context', contract: 'robonix/system/scene/get_object_context', layer: 'system',
    params: [{ name: 'object', domain: Object.keys(OBJECTS) }],
    doc: 'Locate one object in the semantic map and list what is next to it.' },

  { cap: 'kitchen.cook', contract: 'robonix/skill/kitchen/cook', layer: 'skill',
    params: [{ name: 'dish' }],
    doc: 'Turn on the stove and cook whatever is on it. Must be standing at the stove.' },

  { cap: 'kitchen.wash', contract: 'robonix/skill/kitchen/wash', layer: 'skill',
    params: [], doc: 'Run the tap. Must be standing at the sink.' },

  { cap: 'houseplant.water', contract: 'robonix/skill/houseplant/water', layer: 'skill',
    params: [], doc: 'Water the plant.' },
];

export { GRIPPER_JOINT };
