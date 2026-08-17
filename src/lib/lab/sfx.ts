/**
 * ============================================================================
 *  音效 —— 全部用 Web Audio 现场合成
 * ============================================================================
 *
 *  不加载任何音频文件：零请求、零体积、零版权问题，而且参数可调。
 *  每个音效都短、干、偏机械，跟这台卡通机器人的调性一致，
 *  也不至于听两遍就烦。
 *
 *  浏览器要求用户先交互过才允许出声，所以 AudioContext 懒创建，
 *  并在第一次点击时 resume。
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.28;   // 整体压低，背景音不该抢戏
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSfxEnabled(on: boolean) { enabled = on; }
export function sfxEnabled() { return enabled; }

/** 一个带包络的振荡器 */
function tone(opts: {
  freq: number;
  toFreq?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}) {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.toFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.toFreq), t0 + opts.dur);

  const peak = opts.gain ?? 0.25;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);

  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + opts.dur + 0.02);
}

/** 一段带包络的噪声（撞击、水声用） */
function noise(opts: { dur: number; gain?: number; lp?: number; hp?: number; delay?: number }) {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const len = Math.max(1, Math.floor(c.sampleRate * opts.dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  let node: AudioNode = src;
  if (opts.hp) {
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = opts.hp;
    node.connect(f); node = f;
  }
  if (opts.lp) {
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lp;
    node.connect(f); node = f;
  }
  const g = c.createGain();
  g.gain.setValueAtTime(opts.gain ?? 0.18, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  node.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + opts.dur + 0.02);
}

/* ========================================================================== */
/* 具体音效                                                                    */
/* ========================================================================== */

export const sfx = {
  /** 底盘启动：低频马达短促上扬 */
  moveStart() {
    tone({ freq: 70, toFreq: 150, dur: 0.22, type: 'sawtooth', gain: 0.1 });
  },
  /** 停车：马达落下 */
  moveStop() {
    tone({ freq: 150, toFreq: 60, dur: 0.18, type: 'sawtooth', gain: 0.09 });
  },
  /** 检测：两声短促的电子哔 */
  detect() {
    tone({ freq: 1180, dur: 0.06, type: 'square', gain: 0.16 });
    tone({ freq: 1560, dur: 0.07, type: 'square', gain: 0.16, delay: 0.09 });
  },
  /** 抓取：舵机爬升 + 合爪的咔哒 */
  grasp() {
    tone({ freq: 320, toFreq: 620, dur: 0.2, type: 'sawtooth', gain: 0.1 });
    noise({ dur: 0.05, gain: 0.2, hp: 2200, delay: 0.2 });   // 咔
  },
  /** 放下：舵机下降 + 落到台面的闷响 */
  release() {
    tone({ freq: 600, toFreq: 300, dur: 0.18, type: 'sawtooth', gain: 0.09 });
    noise({ dur: 0.09, gain: 0.24, lp: 900, delay: 0.19 });  // 咚
  },
  /** 灶台：持续的滋滋声 */
  cook() {
    noise({ dur: 1.9, gain: 0.1, hp: 1400, lp: 6500 });
  },
  /** 水流 */
  water() {
    noise({ dur: 1.5, gain: 0.09, hp: 900, lp: 5200 });
  },
  /** 任务完成：上行三音 */
  done() {
    tone({ freq: 660, dur: 0.1, type: 'triangle', gain: 0.16 });
    tone({ freq: 880, dur: 0.1, type: 'triangle', gain: 0.16, delay: 0.1 });
    tone({ freq: 1320, dur: 0.18, type: 'triangle', gain: 0.16, delay: 0.2 });
  },
  /** 被运行时拒绝：下行两音 */
  reject() {
    tone({ freq: 420, dur: 0.12, type: 'square', gain: 0.16 });
    tone({ freq: 200, dur: 0.24, type: 'square', gain: 0.16, delay: 0.12 });
  },
};

/** 第一次交互时解锁音频（浏览器自动播放策略） */
export function unlockAudioOnce() {
  const go = () => { ac(); window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); };
  window.addEventListener('pointerdown', go, { once: true });
  window.addEventListener('keydown', go, { once: true });
}
