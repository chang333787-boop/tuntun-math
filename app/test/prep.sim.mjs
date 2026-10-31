// 준비 다리 고리 시험 — 가상 아이로: node app/test/prep.sim.mjs [단원마다 아이 수] [실수]
//   빈 아이: 준비 칸 아래의 차시 G 하나와 G에 기대는 위 차시를 모름 · 아는 차시도 실수 확률로 틀림
//   빈 곳 없는 아이 · 절차 버그 아이(그 틀린 방법이 먹히는 문제만 그 답)
import { UNITS } from '../../engine/lessons/index.js';
import { readExpr, testable, __predict } from '../../engine/errors.js';
import { rng } from '../../engine/math.js';
import { closure } from '../../paper/js/gen.js';
import { prepPlan, newPrep, current, answer, summary, PREP } from '../js/prep.js';
const N = Number(process.argv[2] || 6), SLIP = Number(process.argv[3] || 0.05);
const r = rng(7);
function reply(it, knows, bug) {
  const view = { prompt: it.snap.prompt, sol: it.snap.sol };
  let tests = []; try { tests = readExpr(view) ? testable(view) : []; } catch (e) { /* */ }
  if (bug && tests.includes(bug)) { const v = __predict(view, bug); if (v) return { vals: v.map(Number), raws: v.map(String) }; }
  if (knows) { if (r.next() >= SLIP) return { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) }; }
  if (!knows && tests.length) { const v = __predict(view, tests[Math.floor(r.next() * tests.length)]); if (v) return { vals: v.map(Number), raws: v.map(String) }; }
  if (it.snap.choices) { const k = (Number(it.snap.sol[0]) + 1) % it.snap.choices.length; return { vals: [k], raws: [String(k)] }; }
  if (knows) { const v = it.snap.sol.map((x, i) => (i === it.snap.sol.length - 1 ? Number(x) + 1 : Number(x))); return { vals: v, raws: v.map(String) }; }
  const u = r.next();
  if (u < 0.25) { const v = it.snap.sol.map((x, i) => (i === 0 ? Number(x) + 10 ** Math.max(0, String(Math.trunc(Number(x))).length - 1) : Number(x))); return { vals: v, raws: v.map(String) }; }   // 늘 같은 자리를 1 틀림(실수처럼 보이는 꼴 · 10-31 브라우저에서 찾은 되풀이)
  if (u < 0.6) return { idk: true };
  const v = it.snap.sol.map((x) => Math.max(0, Math.round(Number(x) * (0.4 + r.next())) + 3)); return { vals: v, raws: v.map(String) };
}
// days = 며칠에 걸쳐(이틀째는 지난 기록을 함께 판정해 이어 감 · 그 사이 고치지는 않았다고 침)
function run(unit, gap, bug, days = 1) {
  const P = prepPlan(unit);
  const all = new Set([...P.pre, ...P.below]);
  const unknown = new Set(gap ? [...all].filter((c) => closure(c).has(gap)) : []);
  let prior = null, S, n = 0;
  for (let d = 0; d < days; d++) {
    S = newPrep({ unit, id: 'S' + Math.floor(r.next() * 1e6) + d, prior, now: Date.now() + d * 1000 });
    let it, guard = 0;
    while ((it = current(S)) && guard++ < 200) answer(S, reply(it, !unknown.has(it.c), bug), { conf: 2 });
    n += S.sheets.reduce((k, sh) => k + Object.keys(S.res[sh.id].me.it).length, 0);
    const sum = summary(S);
    if (sum.fix.length || S.why === 'clear' || S.why === 'none') break;
    prior = { sheets: [...(prior ? prior.sheets : []), ...S.sheets], res: { ...(prior ? prior.res : {}), ...S.res } };
  }
  const sum = summary(S); sum.n = n;
  return { S, sum, unknown };
}
const DAYS = Number(process.env.DAYS || 1);
let gRuns = 0, hit = 0, near = 0, below = 0, falseS = 0, items = 0, budget = 0, cRuns = 0, cFalse = 0, cItems = 0, maxItems = 0;
const perUnit = [];
for (const u of UNITS) {
  const P = prepPlan(u.id); if (!P.fringe.length) continue;
  const all = [...new Set([...P.pre, ...P.below])].filter((c) => !c.startsWith('est:'));
  let uh = 0, ur = 0, ui = 0;
  for (let i = 0; i < N; i++) {
    const gap = all[Math.floor(r.next() * all.length)];
    const { S, sum, unknown } = run(u.id, gap, null, DAYS); gRuns++; ur++; items += sum.n; ui += sum.n; maxItems = Math.max(maxItems, sum.n);
    if (S.why === 'budget') budget++;
    if (sum.fix.includes(gap)) { hit++; uh++; }
    else if (sum.fix.some((c) => closure(gap).has(c) || closure(c).has(gap))) near++;
    else if (sum.firstCheck.some((c) => unknown.has(c))) below++;
    if (sum.fix.some((c) => !unknown.has(c))) falseS++;
  }
  for (let i = 0; i < Math.ceil(N / 2); i++) { const { sum } = run(u.id, null); cRuns++; cItems += sum.n; if (sum.fix.length) cFalse++; }
  perUnit.push(`${u.id} ${(uh / ur * 100).toFixed(0)}% ${(ui / ur).toFixed(0)}문항`);
}
const BUGS = ['add.noCarry', 'sub.noDec', 'sub.big', 'mul.noCarry', 'div.dropRem', 'mul.noShift'];
let bRuns = 0, bShown = 0;
for (const u of UNITS) {
  const P = prepPlan(u.id); if (!P.fringe.length) continue;
  for (const bug of BUGS) {
    const { sum } = run(u.id, null, bug);
    const hitL = Object.values(sum.rep.L).filter((x) => x.why && x.why.sure.some((h) => h.id === bug));
    if (!hitL.length) continue;
    bRuns++;
    const shown = new Set([...sum.fix, ...sum.firstCheck, ...sum.because]);
    if (hitL.some((x) => shown.has(x.c))) bShown++;
  }
}
const pct = (a, b) => `${((a / Math.max(b, 1)) * 100).toFixed(1)}%`;
if (process.env.UNITS) console.log(perUnit.join('\n'));
console.log(`준비 다리(${DAYS}일) · 빈 아이 ${gRuns}명(실수 ${SLIP * 100}%): 고칠 판자가 바로 그 칸 ${pct(hit, gRuns)} · 이웃 칸 ${pct(near, gRuns)} · 아직 아래 확인 ${pct(below, gRuns)} · 엉뚱한 칸 ${pct(falseS, gRuns)} · 평균 ${(items / gRuns).toFixed(1)}문항(최대 ${maxItems}) · 예산에서 멈춤 ${pct(budget, gRuns)}`);
console.log(`빈 곳 없는 아이 ${cRuns}명: 헛짚음 ${pct(cFalse, cRuns)} · 평균 ${(cItems / cRuns).toFixed(1)}문항`);
console.log(`절차 버그 아이 ${bRuns}명: 그 칸을 보여 줌 ${pct(bShown, bRuns)}`);
const HIT = DAYS >= 2 ? 0.95 : 0.8;   // 하루 한 판에 80% · 못 찾으면 다음 시간에 이어서 — 이틀 안에 95%
const pass = hit / gRuns >= HIT && falseS / gRuns <= 0.05 && cFalse / cRuns <= 0.06 && (!bRuns || bShown / bRuns >= 0.9);
console.log(pass ? '준비 다리 시험 PASS' : '준비 다리 시험 FAIL', `(기준 바로 그 칸 ≥${HIT * 100}% · 엉뚱 ≤5% · 헛짚음 ≤6% · 버그 ≥90% · 한 판 ${PREP.budget}문항 안)`);
if (!pass) process.exitCode = 1;
