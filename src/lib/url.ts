/**
 * 站内链接一律经过这里，自动带上 Astro 的 base 前缀。
 *
 * 根目录部署时 BASE_URL 是 '/'，等于原样返回；
 * 子路径预发布（BASE=/preview/ pnpm build）时会补上前缀。
 * 直接写死 "/blog/" 的话，预发布站上全是死链。
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}
