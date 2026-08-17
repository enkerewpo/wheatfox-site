/**
 * ============================================================================
 *  学术资料 —— /about 页的全部内容都从这里渲染
 * ============================================================================
 *
 *  加一篇论文 / 一段经历 / 一个开源贡献，就在对应数组里加一项，
 *  页面自动排版，不用碰任何 .astro 文件。
 */

/* -------------------------------------------------------------------------- */
/* 基本身份                                                                     */
/* -------------------------------------------------------------------------- */

export const profile = {
  name: 'Yulong Han',
  /** 网名 / 常用 handle，显示在正名旁边 */
  handle: 'wheatfox',
  /** 中文名，留空则不显示 */
  nameCn: '韩雨龙',
  /** 当前身份，一行 */
  role: 'PhD Candidate, School of Computer Science',
  affiliation: 'Peking University',
  affiliationUrl: 'https://cs.pku.edu.cn/',
  location: 'Beijing, China',

  /**
   * 开场白。about 页最上方，一两段，第一人称。
   * 支持行内 HTML（链接）。
   */
  bio: [
    `I build operating systems, in Rust and C. I'm a PhD candidate at the School of
     Computer Science, <a href="https://cs.pku.edu.cn/">Peking University</a>, and a
     researcher at the <a href="https://github.com/syswonder">Syswonder</a> community.`,

    `I lead <a href="https://github.com/syswonder/robonix">Robonix</a>, an embodied AI
     operating system: it exposes heterogeneous robot hardware as typed, discoverable
     capabilities, and treats pre-trained models as services — a VLM plans, VLA policies
     act — so the system's job is composing, scheduling, and switching between them. I
     also maintain <a href="https://github.com/syswonder/hvisor">hvisor</a>, a lightweight
     type-1 hypervisor for edge devices.`,

    `I work upstream too — LoongArch virtualization and documentation tooling in the
     <a href="https://github.com/torvalds/linux">Linux kernel</a>, syscalls in
     <a href="https://github.com/asterinas/asterinas">Asterinas</a>, LoongArch64 support
     across the Rust ecosystem, and the
     <a href="https://docs.freebsd.org/zh-cn">FreeBSD</a> Simplified Chinese translation
     team.`,

    `When I'm not writing systems code I write game and electronic music.`,
  ],

  /** 研究关键词，显示为一排小标签 */
  interests: [
    'Operating Systems',
    'Virtualization & Hypervisors',
    'Embodied AI Runtimes',
    'Rust for Systems',
    'Heterogeneous Hardware',
    'LoongArch',
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* News —— 首页时间线，学术站的标配                                              */
/* -------------------------------------------------------------------------- */

export type NewsItem = {
  /** YYYY-MM 或 YYYY-MM-DD */
  date: string;
  /** 一句话。支持行内 HTML */
  text: string;
};

/**
 * 新的加在最前面。首页只显示前 NEWS_ON_HOME 条，其余折叠。
 * 这是访客判断你「还活跃吗」的第一眼信息，尽量保持更新。
 */
export const news: NewsItem[] = [
  {
    date: '2026-01',
    text: 'Added LoongArch64 support to <a href="https://github.com/nbdd0121/unwinding">unwinding</a>, the Rust stack-unwinding library.',
  },
  {
    date: '2025-12',
    text: 'Landed <code>/proc/version</code> support in <a href="https://github.com/asterinas/asterinas">Asterinas</a>.',
  },
  {
    date: '2025-07',
    text: 'Second LoongArch KVM patch merged into the mainline <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=36d09b96d3e79518e2be31fc7960cc694702afb8">Linux kernel</a> — tracepoints for CPUCFG and CSR emulation exits.',
  },
  {
    date: '2025-04',
    text: 'First patch merged into the mainline <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8b2d01fec800081dd68271c01e4d239ef4d7115e">Linux kernel</a> (LoongArch KVM).',
  },
  {
    date: '2024-09',
    text: 'Started my PhD at the School of Computer Science, Peking University.',
  },
];

/** 首页显示几条 news，其余收进 <details> */
export const NEWS_ON_HOME = 4;

/* -------------------------------------------------------------------------- */
/* 联系方式 & 学术档案                                                           */
/* -------------------------------------------------------------------------- */

export type Link = {
  label: string;
  href: string;
  /** 显示用的短文本，省略则用 label */
  text?: string;
};

/** 邮箱。第一个是首选 */
export const emails: string[] = [
  'yulonghan@stu.pku.edu.cn',
  'wheatfox17@icloud.com',
];

/** 学术身份标识符，会带图标显示在 about 页顶部 */
export const academicIds: Link[] = [
  {
    label: 'ORCID',
    href: 'https://orcid.org/0009-0006-3482-9652',
    text: '0009-0006-3482-9652',
  },
  // 有了再填：
  // { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=XXXX' },
  // { label: 'DBLP',          href: 'https://dblp.org/pid/XXX/XXXX' },
  // { label: 'Semantic Scholar', href: 'https://www.semanticscholar.org/author/XXXX' },
];

/** 社交 / 代码 / 音乐 */
export const socials: Link[] = [
  { label: 'GitHub',     href: 'https://github.com/enkerewpo', text: '@enkerewpo' },
  { label: 'X',          href: 'https://x.com/wheat_fox',      text: '@wheat_fox' },
  { label: 'SoundCloud', href: 'https://soundcloud.com/wheatfox' },
  { label: 'Spotify',    href: 'https://open.spotify.com/artist/1u5SE8RW4ivt3LgZR7skkO' },
  { label: 'Bandcamp',   href: 'https://wheatfox.bandcamp.com/' },
  { label: 'Bilibili',   href: 'https://space.bilibili.com/305084932' },
];

/* -------------------------------------------------------------------------- */
/* 教育经历                                                                     */
/* -------------------------------------------------------------------------- */

export type Education = {
  period: string;
  degree: string;
  field: string;
  institution: string;
  institutionUrl?: string;
  /** 论文题目、导师、荣誉之类的补充，可省略 */
  note?: string;
};

export const education: Education[] = [
  {
    period: '2024 — Present',
    degree: 'Ph.D.',
    field: 'Computer Science',
    institution: 'Peking University',
    institutionUrl: 'https://www.pku.edu.cn/',
  },
  {
    period: '2020 — 2024',
    degree: 'B.Eng.',
    field: 'Computer Science',
    institution: 'Northwestern Polytechnical University',
    institutionUrl: 'https://www.nwpu.edu.cn/',
    note: 'Thesis: Design and Implementation of a Lightweight Hypervisor for the LoongArch Instruction Set Architecture',
  },
];

/* -------------------------------------------------------------------------- */
/* 论文 / 出版物                                                                 */
/* -------------------------------------------------------------------------- */

export type Publication = {
  /** 作者列表；用 profile.name 的值标记自己会自动加粗 */
  authors: string[];
  title: string;
  /** 会议 / 期刊 / 出版方 */
  venue: string;
  year: number | string;
  /** 'conference' | 'journal' | 'preprint' | 'thesis' | 'report' */
  type: 'conference' | 'journal' | 'preprint' | 'thesis' | 'report';
  links?: Link[];
  /** 一句话说明，可省略 */
  note?: string;
};

/**
 * 新论文加在数组最前面（页面按数组顺序渲染，不自动排序）。
 */
export const publications: Publication[] = [
  {
    authors: ['CCF Ubiquitous Operating Systems Open Community', 'Yulong Han'],
    title: 'Embodied AI Operating System Technical White Paper',
    venue: 'CCF Ubiquitous Operating Systems Open Community',
    year: 2025,
    type: 'report',
    note: 'Co-author.',
    links: [
      { label: 'Document', href: 'https://gitlink.org.cn/zone/uos/source/292' },
    ],
  },
  {
    authors: ['Yulong Han'],
    title:
      'Design and Implementation of a Lightweight Hypervisor for the LoongArch Instruction Set Architecture',
    venue: "Bachelor's Thesis, Northwestern Polytechnical University",
    year: 2024,
    type: 'thesis',
  },
];

/* -------------------------------------------------------------------------- */
/* 主导的项目                                                                    */
/* -------------------------------------------------------------------------- */

export type Project = {
  name: string;
  href: string;
  /** 你在项目里的角色 */
  role: string;
  period: string;
  description: string;
  /** 技术标签 */
  tags?: string[];
};

export const projects: Project[] = [
  {
    name: 'Robonix',
    href: 'https://github.com/syswonder/robonix',
    role: 'Lead',
    period: '2025 — Present',
    description:
      'An embodied AI operating system. Exposes heterogeneous robot hardware as typed, discoverable capabilities and treats pre-trained models as services — a VLM plans, VLA policies act — leaving the system to compose, schedule, and switch between them.',
    tags: ['Embodied AI', 'Robotics', 'Python', 'ROS 2'],
  },
  {
    name: 'hvisor',
    href: 'https://github.com/syswonder/hvisor',
    role: 'Maintainer',
    period: '2023 — Present',
    description:
      'A lightweight type-1 hypervisor for edge devices, written in Rust. Supports aarch64, riscv64, and loongarch64.',
    tags: ['Rust', 'Hypervisor', 'aarch64', 'riscv64', 'loongarch64'],
  },
  {
    name: 'FreeBSD Documentation',
    href: 'https://docs.freebsd.org/zh-cn',
    role: 'Translator, zh_CN team',
    period: '2024 — Present',
    description:
      'Simplified Chinese translation of the FreeBSD Handbook and documentation set.',
    tags: ['FreeBSD', 'Documentation', 'i18n'],
  },
];

/* -------------------------------------------------------------------------- */
/* 上游开源贡献                                                                  */
/* -------------------------------------------------------------------------- */

export type Contribution = {
  project: string;
  href: string;
  /** 项目一句话简介 */
  blurb: string;
  items: {
    /** 例如 'PATCH' / 'PR #4082' */
    ref: string;
    title: string;
    href: string;
    date: string;
  }[];
};

export const contributions: Contribution[] = [
  {
    project: 'Linux Kernel',
    href: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/',
    blurb: 'The Linux kernel',
    items: [
      {
        ref: 'PATCH',
        title: 'LoongArch: KVM: Fix multiple typos of KVM code',
        href: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8b2d01fec800081dd68271c01e4d239ef4d7115e',
        date: '2025-04-26',
      },
      {
        ref: 'PATCH',
        title: 'LoongArch: KVM: Add tracepoints for CPUCFG and CSR emulation exits',
        href: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=36d09b96d3e79518e2be31fc7960cc694702afb8',
        date: '2025-07-21',
      },
    ],
  },
  {
    project: 'Asterinas',
    href: 'https://github.com/asterinas/asterinas',
    blurb: 'A secure, fast, general-purpose OS kernel in Rust with a Linux-compatible ABI',
    items: [
      {
        ref: 'PR #1859',
        title: 'Implement `getcpu` syscall and add corresponding test application',
        href: 'https://github.com/asterinas/asterinas/pull/1859',
        date: '2025-02-27',
      },
      {
        ref: 'PR #2679',
        title: 'Add `/proc/version` support',
        href: 'https://github.com/asterinas/asterinas/pull/2679',
        date: '2025-12-05',
      },
    ],
  },
  {
    project: 'LLVM',
    href: 'https://github.com/llvm/llvm-project',
    blurb: 'Modular and reusable compiler and toolchain technologies',
    items: [
      {
        ref: 'PR #128889',
        title: '[mlir][Tosa] Add unreachable case for bad Extension type in TosaProfileCompliance',
        href: 'https://github.com/llvm/llvm-project/pull/128889',
        date: '2025-02-27',
      },
    ],
  },
  {
    project: 'Gleam',
    href: 'https://github.com/gleam-lang/gleam',
    blurb: 'A friendly language for building type-safe, scalable systems',
    items: [
      {
        ref: 'PR #4082',
        title: 'Add better help texts for `Error::ShellProgramNotFound`',
        href: 'https://github.com/gleam-lang/gleam/pull/4082',
        date: '2024-12-23',
      },
      {
        ref: 'PR #4109',
        title: 'Clean up existing build folders in repo and update `.gitignore` files',
        href: 'https://github.com/gleam-lang/gleam/pull/4109',
        date: '2024-12-29',
      },
    ],
  },
  {
    project: 'nixpkgs',
    href: 'https://github.com/NixOS/nixpkgs',
    blurb: 'Nix, the purely functional package manager',
    items: [
      {
        ref: 'PR #423765',
        title: 'ecc: add llvm in inputs to fix cross compilation error',
        href: 'https://github.com/NixOS/nixpkgs/pull/423765',
        date: '2025-07-09',
      },
    ],
  },
  {
    project: 'unwinding',
    href: 'https://github.com/nbdd0121/unwinding',
    blurb: 'Stack unwinding library in Rust',
    items: [
      {
        ref: 'PR #50',
        title: 'Add arch support for LoongArch64',
        href: 'https://github.com/nbdd0121/unwinding/pull/50',
        date: '2026-01-20',
      },
    ],
  },
  {
    project: 'loongarch-packages',
    href: 'https://github.com/lcpu-club/loongarch-packages',
    blurb: "Arch Linux for Loong64's patch set",
    items: [
      {
        ref: 'PR #759',
        title: 'addpatch: linux-rt, ver=6.14.0.rt3.arch1-3',
        href: 'https://github.com/lcpu-club/loongarch-packages/pull/759',
        date: '2025-10-19',
      },
      {
        ref: 'PR #779',
        title: 'updpatch: openucx, ver=1.19.0-2',
        href: 'https://github.com/lcpu-club/loongarch-packages/pull/779',
        date: '2025-10-28',
      },
    ],
  },
  {
    project: 'Marchkov-Helper',
    href: 'https://github.com/VariantConst/Marchkov-Helper',
    blurb: 'Peking University New Yanyuan bus reservation app',
    items: [
      {
        ref: 'PR #4',
        title: 'feat: add theme color change feature in settings',
        href: 'https://github.com/VariantConst/Marchkov-Helper/pull/4',
        date: '2024-10-25',
      },
      {
        ref: 'PR #7',
        title: 'fix: selected color check mark not shown when reopening theme settings',
        href: 'https://github.com/VariantConst/Marchkov-Helper/pull/7',
        date: '2025-07-21',
      },
    ],
  },
  {
    project: 'loongArch64',
    href: 'https://github.com/Godones/loongArch64',
    blurb: 'LoongArch ISA manual, a Rust implementation',
    items: [
      {
        ref: 'PR #1',
        title: 'fix: mistyped `sub_ecode` and `pte_width` fixed',
        href: 'https://github.com/Godones/loongArch64/pull/1',
        date: '2024-03-27',
      },
    ],
  },
];
