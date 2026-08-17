/**
 * ============================================================================
 *  学术资料 —— 首页（= about 页）的全部内容都从这里渲染
 * ============================================================================
 *
 *  加一篇论文 / 一段经历 / 一个开源贡献，就在对应数组里加一项，
 *  页面自动排版，不用碰任何 .astro 文件。
 *
 *  写成 { en: ..., zh: ... } 的字段是双语的，两边都要填。
 *  人名、项目名、会议名这类专有名词不做双语，保持原文。
 */

import type { L10n } from '../i18n';

/* -------------------------------------------------------------------------- */
/* 基本身份                                                                     */
/* -------------------------------------------------------------------------- */

export const profile = {
  name: 'Yulong Han',
  /** 网名 / 常用 handle，显示在正名旁边 */
  handle: 'wheatfox',
  /** 中文名 */
  nameCn: '韩雨龙',

  /** 当前身份，一行 */
  role: {
    en: 'PhD Candidate, School of Computer Science',
    zh: '计算机学院博士生',
  } satisfies L10n,

  affiliation: {
    en: 'Peking University',
    zh: '北京大学',
  } satisfies L10n,
  affiliationUrl: 'https://cs.pku.edu.cn/',

  /**
   * 开场白。首页最上方，第一人称，支持行内 HTML（链接、代码）。
   * 中英文各写各的，不要机翻 —— 中文段落可以更口语一点。
   */
  bio: {
    en: [
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
       <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/">Linux
       kernel</a>, syscalls in
       <a href="https://github.com/asterinas/asterinas">Asterinas</a>, LoongArch64 support
       across the Rust ecosystem, and the
       <a href="https://docs.freebsd.org/zh-cn">FreeBSD</a> Simplified Chinese translation
       team.`,

      `When I'm not writing systems code I write game and electronic music.`,
    ],
    zh: [
      `我用 Rust 和 C 写操作系统。目前在<a href="https://cs.pku.edu.cn/">北京大学计算机学院</a>读博士，
       同时是 <a href="https://github.com/syswonder">Syswonder</a> 社区的研究者。`,

      `我主导 <a href="https://github.com/syswonder/robonix">Robonix</a>，一个具身智能操作系统：
       它把异构机器人硬件抽象成带类型、可发现的能力，把预训练模型当作服务来调度 ——
       VLM 负责规划，VLA 策略负责执行，系统要做的是组合、调度和在它们之间切换。
       我也维护 <a href="https://github.com/syswonder/hvisor">hvisor</a>，
       一个面向边缘设备的轻量级 type-1 hypervisor。`,

      `我也在上游社区做事 ——
       <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/">Linux 内核</a>
       的 LoongArch 虚拟化和文档工具链、<a href="https://github.com/asterinas/asterinas">Asterinas</a>
       的系统调用、Rust 生态的 LoongArch64 支持，以及
       <a href="https://docs.freebsd.org/zh-cn">FreeBSD</a> 简体中文翻译组。`,

      `不写系统代码的时候，我写游戏音乐和电子音乐。`,
    ],
  } satisfies L10n<string[]>,

  /** 研究关键词，显示为一排小标签 */
  interests: {
    en: [
      'Operating Systems',
      'Virtualization & Hypervisors',
      'Embodied AI Runtimes',
      'Rust for Systems',
      'Heterogeneous Hardware',
      'LoongArch',
    ],
    zh: [
      '操作系统',
      '虚拟化与 Hypervisor',
      '具身智能运行时',
      '系统编程与 Rust',
      '异构硬件',
      'LoongArch',
    ],
  } satisfies L10n<string[]>,
} as const;

/* -------------------------------------------------------------------------- */
/* News —— 首页时间线，学术站的标配                                              */
/* -------------------------------------------------------------------------- */

export type NewsItem = {
  /** YYYY-MM 或 YYYY-MM-DD */
  date: string;
  /** 一句话，支持行内 HTML */
  text: L10n;
};

/**
 * 新的加在最前面。首页只显示前 NEWS_ON_HOME 条，其余折叠。
 * 这是访客判断你「还活跃吗」的第一眼信息，尽量保持更新。
 */
export const news: NewsItem[] = [
  {
    date: '2026-01',
    text: {
      en: 'Added LoongArch64 support to <a href="https://github.com/nbdd0121/unwinding">unwinding</a>, the Rust stack-unwinding library.',
      zh: '为 Rust 栈回溯库 <a href="https://github.com/nbdd0121/unwinding">unwinding</a> 加上了 LoongArch64 支持。',
    },
  },
  {
    date: '2025-12',
    text: {
      en: 'Landed <code>/proc/version</code> support in <a href="https://github.com/asterinas/asterinas">Asterinas</a>.',
      zh: '在 <a href="https://github.com/asterinas/asterinas">Asterinas</a> 中实现了 <code>/proc/version</code>。',
    },
  },
  {
    date: '2025-07',
    text: {
      en: 'Second LoongArch KVM patch merged into the mainline <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=36d09b96d3e79518e2be31fc7960cc694702afb8">Linux kernel</a> — tracepoints for CPUCFG and CSR emulation exits.',
      zh: '第二个 LoongArch KVM 补丁合入 <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=36d09b96d3e79518e2be31fc7960cc694702afb8">Linux 内核</a>主线 —— 为 CPUCFG 和 CSR 模拟退出加了 tracepoint。',
    },
  },
  {
    date: '2025-04',
    text: {
      en: 'First patch merged into the mainline <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8b2d01fec800081dd68271c01e4d239ef4d7115e">Linux kernel</a> (LoongArch KVM).',
      zh: '第一个补丁合入 <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8b2d01fec800081dd68271c01e4d239ef4d7115e">Linux 内核</a>主线（LoongArch KVM）。',
    },
  },
  {
    date: '2024-09',
    text: {
      en: 'Started my PhD at the School of Computer Science, Peking University.',
      zh: '入学北京大学计算机学院，开始读博。',
    },
  },
];

/** 首页显示几条 news，其余收进折叠区 */
export const NEWS_ON_HOME = 4;

/* -------------------------------------------------------------------------- */
/* 联系方式 & 学术档案                                                           */
/* -------------------------------------------------------------------------- */

export type Link = {
  label: string;
  href: string;
  /** 显示用的短文本，省略则只显示 label */
  text?: string;
};

/** 邮箱。第一个是首选 */
export const emails: string[] = [
  'yulonghan@stu.pku.edu.cn',
  'wheatfox17@icloud.com',
];

/** 学术身份标识符 */
export const academicIds: Link[] = [
  {
    label: 'ORCID',
    href: 'https://orcid.org/0009-0006-3482-9652',
    text: '0009-0006-3482-9652',
  },
  // 有了再填：
  // { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=XXXX' },
  // { label: 'DBLP',          href: 'https://dblp.org/pid/XXX/XXXX' },
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
  degree: L10n;
  field: L10n;
  institution: L10n;
  institutionUrl?: string;
  /** 论文题目、导师、荣誉之类的补充 */
  note?: L10n;
};

export const education: Education[] = [
  {
    period: '2024 — Present',
    degree: { en: 'Ph.D.', zh: '博士' },
    field: { en: 'Computer Science', zh: '计算机科学与技术' },
    institution: { en: 'Peking University', zh: '北京大学' },
    institutionUrl: 'https://www.pku.edu.cn/',
  },
  {
    period: '2020 — 2024',
    degree: { en: 'B.Eng.', zh: '工学学士' },
    field: { en: 'Computer Science', zh: '计算机科学与技术' },
    institution: {
      en: 'Northwestern Polytechnical University',
      zh: '西北工业大学',
    },
    institutionUrl: 'https://www.nwpu.edu.cn/',
    note: {
      en: 'Thesis: Design and Implementation of a Lightweight Hypervisor for the LoongArch Instruction Set Architecture',
      zh: '毕业论文：面向龙芯架构的轻量级虚拟机监控器设计与实现',
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 论文 / 出版物                                                                 */
/* -------------------------------------------------------------------------- */

export type Publication = {
  /** 作者列表；等于 profile.name 的那个会自动加粗 */
  authors: string[];
  title: L10n;
  /** 会议 / 期刊 / 出版方 */
  venue: L10n;
  year: number | string;
  type: 'conference' | 'journal' | 'preprint' | 'thesis' | 'report';
  links?: Link[];
  note?: L10n;
};

/**
 * 新论文加在数组最前面（页面按数组顺序渲染，不自动排序）。
 */
export const publications: Publication[] = [
  {
    authors: ['CCF Ubiquitous Operating Systems Open Community', 'Yulong Han'],
    title: {
      en: 'Embodied AI Operating System Technical White Paper',
      zh: '具身智能操作系统技术白皮书',
    },
    venue: {
      en: 'CCF Ubiquitous Operating Systems Open Community',
      zh: 'CCF 开源发展委员会泛在操作系统开源社区',
    },
    year: 2025,
    type: 'report',
    note: { en: 'Co-author.', zh: '合著者。' },
    links: [
      { label: 'Document', href: 'https://gitlink.org.cn/zone/uos/source/292' },
    ],
  },
  {
    authors: ['Yulong Han'],
    title: {
      en: 'Design and Implementation of a Lightweight Hypervisor for the LoongArch Instruction Set Architecture',
      zh: '面向龙芯架构的轻量级虚拟机监控器设计与实现',
    },
    venue: {
      en: "Bachelor's Thesis, Northwestern Polytechnical University",
      zh: '学士学位论文，西北工业大学',
    },
    year: 2024,
    type: 'thesis',
  },
];

/* -------------------------------------------------------------------------- */
/* 主导的项目                                                                    */
/* -------------------------------------------------------------------------- */

export type Project = {
  /** 项目名保持原文，不翻译 */
  name: string;
  href: string;
  role: L10n;
  period: string;
  description: L10n;
  tags?: string[];
};

export const projects: Project[] = [
  {
    name: 'Robonix',
    href: 'https://github.com/syswonder/robonix',
    role: { en: 'Lead', zh: '主导' },
    period: '2025 — Present',
    description: {
      en: 'An embodied AI operating system. Exposes heterogeneous robot hardware as typed, discoverable capabilities and treats pre-trained models as services — a VLM plans, VLA policies act — leaving the system to compose, schedule, and switch between them.',
      zh: '具身智能操作系统。把异构机器人硬件抽象成带类型、可发现的能力，把预训练模型当作服务 —— VLM 规划、VLA 策略执行 —— 系统负责组合、调度和在它们之间切换。',
    },
    tags: ['Embodied AI', 'Robotics', 'Python', 'ROS 2'],
  },
  {
    name: 'hvisor',
    href: 'https://github.com/syswonder/hvisor',
    role: { en: 'Maintainer', zh: '维护者' },
    period: '2023 — Present',
    description: {
      en: 'A lightweight type-1 hypervisor for edge devices, written in Rust. Supports aarch64, riscv64, and loongarch64.',
      zh: '面向边缘设备的轻量级 type-1 hypervisor，用 Rust 编写，支持 aarch64、riscv64 和 loongarch64。',
    },
    tags: ['Rust', 'Hypervisor', 'aarch64', 'riscv64', 'loongarch64'],
  },
  {
    name: 'FreeBSD Documentation',
    href: 'https://docs.freebsd.org/zh-cn',
    role: { en: 'Translator, zh_CN team', zh: '简体中文翻译组成员' },
    period: '2024 — Present',
    description: {
      en: 'Simplified Chinese translation of the FreeBSD Handbook and documentation set.',
      zh: 'FreeBSD 手册及文档集的简体中文翻译。',
    },
    tags: ['FreeBSD', 'Documentation', 'i18n'],
  },
];

/* -------------------------------------------------------------------------- */
/* 上游开源贡献                                                                  */
/* -------------------------------------------------------------------------- */

export type Contribution = {
  /** 项目名保持原文 */
  project: string;
  href: string;
  blurb: L10n;
  items: {
    /** 例如 'PATCH' / 'PR #4082'，不翻译 */
    ref: string;
    /** 补丁标题保持原文 —— 上游提交信息本来就是英文 */
    title: string;
    href: string;
    date: string;
  }[];
};

export const contributions: Contribution[] = [
  {
    project: 'Linux Kernel',
    href: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/',
    blurb: { en: 'The Linux kernel', zh: 'Linux 内核' },
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
    blurb: {
      en: 'A secure, fast, general-purpose OS kernel in Rust with a Linux-compatible ABI',
      zh: '用 Rust 写的安全、快速、通用操作系统内核，提供 Linux 兼容 ABI',
    },
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
    blurb: {
      en: 'Modular and reusable compiler and toolchain technologies',
      zh: '模块化、可复用的编译器与工具链技术',
    },
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
    blurb: {
      en: 'A friendly language for building type-safe, scalable systems',
      zh: '一门友好的语言，用于构建类型安全、可扩展的系统',
    },
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
    blurb: {
      en: 'Nix, the purely functional package manager',
      zh: 'Nix，纯函数式包管理器',
    },
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
    blurb: {
      en: 'Stack unwinding library in Rust',
      zh: 'Rust 栈回溯库',
    },
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
    blurb: {
      en: "Arch Linux for Loong64's patch set",
      zh: 'Loong64 版 Arch Linux 的补丁集',
    },
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
    blurb: {
      en: 'Peking University New Yanyuan bus reservation app',
      zh: '北京大学新燕园校区班车预约应用',
    },
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
    blurb: {
      en: 'LoongArch ISA manual, a Rust implementation',
      zh: 'LoongArch 指令集手册的 Rust 实现',
    },
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
