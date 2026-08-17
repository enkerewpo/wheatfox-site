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
    /**
     * 正文语言。文章不做翻译 —— 写的是哪种语言就标哪种，
     * 渲染时打在 <article lang> 上，让浏览器用对断行和字体。
     * 默认中文，因为博客正文以中文为主。
     */
    lang: z.enum(['zh', 'en']).default('zh'),
    /**
     * 标成 true 会在列表里加粗显示。
     * 借 research.swtch.com 的「favorites in bold」做法 ——
     * 不用单开一个 "start here" 页面就能给读者指路。
     */
    featured: z.boolean().default(false),
    /** true 时不出现在列表、归档、RSS、sitemap 里 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
