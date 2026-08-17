/**
 * 运行时来源信息 —— 显示在 playground 页脚。
 *
 * 演示这类东西最容易含糊其辞，所以把「跑的是哪个版本、什么架构、
 * 哪台机器」直接写在页面上。数值由 scripts/refresh-provenance.sh
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
  /** 这些组件跑在上面那台机器上 */
  components: string[];
  /** 浏览器这侧承担的角色 */
  browserRole: string;
  /** 最后一次核对时间 */
  checked: string;
};

export const PROVENANCE: Provenance = {
  robonix: {
    version: 'v1.0.0',
    commit: 'd945988',
    date: '2026-08-14',
    repo: 'https://github.com/syswonder/robonix',
  },
  host: {
    name: 'dedsec-amd0',
    arch: 'x86_64',
    kernel: '6.12.101+deb13-amd64',
    distro: 'Debian GNU/Linux 13 (trixie)',
    rustc: '1.95.0',
    python: '3.13.5',
  },
  components: ['atlas', 'executor', 'pilot', 'liaison', 'soma', 'vitals'],
  browserRole:
    'capability provider (chassis, arm, camera, speaker) + RTDL viewer',
  checked: '2026-08-17',
};
