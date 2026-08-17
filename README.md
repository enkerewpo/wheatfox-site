# wheatfox-site

Astro 重写版个人站 / 学术主页。旧的 Hexo 站（oscommunity.cn）保持原样不动，这是并行的新站。

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # 输出到 dist/
pnpm preview   # 本地预览构建产物
```

## 我想改 X，去哪改？

所有「经常要动」的东西都集中暴露了，不用翻组件：

| 想改什么 | 改哪个文件 |
|---|---|
| 站点标题、副标题、描述、域名 | `src/config.ts` → `site` |
| 导航栏条目 | `src/config.ts` → `nav` |
| **界面文案**（按钮、区块标题、提示语） | `src/i18n/ui.ts` |
| **备案号**（ICP / 公安） | `src/config.ts` → `beian` |
| 头像、首页大图、OG 图、favicon | `src/config.ts` → `images`（文件放 `public/img/`） |
| 页脚鸣谢、访问统计开关 | `src/config.ts` → `footerCredits` / `analytics` |
| **配色**（亮色 + 暗色两套） | `src/styles/tokens.css` → 第 1、2 节 |
| **字体**（字族、字号、行高、字重） | `src/styles/tokens.css` → 第 3 节 |
| 间距、内容宽度、圆角 | `src/styles/tokens.css` → 第 4 节 |
| 文章正文排版（标题、代码块、表格、公式） | `src/styles/prose.css` |
| 页头/页脚/列表的结构样式 | `src/styles/base.css` |
| **个人简介、教育、论文、开源贡献** | `src/data/profile.ts` |

配色和字体全部走 CSS 变量，`tokens.css` 改一个值全站生效。亮色 / 暗色是同一组变量名的两套取值，不会漏改。

## 双语

英文是默认语言，不带前缀；中文走 `/zh/`：

```
/            /blog/           /open-source/        英文
/zh/         /zh/blog/        /zh/open-source/     中文
```

页头右侧有语言切换按钮，会跳到当前页面的另一语言版本。
`hreflang` 和 sitemap 都配好了，搜索引擎知道这两个 URL 是同一页。

- **界面文案**（导航、区块标题、按钮）在 `src/i18n/ui.ts`，一个 key 两种语言。
- **个人资料**（bio、项目描述、教育经历）在 `src/data/profile.ts`，
  写成 `{ en: ..., zh: ... }` 的字段都是双语的。
- **专有名词不翻译** —— 人名、项目名、会议名、上游补丁标题保持原文。
- **博客正文不翻译**。写的是哪种语言就标哪种，front-matter 里 `lang: zh`（默认）
  或 `lang: en`，渲染时打在 `<article lang>` 上，浏览器才会用对断行规则和字体。
  界面语言和正文语言可以不同 —— 英文界面读中文文章是常态。

页面主体都在 `src/views/`，`src/pages/` 下只是几行路由壳子。
加一个新页面要在 `src/pages/` 和 `src/pages/zh/` 各放一个壳子。

## 写新文章

```
src/content/posts/<slug>/index.md      文章正文
src/content/posts/<slug>/xxx.png       配图，正文里写 ![](./xxx.png)
```

front-matter：

```yaml
---
title: "标题（有冒号就加引号）"
date: 2026-08-17T20:00:00+08:00
tags:
  - Operating Systems
  - Rust
description: 列表页和分享卡片用的一句话摘要，可省略
lang: zh            # 正文语言，默认 zh
featured: false     # true 则在列表里加粗，用来给读者指路
draft: false        # true 则不出现在列表 / RSS / sitemap
---
```

数学公式直接写 `$x^2$` 和 `$$...$$`，构建期用 KaTeX 渲染成 HTML，页面上零 JS。
代码块自动双主题高亮，跟随站点亮暗色切换。

URL 规则是 `/blog/<slug>/`（中文版 `/zh/blog/<slug>/`），改 `src/lib/posts.ts` 的 `postUrl()` 就能全站改掉。

## 加一篇论文 / 一个项目

`src/data/profile.ts` 里对应数组加一项即可，`/about` 页自动排版：

- `publications` — 论文，新的加在数组最前面
- `projects` — 主导的项目
- `contributions` — 上游开源贡献（按项目分组）
- `education` — 教育经历
- `academicIds` — ORCID / Google Scholar / DBLP
- `socials` — GitHub / X / 音乐平台

## 从旧 Hexo 站再同步一次文章

```bash
pnpm migrate                                   # 默认读 ../oscommunity/blog/source/_posts
node scripts/migrate-hexo.mjs /path/to/_posts  # 或指定目录
```

脚本会把 `foo.md` + `foo/` 资源目录合并成 `posts/foo/index.md`，并把
Hexo 的 `![](foo/bar.png)` 改写成 `![](./bar.png)`。可重复执行，会覆盖同名文件。

## 字体

全部自托管（`@fontsource`），不依赖任何第三方 CDN：

- **Patrick Hand** — 页头 wordmark，沿用旧站的手写体
- **Inter Variable** — 界面文字（导航、日期、tag）
- **Source Serif 4 Variable** — 文章正文，学术站的阅读主力
- **JetBrains Mono Variable** — 代码

中文没有打包字体文件（CJK 字体动辄 10MB+），走系统字体回落：
PingFang SC → 苹方 → 微软雅黑 → Noto Sans SC。要改回落顺序看 `tokens.css` 的
`--font-sans` / `--font-serif`。
