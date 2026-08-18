/**
 * ============================================================================
 *  学术资料 —— 首页（= about 页）的全部内容都从这里渲染
 * ============================================================================
 *
 *  加一篇论文 / 一段经历 / 一个开源贡献，就在对应数组里加一项，
 *  页面自动排版，不用碰任何 .astro 文件。
 *
 */

/* -------------------------------------------------------------------------- */
/* 基本身份                                                                     */
/* -------------------------------------------------------------------------- */

export const profile = {
  name: 'Yulong Han',
  /** 网名 / 常用 handle，显示在正名旁边 */
  handle: 'wheatfox',

  /** 当前身份，一行 */
  role: 'PhD Candidate, School of Computer Science',

  affiliation: 'Peking University',
  affiliationUrl: 'https://cs.pku.edu.cn/',

  /**
   * 开场白。首页最上方，第一人称，支持行内 HTML（链接、代码）。
   */
  bio: [
      `I build operating systems, in Rust and C. I'm a PhD candidate at the School of
       Computer Science, <a href="https://cs.pku.edu.cn/">Peking University</a>, and a
       researcher at the <a href="https://github.com/syswonder">Syswonder</a> community.`,

      `I lead <a href="https://github.com/syswonder/robonix">Robonix</a>, an embodied AI
       operating system. It exposes heterogeneous robot hardware as typed, discoverable
       capabilities, layered the way an OS layers anything else: primitives are the hardware,
       services are the shared system facilities — navigation, mapping, semantic memory,
       speech — and skills are the task-level behaviours, which is where a VLA policy lives.
       A VLM sits above all of it and plans. The system's job is composing, scheduling and
       switching between them. I also maintain
       <a href="https://github.com/syswonder/hvisor">hvisor</a>, a lightweight type-1
       hypervisor for edge devices.`,

      `I work upstream too — LoongArch virtualization and documentation tooling in the
       <a href="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/">Linux
       kernel</a>, syscalls in
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
      // 用白皮书里确立的术语（EAIOS），不自己造词
      'Embodied AI Operating Systems',
      // Robonix 的核心是编排、调度、在模型之间切换 —— 这条之前漏了
      'Agent Systems & Scheduling',
      'Rust for Systems',
      'LoongArch & Heterogeneous Hardware',
    ],
} as const;

/* -------------------------------------------------------------------------- */
/* News —— 首页时间线，学术站的标配                                              */
/* -------------------------------------------------------------------------- */

export type NewsItem = {
  /**
   * 一律用 YYYY-MM，不要精确到日 —— 一栏里混着两种粒度很难看，
   * 而且 news 这种东西月份就够了（Russ Cox 也只写到月）。
   */
  date: `${number}-${number}`;
  /** 一句话，支持行内 HTML */
  text: string;
};

/**
 * 新的加在最前面。首页只显示前 NEWS_ON_HOME 条，其余折叠。
 * 这是访客判断你「还活跃吗」的第一眼信息，尽量保持更新。
 */
export const news: NewsItem[] = [
  {
    date: '2026-08',
    text: 'Robonix was officially released at the <a href="https://chinaosc.ccf.org.cn/">2026 CCF China Open Source Conference</a> in Chongqing, which ran a dedicated forum on embodied AI operating systems.',
  },
  {
    date: '2026-03',
    text: 'The <a href="https://gitlink.org.cn/zone/uos/source/292">Embodied AI Operating System Technical White Paper</a> was published by the CCF Ubiquitous Operating Systems Open Community. I am one of the authors.',
  },
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
  degree: string;
  field: string;
  institution: string;
  institutionUrl?: string;
  /** 论文题目、导师、荣誉之类的补充 */
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
  /** 作者列表；等于 profile.name 的那个会自动加粗 */
  authors: string[];
  title: string;
  /** 会议 / 期刊 / 出版方 */
  venue: string;
  year: number | string;
  type: 'conference' | 'journal' | 'preprint' | 'thesis' | 'report';
  links?: Link[];
  note?: string;
};

/**
 * 新论文加在数组最前面（页面按数组顺序渲染，不自动排序）。
 */
export const publications: Publication[] = [
  {
    // 作者顺序照白皮书致谢页原文，跨单位按原文次序排
    authors: [
      'Donggang Cao', 'Yulong Han', 'Zhaobo Zhang', 'Guowei Li', 'Xiang Chen',
      'Zihao Zheng', 'Yao Guo', 'Kang Chen', 'Dongliang Xue', 'Dong Li', 'Litong You',
    ],
    title: 'Embodied AI Operating System Technical White Paper (EAIOS)',
    venue: 'CCF Ubiquitous Operating Systems Open Community',
    year: 2026,
    type: 'report',
    note: 'Peking University, Tsinghua University, Shanghai Jiao Tong University, ICT CAS, and Hangzhou Dianzi University. Organised by the Syswonder open-source community.',
    links: [
      { label: 'Document', href: 'https://gitlink.org.cn/zone/uos/source/292' },
    ],
  },
  {
    authors: ['Yulong Han'],
    title: 'Design and Implementation of a Lightweight Hypervisor for the LoongArch Instruction Set Architecture',
    venue: "Bachelor's Thesis, Northwestern Polytechnical University",
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
  role: string;
  period: string;
  description: string;
  tags?: string[];
};

export const projects: Project[] = [
  {
    name: 'Robonix',
    href: 'https://github.com/syswonder/robonix',
    role: 'Lead',
    period: '2025 — Present',
    description: 'An embodied AI operating system. Exposes heterogeneous robot hardware as typed, discoverable capabilities, layered into primitives (hardware), services (navigation, mapping, semantic memory, speech) and skills (task-level behaviours, including VLA policies), with a VLM planning above them. The system composes, schedules and switches between them.',
    tags: ['Embodied AI', 'Robotics', 'Rust', 'Python', 'gRPC', 'MCP'],
  },
  {
    name: 'hvisor',
    href: 'https://github.com/syswonder/hvisor',
    role: 'Maintainer',
    period: '2023 — Present',
    description: 'A lightweight type-1 hypervisor for edge devices, written in Rust. Supports aarch64, riscv64, and loongarch64.',
    tags: ['Rust', 'Hypervisor', 'aarch64', 'riscv64', 'loongarch64'],
  },
  {
    name: 'FreeBSD Documentation',
    href: 'https://docs.freebsd.org/zh-cn',
    role: 'Translator, zh_CN team',
    period: '2024 — Present',
    description: 'Simplified Chinese translation of the FreeBSD Handbook and documentation set.',
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
  blurb: string;
  items: {
    /** 例如 'PATCH' / 'PR #4082'，不翻译 */
    ref: string;
    /** 补丁标题保持原文 —— 上游提交信息本来就是英文 */
    title: string;
    href: string;
    date: string;
  }[];
};

/**
 * 只列**上游大项目**的贡献 —— 自己主导/维护的项目（Robonix、hvisor 等）
 * 归到上面的 projects，不在这里重复。
 *
 * 所有条目都核对过合并状态（GitHub API / kernel.org），未合并的不列。
 */
export const contributions: Contribution[] = [
  {
    project: 'Linux Kernel',
    href: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/',
    blurb: 'The mainline Linux kernel — LoongArch KVM and documentation tooling',
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
      {
        ref: 'PATCH',
        title: 'docs: automarkup.py: Skip common English words as C identifiers',
        href: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=6b8edfcd661b569f077cc1ea1f7463ec38547779',
        date: '2026-01-25',
      },
    ],
  },
  {
    project: 'LLVM',
    href: 'https://github.com/llvm/llvm-project',
    blurb: 'Modular compiler and toolchain technologies',
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
    project: 'nixpkgs',
    href: 'https://github.com/NixOS/nixpkgs',
    blurb: 'Nix, the purely functional package manager',
    items: [
      {
        ref: 'PR #401020',
        title: 'rt-tests: add cross compilation support',
        href: 'https://github.com/NixOS/nixpkgs/pull/401020',
        date: '2025-04-26',
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
        date: '2024-12-28',
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
    project: 'nvmevirt',
    href: 'https://github.com/snu-csl/nvmevirt',
    blurb: 'NVMe device virtualization for the Linux kernel (SNU CSL)',
    items: [
      {
        ref: 'PR #71',
        title: 'fix: add E820_TYPE_RESERVED_KERN check and fixed access out-of-bound bug',
        href: 'https://github.com/snu-csl/nvmevirt/pull/71',
        date: '2026-05-21',
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
