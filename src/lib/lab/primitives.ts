/**
 * ============================================================================
 *  能力实现 —— 浏览器作为 Robonix 的 primitive provider
 * ============================================================================
 *
 *  浏览器在这套系统里只是**硬件**。不规划、不展开计划、不判前置条件 ——
 *  那些是 pilot 和 executor 的职责。
 *
 *  这是唯一的对接面：契约名 → 仿真世界里的动作。
 *  bridge 收到 executor 的调用后按契约名查到这里，把参数丢进来，
 *  动画播完 resolve。
 *
 *  契约名沿用仓库里已有的标准契约（capabilities/primitive/ 下），不自造。
 */

import type { LabWorld } from './world';
import type { PlaceId, ObjectId } from './scene-spec';
import { PLACES, OBJECTS, RECIPES } from './scene-spec';

export type CapReply =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; message: string };

export function makePrimitives(world: LabWorld) {
  const table = {
    async 'chassis.move'(a: { target: string }): Promise<CapReply> {
      if (!(a.target in PLACES)) return { success: false, message: `unknown place "${a.target}"` };
      await world.move(a.target as PlaceId);
      return { success: true, at: world.snapshot().at };
    },

    async 'camera.snapshot'(): Promise<CapReply> {
      const url = world.captureRobotView(0.7);
      return { success: true, image_base64: url.split(',')[1], format: 'jpeg' };
    },

    async 'camera.detect'(a: { object: string }): Promise<CapReply> {
      if (!(a.object in OBJECTS)) return { success: false, message: `unknown object "${a.object}"` };
      const found = await world.detect(a.object as ObjectId);
      return found
        ? { success: true, found: true }
        : { success: false, message: `${a.object} is not visible from here` };
    },

    async 'arm.grasp'(a: { object: string }): Promise<CapReply> {
      if (!(a.object in OBJECTS)) return { success: false, message: `unknown object "${a.object}"` };
      const ok = await world.grasp(a.object as ObjectId);
      return ok
        ? { success: true }
        : { success: false, message: `cannot grasp ${a.object} — not detected here, or the gripper is full` };
    },

    async 'arm.release'(a: { target: string }): Promise<CapReply> {
      if (!(a.target in PLACES)) return { success: false, message: `unknown place "${a.target}"` };
      const ok = await world.release(a.target as PlaceId);
      return ok ? { success: true } : { success: false, message: 'the gripper is empty' };
    },

    async 'speaker.say'(a: { text: string }): Promise<CapReply> {
      await world.say(a.text);
      return { success: true };
    },

    async 'stove.cook'(a: { dish: string }): Promise<CapReply> {
      if (!(a.dish in RECIPES)) return { success: false, message: `no recipe for "${a.dish}"` };
      await world.cook(a.dish);
      return { success: true, dish: a.dish };
    },

    async 'sink.wash'(): Promise<CapReply> {
      await world.wash();
      return { success: true };
    },

    async 'watering.water'(): Promise<CapReply> {
      await world.water();
      return { success: true };
    },

    async 'scene.get_robot_context'(): Promise<CapReply> {
      return { success: true, ...world.snapshot() };
    },
  };
  return table;
}

export type PrimitiveTable = ReturnType<typeof makePrimitives>;
export type CapName = keyof PrimitiveTable;

/**
 * 能力目录 —— bridge 用它向 Atlas 声明，pilot 用它渲染给 VLM 的清单。
 * `contract` 是 Robonix 的标准契约 id；`cap` 是 pilot 目录里的短名
 * （provider_id + "." + area_leaf），VLM 在 RTDL 里就是抄这个。
 */
export const CATALOG: {
  cap: CapName;
  contract: string;
  layer: 'primitive' | 'service';
  params: { name: string; domain?: readonly string[] }[];
  doc: string;
}[] = [
  { cap: 'chassis.move', contract: 'robonix/primitive/chassis/move', layer: 'primitive',
    params: [{ name: 'target', domain: Object.keys(PLACES) }],
    doc: 'Drive the base to a named place and face it.' },

  { cap: 'camera.snapshot', contract: 'robonix/primitive/camera/snapshot', layer: 'primitive',
    params: [], doc: 'Capture the current camera frame.' },

  { cap: 'camera.detect', contract: 'robonix/primitive/camera/detect', layer: 'primitive',
    params: [{ name: 'object', domain: Object.keys(OBJECTS) }],
    doc: 'Look for an object from where the robot is standing. Must succeed before grasping.' },

  { cap: 'arm.grasp', contract: 'robonix/primitive/arm/grasp', layer: 'primitive',
    params: [{ name: 'object', domain: Object.keys(OBJECTS) }],
    doc: 'Close the gripper on a detected object within reach.' },

  { cap: 'arm.release', contract: 'robonix/primitive/arm/release', layer: 'primitive',
    params: [{ name: 'target', domain: Object.keys(PLACES) }],
    doc: 'Open the gripper over a surface, putting the held object down.' },

  { cap: 'speaker.say', contract: 'robonix/primitive/audio/speaker', layer: 'primitive',
    params: [{ name: 'text' }], doc: 'Say a short line out loud.' },

  { cap: 'stove.cook', contract: 'robonix/primitive/stove/cook', layer: 'primitive',
    params: [{ name: 'dish', domain: Object.keys(RECIPES) }],
    doc: 'Cook whatever ingredients are on the stove.' },

  { cap: 'sink.wash', contract: 'robonix/primitive/sink/wash', layer: 'primitive',
    params: [], doc: 'Run the tap and wash what is in the sink.' },

  { cap: 'watering.water', contract: 'robonix/primitive/watering/water', layer: 'primitive',
    params: [], doc: 'Water the plant.' },

  { cap: 'scene.get_robot_context', contract: 'robonix/system/scene/get_robot_context', layer: 'service',
    params: [], doc: 'Where the robot is, what it holds, and where every object is.' },
];
