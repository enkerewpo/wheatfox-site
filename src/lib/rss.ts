import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config';
import { pick, type Lang } from '../i18n';
import { getPosts, postUrl } from './posts';

/** 两个语言版本的 RSS 共用这一份逻辑，只有标题描述和链接前缀不同。 */
export async function feed(context: APIContext, lang: Lang) {
  const posts = await getPosts();

  return rss({
    title: site.title,
    description: pick(site.description, lang),
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      categories: post.data.tags,
      link: postUrl(post, lang),
    })),
    customData: `<language>${lang === 'zh' ? 'zh-cn' : 'en'}</language>`,
  });
}
