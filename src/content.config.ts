import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 文章集合。
 * 目录结构：src/content/posts/<slug>/index.md
 * 图片和 md 放同一个目录，正文里用 ./xxx.png 引用，Astro 会自动优化。
 */
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/index.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** 最后更新时间，省略则不显示 */
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /**
     * 分类，可省略。Hexo 里既能写成字符串也能写成列表，
     * 这里统一收敛成字符串数组。
     */
    category: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
    /** 列表页和 OG 用的摘要；省略则自动取正文开头 */
    description: z.string().optional(),
    /** true 时不出现在列表、归档、RSS、sitemap 里 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
