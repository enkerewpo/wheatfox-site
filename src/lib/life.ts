/**
 * Conway 生命游戏引擎。
 * favicon 里那个 16×16 和侧栏那条可见网格共用这一份实现。
 *
 * 环面拓扑：滑翔机从一边走出去会从另一边回来，不会撞墙卡死。
 */

export type Grid = { w: number; h: number; cells: Uint8Array };

export function makeGrid(w: number, h: number): Grid {
  return { w, h, cells: new Uint8Array(w * h) };
}

/** 随机播种。density 是初始存活率，0.3 左右最容易长出有意思的东西 */
export function seed(g: Grid, density = 0.32): Grid {
  for (let i = 0; i < g.cells.length; i++) {
    g.cells[i] = Math.random() < density ? 1 : 0;
  }
  return g;
}

/** 在 (x, y) 处放一个滑翔机，给随机局面添点保证会动的东西 */
export function addGlider(g: Grid, x: number, y: number): Grid {
  const pts = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
  for (const [dx, dy] of pts) {
    const nx = (x + dx + g.w) % g.w;
    const ny = (y + dy + g.h) % g.h;
    g.cells[ny * g.w + nx] = 1;
  }
  return g;
}

/** 推进一代，返回新的 Grid（不原地改，方便比较前后是否相同） */
export function step(g: Grid): Grid {
  const { w, h, cells } = g;
  const next = new Uint8Array(cells.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          n += cells[((y + dy + h) % h) * w + ((x + dx + w) % w)];
        }
      }
      const alive = cells[y * w + x];
      next[y * w + x] = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
    }
  }
  return { w, h, cells: next };
}

/**
 * 检测「死局」：全灭、静物、或短周期振荡。
 * 不检测的话图标/面板会僵在一个图案上再也不动，看着像坏了。
 */
export class StallDetector {
  private history: string[] = [];
  constructor(private depth = 12) {}

  /** 返回 true 表示该重新播种了 */
  check(g: Grid): boolean {
    if (!g.cells.some(Boolean)) return true;
    const key = g.cells.join('');
    if (this.history.includes(key)) {
      this.history = [];
      return true;
    }
    this.history.push(key);
    if (this.history.length > this.depth) this.history.shift();
    return false;
  }

  reset() {
    this.history = [];
  }
}
