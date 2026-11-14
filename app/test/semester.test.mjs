// 한 학기 · 한 해 쓰면 버티는지: node app/test/semester.test.mjs
//  ① 아이 하나가 단원 점검을 이어 풀고(앱 점검 엔진) 배우기 · 다시 보기 · 보충 · 점검지 · 매일 연습 흔적이 쌓였을 때 — 서버 규칙 칸(st 3만 · 기록 하나 8천 · rv 2만 · mx 6만) 안인지(요약은 8할 안)
//  ② 요약 · 판정이 한 해 기록에서도 빠른지(선생님 화면은 아이마다 st만 · 아이 화면은 판정을 다시 함)
//  ③ 크롬북 한 대를 여럿이 쓰다 저장 자리가 모자라면 — 다른 아이 기록부터 비우고(오래 안 푼 것부터) 지금 아이 · 보낼 줄은 그대로 · 못 쓴 칸은 방금 값으로 읽음
import { readExpr, testable, __predict } from '../../engine/errors.js';
import { rng } from '../../engine/math.js';
import { closure } from '../../paper/js/gen.js';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };

/* 저장 자리가 정해진 가짜 localStorage(글자 수로 셈) */
function fakeStore(quota = Infinity) {
  const m = new Map(), used = () => [...m].reduce((a, [k, v]) => a + k.length + v.length, 0);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem(k, v) { v = String(v); const before = m.get(k); m.set(k, v); if (used() > quota) { if (before == null) m.delete(k); else m.set(k, before); const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } }, removeItem: (k) => { m.delete(k); }, key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, used };
}
globalThis.localStorage = fakeStore();
const P = await import('../js/prep.js');
const KS = await import('../js/kidstore.js');
const L = await import('../js/local.js');
const DAY = 864e5, sz = (o) => JSON.stringify(o).length;

/* 아이 하나의 한 학기 — 단원마다 점검(지난 기록과 함께 · 사흘까지) → 여기서부터 칸 셋을 배움 → 다음 단원 */
function semester(units, { seed = 5, gaps = 6, gv = 40, ck = 12 } = {}) {
  const r = rng(seed), now = Date.now(), D0 = now - 95 * DAY;
  const reply = (it, knows) => {
    const view = { prompt: it.snap.prompt, sol: it.snap.sol };
    let tests = []; try { tests = readExpr(view) ? testable(view) : []; } catch (e) { /* */ }
    if (knows && r.next() > 0.08) return { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) };
    if (tests.length && r.next() < 0.7) { const v = __predict(view, tests[Math.floor(r.next() * tests.length)]); if (v) return { vals: v.map(Number), raws: v.map(String) }; }
    if (it.snap.choices) { const k = (Number(it.snap.sol[0]) + 1) % it.snap.choices.length; return { vals: [k], raws: [String(k)] }; }
    if (r.next() < 0.5) return { idk: true };
    const v = it.snap.sol.map((x) => Number(x) + 1); return { vals: v, raws: v.map(String) };
  };
  const pool = [...new Set(units.flatMap((u) => { const pl = P.prepPlan(u); return [...pl.pre, ...pl.below]; }))].filter((c) => !c.startsWith('est:'));
  const G = Array.from({ length: gaps }, () => pool[Math.floor(r.next() * pool.length)]), unknown = (c) => G.some((g) => closure(c).has(g));
  const K = { recs: {}, rv: {}, fixed: {}, log: [], mx: {} };
  let t = D0;
  for (const unit of units) {
    let prior = null;
    for (let d = 0; d < 3; d++) {
      const S = P.newPrep({ unit, id: `Z${unit.replace(/-/g, '')}d${d}`, now: t, prior });
      let it, guard = 0; while ((it = P.current(S)) && guard++ < 300) P.answer(S, reply(it, !unknown(it.c)), { conf: r.next() < 0.6 ? 2 : 1 });
      for (const sh of S.sheets) { const R = S.res[sh.id].me; if (!sh.chapters.length || !sh.chapters.every((c) => R.done[c.key])) continue; sh.unit = unit; sh.made = t; K.recs[sh.id] = { s: KS.pack(sh), r: R, cf: S.conf[sh.id] || {}, ms: S.ms[sh.id] || {} }; }
      K.lastPrep = { unit, why: S.why, t }; t += DAY;
      if (S.why !== 'budget') break;
      prior = { sheets: [...(prior ? prior.sheets : []), ...S.sheets], res: { ...(prior ? prior.res : {}), ...S.res } };
    }
    for (const c of KS.summaryOf(K).start.slice(0, 3)) { K.fixed[c] = t; K.rv[c] = { n: Math.floor(r.next() * 4), due: t + DAY, t }; }
    t += 3 * DAY;
  }
  const one = Object.values(K.recs)[0];
  for (let k = 0; k < gv; k++) K.recs[`gv${k}`] = { s: { ...one.s, id: `gv${k}`, kind: 'gv', made: D0 + k * DAY, it: one.s.it.slice(0, 10), tr: [3, 5] }, r: one.r, cf: {}, ms: {} };
  for (let k = 0; k < ck; k++) K.recs[`ck2026TEST${k}_0`] = { s: { ...one.s, id: `ck${k}`, kind: 'ck', made: D0 + k * 7 * DAY, it: one.s.it.slice(0, 10) }, r: one.r, cf: {}, ms: {} };
  K.jog = Array.from({ length: 80 }, (_, k) => new Date(D0 + k * DAY).toISOString().slice(0, 10));
  for (const c of pool) K.mx[c] = { tier: Math.floor(r.next() * 4), runs: Array.from({ length: 6 }, () => ({ t: D0, ok: 9, n: 10 })) };
  K.help = Object.fromEntries(pool.slice(0, 30).map((c) => [c, 2]));
  K.tools = { line: { t: D0, self: 3 }, bars: { t: D0, self: 2 } };
  K.rush = 30;
  return K;
}

// ① 서버 규칙 칸
const RUNS = [
  ['4학년 한 학기', '3-1-1,3-1-3,3-1-4,3-1-6,3-2-1,3-2-2,3-2-4,4-1-1,4-1-3,4-1-6,4-2-1,4-2-3', 4],
  ['6학년 한 학기(빈칸 많음)', '5-1-1,5-1-2,5-1-4,5-1-5,5-1-6,5-2-1,5-2-2,5-2-4,6-1-1,6-1-3,6-1-4,6-2-1,6-2-2,6-2-4,6-2-5', 8],
  ['3 ~ 6학년 한 해 몰아서', '3-1-1,3-1-3,3-1-4,3-1-6,3-2-1,3-2-2,3-2-4,4-1-1,4-1-3,4-1-6,4-2-1,4-2-3,5-1-1,5-1-2,5-1-4,5-1-5,5-1-6,5-2-1,5-2-2,5-2-4,6-1-1,6-1-3,6-1-4,6-2-1,6-2-2,6-2-4,6-2-5', 10],
];
let big = null;
for (const [name, us, gaps] of RUNS) {
  const K = semester(us.split(','), { gaps });
  const t0 = performance.now(), st = KS.summaryOf(K), ms = performance.now() - t0;
  const rec = Math.max(...Object.values(K.recs).map(sz)), n = Object.keys(K.recs).length;
  ok(sz(st) <= 24000, `${name} — 요약(st) ${sz(st)}자 ≤ 2만 4천(서버 3만의 8할) · 판정 차시 ${Object.keys(st.L).length} · 기록 ${n}`);
  ok(rec <= 8000 && sz(K.rv) <= 20000 && KS.mxOut(K).length <= 60000, `${name} — 기록 하나 ${rec} ≤ 8천 · rv ${sz(K.rv)} ≤ 2만 · mx ${KS.mxOut(K).length} ≤ 6만`);
  ok(ms < 1500, `${name} — 요약 만들기 ${Math.round(ms)}ms < 1.5초(기록 ${n} · 이 기기 ${Math.round(sz(K) / 1000)}천 자)`);
  if (!big || sz(K) > sz(big)) big = K;
}

// ③ 저장 자리가 모자랄 때 — 아이 다섯 몫 자리에 아홉 명이 차례로
const each = sz(big), store = fakeStore(Math.round(each * 5.5));
globalThis.localStorage = store;
L.lsSet('tt.q', [{ path: 'k/A/1/0000/st', v: '"x"' }]);
L.lsSet('tt.t', { C: 'ABCDEF' });
const made = (k) => Object.fromEntries(Object.entries(big.recs).map(([id, x]) => [id, { ...x, s: { ...x.s, made: x.s.made + k * DAY } }]));
const saved = [];
for (let no = 1; no <= 9; no++) { KS.save({ C: 'ZZSEM1', no, pin: '0000' }, { ...big, recs: made(no) }); saved.push(store.getItem(`tt.k.ZZSEM1.${no}`) != null); }
const kept = Array.from({ length: 9 }, (_, i) => store.getItem(`tt.k.ZZSEM1.${i + 1}`) != null);
ok(kept[8] && kept[7], `가득 차도 방금 들어온 아이 기록은 이 기기에 씀(남은 번호 ${kept.map((x, i) => (x ? i + 1 : '·')).join(' ')})`);
ok(!kept[0] && kept.filter(Boolean).length >= 4, '오래 안 푼 아이 기록부터 비움(1번이 먼저)');
ok(store.getItem('tt.q') != null && store.getItem('tt.t') != null, '보낼 줄 · 선생님 칸은 비우지 않음');
/* 지울 다른 아이가 없는데도 못 쓰면 — 이 창에서는 방금 값으로 읽음(옛 값을 읽어 보낼 줄이 사라지던 것) */
globalThis.localStorage = fakeStore(60);
L.lsSet('tt.q', [1]);
L.lsSet('tt.q', Array.from({ length: 50 }, (_, i) => i));
ok(Array.isArray(L.lsGet('tt.q')) && L.lsGet('tt.q').length === 50, `못 쓴 칸은 방금 값으로 읽음(${(L.lsGet('tt.q') || []).length}개)`);
L.lsSet('tt.q', [2]);
ok(L.lsGet('tt.q').length === 1 && localStorage.getItem('tt.q') === '[2]', '다시 쓸 수 있게 되면 이 기기 값으로 돌아감');

console.log(fail ? `실패 ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
