// 차시 단위 가상 학생 시뮬레이션: node tests/lsim.mjs   (T=판 수 · SLIP=실수율 · UNITS=3-1-4,4-2-1 처럼 단원 고르기)
//   학생마다 '진짜 막힌 차시'를 정해 두고, 단원 점검이 ① 단원 안 경계 차시 ② 그 아래 뿌리 차시를 정확히 찾는지 잰다
import { NODES, byId, corePre, preOf, UNITS, lessonsOfUnit } from '../engine/lessons/index.js';
import { newUnitScan, chainsOf, currentItem, answer, continueSession } from '../engine/engine.js';
import { rng } from '../engine/math.js';

const R = rng(Number(process.env.SEED || 7));
const T = Number(process.env.T || 1500), SLIP = Number(process.env.SLIP ?? 0.04), IDK = 0.4;
const pickUnits = process.env.UNITS ? process.env.UNITS.split(',') : UNITS.map((u) => u.id).filter((u) => lessonsOfUnit(u).length >= 3 && Number(u[0]) >= 3);
if (!pickUnits.length) { console.log('차시가 정의된 단원이 없어요'); process.exit(0); }

const anc = (id) => { const seen = new Set(), st = [id]; while (st.length) { const x = st.pop(); for (const y of corePre(x)) if (!seen.has(y)) { seen.add(y); st.push(y); } } return seen; };

function student(gaps) {
  const memo = {};
  const ok = (c) => (c in memo ? memo[c] : (memo[c] = !gaps.has(c) && corePre(c).every(ok)));
  const can = (c, p) => !gaps.has(c) && preOf(c, p).every(ok);
  return {
    ok, can,
    respond(q) {
      const it = q.item, ms = 2000 + Math.floor(R.next() * 4000);
      if (can(q.c, q.p) && !R.chance(SLIP)) return { vals: it.sol.map(Number), raws: it.sol.map(String), ms };
      if (!can(q.c, q.p) && R.chance(IDK)) return { idk: true, ms };
      if (it.choices) { const k = R.int(0, it.choices.length - 1); return { vals: [k], ms }; }
      const w = it.sol.map((x, i) => (x == null ? x : Number(x) + (i === 0 ? R.pick([1, 2, 3, 10]) : 0)));
      return { vals: w, raws: w.map(String), ms };
    },
  };
}

let rootHit2 = 0, items2 = 0, contN = 0;
let n = 0, bExact = 0, bN = 0, rootHit = 0, rootN = 0, cleanN = 0, cleanOk = 0, items = 0, maxI = 0, falseRoot = 0, budget = 0;
const missU = {}, missWhy = {}; let dbgShown = 0, bShown = 0;
for (let t = 0; t < T; t++) {
  const unit = R.pick(pickUnits), ids = lessonsOfUnit(unit), chains = chainsOf(unit);
  // 진짜 빈칸: 0개(단원을 앎) 20% · 단원 안 한 차시 40% · 옛 단원 차시 40%
  const gaps = new Set(), mode = R.next();
  if (mode < 0.2) { /* 다 앎 */ }
  else if (mode < 0.6) gaps.add(R.pick(ids));
  else { const old = [...new Set(ids.flatMap((x) => [...anc(x)]))].filter((x) => byId[x].u !== unit); if (old.length) gaps.add(R.pick(old)); else gaps.add(R.pick(ids)); }
  const kid = student(gaps);
  // 진짜 경계: 갈래마다 처음으로 '문제의 10% 넘게 못 푸는' 차시 (숫자에 따라 필요한 줄이 다르므로 문제를 뽑아 본다)
  //   그 차시부터 '절반 넘게 못 푸는' 차시 사이를 찾으면 맞힌 것으로 센다 (그 사이는 실제로도 흔들리는 칸)
  const frac = (c) => { const r = rng(91 + c.length); let k = 0; for (let i = 0; i < 40; i++) if (kid.can(c, byId[c].gen(r))) k++; return k / 40; };
  const okFrac = {}; ids.forEach((x) => { okFrac[x] = frac(x); });
  const trueB = chains.map((ch) => ch.find((x) => okFrac[x] < 0.9) || null);
  const trueB2 = chains.map((ch) => ch.find((x) => okFrac[x] < 0.5) || null);
  // 진짜 뿌리: 빈칸 중 앞이 다 되는 것 (= gaps 자체, 앞이 다 되면)
  const truth = [...gaps].filter((g) => corePre(g).every(kid.ok));
  const S = newUnitScan({ id: 's' + t, sid: 'x', unit, opts: { maxItems: 30 } });
  let g = 0;
  while (!S.done && g++ < 200) { const q = currentItem(S); answer(S, kid.respond(q)); }
  n++; items += S.log.length; maxI = Math.max(maxI, S.log.length); if (S.stoppedByBudget) budget++;
  const R0 = S.result;
  chains.forEach((ch, k) => {
    const tb = trueB[k], tb2 = trueB2[k], fb = R0.boundaries.find((x) => ch.includes(x)) || null;
    const okRange = tb === fb || (tb && fb && ch.indexOf(fb) >= ch.indexOf(tb) && (tb2 ? ch.indexOf(fb) <= ch.indexOf(tb2) : true));
    bN++; if (okRange) bExact++; else { missU[unit] = (missU[unit] || 0) + 1; if (process.env.BDBG && bShown++ < 6) { console.log('-- 경계 놓침', unit, '갈래', ch.join(' '), '진짜', tb, '찾음', fb, '빈칸', [...gaps]); S.log.filter((l) => l.role === 'scan').forEach((l) => console.log('   ', l.c, l.ok ? 'O' : (l.idk ? '?' : 'X'), S.res[l.c] && S.res[l.c].st)); } }
  });
  if (!gaps.size || ids.every((x) => okFrac[x] >= 0.9) && [...gaps].every((g) => !ids.includes(g))) { if (!gaps.size) cleanN++; if (!gaps.size && !R0.roots.length && !R0.boundaries.length) cleanOk++; }
  else if (truth.length) {
    rootN++;
    const found = new Set([...R0.roots, ...R0.bridges, ...R0.unstable]);
    // 이어서 하기 한 번 (다음 날)
    let found2 = found;
    if (R0.pending.length) {
      const C = continueSession(S, { id: 'c' + t, prior: {} }); let g2 = 0;
      while (!C.done && g2++ < 200) { const q = currentItem(C); answer(C, kid.respond(q)); }
      found2 = new Set([...found, ...C.result.roots, ...C.result.bridges, ...C.result.unstable]); items2 += C.log.length; contN++;
    }
    if (truth.every((x) => found2.has(x))) rootHit2++;
    if (truth.every((x) => found.has(x))) rootHit++;
    else truth.filter((x) => !found.has(x)).forEach((x) => { const r = S.res[x], st = R0.states[x]; const why = !r ? (S.stoppedByBudget ? '예산 — 닿지 못함' : '닿지 못함') : st ? (st.s === 'pending' ? (S.stoppedByBudget ? '예산 — 더 봐야 함' : '더 봐야 함') : st.s) : r.st; missWhy[why] = (missWhy[why] || 0) + 1; });
    if (R0.roots.some((x) => !gaps.has(x))) { falseRoot++; if (process.env.DBG && dbgShown++ < 4) { console.log('-- 엉뚱한 뿌리', unit, '빈칸', [...gaps], '짚음', R0.roots, '예산', S.stoppedByBudget); S.log.forEach((l) => console.log('   ', l.role, l.c, l.ok ? 'O' : (l.idk ? '?' : 'X'), S.res[l.c] ? S.res[l.c].st : '')); } }
  }
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
console.log(`단원 ${pickUnits.length}개 · ${n}판 · 실수율 ${SLIP}`);
console.log(`단원 안 경계 차시를 정확히 찾음 ${pct(bExact, bN)} (갈래 ${bN})`);
console.log(`진짜 뿌리 차시를 찾음 ${pct(rootHit, rootN)} · 이어서 하기 한 번 뒤 ${pct(rootHit2, rootN)} (이어서 한 판 ${contN} · 평균 ${(items2 / Math.max(1, contN)).toFixed(1)}문항) · 엉뚱한 뿌리를 짚음 ${pct(falseRoot, rootN)}`);
console.log(`다 아는 아이를 빈칸 없음으로 봄 ${pct(cleanOk, cleanN)}`);
console.log(`문항 평균 ${(items / n).toFixed(1)} · 최대 ${maxI} · 예산 닿음 ${pct(budget, n)}`);
console.log('뿌리를 놓친 까닭', JSON.stringify(missWhy));
const worst = Object.entries(missU).sort((a, b) => b[1] - a[1]).slice(0, 8);
if (worst.length) console.log('경계를 자주 놓친 단원', worst.map(([u, k]) => `${u}×${k}`).join(' '));
if (process.env.CHECK) {
  const okB = bExact / bN >= 0.9, okR = rootHit / Math.max(1, rootN) >= 0.85;
  console.log(okB && okR ? '기준 통과' : '기준 미달 (경계 90% · 뿌리 85%)');
  process.exit(okB && okR ? 0 : 1);
}
