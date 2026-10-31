// 차시 문제를 선생님이 그대로 쳐 넣으면 같은 차시로 알아보는가: node tests/parse.lessons.mjs (V=1 자세히)
import { NODES, makeItem } from '../engine/lessons/index.js';
import { readProblem } from '../engine/lessons/read.js';
import { toText } from '../engine/tokens.js';
import { rng } from '../engine/math.js';
const N = Number(process.env.N || 30);
const rows = [];
let typed = 0, ok = 0, near = 0;
for (const c of NODES) {
  const r = rng(77 + c.n);
  let tries = 0, hit = 0, same = 0, sameU = 0; const fails = [];
  for (let i = 0; i < N; i++) {
    const p = c.gen(r), it = makeItem(c.id, p);
    if (it.choices) continue;
    const text = toText(it.prompt).replace(/\s+/g, ' ').trim();
    if (!/[=＝]\s*□|□\s*[=＝]|=\s*$/.test(text) && !/[0-9]\s*[+\-−×÷:]\s*[0-9]/.test(text)) continue;
    if (/[가-힣]{3,}/.test(text.replace(/[을를은는이가의과와로으]/g, '').replace(/통분|약분|최대공약수|최소공배수|비례배분|백분율|반올림|올림|버림|배예요/g, ''))) continue; // 말로 된 문제는 빼고 식만
    tries++;
    const t = readProblem(text);
    if (t.error) { fails.push(`${text}  ⇒ ${t.error}`); continue; }
    hit++;
    if (t.c === c.id) same++; else { if (t.c && t.c.split(':')[0] === c.u) sameU++; fails.push(`${text}  ⇒ ${t.c || '(없음)'}`); }
  }
  if (!tries) continue;
  typed++; if (same === tries) ok++; else if (same + sameU === tries) near++;
  rows.push({ id: c.id, name: c.name, tries, hit, same, fails: fails.slice(0, 2) });
}
const bad = rows.filter((x) => x.same < x.tries);
console.log(`식으로 쓸 수 있는 차시 ${typed}개 · 모두 같은 차시로 알아봄 ${ok} · 같은 단원 다른 차시 섞임 ${near} · 못 알아보는 것 있음 ${bad.length - near}`);
if (process.env.V) bad.forEach((x) => console.log(`✗ ${x.id} ${x.name} ${x.same}/${x.tries} (읽음 ${x.hit})\n     ${x.fails.join('\n     ')}`));
else bad.slice(0, 40).forEach((x) => console.log(`✗ ${x.id.padEnd(8)} ${x.same}/${x.tries}  ${x.fails[0] || ''}`));
