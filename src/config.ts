/**
 * ============================================================================
 *  站点总配置 —— 平时要改的东西，基本都在这个文件里
 * ============================================================================
 *
 *  这里放「内容 / 文案 / 链接 / 备案 / 图片」。
 *  颜色、字体、字号、间距这类视觉 token 在 src/styles/tokens.css。
 *  学术信息（教育、论文、开源贡献）在 src/data/profile.ts。
 *  界面文案（导航、区块标题、按钮）在 src/i18n/ui.ts。
 *
 *  写成 { en, zh } 的字段是双语的，两边都要填。
 */

import type { L10n } from './i18n';

export const site = {
  /** 站点标题，出现在 <title>、页头 wordmark、RSS。中英文保持一致比较好认 */
  title: 'wheatfox',

  /** 页头 wordmark 下的一行小字，留空则不显示 */
  subtitle: {
    en: 'operating systems, in Rust and C',
    zh: '操作系统，用 Rust 和 C 写',
  } satisfies L10n,

  /** <meta name="description">，也用于 RSS */
  description: {
    en: 'Yulong Han (wheatfox) — PhD candidate at Peking University. Operating systems, hypervisors, embodied AI runtimes. Notes and papers.',
    zh: '韩雨龙（wheatfox）—— 北京大学计算机学院博士生。操作系统、虚拟化、具身智能运行时。笔记与论文。',
  } satisfies L10n,

  /** 站点根 URL。换域名时改这里（影响 canonical / sitemap / RSS 里的绝对链接） */
  url: 'https://www.oscommunity.cn',

  /** 作者名，用于 RSS / JSON-LD */
  author: 'Yulong Han',

  /** 时区，用于日期渲染 */
  timezone: 'Asia/Shanghai',
} as const;

/**
 * 页头导航。href 写语言无关的路径，渲染时自动加 /zh 前缀。
 * labelKey 指向 src/i18n/ui.ts 里的一条文案。
 */
export const nav = [
  { labelKey: 'nav.home',       href: '/' },
  { labelKey: 'nav.blog',       href: '/blog/' },
  { labelKey: 'nav.openSource', href: '/open-source/' },
  { labelKey: 'nav.tags',       href: '/tags/' },
  { labelKey: 'nav.rss',        href: '/rss.xml', external: true },
] as const;

/**
 * 图片资源。放在 public/ 下，改文件名就在这里同步改。
 */
export const images = {
  /** 头像，首页用 */
  avatar: '/img/avatar.jpg',
  /** 首页顶部横图。设为 null 关闭 */
  hero: null as string | null,
  /** 社交分享用的 OG 图 */
  ogImage: '/img/og.png',
  /** favicon（public/favicon/） */
  favicon: '/favicon/favicon.ico',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
} as const;

/**
 * 备案信息 —— 中国大陆服务器必须展示在页脚。
 * 换域名 / 换主体后记得同步更新，任一项设为 null 即隐藏。
 */
export const beian = {
  /** 工信部 ICP 备案号 */
  icp: '陕ICP备2024041510号' as string | null,
  /** ICP 备案查询入口 */
  icpUrl: 'https://beian.miit.gov.cn/',
  /** 公安备案号 */
  police: '冀公网安备13010802002307号' as string | null,
  /** 公安备案查询入口 */
  policeUrl: 'https://beian.mps.gov.cn/',
} as const;

/**
 * 页脚里的鸣谢 / 赞助。留空数组即不显示。
 */
export const footerCredits: { label: string; href: string }[] = [
  { label: '阿里云', href: 'https://www.aliyun.com/' },
  { label: 'Anubis', href: 'https://anubis.techaro.lol/' },
];

/**
 * 访问统计。busuanzi 是无后端的轻量方案，关掉就设 false。
 */
export const analytics = {
  busuanzi: true,
} as const;

/**
 * 列表长度
 */
export const pagination = {
  /** 首页「近期文章」显示几篇 */
  homeRecentPosts: 5,
} as const;
