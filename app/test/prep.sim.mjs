// 준비 다리 고리 시험 — 가상 아이로: node app/test/prep.sim.mjs [단원마다 아이 수] [실수]
//   빈 아이: 준비 칸 아래의 차시 G 하나와 G에 기대는 위 차시를 모름 · 아는 차시도 실수 확률로 틀림
//   빈 곳 없는 아이 · 절차 버그 아이(그 틀린 방법이 먹히는 문제만 그 답)
import { UNITS } from '../../engine/lessons/index.js';
import { readExpr, testable, __predict } from '../../engine/errors.js';
import { rng } from '../../engine/math.js';
import { closure, LES } from '../../paper/js/gen.js';
import { prepPlan, newPrep, current, answer, summary, PREP } from '../js/prep.js';
if (process.env.BUDGET) { PREP.budget = Number(process.env.BUDGET); PREP.rounds = Math.ceil(PREP.budget / 3); }   /* 예산 견주기용 */
if (process.env.CAP) PREP.cap = Number(process.env.CAP);
const N = Number(process.argv[2] || 6), SLIP = Number(process.argv[3] || 0.05);
if (process.env.PREPX) Object.assign(PREP, JSON.parse(process.env.PREPX));   // 실험: PREPX='{"budget":24}' — 예산 · 묶음 크기를 바꿔 견주기
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
//  gap = 빈 차시 하나 · gaps = 여럿(약한 아이) — 그 차시에 기대는 칸을 모두 모름
function run(unit, gap, bug, days = 1, gaps = null) {
  const P = prepPlan(unit);
  const all = new Set([...P.pre, ...P.below]);
  const G = gaps || (gap ? [gap] : []);
  const unknown = new Set([...all].filter((c) => G.some((g) => closure(c).has(g))));
  let prior = null, S, n = 0, day1 = null, dayMax = 0, used = 0;
  for (let d = 0; d < days; d++) {
    S = newPrep({ unit, id: 'S' + Math.floor(r.next() * 1e6) + d, prior, now: Date.now() + d * 1000 });
    let it, guard = 0;
    while ((it = current(S)) && guard++ < 200) answer(S, reply(it, !unknown.has(it.c), bug), { conf: 2 });
    const k = S.sheets.reduce((m, sh) => m + Object.keys(S.res[sh.id].me.it).length, 0);
    n += k; dayMax = Math.max(dayMax, k); used = d + 1;
    if (!day1) day1 = S.why;
    const sum = summary(S);
    if (sum.fix.length || S.why === 'clear' || S.why === 'none') break;
    prior = { sheets: [...(prior ? prior.sheets : []), ...S.sheets], res: { ...(prior ? prior.res : {}), ...S.res } };
  }
  const sum = summary(S); sum.n = n;
  return { S, sum, unknown, day1, dayMax, used };
}
const DAYS = Number(process.env.DAYS || 1);
let gRuns = 0, hit = 0, near = 0, below = 0, falseS = 0, items = 0, budget = 0, cRuns = 0, cFalse = 0, cItems = 0, maxItems = 0, dayMax = 0, teach1 = 0, days = 0;
const perUnit = [];
for (const u of UNITS) {
  const P = prepPlan(u.id); if (!P.fringe.length) continue;
  const all = [...new Set([...P.pre, ...P.below])].filter((c) => !c.startsWith('est:'));
  let uh = 0, ur = 0, ui = 0;
  for (let i = 0; i < N; i++) {
    // 빈 곳 고르기 — 기본은 고르게(가장 어려운 가정) · NEAR=1이면 단원과 가까운 학기일수록 잦게(한 학기 멀어질 때마다 반)
    const gi = (c) => { const L = LES(c); return L ? Number(L.g[0]) * 2 + Number(L.g[2]) : 0; }, ug = Number(u.g[0]) * 2 + Number(u.g[2]);
    const wts = all.map((c) => (process.env.NEAR ? 0.5 ** Math.max(0, ug - gi(c) - 1) : 1)), tot = wts.reduce((a, b) => a + b, 0);
    let pick = r.next() * tot, gap = all[all.length - 1]; for (let k = 0; k < all.length; k++) { pick -= wts[k]; if (pick <= 0) { gap = all[k]; break; } }
    const { S, sum, unknown, day1, dayMax: dm, used } = run(u.id, gap, null, DAYS); gRuns++; ur++; items += sum.n; ui += sum.n; maxItems = Math.max(maxItems, sum.n); dayMax = Math.max(dayMax, dm); days += used;
    if (S.why === 'budget') budget++;
    if (day1 === 'teacher') teach1++;
    if (sum.fix.includes(gap)) { hit++; uh++; }
    else if (sum.fix.some((c) => closure(gap).has(c) || closure(c).has(gap))) near++;
    else if (sum.firstCheck.some((c) => unknown.has(c))) below++;
    if (sum.fix.some((c) => !unknown.has(c))) falseS++;
  }
  for (let i = 0; i < Math.ceil(N / 2); i++) { const { sum, dayMax: dm } = run(u.id, null); cRuns++; cItems += sum.n; dayMax = Math.max(dayMax, dm); if (sum.fix.length) cFalse++; }
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
// 약한 아이 — 준비 칸 아래에 빈 차시가 셋(서로 다른 갈래일 수 있음) · 한 판에서 일찍 '선생님과 같이'로 가거나 고칠 판자를 찾는지 · 한 판 문항
let wRuns = 0, wTeach = 0, wFound = 0, wItems = 0, wMax = 0;
for (const u of UNITS) {
  const P = prepPlan(u.id); if (!P.fringe.length) continue;
  const all = [...new Set([...P.pre, ...P.below])].filter((c) => !c.startsWith('est:'));
  if (all.length < 4) continue;
  for (let i = 0; i < Math.ceil(N / 2); i++) {
    const gaps = []; while (gaps.length < 3) { const g = all[Math.floor(r.next() * all.length)]; if (!gaps.includes(g)) gaps.push(g); }
    const { S, sum, dayMax: dm } = run(u.id, null, null, 1, gaps); wRuns++; wItems += sum.n; wMax = Math.max(wMax, dm);
    if (S.why === 'teacher') wTeach++; else if (sum.fix.length) wFound++;
  }
}
const pct = (a, b) => `${((a / Math.max(b, 1)) * 100).toFixed(1)}%`;
if (process.env.UNITS) console.log(perUnit.join('\n'));
console.log(`준비 다리(${DAYS}일${process.env.NEAR ? ' · 가까운 학기 빈 곳' : ''}) · 빈 아이 ${gRuns}명(실수 ${SLIP * 100}%): 고칠 판자가 바로 그 칸 ${pct(hit, gRuns)} · 이웃 칸 ${pct(near, gRuns)} · 아직 아래 확인 ${pct(below, gRuns)} · 엉뚱한 칸 ${pct(falseS, gRuns)} · 평균 ${(items / gRuns).toFixed(1)}문항(최대 ${maxItems}) · 예산에서 멈춤 ${pct(budget, gRuns)}`);
console.log(`  한 판(하루) 가장 많이 ${dayMax}문항 · 첫날 '선생님과 같이'로 멈춤 ${pct(teach1, gRuns)} · 평균 ${(days / gRuns).toFixed(2)}일`);
console.log(`빈 곳 없는 아이 ${cRuns}명: 헛짚음 ${pct(cFalse, cRuns)} · 평균 ${(cItems / cRuns).toFixed(1)}문항`);
console.log(`약한 아이(빈 차시 셋) ${wRuns}명 · 하루: '선생님과 같이' ${pct(wTeach, wRuns)} · 고칠 판자 찾음 ${pct(wFound, wRuns)} · 평균 ${(wItems / wRuns).toFixed(1)}문항(최대 ${wMax})`);
console.log(`절차 버그 아이 ${bRuns}명: 그 칸을 보여 줌 ${pct(bShown, bRuns)}`);
//  한 판 길이는 선생님이 고름(18 · 24 · 36 — 10-31 혹평 '준비 다리가 수업을 먹음') · 기본 보통 24 · 18이면 하루에 칸 여섯만 물을 수 있다 — 바깥 칸 넷(12문항)을 묻고 나면 아래로는 두 칸만 내려감
//  그래서 하루에 바로 그 칸을 찾는 비율은 낮고(빈 곳 고르게 37% · 가까운 학기 48%) 다음 시간에 이어서 찾는다(이틀 80% · 사흘 95% · 10-31 예산 36에선 하루 86% · 이틀 98%)
//  기준은 그 값 바로 아래 — 예산 · 묶음 · 일찍 멈춤을 바꾸다 떨어지면 FAIL
const HIT = DAYS >= 3 ? 0.92 : DAYS >= 2 ? 0.8 : 0.45;   /* 보통 길이(24문제) 기준 — 빈 곳을 고르게 놓으면 하루 51 · 이틀 85% · 가까운 학기면 63 · 92.5% · 선생님이 짧게(18)를 고르면 더 낮음(10-31 모의) */
const pass = hit / gRuns >= HIT && falseS / gRuns <= 0.05 && cFalse / cRuns <= 0.06 && (!bRuns || bShown / bRuns >= 0.9) && dayMax <= PREP.budget && wMax <= PREP.budget;
console.log(pass ? '준비 다리 시험 PASS' : '준비 다리 시험 FAIL', `(기준 바로 그 칸 ≥${HIT * 100}% · 엉뚱 ≤5% · 헛짚음 ≤6% · 버그 ≥90% · 한 판 ${PREP.budget}문항 안 — 가장 많이 ${Math.max(dayMax, wMax)})`);
if (!pass) process.exitCode = 1;
