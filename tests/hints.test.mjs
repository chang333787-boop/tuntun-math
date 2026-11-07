// 틀렸을 때 도움(engine/hints) 검사 — 차시마다 떠올리기 말(cue)이 있나 · 답을 말하지 않나 · 단계가 있나(차시 정의 또는 hints)
//  node tests/hints.test.mjs        덮은 정도만 알림(통과)
//  STRICT=1 node tests/hints.test.mjs  모든 차시에 cue가 있어야 · 단계 없는 차시는 까닭(HINTS[c].noSteps)이 있어야
import { NODES, byId, makeItem, stepsOf } from '../engine/lessons/index.js';
import { HINTS, cueOf } from '../engine/hints/index.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';

const STRICT = !!process.env.STRICT;
let fail = 0, noCue = [], noStep = [], leak = [], bad = [];
const nums = (t) => (String(t).match(/\d+(?:\.\d+)?/g) || []).map(Number);
for (const n of NODES) {
  const r = rng(11);
  let cueN = 0, stepN = 0;
  for (let k = 0; k < 30; k++) {
    let p, it; try { p = n.gen(r); it = makeItem(n.id, p); } catch (e) { continue; }
    const cue = cueOf(n.id, p);
    if (cue) {
      cueN++;
      if (cue.length > 90) bad.push(`${n.id} 떠올리기 말이 길어요(${cue.length}자): ${cue}`);
      if (!it.choices) {   /* 답이 문제에 없던 수인데 떠올리기 말에 나오면 = 답을 말한 것 */
        const own = new Set(nums(toText(it.prompt))), cn = new Set(nums(cue));
        const ans = (it.sol || []).map(Number).filter((v) => Number.isFinite(v) && !own.has(v));
        if (ans.some((v) => cn.has(v))) leak.push(`${n.id} ${toText(it.prompt)} → 답 ${it.sol} · 말: ${cue}`);
      }
    }
    let st = []; try { st = stepsOf(n.id, p); } catch (e) { st = []; }
    if (st.length) stepN++;
    for (const s of st) { try { const x = makeItem(s.c, s.p); if (!x.sol || !x.sol.length) bad.push(`${n.id} 단계 문항에 답이 없어요(${s.c})`); } catch (e) { bad.push(`${n.id} 단계 문항을 못 만들어요(${s.c}): ${e.message}`); break; } }
  }
  if (!cueN) noCue.push(n.id);
  if (!stepN && !(HINTS[n.id] && HINTS[n.id].noSteps)) noStep.push(n.id);
}
const T = NODES.length;
console.log(`떠올리기 말: ${T - noCue.length}/${T} 차시 · 단계: ${T - noStep.length}/${T} 차시(까닭 있는 '단계 없음' 포함)`);
if (leak.length) { console.log(`✗ 답을 말한 떠올리기 말 ${leak.length}개`); leak.slice(0, 12).forEach((x) => console.log('  ', x)); fail++; }
if (bad.length) { console.log(`✗ 모양이 이상한 것 ${bad.length}개`); [...new Set(bad)].slice(0, 12).forEach((x) => console.log('  ', x)); fail++; }
if (STRICT && noCue.length) { console.log(`✗ 떠올리기 말 없는 차시 ${noCue.length}개: ${noCue.join(' ')}`); fail++; }
if (STRICT && noStep.length) { console.log(`✗ 단계도 까닭도 없는 차시 ${noStep.length}개: ${noStep.join(' ')}`); fail++; }
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
