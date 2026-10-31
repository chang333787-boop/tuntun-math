// 옛 개념 다리 시험 — 다리가 있는 차시마다 문제를 만들어 다리(예전 문제 · 같은 것 · 바뀐 것)가 늘 생기는지,
//   예전 문제가 지금 차시보다 앞 차시인지, 예전 문제의 정답이 정답으로 채점되는지, 글에 이상한 값이 없는지 본다.
//   node tests/bridges.test.mjs
import { byId, makeItem } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
import { BRIDGE_LESSONS, bridgeOf } from '../engine/bridges.js';

const N = Number(process.env.N || 300), bad = [];
const ord = (id) => { const L = byId[id], [x, y, z] = L.u.split('-').map(Number); return ((x * 10 + y) * 10 + z) * 100 + L.n; };
for (const c of BRIDGE_LESSONS) {
  if (!byId[c]) { bad.push(`${c}: 차시 없음`); continue; }
  const r = rng(c.length * 977 + 5); let made = 0;
  for (let i = 0; i < N; i++) {
    const p = byId[c].gen(r), b = bridgeOf(c, p);
    if (!b) continue;
    made++;
    if (ord(b.old.c) >= ord(c)) bad.push(`${c}: 예전 문제 ${b.old.c} 가 앞 차시가 아님`);
    const it = b.old.item, ok = it.choices ? it.check([it.sol[0]]).ok : it.check(it.sol.map(Number), it.sol.map(String)).ok;
    if (!ok) bad.push(`${c}: 예전 문제 정답이 틀림 ${JSON.stringify(b.old.p)}`);
    const text = [b.idea, b.same, b.change, b.leap || ''].join(' ');
    if (/undefined|NaN|null|\[object/.test(text)) bad.push(`${c}: 글에 이상한 값 — ${text}`);
    if (!b.idea || !b.same || !b.change) bad.push(`${c}: 빈 글`);
    void makeItem;
  }
  if (made < N * 0.9) bad.push(`${c}: 다리가 생긴 문제 ${made}/${N}(90% 아래)`);
}
for (const m of bad.slice(0, 20)) console.log('FAIL', m);
console.log(`옛 개념 다리 시험 — 차시 ${BRIDGE_LESSONS.length}개 · ${bad.length ? 'FAIL ' + bad.length : 'PASS'}`);
process.exit(bad.length ? 1 : 0);
