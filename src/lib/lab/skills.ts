/**
 * ============================================================================
 *  skill 层 —— 任务级行为
 * ============================================================================
 *
 *  把一个杯子从茶几挪到料理台，用 primitive 拼出来是八步，每一步都要把上一步
 *  的返回值正确地喂进下一步。任何一处偏了整条就断，然后规划器开始在错误里
 *  打转 —— 这就是之前「常规家务做不完」的直接原因。
 *
 *  这里把那几段序列封成可靠的整体。注意**不是**把整个任务封成一步：
 *  pick / place 仍然是两个能力，「做饭」还是要模型自己想清楚先拿哪些食材、
 *  再上灶、最后开火。组合留给规划器，可靠性归系统 —— 这正是 skill 层
 *  该有的分工。
 *
 *  每一步都如实失败：够不着就说够不着，手里没东西就说没东西，灶上没料就
 *  拒绝做饭。绝不为了让 demo 好看而假装成功。
 */

import type { LabWorld } from './world';
import { OBJECTS, PLACES, FURNITURE, type ObjectId, type PlaceId } from './scene-spec';
import { poseFromSim } from './pose';
import { goalNear, findNode } from './semantic-map';

export type SkillResult = { success: boolean; detail: string };

const ok = (detail: string): SkillResult => ({ success: true, detail });
const no = (detail: string): SkillResult => ({ success: false, detail });

/** 认识的目的地 —— 报错时列出来，比一句「未知」有用 */
const placeList = () => Object.keys(PLACES).join(', ');

export function makeSkills(world: LabWorld) {
  /** 走到某个地点的停靠位姿并面向它。失败原因原样往上抛。 */
  async function goTo(place: PlaceId, what: string): Promise<SkillResult | null> {
    const view = world.worldView();
    const g = goalNear(view, place, (p) => world.standFor(p));
    if (!g.reachable) return no(`cannot reach ${what}: ${g.reason}`);

    const r = await world.navigate({ x: g.x, y: g.y, yaw: g.yaw });
    if (!r.accepted) return no(`navigation to ${what} failed: ${r.detail}`);
    return null;      // null = 一切正常
  }

  /**
   * 站定后微调朝向，让目标落进手臂的矢状面。
   *
   * goal_near 给的 yaw 瞄的是物体，但导航是按栅格走的，停下来总有零点几度
   * 的偏差；而手臂只能往正前方够。所以抓取前补一次转向 —— 这一步以前是
   * 指望规划器自己发现并纠正的，它做不到，也不该由它做。
   */
  async function faceTarget(x: number, z: number) {
    const base = world.basePose();
    const bearing = Math.atan2(
      (x - base.x) * Math.cos(base.yaw) - (z - base.y) * Math.sin(base.yaw),
      (x - base.x) * Math.sin(base.yaw) + (z - base.y) * Math.cos(base.yaw),
    );
    if (Math.abs(bearing) > 0.03) {
      await world.chassisMove({ rotate_deg: (bearing * 180) / Math.PI });
    }
  }

  return {
    /** robonix/skill/manipulation/pick */
    async pick(objectId: string): Promise<SkillResult> {
      if (!(objectId in OBJECTS)) {
        return no(`there is no object called "${objectId}". Known objects: ${Object.keys(OBJECTS).join(', ')}`);
      }
      const id = objectId as ObjectId;
      const snap = world.snapshot();
      if (snap.holding === id) return ok(`already holding ${OBJECTS[id].label}`);
      if (snap.holding) {
        return no(`the gripper is already holding ${snap.holding} — put it down first`);
      }

      const at = world.worldView().placeOf[id];
      if (!at || at === 'held') return no(`${id} is not resting anywhere I can reach`);

      const failed = await goTo(at as PlaceId, OBJECTS[id].label);
      if (failed) return failed;

      // 高亮一下，让「找到了」这件事在 3D 里看得见
      await world.highlight(id).catch(() => {});

      const node = findNode(world.worldView(), id);
      if (!node) return no(`${id} vanished from the semantic map`);
      await faceTarget(node.x, node.y);

      try {
        await world.armTo(poseFromSim(node.x, node.y, node.z, 0));
      } catch (e) {
        return no(`could not reach ${OBJECTS[id].label}: ${(e as Error).message}`);
      }
      try {
        await world.jointCommand(['gripper_finger_joint'], [0]);
      } catch (e) {
        return no(`grasp failed: ${(e as Error).message}`);
      }

      /*
        核对抓到的到底是不是它。

        夹爪原语的语义是「合拢在末端最近的东西上」—— 那是对的，真夹爪也不知道
        自己夹住了什么。但 skill 是**指名道姓**要某个物体的，所以必须自己验。
        不验的话，台面上两件东西挨得近时会出现「报告抓到了面条、实际抓着盘子」，
        而且一路成功到底 —— 撒谎的成功比失败难查得多。
      */
      const got = world.snapshot().holding;
      if (got !== id) {
        return no(
          got
            ? `aimed at ${OBJECTS[id].label} but the gripper closed on ${OBJECTS[got as ObjectId]?.label ?? got}`
              + ' — they are too close together on that surface. Move the other one first.'
            : `the gripper closed on nothing at ${OBJECTS[id].label}'s position`,
        );
      }
      return ok(`picked up ${OBJECTS[id].label} from ${PLACES[at as PlaceId].label}`);
    },

    /** robonix/skill/manipulation/place */
    async place(destinationId: string): Promise<SkillResult> {
      if (!(destinationId in PLACES)) {
        return no(`there is no destination called "${destinationId}". Known: ${placeList()}`);
      }
      const dest = destinationId as PlaceId;
      const held = world.snapshot().holding;
      if (!held) return no('the gripper is empty — pick something up first');

      const failed = await goTo(dest, PLACES[dest].label);
      if (failed) return failed;

      /*
        放在**自己正前方**，而不是照排布公式算出的格位。

        restingPosition 是给开局摆场景用的：格位排满一行会往台面深处再推一排，
        那个点可能落在臂展之外。第一版 place 照着它放，于是「灶上第三件」
        永远失败 —— 前两件成功、第三件报够不着，看着像随机故障。

        真实机器人放东西也是放在够得着的地方：站定之后沿正前方伸出一个
        固定距离，再夹到家具的水平范围内。这样按构造就一定可达，
        因为停靠点本来就是按这个距离算出来的。
      */
      const p = PLACES[dest];
      const surface = findNode(world.worldView(), dest);
      const h = surface ? surface.z : 0.9;

      await faceTarget(p.spot[0], p.spot[1]);
      const base = world.basePose();
      const REACH = 0.66;                       // 落在 0.35–0.88 的舒适区中段
      let tx = base.x + Math.sin(base.yaw) * REACH;
      let tz = base.y + Math.cos(base.yaw) * REACH;

      // 夹进这件家具的水平范围，别把东西放到台面外面去
      const f = FURNITURE.find((x) => x.id === p.on);
      if (f) {
        const [fw, , fd] = f.size;
        const clamp = (v: number, c: number, half: number) =>
          Math.min(c + half, Math.max(c - half, v));
        tx = clamp(tx, f.pos[0], Math.max(0, fw / 2 - 0.08));
        tz = clamp(tz, f.pos[2], Math.max(0, fd / 2 - 0.08));
      }

      try {
        // 略高于台面，松手后自然落下
        await world.armTo(poseFromSim(tx, tz, h + 0.06, 0));
      } catch (e) {
        return no(`could not reach over ${p.label}: ${(e as Error).message}`);
      }
      try {
        await world.jointCommand(['gripper_finger_joint'], [0.045]);
      } catch (e) {
        return no(`release failed: ${(e as Error).message}`);
      }
      return ok(`put ${OBJECTS[held as ObjectId]?.label ?? held} on ${p.label}`);
    },

    /** robonix/skill/kitchen/cook */
    async cook(dish: string): Promise<SkillResult> {
      const view = world.worldView();
      /*
        要的是**食材**，不是「灶上有东西」。
        锅本来就放在灶上，只查「有没有物体」的话，空锅也能做出一顿饭来 ——
        第一版就是这样，报了 success 却什么都没发生。宁可拒绝也不要假成功。
      */
      const onHob = Object.keys(OBJECTS).filter(
        (o) => view.placeOf[o] === 'stove' && OBJECTS[o as ObjectId].ingredient,
      );
      if (!onHob.length) {
        const have = Object.keys(OBJECTS).filter((o) => OBJECTS[o as ObjectId].ingredient);
        return no(
          'there are no ingredients on the hob — bring some first with pick/place. '
          + `Ingredients in this apartment: ${have.join(', ')}.`,
        );
      }
      const failed = await goTo('stove', PLACES.stove.label);
      if (failed) return failed;
      await world.cook(dish || 'dinner');
      const what = onHob.map((o) => OBJECTS[o as ObjectId].label).join(' and ');
      return ok(`cooked ${dish || 'a meal'} from ${what}`);
    },

    /** robonix/skill/kitchen/wash */
    async wash(): Promise<SkillResult> {
      const view = world.worldView();
      const inSink = Object.keys(OBJECTS).filter((o) => view.placeOf[o] === 'sink');
      if (!inSink.length) {
        return no('the sink is empty — put the dirty things in the sink first');
      }
      const failed = await goTo('sink', PLACES.sink.label);
      if (failed) return failed;
      await world.wash();
      return ok(`rinsed ${inSink.map((o) => OBJECTS[o as ObjectId].label).join(', ')}`);
    },

    /** robonix/skill/houseplant/water */
    async water(plantId: string): Promise<SkillResult> {
      const id = (plantId in OBJECTS ? plantId : 'plant') as ObjectId;
      const at = world.worldView().placeOf[id];
      if (!at || at === 'held') return no(`${id} is not standing anywhere I can water it`);
      const failed = await goTo(at as PlaceId, OBJECTS[id].label);
      if (failed) return failed;
      await world.water();
      return ok(`watered ${OBJECTS[id].label}`);
    },
  };
}

export type SkillTable = ReturnType<typeof makeSkills>;
