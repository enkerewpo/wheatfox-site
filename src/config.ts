/**
 * ============================================================================
 *  站点总配置 —— 平时要改的东西，基本都在这个文件里
 * ============================================================================
 *
 *  这里放「文案 / 链接 / 备案 / 图片」。
 *  颜色、字体、字号、间距这类视觉 token 在 src/styles/tokens.css。
 *  学术信息（教育、论文、开源贡献）在 src/data/profile.ts。
 */

export const site = {
  /** 出现在 <title> 和 RSS */
  title: 'Yulong Han',
  /** <meta name="description">，也用于 RSS */
  description:
    'Yulong Han (wheatfox) — PhD candidate at Peking University. Operating systems, hypervisors, embodied AI runtimes.',
  /** 站点根 URL。换域名时改这里（影响 canonical / sitemap / RSS 里的绝对链接） */
  url: 'https://www.oscommunity.cn',
  author: 'Yulong Han',
} as const;

/** 侧栏导航。顺序即显示顺序，删掉一行就少一个入口。 */
export const nav: { label: string; href: string }[] = [
  { label: 'Home',         href: '/' },
  { label: 'Publications', href: '/publications/' },
  { label: 'Open Source',  href: '/open-source/' },
  { label: 'Blog',         href: '/blog/' },
  { label: 'RSS',          href: '/rss.xml' },
];

/** 图片资源。放在 public/ 下，改文件名就在这里同步改。 */
export const images = {
  avatar: '/img/avatar.jpg',
  ogImage: '/img/og.png',
  favicon: '/favicon/favicon.ico',
  appleTouchIcon: '/favicon/apple-touch-icon.png',
} as const;

/**
 * 备案信息 —— 中国大陆服务器必须展示在页脚。
 * 换域名 / 换主体后记得同步更新，设为 null 即隐藏。
 */
export const beian = {
  icp: '陕ICP备2024041510号' as string | null,
  icpUrl: 'https://beian.miit.gov.cn/',
  police: '冀公网安备13010802002307号' as string | null,
  policeUrl: 'https://beian.mps.gov.cn/',
} as const;

/** 页脚鸣谢。留空数组即不显示。 */
export const footerCredits: { label: string; href: string }[] = [
  { label: 'Aliyun', href: 'https://www.aliyun.com/' },
  { label: 'Anubis', href: 'https://anubis.techaro.lol/' },
];

/** 访问统计。busuanzi 无后端，关掉就设 false。 */
export const analytics = { busuanzi: true } as const;

/** 首页「Recent Writing」显示几篇 */
export const pagination = { homeRecentPosts: 5 } as const;
