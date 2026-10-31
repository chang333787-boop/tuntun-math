// 가상 학생 시뮬레이션 (못 푼 문제로 진단): node tests/sim.test.mjs
// 학생마다 '진짜 빈칸 차시'를 정해 두고, 엔진이 그 빈칸(뿌리)을 찾아내는지 잰다. (단원 점검은 tests/lsim.mjs)
import { NODES as CONCEPTS, byId, allPre, corePre, preOf, makeItem, stepsOf } from '../engine/lessons/index.js';
import { newSession, currentItem, answer } from '../engine/engine.js';
import { rng } from '../engine/math.js';

const R = rng(Number(process.env.SEED || 2026));
const TRIALS = Number(process.env.T || 1500);
const SLIP = Number(process.env.SLIP ?? 0.04), IDK = 0.4;

function ancestors(cid) {
  const seen = new Set(), st = [cid];
  while (st.length) { const x = st.pop(); for (const y of allPre(x)) if (!seen.has(y)) { seen.add(y); st.push(y); } }
  return seen;
}

function student(gaps) {
  const memo = {};
  const canDoG = (c) => (c in memo ? memo[c] : (memo[c] = !gaps.has(c) && corePre(c).every(canDoG)));
  const can = (c, p) => !gaps.has(c) && preOf(c, p).every(canDoG);
  return {
    can, canDoG,
    respond(q) {
      const it = q.item;
      const able = can(q.c, q.p);
      const ms = 1500 + Math.floor(R.next() * 4000);
      if (able && !R.chance(SLIP)) return { vals: it.sol.map(Number), raws: it.sol.map(String), ms };
      if (!able && R.chance(IDK)) return { idk: true, ms };
      if (it.choices) { const k = R.int(0, it.choices.length - 1); return { vals: [k], ms }; }
      const wrong = it.sol.map((x, i) => Number(x) + (i === 0 ? R.pick([1, 2, 3, 7, 10]) : 0));
      return { vals: wrong, raws: wrong.map(String), ms };
    },
  };
}

const tops = CONCEPTS.filter((c) => ['3-2', '4-1', '4-2', '5-1', '5-2', '6-1', '6-2'].includes(c.g)).map((c) => c.id);
let n = 0, exact = 0, clean = 0, cover = 0, precS = 0, recS = 0, items = 0, maxItems = 0, budgetHit = 0, skipped = 0, bridgeOk = 0, bridgeN = 0;
const misses = {}, cause = {}, falsePos = {}; let shown = 0;
for (let t = 0; t < TRIALS; t++) {
  const C0 = R.pick(tops);
  const anc = [...ancestors(C0)];
  const gaps = new Set();
  const mode = R.next();
  if (mode < 0.15) gaps.add(C0);                     // 다리 / 이 개념만 모름
  else { const k = R.chance(0.6) ? 1 : 2; for (let i = 0; i < k; i++) gaps.add(R.pick(anc)); }
  const S0 = student(gaps);
  const p0 = byId[C0].gen(R);
  if (S0.can(C0, p0)) { skipped++; continue; }       // 이 문제로는 드러나지 않는 빈칸
  // 진짜 뿌리 = 이 문제에 실제로 쓰이는 개념 중, 모르는데 앞 개념은 다 아는 것
  const needed = new Set([C0]); const st = [...preOf(C0, p0)];
  stepsOf(C0, p0).forEach((s) => st.push(s.c));
  while (st.length) { const x = st.pop(); if (needed.has(x)) continue; needed.add(x); corePre(x).forEach((y) => st.push(y)); }
  const truth = new Set([...gaps].filter((g) => needed.has(g) && corePre(g).every(S0.canDoG)));
  if (!truth.size) { skipped++; continue; }

  const S = newSession({ id: 'sim' + t, sid: 'x', problem: { c: C0, p: p0 }, now: 0 });
  let guard = 0;
  while (!S.done && guard++ < 200) { const q = currentItem(S); answer(S, S0.respond(q)); }
  const res = S.result;
  const found = new Set([...res.roots, ...res.bridges, ...res.pending.filter((x) => res.states[x].note)]);
  const hit = [...truth].filter((g) => found.has(g)).length;
  const prec = found.size ? [...found].filter((g) => truth.has(g)).length / found.size : 0;
  n++; items += res.items; maxItems = Math.max(maxItems, res.items); if (res.budget) budgetHit++;
  precS += prec; recS += hit / truth.size;
  if (hit === truth.size && prec === 1) exact++;
  // 실제 빈칸 기준: 짚은 뿌리가 모두 진짜 빈칸인가 / 진짜 뿌리를 짚었거나, 그 아래 진짜 빈칸 때문에 흔들림으로 봤는가
  const allReal = [...found].every((g) => gaps.has(g));
  const covered = [...truth].every((g) => found.has(g) || (res.states[g] && res.states[g].s === 'shaky' && (res.states[g].because || []).some((b) => gaps.has(b) || found.has(b))));
  if (allReal) clean++;
  if (allReal && covered) cover++;
  else {
    [...truth].filter((g) => !found.has(g)).forEach((g) => {
      misses[g] = (misses[g] || 0) + 1;
      if (process.env.MISS === g && !shown++) { console.log('-- MISS', C0, JSON.stringify(p0), 'gaps', [...gaps], 'truth', [...truth], 'found', [...found], 'shaky', res.shaky.join(',')); S.log.forEach((l) => console.log('  ', l.role, l.c, l.ok ? 'O' : 'X', l.depth, JSON.stringify(l.p))); console.log('  steps', JSON.stringify(S.steps.map((s) => [s.c, s.ok]))); }
      const r = S.res[g], st = res.states[g];
      const why = !r ? '닿지 못함' : r.st === 'pending' ? '예산' : r.st === 'pass' ? (r.prior ? '기록' : r.viaStep ? '단계 통과' : (r.items.some((x) => x.p && makeItem(g, x.p).choices) ? '찍어서 통과' : '통과(?)')) : st ? '판정 ' + st.s : r.st;
      cause[why] = (cause[why] || 0) + 1;
    });
    const fp = [...found].filter((g) => !truth.has(g));
    fp.forEach((g) => { falsePos[g] = (falsePos[g] || 0) + 1; });
    if (process.env.DBG && fp.includes(process.env.DBG) && !shown++) { console.log('--', C0, 'gaps', [...gaps], 'truth', [...truth], 'found', [...found]); S.log.forEach((l) => console.log('  ', l.role, l.c, l.ok ? 'O' : 'X', l.depth, JSON.stringify(l.p))); }
  }
  if (gaps.size === 1 && gaps.has(C0)) { bridgeN++; if (found.has(C0)) bridgeOk++; }
}
const pct = (x) => (100 * x).toFixed(1) + '%';
console.log(`시행 ${n} (드러나지 않아 뺀 것 ${skipped}) · 실수율 ${SLIP}`);
console.log(`정확히 맞힘 ${pct(exact / n)} · 정밀도 ${pct(precS / n)} · 재현율 ${pct(recS / n)} · 다리/이 개념만 ${pct(bridgeOk / Math.max(1, bridgeN))}`);
console.log(`실제 빈칸 기준 — 짚은 뿌리가 모두 진짜 ${pct(clean / n)} · 진짜 뿌리까지 설명 ${pct(cover / n)}`);
console.log(`문항 평균 ${(items / n).toFixed(1)} · 최대 ${maxItems} · 예산(30) 닿음 ${pct(budgetHit / n)}`);
console.log('자주 놓친 뿌리', Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}×${v}`).join(' '));
console.log('놓친 까닭', JSON.stringify(cause));
console.log('잘못 짚은 것', Object.entries(falsePos).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}×${v}`).join(' '));
if (process.env.CHECK) { const pass = clean / n >= 0.95 && cover / n >= 0.9 && items / n <= 18; console.log(pass ? '기준 통과' : '기준 미달'); process.exit(pass ? 0 : 1); }
