/**
 * ============================================================================
 *  语义地图 —— system/scene 服务的数据
 * ============================================================================
 *
 *  这一层的存在理由：primitive 只认识米和弧度，「把杯子放到料理台上」这句话
 *  在那里没有任何意义。名字住在这儿，米制也住在这儿，`goalNear` 是它们之间
 *  唯一的官方出口。
 *
 *  一个测试里发现的坑，值得写下来：最早 `list_objects` 只返回可搬动的物体，
 *  于是 qwen3.8-max 收到「把杯子放到料理台上」之后调 get_object_context('counter')
 *  直接失败 —— **目的地根本不在地图里**。台面、水槽、餐桌这些当然也是场景里的
 *  东西，只是搬不动而已。所以这里把它们一并作为节点暴露出去，用 `movable`
 *  区分能不能抓。
 *
 *  另一件事：这些坐标是仿真真值，不是感知出来的。所以 confidence 一律 1.0，
 *  soma.yaml 的 cannot_do 里也写明了这台机器人没有检测器。宁可说清楚，
 *  也不要编一个像模像样的 0.87。
 */

import {
  OBJECTS, PLACES, surfaceY, type ObjectId, type PlaceId,
} from './scene-spec';

/** 地图里的一个节点 —— 可能是能搬的东西，也可能是一件家具 */
export type SceneNode = {
  id: string;
  label: string;
  /** 世界坐标（米），ROS 约定：x 向右、y 向前、z 向上 */
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** 能不能抓起来。家具是 false */
  movable: boolean;
  /** 一句人话描述，喂给 VLM */
  caption: string;
};

export type Relation = {
  source_id: string;
  target_id: string;
  relation: string;
  reason: string;
};

/** 世界当前的样子 —— 由 LabWorld 提供 */
export type WorldView = {
  /** 每个物体现在在哪个地点（'held' = 拿在手里） */
  placeOf: Record<string, PlaceId | 'held'>;
  /** 物体的实际世界坐标 */
  objectPos: Record<string, [number, number, number]>;
  /** 机器人底盘 */
  robot: { x: number; z: number; yaw: number };
  holding: string | null;
};

/* -------------------------------------------------------------------------- */
/* 房间划分 —— 用来回答「你在哪个房间」                                          */
/* -------------------------------------------------------------------------- */

type Area = { id: string; name: string; z: [number, number] };

/**
 * 这间公寓是开放式的，没有隔墙，所以按功能分区而不是按房间。
 * 边界取自家具的实际位置：厨房沿后墙 (z ≈ -2.9)，客厅在 +z 那头。
 */
const AREAS: Area[] = [
  { id: 'kitchen',      name: 'the kitchen',      z: [-3.5, -1.6] },
  { id: 'dining',       name: 'the dining area',  z: [-1.6,  1.2] },
  { id: 'living_room',  name: 'the living room',  z: [ 1.2,  3.5] },
];

function areaAt(z: number): Area {
  for (const a of AREAS) if (z >= a.z[0] && z < a.z[1]) return a;
  return AREAS[AREAS.length - 1];
}

/* -------------------------------------------------------------------------- */
/* 节点                                                                        */
/* -------------------------------------------------------------------------- */

/** 家具的一句话描述 —— VLM 靠这个判断该把东西放哪 */
const SURFACE_CAPTIONS: Record<PlaceId, string> = {
  counter:        'a long kitchen worktop, the usual place to prepare food',
  stove:          'a gas hob; things put here can be cooked',
  sink:           'a steel sink; dirty dishes go here to be washed',
  fridge:         'the fridge, where the fresh ingredients are kept',
  shelf:          'open wooden shelving where the crockery lives',
  table:          'the dining table, where meals are served',
  'coffee-table': 'a low coffee table in front of the sofa',
  sofa:           'a two-seat sofa facing the coffee table',
  bin:            'the waste bin; rubbish goes in here',
};

/** 家具节点 —— 位置取台面中心，高度取台面高度 */
export function surfaceNodes(): SceneNode[] {
  return (Object.keys(PLACES) as PlaceId[]).map((id) => {
    const p = PLACES[id];
    return {
      id,
      label: p.label,
      x: p.spot[0],
      y: p.spot[1],
      z: surfaceY(id),
      yaw: 0,
      movable: false,
      caption: SURFACE_CAPTIONS[id],
    };
  });
}

/** 可搬动物体的节点 */
export function objectNodes(view: WorldView): SceneNode[] {
  return (Object.keys(OBJECTS) as ObjectId[]).map((id) => {
    const spec = OBJECTS[id];
    const pos = view.objectPos[id];
    const at = view.placeOf[id];
    const where =
      at === 'held' ? 'currently held in the gripper'
        : at ? `on ${PLACES[at as PlaceId].label}`
          : 'somewhere in the room';
    return {
      id,
      label: spec.label,
      x: pos ? pos[0] : 0,
      y: pos ? pos[2] : 0,          // three 的 z 是 ROS 的 y
      z: pos ? pos[1] : 0,          // three 的 y 是 ROS 的 z
      yaw: 0,
      movable: true,
      caption: `${spec.label}, ${where}`,
    };
  });
}

export function allNodes(view: WorldView): SceneNode[] {
  return [...objectNodes(view), ...surfaceNodes()];
}

export function findNode(view: WorldView, id: string): SceneNode | null {
  return allNodes(view).find((n) => n.id === id) ?? null;
}

/* -------------------------------------------------------------------------- */
/* 关系                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * 场景图的边。这里只有两种关系，因为世界只支持这两种：
 * 物体「在」某件家具上，家具「属于」某个功能区。
 * 不去编 near / left_of 之类看着高级但没人用的边。
 */
export function relationsOf(view: WorldView, id: string): Relation[] {
  const out: Relation[] = [];
  const at = view.placeOf[id];
  if (at && at !== 'held') {
    out.push({
      source_id: id, target_id: at, relation: 'on',
      reason: 'simulation ground truth',
    });
  } else if (at === 'held') {
    out.push({
      source_id: id, target_id: 'robot', relation: 'held_by',
      reason: 'the gripper is closed on it',
    });
  }
  if (id in PLACES) {
    const p = PLACES[id as PlaceId];
    out.push({
      source_id: id, target_id: areaAt(p.spot[1]).id, relation: 'in',
      reason: 'by position',
    });
  }
  return out;
}

/** 和某个节点同处一件家具上的其它东西 */
export function nearbyOf(view: WorldView, id: string): SceneNode[] {
  const at = view.placeOf[id];
  const objs = objectNodes(view);
  if (at && at !== 'held') {
    // 物体：同一台面上的其它物体，外加那件家具本身
    const surface = surfaceNodes().find((s) => s.id === at);
    return [
      ...objs.filter((o) => o.id !== id && view.placeOf[o.id] === at),
      ...(surface ? [surface] : []),
    ];
  }
  if (id in PLACES) {
    // 家具：放在它上面的东西
    return objs.filter((o) => view.placeOf[o.id] === id);
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* goal_near —— 语义到米制的那道门                                              */
/* -------------------------------------------------------------------------- */

export type GoalNear = {
  reachable: boolean;
  x: number;
  y: number;
  yaw: number;
  reason: string;
};

/**
 * 把一个名字变成机器人真的能站过去的位姿。
 *
 * 停靠点不是这里编的：`PLACES[*].stand` 由家具的实际包围盒加净空算出来
 * （见 scene-spec 的 computeStands），所以家具一挪，停靠点跟着挪，
 * 不会再出现「站在茶几里」那种事。
 *
 * 拿在手里的东西没有停靠点可言 —— 如实说，别给一个 (0,0)。
 */
export function goalNear(
  view: WorldView,
  id: string,
  resolve: (place: PlaceId) => [number, number],
): GoalNear {
  const miss = (reason: string): GoalNear =>
    ({ reachable: false, x: 0, y: 0, yaw: 0, reason });

  let place: PlaceId | null = null;

  if (id in PLACES) {
    place = id as PlaceId;
  } else if (id in OBJECTS) {
    const at = view.placeOf[id];
    if (at === 'held') {
      return miss(`${OBJECTS[id as ObjectId].label} is already in the gripper`);
    }
    if (!at) return miss(`${id} is not anywhere in the map right now`);
    place = at as PlaceId;
  } else {
    const known = allNodes(view).map((n) => n.id).join(', ');
    return miss(`no node called "${id}" in the map. Known nodes: ${known}`);
  }

  const p = PLACES[place];
  // 停靠点可能被别的家具压住，导航侧会外移到最近的可站格
  const [sx, sz] = resolve(place);

  /*
    朝向要瞄**这个物体**，不是家具中心。

    物体是靠边摆的（见 restingPosition），一张 1.5 m 宽的餐桌上，桌角的杯子
    和桌心能差出 40 多度 —— 而这条臂只能往正前方够。瞄家具中心的话，机器人
    会停在正确的位置、却偏着身子，然后手臂报「偏了 44°」。
    goal_near(object_id) 的语义本来就是「给我一个能操作这个东西的位姿」。
  */
  const node = id in OBJECTS ? findNode(view, id) : null;
  const aimX = node ? node.x : p.spot[0];
  const aimZ = node ? node.y : p.spot[1];
  const yaw = Math.atan2(aimX - sx, aimZ - sz);

  const moved = Math.hypot(sx - p.stand[0], sz - p.stand[1]) > 0.05;
  return {
    reachable: true, x: sx, y: sz, yaw,
    reason: (moved
      ? `stand point beside ${p.label}, nudged clear of an obstacle`
      : `free stand point beside ${p.label}`)
      + (node ? `, facing ${node.label}` : ''),
  };
}

/** 机器人当前所在的功能区 */
export function robotArea(view: WorldView) {
  return areaAt(view.robot.z);
}
