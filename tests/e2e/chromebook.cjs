// 느린 크롬북 흉내(배포 주소): node tests/e2e/chromebook.cjs — CPU 4배 느리게 · 네트워크 1.5Mbps/150ms · 1366×768 · 터치 · 끝나면 찍힌 시험 반 ZZ를 firebase CLI로 지울 것
const { chromium } = require('/Users/dobuk/Projects/school-metaverse/node_modules/playwright');
const BASE = 'https://chang333787-boop.github.io/tuntun-math/app/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, hasTouch: true });
  const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.5e6 / 8, uploadThroughput: 0.75e6 / 8 });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('dialog', (d) => d.accept());
  const T = {}, w = (ms) => pg.waitForTimeout(ms);
  let t0 = Date.now();
  await pg.goto(BASE + '#/t'); await pg.waitForFunction(() => document.getElementById('view') && document.getElementById('view').innerText.includes('선생님 처음 화면'), null, { timeout: 120000 });
  T.coldLoad = Date.now() - t0;
  await pg.goto(BASE + '#/t/new?zz=1'); await w(500);
  await pg.fill('#n', '3'); t0 = Date.now(); await pg.click('#mk'); await pg.waitForURL(/cards/, { timeout: 60000 }); T.makeClass = Date.now() - t0;
  const C = (await pg.url()).match(/c\/(\w+)\/cards/)[1];
  t0 = Date.now(); await pg.goto(BASE + `#/t/c/${C}`); await pg.waitForSelector('#u', { timeout: 60000 }); T.classView = Date.now() - t0;
  await pg.selectOption('#u', '3-1-1'); await pg.click('#open'); await w(3000);
  const pin = await pg.evaluate((c) => JSON.parse(localStorage.getItem('tt.t')).classes[c].pins[1], C);
  await pg.goto(BASE + `#/join?c=${C}`); await w(800);
  await pg.fill('#n', '1'); await pg.fill('#p', pin); t0 = Date.now(); await pg.click('#f button'); await pg.waitForURL(/#\/me/, { timeout: 60000 });
  await pg.waitForFunction(() => document.querySelector('.todo'), null, { timeout: 60000 }); T.joinToHome = Date.now() - t0;
  await pg.goto(BASE + '#/prep/3-1-1'); await pg.waitForSelector('#s', { timeout: 60000 }); await pg.click('#s');
  const lat = [];
  for (let n = 0; n < 15; n++) {
    if (!(await pg.$('.qcard'))) break;
    const conf = await pg.$('[data-cf="1"]'); if (conf) await conf.tap();
    const before = await pg.evaluate(() => document.querySelector('#q') && document.querySelector('#q').innerText);
    const s0 = Date.now();
    await pg.tap('#idk');
    await pg.waitForFunction((b) => { const q = document.querySelector('#q'); return !q || q.innerText !== b; }, before, { timeout: 30000 }).catch(() => {});
    lat.push(Date.now() - s0);
  }
  T.prepAnswerMs = { n: lat.length, med: lat.slice().sort((a, b) => a - b)[Math.floor(lat.length / 2)], max: Math.max(...lat) };
  t0 = Date.now(); await pg.goto(BASE + '#/me'); await pg.waitForFunction(() => document.querySelector('.todo') || document.querySelector('#view h2'), null, { timeout: 60000 }); T.homeAgain = Date.now() - t0;
  t0 = Date.now(); await pg.goto(BASE + '#/stages'); await w(300); await pg.waitForFunction(() => document.getElementById('view').innerText.length > 50, null, { timeout: 60000 }); T.stages = Date.now() - t0;
  t0 = Date.now(); await pg.goto(BASE + '#/story'); await pg.waitForFunction(() => document.getElementById('view').innerText.length > 50, null, { timeout: 60000 }); T.story = Date.now() - t0;
  await pg.screenshot({ path: '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/f26e2d45-7adb-4b24-ba6f-51b1bd61efd5/scratchpad/cb/story.png' });
  await pg.goto(BASE + `#/t/c/${C}`); t0 = Date.now(); await pg.waitForSelector('.ctab', { timeout: 60000 }).catch(() => {}); T.classView2 = Date.now() - t0;
  const fonts = await pg.evaluate(() => { const xs = [...document.querySelectorAll('#view *')].filter((e) => e.childElementCount === 0 && e.innerText && e.innerText.trim()).map((e) => parseFloat(getComputedStyle(e).fontSize)); return { min: Math.min(...xs), small: xs.filter((v) => v < 13).length, n: xs.length }; });
  console.log(JSON.stringify({ C, T, fonts, errs }, null, 1));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
