/**
 * 运行时来源信息 —— 显示在 playground 页脚。
 *
 * 演示这类东西最容易含糊其辞（「由 AI 驱动」「运行真实机器人系统」），
 * 所以把「跑的是哪个版本、什么架构、哪台机器、哪个模型」直接写在页面上，
 * 让人能自己判断这个 demo 有几分真。数值由 scripts/refresh-provenance.sh
 * 从真机上抓取，不手写。
 */

export type Provenance = {
  /** Robonix 源码版本 */
  robonix: { version: string; commit: string; date: string; repo: string };
  /** 运行时所在的机器 */
  host: {
    name: string;
    arch: string;
    kernel: string;
    distro: string;
    rustc: string;
    python: string;
  };
  /** 规划用的模型 —— 这是最该说清楚的一项 */
  vlm: {
    model: string;
    vendor: string;
    endpoint: string;
    /** 用到了它的哪些能力 */
    modalities: string;
    /** 它在这套系统里具体负责什么 */
    role: string;
  };
  /** 这些组件跑在上面那台机器上 */
  components: string[];
  /** 浏览器这侧承担的角色 */
  browserRole: string;
  /** 浏览器注册进 Atlas 的三个 provider */
  browserProviders: { id: string; layer: string; caps: number; note: string }[];
  /** 最后一次核对时间 */
  checked: string;
};

export const PROVENANCE: Provenance = {
  robonix: {
    version: 'v0.1.0',
    commit: 'd945988',
    date: '2026-08-14',
    repo: 'https://github.com/syswonder/robonix',
  },
  host: {
    name: 'dedsec-amd0',
    arch: 'x86_64',
    kernel: '6.12.101+deb13-amd64',
    distro: 'Debian GNU/Linux 13 (trixie)',
    rustc: '1.95.0 (59807616e)',
    python: '3.11.15',
  },
  vlm: {
    model: 'qwen3-vl-plus',
    vendor: 'Alibaba Cloud (Tongyi Qianwen)',
    endpoint: 'dashscope.aliyuncs.com/compatible-mode/v1',
    modalities: 'text + vision, JSON-mode structured output',
    role:
      'Pilot asks it for an RTDL plan over the capabilities Atlas has registered. ' +
      'It never touches the robot directly — every motion goes through the executor. ' +
      'The reasoning-heavy qwen3.8-max plans this task just as well but spends about ' +
      '80 s per round, which is too slow to watch; qwen3-vl-plus answers in about 8 s ' +
      'and keeps the vision capability.',
  },
  components: ['atlas', 'executor', 'pilot', 'liaison', 'soma'],
  browserRole:
    'three Robonix capability providers, registered with Atlas over gRPC and ' +
    'serving MCP: the body, its navigation, and its semantic map',
  browserProviders: [
    {
      id: 'browser_sim',
      layer: 'primitive',
      caps: 5,
      note: 'chassis and arm — metres, radians, joint names',
    },
    {
      id: 'browser_nav',
      layer: 'service',
      caps: 3,
      note: 'A* over a 0.1 m occupancy grid, same contracts as the nav2 wrapper',
    },
    {
      id: 'browser_scene',
      layer: 'system',
      caps: 4,
      note: 'semantic map from simulation ground truth, not from a detector',
    },
  ],
  checked: '2026-08-18',
};
