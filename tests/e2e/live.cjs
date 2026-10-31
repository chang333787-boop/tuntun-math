// 배포 주소에서 한 바퀴(머리 없는 크롬): node tests/e2e/live.cjs [주소]
//  시험 반(ZZ) 만들기 → 오늘 단원 열기 → 1번 아이 들어가기 → 준비 다리(빈 곳 하나) → 고칠 판자 → 선생님 표에 보임 → (지우기는 firebase CLI)
const { chromium } = require('/Users/dobuk/Projects/school-metaverse/node_modules/playwright');
const BASE = process.argv[2] || 'https://chang333787-boop.github.io/tuntun-math/app/';
const UNIT = '2-2-2', GAP = '2-1-6:3';
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const w = (ms) => pg.waitForTimeout(ms);
  await pg.goto(BASE + '#/t/new?zz=1'); await w(1500);
  await pg.fill('#n', '2'); await pg.click('#mk'); await pg.waitForURL(/cards/, { timeout: 15000 });
  const C = (await pg.url()).match(/c\/(\w+)\/cards/)[1];
  await pg.goto(BASE + `#/t/c/${C}`); await w(1200);
  await pg.selectOption('#u', UNIT); await pg.click('#open'); await w(2500);
  const opened = await pg.textContent('#msg');
  const pin = await pg.evaluate((c) => JSON.parse(localStorage.getItem('tt.t')).classes[c].pins[1], C);
  await pg.goto(BASE + `#/join?c=${C}`); await w(800);
  await pg.fill('#n', '1'); await pg.fill('#p', pin); await pg.click('#f button'); await pg.waitForURL(/#\/me/, { timeout: 15000 }); await w(2500);
  const todo = await pg.textContent('.todo');
  await pg.goto(BASE + `#/prep/${UNIT}`); await w(800); await pg.click('#s'); await w(300);
  let n = 0;
  for (; n < 60; n++) {
    if (!(await pg.$('.qcard'))) break;
    const it = await pg.evaluate(async ([c, gap]) => {
      const G = await import(new URL('../paper/js/gen.js', location.href).href);
      const S = JSON.parse(localStorage.getItem(`tt.prep.${c}.1`) || 'null');
      if (!S) return null; if (!S.at) return 'done';
      const it = S.sheets.find((x) => x.id === S.at.sheet).items[S.at.i];
      return { sol: it.snap.sol, ch: !!it.snap.choices, knows: !G.closure(it.c).has(gap) };
    }, [C, GAP]);
    if (it === 'done') break;
    if (!it) { await pg.click('#idk'); await w(150); continue; }
    await pg.click(`[data-cf="${it.knows ? 2 : 0}"]`);
    if (it.ch) await pg.click(`[data-k="${it.knows ? it.sol[0] : (Number(it.sol[0]) + 1) % 2}"]`);
    else if (!it.knows) await pg.click('#idk');
    else { const bl = await pg.$$('.qcard .blank'); for (let i = 0; i < bl.length; i++) await bl[i].fill(String(it.sol[i])); await pg.click('#ok'); }
    await w(150);
  }
  const end = (await pg.textContent('#view')).slice(0, 80);
  // 다듬기 한 판(곱셈구구 3·6단 — 다 맞힘) → 표를 땀
  await pg.goto(BASE + '#/drill/2-2-2:4'); await w(900); await pg.click('#s'); await w(200);
  for (let i = 0; i < 20; i++) {
    if (!(await pg.$('.qcard'))) break;
    const q = (await pg.textContent('.qcard #q')).replace(/\s/g, '').replace(/=.*$/, '').replace(/×/g, '*');
    await pg.fill('.qcard .blank', String(Function(`return (${q})`)())); await pg.click('#ok'); await w(120);
  }
  const drill = (await pg.textContent('#view')).slice(0, 70);
  // 막힌 문제 거꾸로 찾기: 47 + 38 — 10을 넘는 한 자리 덧셈(1-2-6:2)이 빈 아이
  await pg.goto(BASE + '#/back'); await w(900);
  await pg.fill('#pq', '47+38'); await w(200); await pg.click('#go'); await w(300);
  for (let i = 0; i < 40; i++) {
    if (!(await pg.$('.qcard'))) break;
    const q = await pg.evaluate(async ([c]) => {
      const E = await import(new URL('../engine/engine.js', location.href).href), G = await import(new URL('../paper/js/gen.js', location.href).href);
      const S = JSON.parse(localStorage.getItem(`tt.back.${c}.1`) || 'null'); if (!S) return null;
      const q = E.currentItem(S); if (!q) return null;
      return { sol: q.item.sol, ch: !!q.item.choices, knows: !G.closure(q.c).has('1-2-6:2') };
    }, [C]);
    if (!q) break;
    if (q.ch) await pg.click(`[data-k="${q.knows ? q.sol[0] : (Number(q.sol[0]) + 1) % 2}"]`);
    else if (!q.knows) await pg.click('#idk');
    else { const bl = await pg.$$('.qcard .blank'); for (let k = 0; k < bl.length; k++) await bl[k].fill(String(q.sol[k])); await pg.click('#ok'); }
    await w(120);
  }
  const back = (await pg.textContent('#view')).trim().slice(0, 90);
  await w(3000);
  await pg.goto(BASE + `#/t/c/${C}`); await w(3500);
  const head = await pg.textContent('h2 small');
  const row1 = await pg.evaluate(() => { const tr = document.querySelectorAll('.ctab tr')[1]; return tr ? [...tr.children].slice(-3).map((x) => x.textContent).join(' | ') : ''; });
  await pg.screenshot({ path: '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/f26e2d45-7adb-4b24-ba6f-51b1bd61efd5/scratchpad/live_teacher.png' });
  console.log(JSON.stringify({ C, opened, todo: todo.slice(0, 60), items: n, end: end.trim(), drill, back, head, row1, errs }, null, 1));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
