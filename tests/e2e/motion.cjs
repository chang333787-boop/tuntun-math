// 묶음 바꾸기 움직임이 느린 기기에서 끊기는지(서버 X): node tests/e2e/motion.cjs [주소 — 기본 http://localhost:8030/app/]
//  도움 화면처럼 세로셈(늦춤 표시) + 모형을 나란히 그리고 움직임 2.2초 동안 rAF 간격 · 긴 애니메이션 프레임(LoAF)을 잼 · CPU 1 · 6 · 10배 느리게
//  기준: 34ms 넘는 프레임 0 · LoAF 0(11-07 맥에서 10배까지 16.7ms 그대로)
const { chromium } = require(process.env.PW || 'playwright')   /* playwright가 다른 폴더에 있으면 PW=<그 폴더>/node_modules/playwright */;
const BASE = process.argv[2] || 'http://localhost:8030/app/';
const ROOT = new URL('..', BASE).href;
const CASES = ['2-1-3:7', '2-1-3:3', '3-1-1:6'];   /* 받아내림 · 받아올림 · 세 자리 */
(async () => {
  const b = await chromium.launch();
  const out = [], errs = [];
  for (const rate of [1, 6, 10]) for (const c of CASES) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const pg = await ctx.newPage();
    await pg.route('**/*', (r) => (r.request().url().startsWith(ROOT) ? r.continue() : r.abort()));
    pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto(BASE + '#/t'); await pg.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const r = await pg.evaluate(async ([c, root]) => {
      const MD = await import(root + 'app/js/model.js'), G = await import(root + 'paper/js/gen.js'), RR = await import(root + 'engine/math.js'), FX = await import(root + 'app/js/fix.js');
      let x = null; for (let k = 0; k < 80 && !x; k++) { const [y] = G.pickItems(c, 1, RR.rng(700 + k), new Set()); if (y && MD.regroupHTML(y)) x = y; }
      if (!x) return { err: '움직임이 있는 문제를 못 찾음' };
      const C = MD.colOf(x, FX.stepsOf({ c: x.c, p: x.p }));
      const host = document.createElement('div'); host.className = 'card'; host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;padding:20px;overflow:auto'; document.body.appendChild(host);
      const draw = (anim) => { host.innerHTML = `<div class="hl-cp"><div class="hl-col">${C ? MD.colView(C, 1, anim ? MD.rgLag(x) : null).html : ''}</div><div class="hl-pic">${MD.regroupHTML(x, { anim })}</div></div>`; };
      draw(false); await new Promise((f) => setTimeout(f, 300));
      const loaf = []; let po = null;
      try { po = new PerformanceObserver((l) => l.getEntries().forEach((e) => loaf.push(Math.round(e.duration)))); po.observe({ type: 'long-animation-frame' }); } catch (e) { po = null; }
      const ts = []; let run = true; const loop = (t) => { ts.push(t); if (run) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
      await new Promise((f) => setTimeout(f, 150));
      const t0 = performance.now(); draw(true);
      const n = document.getAnimations().length;
      await new Promise((f) => setTimeout(f, 2300)); run = false; if (po) po.disconnect();
      const w = ts.filter((t) => t >= t0 && t <= t0 + 2200), d = []; for (let i = 1; i < w.length; i++) d.push(w[i] - w[i - 1]); d.sort((p, q) => p - q);
      return { q: x.prompt.filter((t) => typeof t === 'string').join(' '), anims: n, frames: w.length, p95: +d[Math.floor(d.length * 0.95)].toFixed(1), max: +d[d.length - 1].toFixed(1), over34: d.filter((v) => v > 34).length, loaf: po ? loaf.length : '잴 수 없음', loafMax: loaf.length ? Math.max(...loaf) : 0 };
    }, [c, ROOT]);
    out.push({ cpu: `${rate}배`, c, ...r });
    await ctx.close();
  }
  console.table(out);
  const bad = out.filter((r) => r.err || !r.anims || r.over34 > 0 || (typeof r.loaf === 'number' && r.loaf > 0));
  console.log(bad.length || errs.length ? `확인할 것 ${bad.length} · 오류 ${JSON.stringify(errs)}` : '통과 — 34ms 넘는 프레임 0 · 긴 프레임 0');
  await b.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
