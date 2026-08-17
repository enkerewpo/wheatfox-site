import type { L10n, Lang } from './index';
import { pick } from './index';

/**
 * 全站界面文案。加一句话就在这里加一个 key，两种语言都要填。
 * 正文内容不在这里 —— 那些在 data/profile.ts 和文章 markdown 里。
 */
export const ui = {
  /* —— 导航 & 通用 —— */
  'nav.home':        { en: 'Home',         zh: '首页' },
  'nav.blog':        { en: 'Blog',         zh: '博客' },
  'nav.openSource':  { en: 'Open Source',  zh: '开源' },
  'nav.tags':        { en: 'Tags',         zh: '标签' },
  'nav.rss':         { en: 'RSS',          zh: 'RSS' },

  'a11y.skipToContent': { en: 'Skip to content', zh: '跳到正文' },
  'a11y.mainNav':       { en: 'Main',            zh: '主导航' },
  'a11y.toggleTheme':   { en: 'Toggle color theme', zh: '切换深浅色' },
  'a11y.switchLang':    { en: 'Switch language',    zh: '切换语言' },

  /* —— 首页区块标题 —— */
  'home.interests':    { en: 'Research Interests', zh: '研究方向' },
  'home.news':         { en: 'News',               zh: '近况' },
  'home.newsEarlier':  { en: 'earlier',            zh: '条更早' },
  'home.projects':     { en: 'Projects',           zh: '项目' },
  'home.publications': { en: 'Publications',       zh: '论文' },
  'home.recentWriting':{ en: 'Recent Writing',     zh: '近期文章' },
  'home.education':    { en: 'Education',          zh: '教育经历' },
  'home.elsewhere':    { en: 'Elsewhere',          zh: '其它' },
  'home.allPosts':     { en: 'All {n} posts →',    zh: '全部 {n} 篇文章 →' },
  'home.upstream':     { en: 'Upstream contributions →', zh: '上游贡献 →' },

  /* —— 博客 —— */
  'blog.title': { en: 'Blog', zh: '博客' },
  'blog.lede': {
    en: 'Notes on operating systems, hypervisors, Rust, and whatever else I\'m reading.',
    zh: '操作系统、虚拟化、Rust，以及最近在读的东西。',
  },
  'blog.summary': {
    en: '{posts} posts across {years} years.',
    zh: '共 {posts} 篇，跨越 {years} 年。',
  },
  'blog.browseByTag': { en: 'Browse by tag', zh: '按标签浏览' },
  'blog.subscribe':   { en: 'subscribe',     zh: '订阅' },

  'post.updated':  { en: 'updated',            zh: '更新于' },
  'post.contents': { en: 'Contents',           zh: '目录' },
  'post.adjacent': { en: 'Adjacent posts',     zh: '相邻文章' },

  /* —— 标签 —— */
  'tags.title': { en: 'Tags', zh: '标签' },
  'tags.lede':  { en: '{n} tags across the archive.', zh: '归档中共有 {n} 个标签。' },
  'tags.allTags': { en: '← All tags', zh: '← 全部标签' },
  'tags.postCount': { en: '{n} posts', zh: '{n} 篇文章' },
  'tags.postCountOne': { en: '1 post', zh: '1 篇文章' },

  /* —— 开源页 —— */
  'os.title': { en: 'Open Source', zh: '开源' },
  'os.lede': {
    en: '{projects} projects I lead or maintain, and {patches} patches landed across {repos} upstream repositories.',
    zh: '主导或维护 {projects} 个项目，在 {repos} 个上游仓库合入 {patches} 个补丁。',
  },
  'os.maintaining': { en: 'Maintaining',           zh: '主导 / 维护' },
  'os.upstream':    { en: 'Upstream Contributions', zh: '上游贡献' },

  /* —— 论文条目 —— */
  'pub.conference': { en: 'Conference', zh: '会议' },
  'pub.journal':    { en: 'Journal',    zh: '期刊' },
  'pub.preprint':   { en: 'Preprint',   zh: '预印本' },
  'pub.thesis':     { en: 'Thesis',     zh: '学位论文' },
  'pub.report':     { en: 'Report',     zh: '技术报告' },

  /* —— 页脚 —— */
  'footer.thanks':   { en: 'Hosted with thanks to', zh: '感谢' },
  'footer.thanksTail': { en: '', zh: '的支持' },
  'footer.and':      { en: ' and ',  zh: ' 和 ' },
  'footer.visits':   { en: 'Visits',   zh: '访问' },
  'footer.visitors': { en: 'Visitors', zh: '访客' },

  /* —— 404 —— */
  '404.title': { en: "This page doesn't exist.", zh: '这个页面不存在。' },
  '404.body': {
    en: 'It may have moved, or the link may be wrong.',
    zh: '可能已经移动，也可能链接有误。',
  },
  '404.archive': { en: 'archive', zh: '归档' },
  '404.home':    { en: 'home',    zh: '首页' },
  '404.tryThe':  { en: 'Try the', zh: '试试' },
  '404.orHead':  { en: 'or head', zh: '或回到' },
} satisfies Record<string, L10n>;

export type UIKey = keyof typeof ui;

/**
 * 取一条界面文案，并把 {name} 占位符替换掉。
 *
 *   t('home.allPosts', 'zh', { n: 46 })  ->  '全部 46 篇文章 →'
 */
export function t(
  key: UIKey,
  lang: Lang,
  vars?: Record<string, string | number>,
): string {
  let out = pick(ui[key] as L10n, lang);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}

/** 绑定语言，省得每次都传。 */
export function useTranslations(lang: Lang) {
  return (key: UIKey, vars?: Record<string, string | number>) => t(key, lang, vars);
}
