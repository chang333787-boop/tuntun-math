// 229차시 × 문제 셋 — 단계 글 · 단계 식 · 세로셈 · 묶음 바꾸기 · 10칸 틀 · 풀이 순서 · 도움 사다리를 실제로 그려 오류 · undefined · NaN 찾기(서버 X)
//  node tests/e2e/steps.cjs [주소 — 기본 http://localhost:8030/app/] · 11-07 도움말 고친 뒤 회귀 막기
const { chromium } = require(process.env.PW || 'playwright')   /* playwright가 다른 폴더에 있으면 PW=<그 폴더>/node_modules/playwright */;
const BASE = process.argv[2] || 'http://localhost:8030/app/', ROOT = new URL('..', BASE).href;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.route('**/*', (r) => (r.request().url().startsWith(ROOT) ? r.continue() : r.abort()));
  await pg.goto(BASE + '#/t'); await pg.waitForTimeout(600);
  const r = await pg.evaluate(async (root) => {
    const L = await import(root + 'engine/lessons/index.js'), G = await import(root + 'paper/js/gen.js'), M = await import(root + 'engine/math.js'), FX = await import(root + 'app/js/fix.js'), IT = await import(root + 'app/js/item.js'), MD = await import(root + 'app/js/model.js'), H = await import(root + 'app/js/hint.js');
    const host = document.createElement('div'); document.body.append(host);
    const bad = []; let n = 0, st = 0;
    for (const c of Object.keys(L.byId)) for (const sd of [11, 222, 3333]) {
      let it; try { [it] = G.pickItems(c, 1, M.rng(sd), new Set()); } catch (e) { bad.push(`${c} pick ${e.message}`); continue; }
      if (!it) continue; n++;
      try { const steps = FX.stepsOf({ c, p: it.p }); st += steps.length;
        for (const s of steps) { const html = IT.staticHTML(s.prompt, s.sol); if (!html || /undefined|NaN/.test(html)) bad.push(`${c} step html ${s.why}`); if (/undefined|NaN/.test(s.why)) bad.push(`${c} why ${s.why}`); }
        const C = MD.colOf(it, steps); if (C) MD.colView(C, 1, MD.rgLag(it));
        MD.regroupHTML(it, { anim: true }); MD.tenFrameHTML(it, { anim: true });
        H.planNames(c, it.p, steps);
        const full = L.makeItem(c, it.p); H.ladder(host, { it: full, c, raws: ['999'], tag: 't', act: 'give', onEnd: () => {} });
      } catch (e) { bad.push(`${c} ${e.message}`); }
    }
    return { n, st, bad: bad.slice(0, 20), nb: bad.length };
  }, ROOT);
  console.log(`문제 ${r.n} · 단계 ${r.st} · 문제 ${r.nb}개${r.nb ? '\n' + r.bad.join('\n') : ''}${errs.length ? '\n페이지 오류 ' + errs.slice(0, 5).join(' | ') : ''}`);
  await b.close(); process.exit(r.nb || errs.length ? 1 : 0);
})();
