// 배포 주소에서 한 바퀴(머리 없는 크롬): node tests/e2e/live.cjs [주소]
//  시험 반(ZZ) 만들기 → 오늘 단원 점검 열기 → 1번 아이 들어가기 → 오늘 단원 점검(빈 곳 하나) → 배울 것 → 다듬기 → 거꾸로 찾기 → 이번 주 점검 → 선생님 카드 셋 · 반 표 · 보충 주기 → 아이가 풀기 → 보낸 목록 맞힌 수 · 종이 결과 가져오기(2번) → (지우기는 firebase CLI)
const { chromium } = require(process.env.PW || 'playwright')   /* playwright가 다른 폴더에 있으면 PW=<그 폴더>/node_modules/playwright */;
const BASE = process.argv[2] || 'https://chang333787-boop.github.io/tuntun-math/app/';
const UNIT = '2-2-2', GAP = '2-1-6:3';
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  pg.on('dialog', (d) => d.accept());
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const w = (ms) => pg.waitForTimeout(ms);
  await pg.goto(BASE + '#/t/new?zz=1'); await w(1500);
  await pg.fill('#n', '2'); await pg.click('#mk'); await pg.waitForURL(/cards/, { timeout: 15000 });
  const C = (await pg.url()).match(/c\/(\w+)\/cards/)[1];
  await pg.goto(BASE + `#/t/c/${C}/check`); await w(1500);
  await pg.selectOption('#u', UNIT); await pg.click('#open'); await w(2500);
  const opened = await pg.textContent('#m1');
  const pin = await pg.evaluate((c) => JSON.parse(localStorage.getItem('tt.t')).classes[c].pins[1], C);
  await pg.goto(BASE + `#/join?c=${C}`); await w(800);
  await pg.fill('#n', '1'); await pg.fill('#p', pin); await pg.click('#f button'); await pg.waitForURL(/#\/me/, { timeout: 15000 }); await w(2500);
  const todo = await pg.textContent('#view .cards3');
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
  // 이야기 다리 — 첫 갈래 → 시작 → 유형 카드 하나 누르기 → 다음 화면이 뜨나(흐름만)
  await pg.goto(BASE + '#/story'); await w(1200);
  await pg.click('#view a[href^="#/story/"]'); await w(1200);
  const st0 = await pg.$$eval('#view button', (bs) => { const b = bs.find((x) => x.textContent.trim() === '시작'); if (b) b.click(); return !!b; }); await w(1200);
  const tyN = (await pg.$$('.sb-ty')).length; if (tyN) { await pg.click('.sb-ty'); await w(800); }
  const story = { start: st0, types: tyN, after: (await pg.textContent('#view')).trim().slice(0, 40) };
  // 이번 주 점검(모두 넘김 — 흐름만) → 내 선
  await pg.goto(BASE + '#/me'); await w(2500);
  const weekTodo = (await pg.textContent('#view')).includes('이번 주 점검');
  await pg.goto(BASE + '#/week'); await w(900); await pg.click('#s'); await w(200);
  let wn = 0; for (; wn < 15; wn++) { if (!(await pg.$('.qcard'))) break; await pg.click('#idk'); await w(100); }
  const week = { n: wn, head: (await pg.textContent('#view')).trim().slice(0, 40), chart: !!(await pg.$('#view svg.runs')) };
  await w(3000);
  await pg.goto(BASE + `#/t/c/${C}`); await w(3500);
  const head = await pg.textContent('h2 small');
  const cards = await pg.evaluate(() => [...document.querySelectorAll('.c3 h2')].map((h) => h.textContent.trim()).join(' · '));
  const strip = await pg.evaluate(() => { const c = document.querySelector('.strip'); return c ? [...c.querySelectorAll('.st-k')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()).join(' | ') : null; });
  const wkPanel = await pg.evaluate(() => [...document.querySelectorAll('.card h2')].some((h) => h.textContent.includes('이번 주 점검 — 맞힌 수')));
  // 반 표(기능 × 아이) — 1번 아이 줄이 있음
  await pg.goto(BASE + `#/t/c/${C}/table`); await w(3500);
  const row1 = await pg.evaluate(() => { const tr = document.querySelectorAll('.stab tr')[1]; return tr ? [...tr.children].map((x) => x.textContent.trim()).join(' | ').slice(0, 120) : ''; });
  // 보충 주기 → 1번 아이 화면 2번 카드 → 풀기 → 보낸 목록에 맞힌 수
  await pg.goto(BASE + `#/t/c/${C}/give?sk=s.teen&who=1`); await w(2500);
  await pg.click('[data-n="5"]'); await w(200); await pg.click('#send'); await w(2500);
  const gsent = (await pg.textContent('#msg')).trim().slice(0, 30);
  await pg.goto(BASE + '#/me'); await w(400); if (await pg.$('#y')) { await pg.click('#y'); } await w(2500);
  const gcard = await pg.evaluate(() => { const a = document.querySelector('.c3 a[href^="#/give/"]'); return a ? a.getAttribute('href') : null; });
  let gdone = null;
  if (gcard) {
    await pg.goto(BASE + gcard); await w(1200); await pg.click('#s'); await w(300);
    for (let i = 0; i < 6; i++) { const q = await pg.$('.qcard .blank'); if (!q) break; const t = await pg.textContent('.qcard .math'); const m = t.match(/(\d+)\s*[−-]\s*(\d+)/); await q.fill(m ? String(Number(m[1]) - Number(m[2])) : '0'); await pg.click('#ok'); await w(250); const nx = await pg.$('.fb button.pri'); if (nx) { await nx.click(); await w(200); } }
    gdone = (await pg.textContent('#view')).replace(/\s+/g, ' ').trim().slice(0, 50);
  }
  await w(3000);
  await pg.goto(BASE + `#/t/c/${C}/give`); await w(4000);
  const gres = await pg.evaluate(() => { const li = document.querySelector('.sent li'); return li ? li.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null; });
  if (process.env.SHOT) await pg.screenshot({ path: process.env.SHOT });
  // 종이 결과 가져오기 — 같은 브라우저의 종이 앱 기록(가짜 한 장)을 2번에 넣기 → 2번 자세히에 묶음이 보임
  await pg.evaluate(async () => {
    const G = await import(new URL('../paper/js/gen.js', location.href).href);
    const sh = G.makeSheet({ kind: 'gate', from: '2-1', to: '3-1', id: 'ZZPAPER', seed: 5 });
    const r = { done: Object.fromEntries(sh.chapters.map((c) => [c.key, true])), it: {}, w: {}, t: {}, at: Date.now() };
    sh.items.forEach((it, j) => { if (it.form !== 'w') r.it[it.k] = j % 5 === 2 ? { s: 'x', a: ['3'] } : { s: 'ok' }; });
    localStorage.setItem('kkg.v1', JSON.stringify({ v: 1, kids: [{ id: 'zk1', label: '2번' }], sheets: { ZZPAPER: sh }, res: { ZZPAPER: { zk1: r } }, at: Date.now() }));
  });
  await pg.goto(BASE + `#/t/c/${C}/paper`); await w(900);
  const psel = await pg.$eval('select[data-i="0"]', (el) => el.value);
  await pg.click('#go'); await w(3500);
  const pmsg = (await pg.textContent('#msg')).trim().slice(0, 30);
  await pg.goto(BASE + `#/t/c/${C}/k/2`); await w(2500);
  const kid2 = (await pg.textContent('h2 small')).trim();
  // 번호를 잘못 골랐다 → 1번으로 옮기기(2번에서 빠지고 1번에 들어감)
  await pg.goto(BASE + `#/t/c/${C}/paper`); await w(900);
  await pg.selectOption('select[data-i="0"]', '1'); await pg.click('#go'); await w(4000);
  await pg.goto(BASE + `#/t/c/${C}/k/2`); await w(2500);
  const moved2 = (await pg.textContent('h2 small')).trim();
  await pg.goto(BASE + `#/t/c/${C}/k/1`); await w(2500);
  const moved1 = (await pg.textContent('h2 small')).trim();
  await pg.goto(BASE + `#/t/c/${C}/k/2`); await w(2500);
  const ai = await pg.$eval('#aiq', (el) => ({ n: el.value.length, fix: el.value.includes('고칠_판자'), name: /이름[":]\s*"/.test(el.value) })).catch(() => null);
  await pg.goto(BASE + `#/t/c/${C}/s/compare`); await w(1500);
  const scard = { title: (await pg.textContent('h2')).trim().slice(0, 30), frames: (await pg.$$('.sbf svg')).length };
  await pg.goto(BASE + '#/t/letter'); await w(800);
  const letter = (await pg.textContent('h2')).trim();
  console.log(JSON.stringify({ C, opened, story, scard, letter, todo: todo.replace(/\s+/g, ' ').slice(0, 90), items: n, end: end.trim(), drill, back, weekTodo, week, head, cards, row1, strip, wkPanel, give: { gsent, gcard, gdone, gres }, paper: { psel, pmsg, kid2, moved2, moved1 }, ai, errs }, null, 1));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
