#!/usr/bin/env node
/**
 * 把旧 Hexo 站的文章迁移到 Astro content collection。
 *
 *   Hexo:   source/_posts/foo.md        +  source/_posts/foo/bar.png
 *           正文里写 ![](foo/bar.png)
 *
 *   Astro:  src/content/posts/foo/index.md  +  src/content/posts/foo/bar.png
 *           正文里写 ![](./bar.png)
 *
 * 用法：node scripts/migrate-hexo.mjs [旧站 _posts 目录]
 * 幂等：重复跑会覆盖目标目录里的同名文件。
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC =
  process.argv[2] ??
  path.resolve(ROOT, '../oscommunity/blog/source/_posts');
const DEST = path.resolve(ROOT, 'src/content/posts');

/** 把 Hexo 的 `date: 2026-01-13 19:59:03` 转成 ISO，其它字段原样保留 */
function normalizeFrontmatter(fm, slug) {
  const lines = fm.split('\n');
  const out = [];
  let sawTitle = false;

  for (const line of lines) {
    const dateMatch = line.match(/^date:\s*(.+?)\s*$/);
    if (dateMatch) {
      const raw = dateMatch[1].replace(/^['"]|['"]$/g, '');
      // '2026-01-13 19:59:03' -> '2026-01-13T19:59:03+08:00'
      const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
        ? `${raw.replace(' ', 'T')}+08:00`
        : raw;
      out.push(`date: ${iso}`);
      continue;
    }

    // mathjax: true 是 Hexo 插件开关，Astro 侧全局启用 KaTeX，直接丢掉
    if (/^mathjax:\s*/.test(line)) continue;

    if (/^title:\s*/.test(line)) {
      sawTitle = true;
      // 标题里有冒号、引号的一律用双引号包起来，避免 YAML 解析歧义
      const raw = line.replace(/^title:\s*/, '').replace(/^['"]|['"]$/g, '');
      out.push(`title: ${JSON.stringify(raw)}`);
      continue;
    }

    out.push(line);
  }

  if (!sawTitle) out.unshift(`title: ${JSON.stringify(slug)}`);
  return out.join('\n');
}

/** 把 ![](slug/img.png) 和 <img src="slug/img.png"> 改写成 ./img.png */
function rewriteAssetPaths(body, slug) {
  const esc = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return body
    // Markdown 图片/链接
    .replace(new RegExp(`\\]\\(${esc}/`, 'g'), '](./')
    // HTML src / href
    .replace(new RegExp(`(src|href)=(["'])${esc}/`, 'g'), '$1=$2./');
}

async function main() {
  await fs.mkdir(DEST, { recursive: true });

  const entries = await fs.readdir(SRC, { withFileTypes: true });
  const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.md'));

  let posts = 0;
  let assets = 0;

  for (const file of mdFiles) {
    const slug = file.name.replace(/\.md$/, '');
    const outDir = path.join(DEST, slug);
    await fs.mkdir(outDir, { recursive: true });

    const raw = await fs.readFile(path.join(SRC, file.name), 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

    let output;
    if (match) {
      const [, fm, body] = match;
      output = `---\n${normalizeFrontmatter(fm, slug)}\n---\n\n${rewriteAssetPaths(body, slug).trimStart()}`;
    } else {
      // 没有 front-matter 的，补一个最小的
      const stat = await fs.stat(path.join(SRC, file.name));
      output = `---\ntitle: ${JSON.stringify(slug)}\ndate: ${stat.mtime.toISOString()}\ntags: []\n---\n\n${raw}`;
    }

    await fs.writeFile(path.join(outDir, 'index.md'), output, 'utf8');
    posts++;

    // 同名资源目录整个搬过来
    const assetDir = path.join(SRC, slug);
    try {
      const st = await fs.stat(assetDir);
      if (st.isDirectory()) {
        for (const asset of await fs.readdir(assetDir)) {
          await fs.copyFile(
            path.join(assetDir, asset),
            path.join(outDir, asset),
          );
          assets++;
        }
      }
    } catch {
      /* 没有资源目录，正常 */
    }
  }

  console.log(`迁移完成：${posts} 篇文章，${assets} 个资源文件 -> ${path.relative(ROOT, DEST)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
