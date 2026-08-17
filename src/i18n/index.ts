/**
 * ============================================================================
 *  双语支持 —— 英文为默认，中文走 /zh/ 前缀
 * ============================================================================
 *
 *  URL 结构：
 *    /            /blog/            /open-source/       ← 英文（默认，无前缀）
 *    /zh/         /zh/blog/         /zh/open-source/    ← 中文
 *
 *  界面文案在 ui.ts；个人资料的双语内容在 data/profile.ts。
 *  博客正文不翻译 —— 写的是哪种语言就是哪种，用 front-matter 的 lang 标注。
 */

export const LANGS = ['en', 'zh'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

/** 语言切换按钮上显示的名字（用各自的母语写，这是惯例） */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  zh: '中文',
};

/** <html lang> 用的 BCP 47 标签 */
export const HTML_LANG: Record<Lang, string> = {
  en: 'en',
  zh: 'zh-Hans',
};

/**
 * 一段双语内容。写法：
 *   { en: 'Publications', zh: '论文' }
 */
export type L10n<T = string> = Record<Lang, T>;

/** 取出当前语言的值。 */
export function pick<T>(value: L10n<T>, lang: Lang): T {
  return value[lang] ?? value[DEFAULT_LANG];
}

/**
 * 从 URL 判断当前语言。
 * /zh/... -> 'zh'，其余 -> 'en'
 */
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return LANGS.includes(seg as Lang) && seg !== DEFAULT_LANG ? (seg as Lang) : DEFAULT_LANG;
}

/**
 * 给一个语言无关的路径加上语言前缀。
 *   localizePath('/blog/', 'en')  -> '/blog/'
 *   localizePath('/blog/', 'zh')  -> '/zh/blog/'
 */
export function localizePath(path: string, lang: Lang): string {
  if (lang === DEFAULT_LANG) return path;
  return `/${lang}${path}`;
}

/**
 * 去掉路径上的语言前缀，拿回语言无关的路径。
 * 语言切换按钮靠它算出「同一页的另一个语言版本」。
 */
export function stripLangPrefix(pathname: string): string {
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue;
    if (pathname === `/${lang}` || pathname === `/${lang}/`) return '/';
    if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1);
  }
  return pathname;
}
