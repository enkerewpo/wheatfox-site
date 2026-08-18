import { webkit, devices } from 'playwright';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const page = await ctx.newPage();
await page.goto(process.argv[2], { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
// 滚到 bio 那一段，和他截图取景一致
await page.evaluate(() => window.scrollBy(0, 320));
await page.waitForTimeout(400);
await page.screenshot({ path: process.argv[3] });
console.log('shot:', process.argv[3]);
await browser.close();
