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

/* ==========================================================================
   已知图样库
   纯随机播种出来就是一片噪点，没有可读性。生命游戏好玩的地方在于那些
   有名字的东西：滑翔机会走、脉冲星会呼吸、r-pentomino 会炸开。
   所以播种时先摆几个已知图样，再撒少量随机点当背景。
   ========================================================================== */

/** 图样用相对坐标点集表示 */
export type Pattern = { name: string; w: number; h: number; cells: [number, number][] };

export const PATTERNS: Record<string, Pattern> = {
  /** 滑翔机：斜向移动，每 4 代前进一格 */
  glider: { name: 'glider', w: 3, h: 3,
    cells: [[1,0],[2,1],[0,2],[1,2],[2,2]] },

  /** 轻量级飞船：水平移动，宽横幅里最好看 */
  lwss: { name: 'LWSS', w: 5, h: 4,
    cells: [[1,0],[4,0],[0,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3]] },

  /** 闪灯：周期 2，最小的振荡器 */
  blinker: { name: 'blinker', w: 3, h: 1, cells: [[0,0],[1,0],[2,0]] },

  /** 蛤蟆：周期 2 */
  toad: { name: 'toad', w: 4, h: 2,
    cells: [[1,0],[2,0],[3,0],[0,1],[1,1],[2,1]] },

  /** 信标：周期 2 */
  beacon: { name: 'beacon', w: 4, h: 4,
    cells: [[0,0],[1,0],[0,1],[3,2],[2,3],[3,3]] },

  /** 脉冲星：周期 3，最上镜的振荡器 */
  pulsar: { name: 'pulsar', w: 13, h: 13, cells: [
    [2,0],[3,0],[4,0],[8,0],[9,0],[10,0],
    [0,2],[5,2],[7,2],[12,2],
    [0,3],[5,3],[7,3],[12,3],
    [0,4],[5,4],[7,4],[12,4],
    [2,5],[3,5],[4,5],[8,5],[9,5],[10,5],
    [2,7],[3,7],[4,7],[8,7],[9,7],[10,7],
    [0,8],[5,8],[7,8],[12,8],
    [0,9],[5,9],[7,9],[12,9],
    [0,10],[5,10],[7,10],[12,10],
    [2,12],[3,12],[4,12],[8,12],[9,12],[10,12],
  ]},

  /** R-pentomino：5 个格子能演化 1103 代，经典 methuselah */
  rpentomino: { name: 'R-pentomino', w: 3, h: 3,
    cells: [[1,0],[2,0],[0,1],[1,1],[1,2]] },

  /** 橡实：7 个格子演化 5206 代 */
  acorn: { name: 'acorn', w: 7, h: 3,
    cells: [[1,0],[3,1],[0,2],[1,2],[4,2],[5,2],[6,2]] },
};

/** 把一个图样盖到网格上（左上角对齐 x,y，超出部分环绕） */
export function stamp(g: Grid, p: Pattern, x: number, y: number): Grid {
  for (const [dx, dy] of p.cells) {
    g.cells[((y + dy + g.h) % g.h) * g.w + ((x + dx + g.w) % g.w)] = 1;
  }
  return g;
}

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/**
 * 有构图的播种：先铺一层很稀的随机点当背景，
 * 再沿宽度均匀摆几个已知图样。
 *
 * `noise` 调低一点很重要 —— 背景太密的话，已知图样几代之内就被
 * 周围的随机细胞吃掉了，白摆。
 */
export function seedWithPatterns(g: Grid, opts?: { noise?: number; names?: string[] }): Grid {
  const noise = opts?.noise ?? 0.2;
  g.cells.fill(0);
  for (let i = 0; i < g.cells.length; i++) {
    if (Math.random() < noise) g.cells[i] = 1;
  }

  const pool = (opts?.names ?? ['glider', 'lwss', 'pulsar', 'toad', 'beacon', 'rpentomino', 'acorn'])
    .map((n) => PATTERNS[n])
    .filter((p): p is Pattern => Boolean(p) && p.w <= g.w && p.h <= g.h);
  if (!pool.length) return g;

  // 按宽度大致均分，图样之间留出演化空间
  const slots = Math.max(2, Math.floor(g.w / 11));
  for (let i = 0; i < slots; i++) {
    const p = pick(pool);
    const x = Math.floor((i + 0.5) * (g.w / slots) - p.w / 2);
    const y = Math.floor(Math.random() * Math.max(1, g.h - p.h));
    // 图样周围清一圈，别让背景噪点立刻把它打散（只清一格，
    // 清太多会在密度较高的背景里留下明显的空洞）
    for (let dy = -1; dy <= p.h; dy++) {
      for (let dx = -1; dx <= p.w; dx++) {
        g.cells[((y + dy + g.h) % g.h) * g.w + ((x + dx + g.w) % g.w)] = 0;
      }
    }
    stamp(g, p, x, y);
  }
  return g;
}
