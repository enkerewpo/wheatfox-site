import { webkit, devices } from 'playwright';
const url = process.argv[2] || 'https://www.oscommunity.cn/';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const page = await ctx.newPage();

const fontReqs = [];
page.on('response', (r) => {
  const u = r.url();
  if (/woff2?|\.css/.test(u)) fontReqs.push(`${r.status()} ${u.split('/').pop()}`);
});
page.on('requestfailed', (r) => {
  if (/woff2?/.test(r.url())) fontReqs.push(`FAILED ${r.url().split('/').pop()} — ${r.failure()?.errorText}`);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const info = await page.evaluate(async () => {
  await document.fonts.ready;
  const faces = [...document.fonts].map((f) => `${f.family} ${f.weight} → ${f.status}`);
  const probe = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return `${sel}: (not found)`;
    return `${sel}: ${getComputedStyle(el).fontFamily.split(',')[0]}`;
  };
  return {
    faces,
    checkFira: document.fonts.check('16px "Fira Sans"'),
    checkSCP: document.fonts.check('16px "Source Code Pro Variable"'),
    computed: [probe('body'), probe('.sidebar-name'), probe('.sidebar-handle'), probe('code')],
  };
});
console.log('WebKit / iPhone 14');
console.log('  Fira Sans loaded :', info.checkFira);
console.log('  SourceCodePro    :', info.checkSCP);
console.log('  computed         :', info.computed.join(' | '));
console.log('  faces            :', info.faces.filter((f)=>!/KaTeX/.test(f)).join(' | ') || '(none)');
console.log('  font/css requests:');
console.log('   ', fontReqs.join('\n    ') || '(none)');
await page.screenshot({ path: process.argv[3] || '/tmp/webkit.png', fullPage: false });
await browser.close();
