import { getCollection, type CollectionEntry } from 'astro:content';
import { localizePath, type Lang } from '../i18n';

export type Post = CollectionEntry<'posts'>;

/** 全站唯一的文章查询入口：过滤草稿、按日期倒序。 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * 文章 URL。permalink 规则改这里，全站跟着变。
 * 文章正文不翻译，但链接要留在读者当前的语言版本里，
 * 这样页头页脚和导航不会突然跳回英文。
 */
export function postUrl(post: Post, lang: Lang): string {
  return localizePath(`/blog/${post.id}/`, lang);
}

/** 统计每个 tag 下的文章数，按数量倒序、同数量按字母序。 */
export async function getTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** tag 转 URL slug：小写、空格和斜杠转连字符。 */
export function tagSlug(tag: string): string {
  return encodeURIComponent(tag.toLowerCase().replace(/[\s/]+/g, '-'));
}

/** 按年份分组，用于博客索引。 */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const groups = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.date.getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(post);
  }
  return [...groups.entries()]
    .map(([year, posts]) => ({ year, posts }))
    .sort((a, b) => b.year - a.year);
}

/**
 * 统一的日期格式，全站一致。
 * 用 ISO 风格（2026-01-13）而不是本地化月份名 —— 中英文页面看起来一样，
 * 也不会出现 "1月" / "January" 在同一个列表里混排。
 */
export function formatDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Shanghai',
    ...(style === 'short'
      ? { month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' }),
  });
}
