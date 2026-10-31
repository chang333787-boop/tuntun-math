// 문항 생성기·채점 전수 시험: node tests/items.test.mjs
import { CONCEPTS, byId, makeItem, genItem, stepsOf, preOf, allPre } from '../engine/concepts/index.js';
import { rng } from '../engine/math.js';
import { toText, toHTML } from '../engine/tokens.js';

let fails = 0, items = 0, stepsChecked = 0;
const bad = (msg) => { fails++; if (fails < 60) console.log('✗', msg); };
const N = Number(process.env.N || 400);

function verify(it, where) {
  items++;
  const text = toText(it.prompt) + (it.choices ? ' | ' + it.choices.map((c) => toText(c)).join(' / ') : '');
  if (/undefined|NaN|null|Infinity|\[object/.test(text)) bad(`${where}: 글에 이상한 값 — ${text}`);
  if (/-\d/.test(text.replace(/− /g, ''))) bad(`${where}: 음수 — ${text}`);
  toHTML(it.prompt);
  if (!Array.isArray(it.sol)) { bad(`${where}: sol 없음`); return; }
  const raws = it.sol.map(String);
  const res = it.check(it.sol.map(Number), raws);
  if (!res.ok) bad(`${where}: 정답을 틀렸다고 함 — ${text} · sol=${it.sol} · ${JSON.stringify(res.bug)}`);
  if (it.choices) {
    if (it.choices.length < 2) bad(`${where}: 보기 부족`);
    const ts = it.choices.map((c) => toText(c));
    if (new Set(ts).size !== ts.length) bad(`${where}: 같은 보기 — ${ts}`);
    it.choices.forEach((_, k) => { if (k !== it.sol[0] && it.check([k]).ok) bad(`${where}: 오답 보기를 맞다고 함`); });
  } else {
    if (it.nBlanks < 1) bad(`${where}: 빈칸 없음 — ${text}`);
    const wrong = it.sol.map((x, i) => (i === 0 ? Number(x) + 1 : Number(x)));
    if (it.check(wrong, wrong.map(String)).ok) bad(`${where}: 오답(+1)을 맞다고 함 — ${text}`);
    const res2 = it.check(it.sol.map(() => NaN), []);
    if (res2.ok) bad(`${where}: 빈칸을 맞다고 함`);
  }
  if (res.bug) bad(`${where}: 정답에 오답 모양이 붙음`);
}

for (const c of CONCEPTS) {
  for (const k of ['id', 'name', 'kid', 'g', 's', 'gen', 'make', 'tip']) if (c[k] == null) bad(`${c.id}: ${k} 없음`);
  allPre(c.id).forEach((x) => { if (!byId[x]) bad(`${c.id}: 없는 앞 개념 ${x}`); });
  const r = rng(12345 + c.id.length);
  const seenText = new Set();
  for (let i = 0; i < N; i++) {
    const p = c.gen(r);
    let it;
    try { it = makeItem(c.id, p); } catch (e) { bad(`${c.id}: make 오류 ${e.message} ${JSON.stringify(p)}`); continue; }
    verify(it, `${c.id} ${JSON.stringify(p)}`);
    seenText.add(toHTML(it.prompt) + (it.choices ? it.choices.map((x) => toText(x)).join() : ''));
    preOf(c.id, p).forEach((x) => { if (!byId[x]) bad(`${c.id}: 문항 앞 개념 ${x} 없음`); });
    for (const s of stepsOf(c.id, p)) {
      let si;
      try { si = makeItem(s.c, s.p); } catch (e) { bad(`${c.id} 단계 ${s.c}: make 오류 ${e.message} ${JSON.stringify(s.p)}`); continue; }
      stepsChecked++;
      verify(si, `${c.id}→단계 ${s.c} ${JSON.stringify(s.p)}`);
      if (!s.why) bad(`${c.id}→${s.c}: why 없음`);
    }
  }
  if (seenText.size < Math.min(8, N / 4) && !['N1'].includes(c.id)) bad(`${c.id}: 문항이 너무 적게 다양함 (${seenText.size})`);
  // 같은 씨앗 = 같은 문항
  const a = genItem(c.id, 99), b = genItem(c.id, 99);
  if (toText(a.prompt) !== toText(b.prompt)) bad(`${c.id}: 씨앗 재현 안 됨`);
}
console.log(`개념 ${CONCEPTS.length} · 문항 ${items} · 단계 ${stepsChecked} · 실패 ${fails}`);
process.exit(fails ? 1 : 0);
