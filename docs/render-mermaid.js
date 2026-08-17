// Render a Mermaid source file to PNG by photographing the SVG element itself,
// so the image is exactly the diagram with no guessed window size.
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node render-mermaid.js <source.mmd> <out.png>'); process.exit(1); }

const html = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;padding:14px;background:#fff;font-family:'Segoe UI',system-ui,sans-serif}</style>
<pre class="mermaid">${fs.readFileSync(src, 'utf8')}</pre>
<script src="mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true,theme:'default',
  fontFamily:"'Segoe UI',system-ui,sans-serif",themeVariables:{fontSize:'13px'},
  flowchart:{useMaxWidth:false,nodeSpacing:26,rankSpacing:34,padding:8,curve:'basis'}});</script>`;

fs.writeFileSync('_render.html', html);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars'],
    defaultViewport: { width: 1600, height: 1200, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/_render.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('svg[id^=mermaid]', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));
  const el = await page.$('svg[id^=mermaid]');
  const box = await el.boundingBox();
  await el.screenshot({ path: out });
  console.log(`${out}  ${Math.round(box.width)} x ${Math.round(box.height)} css  (ratio 1:${(box.height / box.width).toFixed(2)})`);
  await browser.close();
})();
