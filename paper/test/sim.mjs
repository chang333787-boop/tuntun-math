// 가상 아이로 고리 재기 — 선별 점검 → 결과 → 확인지 → 결과 → '여기서부터'
//   빈 아이: 차시 G 하나와 G에 기대는 위 차시를 모름(틀린 방법이 있으면 그 답 · 없으면 아무 오답) · 아는 차시도 SLIP 확률로 한 자리 실수
//   빈 곳 없는 아이: 모든 차시를 알고 SLIP 실수만
//   node sheets/test/sim.mjs [아이 수] [SLIP]
import { makeSheet, lessonsIn, closure, LES } from '../js/gen.js';
import { kidReport } from '../js/judge.js';
import { readExpr, testable, __predict } from '../../engine/errors.js';
import { rng } from '../../engine/math.js';
const N = Number(process.argv[2] || 120), SLIP = Number(process.argv[3] || 0.05);
const all = lessonsIn('1-1', '4-1').filter((c) => !c.startsWith('est:'));
const r = rng(31);
function answer(it, knows) {
  const view = { prompt: it.snap.prompt, sol: it.snap.sol };
  if (knows) { if (r.next() >= SLIP) return null; }
  // 모름 · 실수: 틀린 방법이 있으면 그 답, 없으면 정답 +1
  let tests = []; try { tests = readExpr(view) ? testable(view) : []; } catch (e) { /* */ }
  if (!knows && tests.length) { const v = __predict(view, tests[Math.floor(r.next() * tests.length)]); if (v) return { s: 'x', a: v.map(String) }; }
  if (it.snap.choices) return { s: 'x', a: [String((Number(it.snap.sol[0]) + 1) % it.snap.choices.length)] };
  if (knows) return { s: 'x', a: it.snap.sol.map((x, i) => String(i === it.snap.sol.length - 1 ? Number(x) + 1 : x)) };   // 실수 = 한 자리 1 차이
  if (r.next() < 0.5) return { s: 'q' };   // 모르는 아이: 반은 ? · 반은 동떨어진 답
  return { s: 'x', a: it.snap.sol.map((x) => String(Math.max(0, Math.round(Number(x) * (0.4 + r.next())) + 3))) };
}
function run(gap) {
  const unknown = new Set(gap ? all.filter((c) => closure(c).has(gap)) : []);
  const sheets = [], res = {};
  const take = (sh) => { const rr = { done: {}, it: {}, w: {} }; sh.chapters.forEach((c) => (rr.done[c.key] = true)); for (const it of sh.items) { if (it.form === 'w') continue; const a = answer(it, !unknown.has(it.c)); if (a) rr.it[it.k] = a; } res[sh.id] = { kid: rr }; sheets.push(sh); };
  take(makeSheet({ kind: 'gate', words: false, id: 'G' + Math.floor(r.next() * 1e6) }));
  let rep = kidReport(sheets, res, 'kid');
  const CAP = Number(process.env.CAP || 10), ROUNDS = Number(process.env.ROUNDS || 3);   // 앱과 같게: 확인지 아래부터 10차시 · 세 번
  for (let round = 0; round < ROUNDS && rep.checkList.length; round++) {
    take(makeSheet({ kind: 'check', words: false, lessons: rep.checkList.slice(0, CAP).map((c) => ({ c, n: 4, hyps: rep.L[c] && rep.L[c].amb })), id: 'C' + Math.floor(r.next() * 1e6) }));
    rep = kidReport(sheets, res, 'kid');
  }
  const items = sheets.reduce((s, sh) => s + sh.items.length, 0);
  return { rep, items, sheets: sheets.length, unknown };
}
let hit = 0, near = 0, falseStart = 0, gapRuns = 0, items = 0, cleanFalse = 0, cleanRuns = 0, cleanItems = 0, below = 0;
for (let i = 0; i < N; i++) {
  const gap = all[Math.floor(r.next() * all.length)];
  const { rep, items: n, unknown } = run(gap); gapRuns++; items += n;
  const st = rep.start.map((s) => s.c);
  if (st.includes(gap)) hit++;
  else if (st.some((c) => closure(gap).has(c) || closure(c).has(gap))) near++;
  else if (rep.below.some((b) => b.c === gap || unknown.has(b.c))) below++;
  if (st.some((c) => !unknown.has(c))) falseStart++;
}
const why = {};
for (let i = 0; i < Math.round(N / 2); i++) { const { rep, items: n } = run(null); cleanRuns++; cleanItems += n; if (rep.start.length) { cleanFalse++; rep.start.forEach((s) => { const x = rep.L[s.c]; const k = `${x.st}${x.why && x.why.sure.length ? ':' + x.why.sure.map((h) => h.id).join('+') : ''}`; why[k] = (why[k] || 0) + 1; }); } }
if (process.env.WHY) console.log(why);
// 절차 버그 아이 — 그 틀린 방법이 먹히는 문제만 그 답으로 틀리고 나머지는 맞힘(+실수) · 위 차시를 다른 길로 푸는 아이(고립 규칙이 숨기면 안 됨)
const BUGS = ['add.noCarry', 'sub.noDec', 'sub.big', 'mul.noCarry', 'div.dropRem', 'mul.noShift'];
let bugRuns = 0, bugFound = 0, bugShown = 0;
for (let i = 0; i < Math.round(N / 2); i++) {
  const bug = BUGS[i % BUGS.length], sheets = [], res = {};
  const take = (sh) => { const rr = { done: {}, it: {}, w: {} }; sh.chapters.forEach((c) => (rr.done[c.key] = true)); for (const it of sh.items) { if (it.form === 'w') continue; const view = { prompt: it.snap.prompt, sol: it.snap.sol }; let t = []; try { t = readExpr(view) ? testable(view) : []; } catch (e) { /* */ } if (t.includes(bug)) { const v = __predict(view, bug); if (v) { rr.it[it.k] = { s: 'x', a: v.map(String) }; continue; } } const a = answer(it, true); if (a) rr.it[it.k] = a; } res[sh.id] = { kid: rr }; sheets.push(sh); };
  take(makeSheet({ kind: 'gate', words: false, id: 'B' + i }));
  let rep = kidReport(sheets, res, 'kid');
  for (let round = 0; round < 3 && rep.checkList.length; round++) { take(makeSheet({ kind: 'check', words: false, lessons: rep.checkList.slice(0, 10).map((c) => ({ c, n: 4, hyps: rep.L[c] && rep.L[c].amb })), id: 'BC' + i + round })); rep = kidReport(sheets, res, 'kid'); }
  const hit = Object.values(rep.L).filter((x) => x.why && x.why.sure.some((h) => h.id === bug));
  if (!hit.length) continue;   // 이 범위 관문에 그 버그가 먹히는 문제가 없으면 셈에서 뺌
  bugRuns++; bugFound++;
  const shown = new Set([...rep.start.map((s) => s.c), ...rep.below.map((b) => b.c), ...rep.under.map((u) => u.c)]);
  if (hit.some((x) => shown.has(x.c))) bugShown++;
}
console.log(`절차 버그 아이 ${bugRuns}명: 그 원인을 찾고 막힌 차시를 여기서부터 · 아래 먼저 · 아래 때문으로 보여 줌 ${((bugShown / Math.max(bugRuns, 1)) * 100).toFixed(1)}%`);
const bugLine = () => `절차 버그 아이 ${bugRuns}명: 그 원인을 찾고 막힌 차시를 여기서부터 · 아래 먼저 · 아래 때문으로 보여 줌 ${((bugShown / Math.max(bugRuns, 1)) * 100).toFixed(1)}%`;
// 회귀 기준(실수 5% 기준으로 정함 · 10-31): 바로 그 차시 ≥ 90% · 엉뚱한 차시 ≤ 5% · 빈 곳 없는 아이 헛짚음 ≤ 6%
const pass = hit / gapRuns >= 0.9 && falseStart / gapRuns <= 0.05 && cleanFalse / cleanRuns <= 0.06 && (!bugRuns || bugShown / bugRuns >= 0.95);
if (SLIP <= 0.05) { console.log(pass ? '고리 시험 PASS' : '고리 시험 FAIL'); if (!pass) process.exitCode = 1; }
const pct = (a, b) => `${((a / b) * 100).toFixed(1)}%`;
console.log(`빈 곳 하나인 아이 ${gapRuns}명(실수 ${SLIP * 100}%): '여기서부터'가 바로 그 차시 ${pct(hit, gapRuns)} · 그 줄의 이웃 차시 ${pct(near, gapRuns)} · 아직 '아래 먼저 확인' 단계 ${pct(below, gapRuns)} · 엉뚱한 차시를 '여기서부터'로 ${pct(falseStart, gapRuns)} · 평균 문항 ${(items / gapRuns).toFixed(0)}`);
console.log(`빈 곳 없는 아이 ${cleanRuns}명: '여기서부터'를 하나라도 냄(헛짚음) ${pct(cleanFalse, cleanRuns)} · 평균 문항 ${(cleanItems / cleanRuns).toFixed(0)}`);
