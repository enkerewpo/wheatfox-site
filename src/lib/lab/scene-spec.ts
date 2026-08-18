/**
 * ============================================================================
 *  场景定义 —— 家具、地点、物体的单一真相来源
 * ============================================================================
 *
 *  之前物体是悬空的，因为「台面高度」是我在两个地方各写一遍的常数，
 *  和家具实际几何对不上。现在反过来：**先定义家具的真实尺寸，
 *  台面高度从家具算出来，物体再落在台面上**，不可能再飘。
 *
 *      surfaceY = furniture.y + furniture.height / 2      家具顶面
 *      objectY  = surfaceY + object.rest                  物体重心离顶面的高度
 *
 *  房间尺寸都按真实比例（米）：台面 0.9 高、冰箱 1.8 高、桌子 0.75 高。
 */

/* -------------------------------------------------------------------------- */
/* 家具                                                                        */
/* -------------------------------------------------------------------------- */

export type Furniture = {
  id: string;
  /** 盒体尺寸：宽 高 深 */
  size: [number, number, number];
  /** 盒心坐标 */
  pos: [number, number, number];
  color: number;
  /** 这件家具的顶面能不能放东西 */
  surface?: boolean;
};

/** 卡通配色，和站点米白/灰玫瑰不冲突 */
export const C = {
  floor:     0xe6e0d2,
  rug:       0xc7b4a4,
  wall:      0xf4efe4,
  skirting:  0xded5c4,
  counter:   0xd9d0c0,
  worktop:   0xefe9dc,
  wood:      0xb28f66,
  woodDark:  0x8d6f4e,
  metal:     0xc2c7cc,
  fridge:    0xe6e9eb,
  stove:     0x3a3632,
  plant:     0x6f9464,
  pot:       0xb5734f,
  bin:       0x9aa0a6,
  robot:     0xf0a92b,
  robotDark: 0x2f2b28,
  accent:    0x4ecdc4,
} as const;

/** 房间：8 宽 × 7 深，墙高 2.7 */
export const ROOM = { w: 8, d: 7, wall: 2.7 } as const;

export const FURNITURE: Furniture[] = [
  // ---- 厨房沿后墙一字排开 ----
  { id: 'counter-run', size: [4.6, 0.86, 0.62], pos: [-1.0, 0.43, -2.9], color: C.counter, surface: false },
  { id: 'worktop',     size: [4.7, 0.05, 0.66], pos: [-1.0, 0.885, -2.9], color: C.worktop, surface: true },

  { id: 'stove-body',  size: [0.76, 0.86, 0.62], pos: [0.55, 0.43, -2.9], color: C.stove, surface: false },
  { id: 'stove-top',   size: [0.78, 0.05, 0.64], pos: [0.55, 0.885, -2.9], color: 0x2b2825, surface: true },

  { id: 'sink-basin',  size: [0.68, 0.16, 0.46], pos: [-2.3, 0.83, -2.9], color: C.metal, surface: true },

  { id: 'fridge',      size: [0.82, 1.85, 0.72], pos: [2.35, 0.925, -2.85], color: C.fridge, surface: false },

  // ---- 架子（左墙）----
  { id: 'shelf-frame', size: [0.10, 1.5, 0.9], pos: [-3.55, 0.95, -1.2], color: C.woodDark, surface: false },
  { id: 'shelf-b1',    size: [0.86, 0.06, 0.86], pos: [-3.15, 0.62, -1.2], color: C.wood, surface: true },
  { id: 'shelf-b2',    size: [0.86, 0.06, 0.86], pos: [-3.15, 1.12, -1.2], color: C.wood, surface: true },
  { id: 'shelf-b3',    size: [0.86, 0.06, 0.86], pos: [-3.15, 1.62, -1.2], color: C.wood, surface: true },

  // ---- 餐桌（房间中偏右）----
  { id: 'table-top',   size: [1.5, 0.06, 0.95], pos: [1.4, 0.72, 0.5], color: C.wood, surface: true },
  { id: 'table-l1',    size: [0.08, 0.72, 0.08], pos: [0.75, 0.36, 0.1], color: C.woodDark },
  { id: 'table-l2',    size: [0.08, 0.72, 0.08], pos: [2.05, 0.36, 0.1], color: C.woodDark },
  { id: 'table-l3',    size: [0.08, 0.72, 0.08], pos: [0.75, 0.36, 0.9], color: C.woodDark },
  { id: 'table-l4',    size: [0.08, 0.72, 0.08], pos: [2.05, 0.36, 0.9], color: C.woodDark },

  // ---- 客厅茶几 ----
  { id: 'coffee-top',  size: [1.1, 0.05, 0.6], pos: [-1.6, 0.42, 1.9], color: C.wood, surface: true },
  { id: 'coffee-l1',   size: [0.07, 0.4, 0.07], pos: [-2.05, 0.2, 1.65], color: C.woodDark },
  { id: 'coffee-l2',   size: [0.07, 0.4, 0.07], pos: [-1.15, 0.2, 1.65], color: C.woodDark },
  { id: 'coffee-l3',   size: [0.07, 0.4, 0.07], pos: [-2.05, 0.2, 2.15], color: C.woodDark },
  { id: 'coffee-l4',   size: [0.07, 0.4, 0.07], pos: [-1.15, 0.2, 2.15], color: C.woodDark },

  // ---- 沙发 ----
  { id: 'sofa-seat',   size: [1.9, 0.36, 0.78], pos: [-1.6, 0.26, 2.95], color: 0xb9a898 },
  { id: 'sofa-back',   size: [1.9, 0.52, 0.18], pos: [-1.6, 0.62, 3.32], color: 0xa89787 },
  { id: 'sofa-armL',   size: [0.18, 0.5, 0.78], pos: [-2.46, 0.4, 2.95], color: 0xa89787 },
  { id: 'sofa-armR',   size: [0.18, 0.5, 0.78], pos: [-0.74, 0.4, 2.95], color: 0xa89787 },

  // ---- 垃圾桶 ----
  { id: 'bin', size: [0.34, 0.5, 0.34], pos: [3.0, 0.25, -1.1], color: C.bin, surface: true },
];

/* -------------------------------------------------------------------------- */
/* 地点                                                                        */
/* -------------------------------------------------------------------------- */

export type PlaceId =
  | 'counter' | 'stove' | 'sink' | 'fridge' | 'shelf'
  | 'table' | 'coffee-table' | 'sofa' | 'bin';

export type Place = {
  id: PlaceId;
  /** 显示名，也喂给 VLM */
  label: string;
  /** 放东西的那件家具 */
  on: string;
  /** 机器人从哪一侧靠近。停靠点由这一侧的家具外沿 + 净空算出 */
  approach: 'front' | 'back' | 'left' | 'right';
  /** 停靠点（自动算出，见 computeStands） */
  stand: [number, number];
  /** 同一台面上多个物体的排布中心（= 家具中心的 x/z） */
  spot: [number, number];
};

/**
 * 机器人底盘半径 0.31，再留一点余量。
 * 之前停靠点是手写的，结果机器人站进了茶几里 —— 和物体悬空是同一类错误：
 * 位置常量和几何各写一份，必然对不上。现在从家具盒体算。
 */
const CLEARANCE = 0.62;

type PlaceDef = Pick<Place, 'id' | 'label' | 'on' | 'approach'>;

const PLACE_DEFS: PlaceDef[] = [
  { id: 'sink',         label: 'the sink',         on: 'sink-basin', approach: 'front' },
  { id: 'counter',      label: 'the counter',      on: 'worktop',    approach: 'front' },
  { id: 'stove',        label: 'the stove',        on: 'stove-top',  approach: 'front' },
  { id: 'fridge',       label: 'the fridge',       on: 'fridge',     approach: 'front' },
  { id: 'shelf',        label: 'the shelf',        on: 'shelf-b2',   approach: 'right' },
  { id: 'table',        label: 'the dining table', on: 'table-top',  approach: 'front' },
  { id: 'coffee-table', label: 'the coffee table', on: 'coffee-top', approach: 'front' },
  { id: 'sofa',         label: 'the sofa',         on: 'sofa-seat',  approach: 'front' },
  { id: 'bin',          label: 'the bin',          on: 'bin',        approach: 'front' },
];

/** 由家具几何算出停靠点和摆放中心 —— 不再手写坐标 */
function computeStands(): Record<PlaceId, Place> {
  const byId = new Map(FURNITURE.map((f) => [f.id, f]));
  const out = {} as Record<PlaceId, Place>;
  for (const def of PLACE_DEFS) {
    const f = byId.get(def.on);
    if (!f) throw new Error(`place ${def.id} references unknown furniture ${def.on}`);
    const [fw, , fd] = f.size;
    const [fx, , fz] = f.pos;

    let sx = fx, sz = fz;
    switch (def.approach) {
      case 'front': sz = fz + fd / 2 + CLEARANCE; break;   // 房间中心在 +z 方向
      case 'back':  sz = fz - fd / 2 - CLEARANCE; break;
      case 'left':  sx = fx - fw / 2 - CLEARANCE; break;
      case 'right': sx = fx + fw / 2 + CLEARANCE; break;
    }
    out[def.id] = { ...def, stand: [sx, sz], spot: [fx, fz] };
  }
  return out;
}

export const PLACES: Record<PlaceId, Place> = computeStands();

/* -------------------------------------------------------------------------- */
/* 物体                                                                        */
/* -------------------------------------------------------------------------- */

export type ObjectId =
  | 'tomato' | 'egg' | 'noodles' | 'pan' | 'plate' | 'bowl'
  | 'mug' | 'book' | 'plant' | 'trash';

export type ObjectSpec = {
  id: ObjectId;
  label: string;
  /** 造型 */
  shape: 'sphere' | 'ellipsoid' | 'cylinder' | 'box' | 'disc' | 'bowl' | 'plant' | 'crumple';
  size: [number, number, number];
  color: number;
  /**
   * 重心离所在台面的高度。放置时 y = surfaceY + rest，
   * 所以永远不会陷进台面也不会浮在空中。
   */
  rest: number;
  /** 该在哪 —— tidy_up 靠它判断东西是不是乱放了 */
  home: PlaceId;
  /** 开局在哪（不写就用 home） */
  start?: PlaceId;
  /** 是不是食材 */
  ingredient?: boolean;
};

export const OBJECTS: Record<ObjectId, ObjectSpec> = {
  tomato:  { id: 'tomato',  label: 'a tomato',  shape: 'sphere',    size: [0.09, 0.09, 0.09], color: 0xd9483a, rest: 0.045, home: 'fridge', ingredient: true },
  egg:     { id: 'egg',     label: 'an egg',    shape: 'ellipsoid', size: [0.06, 0.08, 0.06], color: 0xf2e4c6, rest: 0.040, home: 'fridge', ingredient: true },
  noodles: { id: 'noodles', label: 'noodles',   shape: 'cylinder',  size: [0.08, 0.20, 0.08], color: 0xdfbf67, rest: 0.100, home: 'shelf',  ingredient: true },
  pan:     { id: 'pan',     label: 'a pan',     shape: 'cylinder',  size: [0.30, 0.08, 0.30], color: 0x4a4643, rest: 0.040, home: 'stove' },
  plate:   { id: 'plate',   label: 'a plate',   shape: 'disc',      size: [0.26, 0.02, 0.26], color: 0xfaf6ee, rest: 0.010, home: 'shelf' },
  bowl:    { id: 'bowl',    label: 'a bowl',    shape: 'bowl',      size: [0.20, 0.10, 0.20], color: 0xe8ded0, rest: 0.050, home: 'shelf' },
  mug:     { id: 'mug',     label: 'a mug',     shape: 'cylinder',  size: [0.10, 0.11, 0.10], color: 0x9F8383, rest: 0.055, home: 'shelf',  start: 'coffee-table' },
  book:    { id: 'book',    label: 'a book',    shape: 'box',       size: [0.20, 0.05, 0.26], color: 0x6f8f66, rest: 0.025, home: 'shelf',  start: 'table' },
  plant:   { id: 'plant',   label: 'a plant',   shape: 'plant',     size: [0.22, 0.34, 0.22], color: C.plant,  rest: 0.170, home: 'coffee-table' },
  trash:   { id: 'trash',   label: 'a crumpled wrapper', shape: 'crumple', size: [0.11, 0.10, 0.11], color: 0xcfc6b6, rest: 0.055, home: 'bin', start: 'counter' },
};

/* -------------------------------------------------------------------------- */
/* 由家具推导出的台面高度 —— 物体不悬空的关键                                     */
/* -------------------------------------------------------------------------- */

const BY_ID = new Map(FURNITURE.map((f) => [f.id, f]));

/** 某件家具的顶面 y */
export function topOf(furnitureId: string): number {
  const f = BY_ID.get(furnitureId);
  if (!f) throw new Error(`unknown furniture: ${furnitureId}`);
  return f.pos[1] + f.size[1] / 2;
}

/** 某个地点的台面 y */
export function surfaceY(place: PlaceId): number {
  return topOf(PLACES[place].on);
}

/**
 * 物体放在某地点时的世界坐标。
 * `slot` 是同一台面上的第几个，用来横向错开，避免互相重叠。
 *
 * 摆放要**偏向机器人接近的那一侧**，不能居中：机器人停在离家具外沿
 * CLEARANCE(0.62 m) 的地方，如果东西还摆在台面正中，水平够取距离就是
 * 0.62 + 半个台面深度 —— 架子那种 0.86 深的家具直接超过 1 m，
 * 一条 0.88 的臂怎么都够不着。人放东西本来也是放在手边那一侧。
 */
export function restingPosition(
  obj: ObjectId, place: PlaceId, slot: number,
): [number, number, number] {
  const p = PLACES[place];
  const spec = OBJECTS[obj];
  const f = BY_ID.get(p.on)!;
  const [fw, , fd] = f.size;

  // 三个一排，多了往台面深处排
  const col = slot % 3;
  const row = Math.floor(slot / 3);

  // 从台面中心往接近侧推，但留 0.1 m 边距免得挂在外沿上
  const push = (span: number) => Math.max(0, span / 2 - 0.12);
  let dx = 0, dz = 0;
  switch (p.approach) {
    case 'front': dz = push(fd) - row * 0.2; dx = (col - 1) * 0.24; break;
    case 'back':  dz = -push(fd) + row * 0.2; dx = (col - 1) * 0.24; break;
    case 'right': dx = push(fw) - row * 0.2; dz = (col - 1) * 0.24; break;
    case 'left':  dx = -push(fw) + row * 0.2; dz = (col - 1) * 0.24; break;
  }
  return [p.spot[0] + dx, surfaceY(place) + spec.rest, p.spot[1] + dz];
}

/** 菜谱 */
export const RECIPES: Record<string, { needs: ObjectId[]; label: string }> = {
  'tomato-egg': { needs: ['tomato', 'egg'], label: 'tomato and egg' },
  'noodles':    { needs: ['noodles', 'egg'], label: 'noodles' },
};
