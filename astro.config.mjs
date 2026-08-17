// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { site } from './src/config.ts';

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',

  integrations: [mdx(), sitemap()],

  markdown: {
    // $...$ 和 $$...$$ 数学公式，构建期渲染成 KaTeX HTML，运行时零 JS
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { output: 'html', throwOnError: false }]],
    shikiConfig: {
      // 双主题代码高亮，跟随站点 light/dark 自动切换
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: false,
    },
  },

  build: {
    // 输出 /posts/foo/index.html，URL 保持带斜杠的干净形式
    format: 'directory',
  },

  image: {
    // 文章插图会被压缩并生成响应式尺寸
    responsiveStyles: true,
  },
});
