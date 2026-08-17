/**
 * 把字符串里的 `code` 渲染成 <code>，其余字符一律转义。
 *
 * 上游的 PR 标题经常带反引号（比如 "Implement `getcpu` syscall"），
 * 直接当纯文本输出就会把反引号原样显示出来。
 * 只支持行内代码这一种语法 —— 不需要完整的 markdown 解析器。
 */
export function inlineCode(text: string): string {
  const escape = (s: string) =>
    s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

  // 按反引号切分：奇数段是代码，偶数段是普通文本
  return text
    .split(/`([^`]+)`/g)
    .map((part, i) => (i % 2 === 1 ? `<code>${escape(part)}</code>` : escape(part)))
    .join('');
}
