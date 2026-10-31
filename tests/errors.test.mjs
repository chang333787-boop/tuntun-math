// 오답 분석 시험 — 가상 아이로 '어떤 점으로 틀렸나'를 얼마나 맞게 가르는지 잰다(js/errors.js)
//   ① 버그형 아이: 그 버그를 늘 씀(그 버그로 가릴 수 있는 문제에서만 틀림) → 8문제 모아 그 버그가 '확실'로 나오나(재현율)
//   ② 계산 실수형 아이: 방법은 맞고 30% 문제에서 한 군데 삐끗(한 자리 ±1 · 이웃 숫자 바꿈 · 곱셈구구 한 칸 · 분자 ±1) → 버그를 '확실'로 잘못 보나(헛짚음)
//   ③ 섞인 아이: 버그 + 가끔 계산 실수 → 그래도 그 버그를 찾나
//   ④ 한 문제: 버그 답은 반드시 그 버그를 가설에 넣음 · 정답은 분석하지 않음 · 꼴만 다른 답(5 10/6)은 절차
//   기준: 재현율 ≥ 90%(가릴 수 있는 문제가 2개 넘을 때) · 헛짚음 ≤ 5% · 섞인 아이 재현율 ≥ 80%
//   node tests/errors.test.mjs
import { NODES, makeItem } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
import { readExpr, answerOf, diagnose, testable, judge, BUG_LIST, rightOf, chainOf } from '../engine/errors.js';

const bad = [];
const note = (m) => { if (bad.length < 30) bad.push(m); };
const r = rng(20261012);
// 지원하는 차시(식이 보이고 연산 · 수 종류가 버그 목록에 있는 것)
const sup = NODES.filter((L) => { let it; try { it = makeItem(L.id, L.gen(rng(L.id.length))); } catch (e) { return false; } const X = readExpr(it); return X && BUG_LIST.some((b) => b.op === X.op && b.st.includes(X.st)); });
// 정답 꼴의 vals — 버그 예측(값 · 꼴)을 그 문제의 답 칸 모양으로 바꿈
function valsFor(it, pred) {
  const p = it.prompt, k = p.map((t, i) => (typeof t === 'string' && t.includes('=') ? i : -1)).filter((i) => i >= 0).pop();
  const tail = p.slice(k + 1).filter((t) => t && typeof t === 'object');
  const vals = it.sol.slice();
  const B = (x) => x && typeof x === 'object' && 'b' in x;
  if (pred.q != null) { const bs = tail.filter(B); if (bs.length !== 2) return null; vals[bs[0].b] = pred.q; vals[bs[1].b] = pred.r; return vals; }
  const t = tail[tail.length - 1];
  const v = pred.v, x = v.n / v.d;
  if (B(t)) { vals[t.b] = Number(x.toFixed(6)); return vals; }
  if ('m' in t) {
    const w = pred.w != null ? pred.w : Math.floor(v.n / v.d), d = pred.d != null ? pred.d : v.d, n = pred.n != null ? pred.n : v.n - w * v.d;
    if (!B(t.m[2]) && t.m[2] !== d) return null;
    [w, n, d].forEach((y, i) => { if (B(t.m[i])) vals[t.m[i].b] = y; }); return vals;
  }
  if ('f' in t) { if (!B(t.f[1]) && t.f[1] !== v.d) return null; if (B(t.f[0])) vals[t.f[0].b] = v.n; if (B(t.f[1])) vals[t.f[1].b] = v.d; return vals; }
  return null;
}
import * as E from '../engine/errors.js';
function slipAnswer(it, rr) {
  const X = readExpr(it);
  if (!X) return null;
  const right = rightOf(X);
  const ansR = answerOf(it, it.sol.map(Number));
  if (!ansR) return null;
  if (ansR.q != null) { const q = ansR.q; if (q < 10) return null; const s = String(q), i = rr.int(0, s.length - 1), d = Number(s[i]); const nd = d === 9 ? 8 : d + 1; return valsFor(it, { q: Number(s.slice(0, i) + nd + s.slice(i + 1)), r: ansR.r }); }
  if (ansR.d) { const n2 = ansR.n + (ansR.n + 1 < ansR.d ? 1 : -1); if (n2 < 0) return null; return valsFor(it, { v: { n: ansR.w * ansR.d + n2, d: ansR.d }, w: ansR.w, n: n2, d: ansR.d }); }
  const x = right.n / right.d, p = String(x).includes('.') ? String(x).split('.')[1].length : 0, ri = Math.round(x * 10 ** p), s = String(ri);
  if (ri < 10) return null;
  const kind = rr.int(0, 2);
  let a;
  if (kind === 0) { const i = rr.int(0, s.length - 1), d = Number(s[i]); a = Number(s.slice(0, i) + (d === 9 ? 8 : d + 1) + s.slice(i + 1)); }
  else if (kind === 1 && s.length >= 2) { const i = rr.int(0, s.length - 2); if (s[i] === s[i + 1]) return null; a = Number(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)); }
  else { const i = rr.int(0, s.length - 1); a = ri + (rr.chance(0.5) ? 1 : -1) * 10 ** (s.length - 1 - i); }
  if (String(a).length !== s.length && kind !== 2) return null;
  return valsFor(it, { v: { n: a, d: 10 ** p } });
}
function play(L, seed, policy) {
  const rr = rng(seed), recs = [];
  for (let k = 0; k < 8; k++) {
    const it = makeItem(L.id, L.gen(rr));
    if (!readExpr(it)) continue;   // 같은 차시라도 식이 안 보이는 꼴(그림 · 고르기)은 분석하지 않음
    const tests = testable(it);
    let vals = policy(it, rr, tests);
    const ok = !vals;
    if (ok) vals = it.sol.map(Number);
    const d = ok ? null : diagnose(it, answerOf(it, vals));
    recs.push({ ok, d, tests });
  }
  return judge(recs);
}
let bugRuns = 0, bugHit = 0, slipRuns = 0, slipFalse = 0, slipSaid = 0, mixRuns = 0, mixHit = 0;
const perBug = {};
for (const L of sup) {
  let X0 = null; for (let k = 1; k < 30 && !X0; k++) X0 = readExpr(makeItem(L.id, L.gen(rng(k))));
  if (!X0) continue;
  const ids = BUG_LIST.filter((b) => b.op === X0.op && b.st.includes(X0.st) && b.id !== 'fr.impr').map((b) => b.id);
  for (const id of ids) {
    for (let s = 1; s <= 6; s++) {
      // 버그형
      let testN = 0;
      const J = play(L, s * 7919 + id.length, (it, rr, tests) => { if (!tests.includes(id)) return null; const v = E.__predict(it, id); if (v) testN++; return v; });
      if (testN >= 2) { bugRuns++; const hit = J.sure.some((h) => h.id === id); if (hit) bugHit++; (perBug[id] = perBug[id] || [0, 0])[1]++; if (hit) perBug[id][0]++; else if (bad.length < 12) note(`버그형 ${L.id} ${id}: 못 찾음 · sure ${J.sure.map((h) => h.id)} · maybe ${J.maybe.map((h) => h.id)}`); }
      // 섞인 아이 — 버그 + 25% 계산 실수
      let t2 = 0;
      const J2 = play(L, s * 104729 + id.length, (it, rr, tests) => { if (tests.includes(id)) { const v = E.__predict(it, id); if (v) { t2++; return v; } } return rr.chance(0.25) ? slipAnswer(it, rr) : null; });
      if (t2 >= 2) { mixRuns++; if (J2.sure.some((h) => h.id === id)) mixHit++; }
    }
  }
  // 계산 실수형
  for (let s = 1; s <= 12; s++) {
    const J = play(L, s * 31337, (it, rr) => (rr.chance(0.3) ? slipAnswer(it, rr) : null));
    if (J.wrong) { slipRuns++; if (J.verdict === 'slip') slipSaid++; if (J.sure.length) { slipFalse++; if (bad.length < 24) note(`계산 실수형 ${L.id}: 버그로 잘못 봄 ${J.sure.map((h) => `${h.id} s${h.s}/a${h.a}`)}`); } }
  }
}
// 한 문제: 꼴만 다른 답(5 10/6) → 절차 · 정답 → 분석 안 함
{
  const it = { prompt: ['1 5/6 + 4 5/6 = ', { m: [{ b: 0 }, { b: 1 }, { b: 2 }] }], sol: [6, 4, 6] };
  const d1 = diagnose(it, answerOf(it, [5, 10, 6]));   // 정답 판정은 차시가 함 — diagnose 는 틀린 답에만 부른다
  if (!d1 || d1.kind !== 'proc' || d1.hyps[0].id !== 'fr.impr') note('5 10/6 을 대분수 꼴 실수로 못 봄');
  // 가운데 칸만 틀림(2/3 + 2/3 = 5/3 = 1 1/3) → 마지막 답은 맞으니 가운데 칸 계산 실수
  const it2 = { prompt: ['2/3 + 2/3 = ', { f: [{ b: 0 }, 3] }, ' = ', { m: [{ b: 1 }, { b: 2 }, 3] }], sol: [4, 1, 1] };
  const d2 = diagnose(it2, answerOf(it2, [5, 1, 1]));
  if (!d2 || d2.kind !== 'slip' || d2.slip !== '가운데 칸 계산 실수' || !d2.mid) note('가운데 칸만 틀린 것을 계산 실수로 못 봄');
  if (chainOf(it2, [5, 1, 1]) !== '5/3 = 1 1/3') note(`가운데 칸 줄 글이 틀림: ${chainOf(it2, [5, 1, 1])}`);
}
// ⑤ 짓궂은 아이들 — 버그를 가끔(60%)만 씀 · 아무 숫자나 씀(정답의 ±50% 안 무작위) · 계산 실수가 잦음(50%)
let incRuns = 0, incHit = 0, rndRuns = 0, rndFalse = 0, heavyRuns = 0, heavyFalse = 0;
function randomAnswer(it, rr) {
  const X = readExpr(it); if (!X) return null;
  const ansR = answerOf(it, it.sol.map(Number)); if (!ansR) return null;
  if (ansR.q != null) return valsFor(it, { q: Math.max(0, ansR.q + rr.int(-5, 5) || 1), r: rr.int(0, Math.max(0, X.B.i - 1)) });
  if (ansR.d) { const n = rr.int(0, ansR.d - 1), w = Math.max(0, (ansR.w || 0) + rr.int(-2, 2)); return valsFor(it, { v: { n: w * ansR.d + n, d: ansR.d }, w, n, d: ansR.d }); }
  const right = rightOf(X), x = right.n / right.d, p2 = String(x).includes('.') ? String(x).split('.')[1].length : 0, ri = Math.round(x * 10 ** p2);
  const a = Math.max(0, Math.round(ri * (0.5 + rr.next())));
  return a === ri ? null : valsFor(it, { v: { n: a, d: 10 ** p2 } });
}
for (const L of sup) {
  let X0 = null; for (let k = 1; k < 30 && !X0; k++) X0 = readExpr(makeItem(L.id, L.gen(rng(k))));
  if (!X0) continue;
  const ids = BUG_LIST.filter((b) => b.op === X0.op && b.st.includes(X0.st) && b.id !== 'fr.impr').map((b) => b.id);
  for (const id of ids) for (let s = 1; s <= 4; s++) {
    let t = 0;
    const J = play(L, s * 271 + id.length, (it, rr, tests) => { if (tests.includes(id) && rr.chance(0.6)) { const v = E.__predict(it, id); if (v) { t++; return v; } } return null; });
    if (t >= 2) { incRuns++; if (J.sure.some((h) => h.id === id)) incHit++; }
  }
  for (let s = 1; s <= 8; s++) {
    const J = play(L, s * 977, (it, rr) => (rr.chance(0.4) ? randomAnswer(it, rr) : null));
    if (J.wrong) { rndRuns++; if (J.sure.length) rndFalse++; }
    const J2 = play(L, s * 1009, (it, rr) => (rr.chance(0.5) ? slipAnswer(it, rr) : null));
    if (J2.wrong) { heavyRuns++; if (J2.sure.length) heavyFalse++; }
  }
}
const inc = incHit / Math.max(1, incRuns), rnd = rndFalse / Math.max(1, rndRuns), heavy = heavyFalse / Math.max(1, heavyRuns);
console.log(`짓궂은 아이 — 버그를 가끔(60%) ${incRuns}판 찾음 ${(inc * 100).toFixed(1)}% · 아무 숫자 ${rndRuns}판 헛짚음 ${(rnd * 100).toFixed(1)}% · 계산 실수 잦음(50%) ${heavyRuns}판 헛짚음 ${(heavy * 100).toFixed(1)}%`);
const recall = bugHit / Math.max(1, bugRuns), fp = slipFalse / Math.max(1, slipRuns), mix = mixHit / Math.max(1, mixRuns);
for (const m of bad) console.log('·', m);
console.log(Object.entries(perBug).map(([k, [h, n]]) => `${k} ${h}/${n}`).join(' · '));
const said = slipSaid / Math.max(1, slipRuns);
console.log(`계산 실수형 아이를 '계산 실수'라고 말함 ${(said * 100).toFixed(1)}%`);
const pass = said >= 0.8 && recall >= 0.9 && fp <= 0.05 && mix >= 0.8 && inc >= 0.7 && rnd <= 0.05 && heavy <= 0.05;
console.log(`오답 분석 시험 — 차시 ${sup.length}개 · 버그형 ${bugRuns}판 찾음 ${(recall * 100).toFixed(1)}% · 계산 실수형 ${slipRuns}판 헛짚음 ${(fp * 100).toFixed(1)}% · 섞인 아이 ${mixRuns}판 찾음 ${(mix * 100).toFixed(1)}% · ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
