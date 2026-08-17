/**
 * ============================================================================
 *  导航 —— 占用栅格 + A* + 碰撞检测
 * ============================================================================
 *
 *  之前是「先退到走廊、再横移」的手写折线，家具一挪就穿模。
 *  现在按真的做：把家具投影成占用栅格（按机器人半径膨胀），A* 求路径，
 *  再把折线拉直。走不通就返回 null —— 让上层如实报「到不了」，
 *  而不是穿墙过去假装成功。
 *
 *  这也是导航服务本来就该做的事：service/navigation 在真机上就是
 *  规划一条无碰撞路径，然后交给底盘执行。
 */

import { FURNITURE, ROOM, type PlaceId, PLACES } from './scene-spec';

/** 栅格分辨率（米/格）。0.1 足够精细，8×7 的房间也就 80×70 格 */
const CELL = 0.1;
/** 机器人底盘半径 + 余量。障碍按这个膨胀，路径就自带净空 */
export const ROBOT_RADIUS = 0.34;

/** 房间在世界坐标里的范围 */
const MIN_X = -ROOM.w / 2;
const MIN_Z = 0.2 - ROOM.d / 2;
const NX = Math.ceil(ROOM.w / CELL);
const NZ = Math.ceil(ROOM.d / CELL);

export type Grid = Uint8Array; // 1 = 被占

function idx(ix: number, iz: number) { return iz * NX + ix; }
function toCell(x: number, z: number): [number, number] {
  return [Math.round((x - MIN_X) / CELL), Math.round((z - MIN_Z) / CELL)];
}
function toWorld(ix: number, iz: number): [number, number] {
  return [MIN_X + ix * CELL, MIN_Z + iz * CELL];
}

/**
 * 建占用栅格。
 * 只有**会挡住底盘**的家具才算障碍 —— 桌面在 0.72 高，底盘只有 0.35 高，
 * 但桌腿是实打实挡路的，所以按家具的水平投影算，不看高度。
 * （真机上底盘激光也是这么看的：投影到平面。）
 */
export function buildGrid(): Grid {
  const g = new Uint8Array(NX * NZ);

  // 墙：四周一圈按机器人半径封起来
  const pad = Math.ceil(ROBOT_RADIUS / CELL);
  for (let ix = 0; ix < NX; ix++) {
    for (let iz = 0; iz < NZ; iz++) {
      if (ix < pad || iz < pad || ix >= NX - pad || iz >= NZ - pad) g[idx(ix, iz)] = 1;
    }
  }

  // 家具：水平投影 + 膨胀
  for (const f of FURNITURE) {
    const [fw, , fd] = f.size;
    const [fx, , fz] = f.pos;
    const x0 = fx - fw / 2 - ROBOT_RADIUS;
    const x1 = fx + fw / 2 + ROBOT_RADIUS;
    const z0 = fz - fd / 2 - ROBOT_RADIUS;
    const z1 = fz + fd / 2 + ROBOT_RADIUS;
    const [ax, az] = toCell(x0, z0);
    const [bx, bz] = toCell(x1, z1);
    for (let ix = Math.max(0, ax); ix <= Math.min(NX - 1, bx); ix++) {
      for (let iz = Math.max(0, az); iz <= Math.min(NZ - 1, bz); iz++) {
        g[idx(ix, iz)] = 1;
      }
    }
  }
  return g;
}

/** 某个世界坐标能不能站 */
export function isFree(g: Grid, x: number, z: number): boolean {
  const [ix, iz] = toCell(x, z);
  if (ix < 0 || iz < 0 || ix >= NX || iz >= NZ) return false;
  return g[idx(ix, iz)] === 0;
}

/** 找离目标最近的可站格 —— 停靠点可能正好压在膨胀区里 */
function nearestFree(g: Grid, x: number, z: number, maxR = 14): [number, number] | null {
  const [cx, cz] = toCell(x, z);
  for (let r = 0; r <= maxR; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const ix = cx + dx, iz = cz + dz;
        if (ix < 0 || iz < 0 || ix >= NX || iz >= NZ) continue;
        if (g[idx(ix, iz)] === 0) return [ix, iz];
      }
    }
  }
  return null;
}

/** 两点之间是否直视可达（用于路径拉直） */
function lineFree(g: Grid, ax: number, az: number, bx: number, bz: number): boolean {
  const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / (CELL * 0.5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!isFree(g, ax + (bx - ax) * t, az + (bz - az) * t)) return false;
  }
  return true;
}

/**
 * A* 求路径。返回世界坐标折线（含起点终点），走不通返回 null。
 * 八邻域，斜向要求两个正交邻居都空，避免贴角穿过。
 */
export function planPath(
  g: Grid, from: [number, number], to: [number, number],
): [number, number][] | null {
  const s = nearestFree(g, from[0], from[1]);
  const t = nearestFree(g, to[0], to[1]);
  if (!s || !t) return null;

  const [sx, sz] = s, [tx, tz] = t;
  const N = NX * NZ;
  const gScore = new Float32Array(N).fill(Infinity);
  const fScore = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const open: number[] = [];

  const h = (ix: number, iz: number) => Math.hypot(ix - tx, iz - tz);
  const startI = idx(sx, sz), goalI = idx(tx, tz);
  gScore[startI] = 0;
  fScore[startI] = h(sx, sz);
  open.push(startI);

  const NB: [number, number, number][] = [
    [1,0,1],[-1,0,1],[0,1,1],[0,-1,1],
    [1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2],
  ];

  while (open.length) {
    // 简单线性取最小 —— 栅格才 5600 格，不值得上二叉堆
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (fScore[open[i]] < fScore[open[bi]]) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === goalI) break;

    const cix = cur % NX, ciz = (cur - (cur % NX)) / NX;
    for (const [dx, dz, cost] of NB) {
      const nx = cix + dx, nz = ciz + dz;
      if (nx < 0 || nz < 0 || nx >= NX || nz >= NZ) continue;
      const ni = idx(nx, nz);
      if (g[ni]) continue;
      // 斜着走时不许贴角穿过
      if (dx && dz && (g[idx(cix + dx, ciz)] || g[idx(cix, ciz + dz)])) continue;

      const tentative = gScore[cur] + cost;
      if (tentative < gScore[ni]) {
        came[ni] = cur;
        gScore[ni] = tentative;
        fScore[ni] = tentative + h(nx, nz);
        if (!open.includes(ni)) open.push(ni);
      }
    }
  }

  if (came[goalI] === -1 && goalI !== startI) return null;

  // 回溯
  const cells: number[] = [];
  for (let c = goalI; c !== -1; c = came[c]) {
    cells.push(c);
    if (c === startI) break;
  }
  cells.reverse();

  const pts: [number, number][] = cells.map((c) => {
    const ix = c % NX, iz = (c - (c % NX)) / NX;
    return toWorld(ix, iz);
  });

  // 拉直：能一眼看到的中间点全部丢掉，机器人就不会走出锯齿
  const out: [number, number][] = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !lineFree(g, pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--;
    out.push(pts[j]);
    i = j;
  }
  return out;
}

/** 每个地点的实际可站点（停靠点被家具压住时自动外移） */
export function resolveStand(g: Grid, place: PlaceId): [number, number] {
  const [x, z] = PLACES[place].stand;
  if (isFree(g, x, z)) return [x, z];
  const c = nearestFree(g, x, z);
  return c ? toWorld(c[0], c[1]) : [x, z];
}

export const GRID_INFO = { CELL, NX, NZ, MIN_X, MIN_Z };
