// Shot + playtest driver for Solara Bay v12 (my own script).
// Serves game/ on :8080, loads each ?shot= with freeze=1, waits for
// window.__ready, captures console errors, screenshots 1280x720 PNG.
// Usage: node tools/shots.mjs [cover|foot|chase|meta|all]  (default all)
//        node tools/shots.mjs playtest
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
// Playwright library only (installed tooling); the driver scripts are not used.
const pw = require('/home/hatch/workspace/makefun/v9-driver-node/node_modules/playwright/index.js');

const SHOTS = [
  ['cover', '1-cover.png'],
  ['foot', '2-foot.png'],
  ['chase', '3-chase.png'],
  ['meta', '4-meta.png'],
];

const mode = process.argv[2] || 'all';

async function startServer() {
  const proc = spawn('node', ['serve.ts', '--port', '8080'], { cwd: '/home/hatch/workspace/makefun/solara-bay-v12', stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 1500));
  return proc;
}

const server = await startServer();
const browser = await pw.chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

try {
  if (mode === 'playtest') {
    await page.goto('http://127.0.0.1:8080/?playtest=1', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__playtest !== undefined, null, { timeout: 30000 });
    const res = await page.evaluate(() => window.__playtest);
    console.log(JSON.stringify(res, null, 2));
    console.log('PAGE ERRORS:', JSON.stringify(errors));
    process.exitCode = res.pass && errors.length === 0 ? 0 : 1;
  } else {
    const wanted = mode === 'all' ? SHOTS : SHOTS.filter(([n]) => n === mode);
    for (const [shot, file] of wanted) {
      errors.length = 0;
      await page.goto(`http://127.0.0.1:8080/?shot=${shot}&freeze=1&seed=1`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
      await page.waitForTimeout(1200);
      const errs = await page.evaluate(() => window.__errors || []);
      const outPath = `/home/hatch/workspace/makefun/solara-bay-v12/screenshots/${file}`;
      await page.screenshot({ path: outPath });
      // Dossier cap is 256 KiB per screenshot: quantize to a 256-colour
      // palette when needed (stylised scene, no visible loss at this size).
      const { execSync } = await import('node:child_process');
      const { statSync } = await import('node:fs');
      if (statSync(outPath).size > 250000) {
        execSync(`python3 -c "from PIL import Image; im=Image.open('${outPath}'); im.quantize(colors=256, method=2).save('${outPath}', optimize=True)"`);
      }
      const finalSize = statSync(outPath).size;
      console.log(`${file}: ready, window errors=${errs.length}, console errors=${errors.length}, size=${finalSize} B`);
      if (errs.length) console.log('  window errors:', JSON.stringify(errs.slice(0, 5)));
      if (errors.length) console.log('  console errors:', JSON.stringify(errors.slice(0, 5)));
    }
  }
} finally {
  await browser.close();
  server.kill();
}
