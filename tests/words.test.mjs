// 기본 문장제 시험 — 문장으로 바꾸는 차시마다 문제를 만들어
//   ① 대부분(90% 이상) 이야기로 바뀌고 ② 이야기의 답 = 그 차시 계산의 답(같은 숫자 · 같은 계산 → 차시 규칙을 그대로 지킴)
//   ③ 정답은 맞고 엉뚱한 답은 틀림 ④ 식 고르기는 맞는 보기 하나 · 맞는 식 = 차시의 식 ⑤ 이야기에 두 수가 그대로 나옴 ⑥ 글에 이상한 값 · 조사 겹침 없음
//   ⑦ 같은 seed = 같은 이야기 · 구조가 고루 나옴
//   ⑧~⑪ 글 기준(QUALITY.md): 맞춤법 · 조사 · 띄어쓰기 · 물음 꼴 · 길이 · 물음 단위 = 답 단위 · 안 배운 연산 없음 · 4학년 약분 없음 · 그럴듯한 수
//   node tests/words.test.mjs
import { NODES, byId, makeItem } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';
import { hasWords, storyOf, readItem, VOCAB } from '../engine/words.js';
import { lintKo } from './lint_ko.mjs';

// 글 기준(QUALITY.md) 중 그럴듯한 수 — [찾는 글, 통과 조건, 이름]
const fv = (t) => { const m = String(t).trim().match(/^(?:(\d+) )?(\d+)\/(\d+)$/); return m ? Number(m[1] || 0) + Number(m[2]) / Number(m[3]) : Number(t); };
const REAL = [
  [/한 줄에 (\d+)개씩 (\d+)줄/, (a, b) => +a <= 12 && +b <= 12, '의자는 한 줄에 12개 · 12줄까지'],
  [/(\d+)명이 똑같이/, (a) => +a >= 2 && +a <= 30, '나누는 사람은 2~30명'],
  [/한 컵에 ([\d./ ]+) L씩/, (a) => fv(a) <= 0.5, '컵 하나는 0.5 L까지'],
  [/한 병에 (?:물이 )?([\d./ ]+) L씩/, (a) => fv(a) <= 2, '병 하나는 2 L까지'],
  [/([\d./ ]+) L를 마셨/, (a) => fv(a) <= 1, '한 번에 마시는 물은 1 L까지'],
  [/하루에 동화책을 (\d+)쪽씩/, (a) => +a <= 50, '하루에 읽는 쪽수는 50쪽까지'],
  [/동화책 (\d+)쪽/, (a) => +a <= 300, '동화책 한 권은 300쪽까지'],
  [/한 묶음에 (\d+)자루씩/, (a) => +a <= 12, '연필 한 묶음은 12자루까지'],
  [/(\d+)배만큼/, (a) => +a >= 2 && +a <= 9, '몇 배는 2~9배'],
  [/에는 [가-힣]+[이가] 1(?:개|권|장|자루) 있어요\. [^.]*배만큼/, () => false, '하나의 몇 배는 쓰지 않음'],
  [/선물 한 개를 포장하는 데 리본이 ([\d./ ]+) m/, (a) => fv(a) <= 2, '선물 하나에 리본 2 m까지'],
  [/한 개에 (\d+)원/, (a) => +a >= 100, '물건값은 100원부터'],
  [/한 (?:봉지|상자|묶음)에 1(?:개|권|장|자루)씩/, () => false, '한 묶음에 하나씩은 쓰지 않음'],
  [/\d+\/\d+(?:개|권|장|자루|명|송이)/, () => false, '세는 것은 분수로 쓰지 않음'],
  [/(?:^|[^\d./])0(?:개|권|장|자루|명|원| m| L| kg)/, () => false, '0은 이야기에 쓰지 않음'],
];
const MAXOF = { 사탕: 50, 구슬: 100, 연필: 60 };   // 낱개로 세는 맥락의 가장 큰 수(묶음이 아닐 때)

const N = Number(process.env.N || 200), bad = [], kinds = {};
// 차시 문제의 정답 값 — 빈칸이 든 마지막 조각을 sol 로 채워 계산(1/□ · □/□ · □ □/□ · □)
function itemValue(it) {
  const p = it.prompt || [], sol = it.sol || [], part = (x) => (x && typeof x === 'object' && 'b' in x ? Number(sol[x.b]) : Number(x));
  for (let i = p.length - 1; i >= 0; i--) {
    const t = p[i];
    if (!t || typeof t !== 'object') continue;
    if ('b' in t) return part(t);
    if ('f' in t && t.f.some((x) => x && typeof x === 'object')) return part(t.f[0]) / part(t.f[1]);
    if ('m' in t && t.m.some((x) => x && typeof x === 'object')) return part(t.m[0]) + part(t.m[1]) / part(t.m[2]);
  }
  return NaN;
}
const note = (m) => { if (bad.length < 40) bad.push(m); };
const right = (it) => (it.choices ? it.check([it.sol[0]]) : it.check(it.sol.map(Number), it.sol.map(String))).ok;
let lessons = 0, made = 0;
for (const L of NODES.filter((n) => hasWords(n.id))) {
  lessons++;
  const r = rng(L.id.length * 131 + 17); let ok = 0, tried = 0;
  for (let i = 0; i < N; i++) {
    const p = L.gen(r), it = makeItem(L.id, p), e = readItem(it);
    if (!e) continue;
    if (!e.a.n || !e.b.n) continue;
    tried++;
    const s = storyOf(L.id, p, i * 7919 + 3);
    if (!s) continue;
    ok++; made++;
    kinds[s.kind] = (kinds[s.kind] || 0) + 1;
    const text = toText(s.story), where = `${L.id} ${toText(it.prompt)}`;
    if (/undefined|NaN|null|\[object/.test(text + s.ans)) note(`${where}: 이상한 값 — ${text}`);
    if (/[\d개장권루L마]\s?(을를|를을|이가|가이|은는|는은|과와|와과)/.test(text)) note(`${where}: 조사 겹침 — ${text}`);
    if (!right(s.item)) note(`${where}: 이야기 정답이 틀림 — ${s.ans}`);
    const wrong = s.item.sol.map((x) => Number(x) + 977);
    if (s.item.check(wrong, wrong.map(String)).ok) note(`${where}: 엉뚱한 답이 맞음`);
    // 이야기 답 = 차시 답
    if (s.rem) { if (Number(it.sol[0]) !== s.rem[0] || Number(it.sol[1]) !== s.rem[1]) note(`${where}: 몫 · 나머지가 다름 ${s.rem}`); }
    else {
      const v = s.x.n / s.x.d, iv = itemValue(it);
      if (!(Math.abs(iv - v) < 1e-9)) note(`${where}: 이야기 답 ${s.ans} ≠ 차시 답 ${it.ans}`);
    }
    // 식 고르기 — 맞는 보기 = 차시의 식
    const pk = s.steps[0].item, rt = toText(pk.choices[pk.sol[0]]);
    if (!toText(it.prompt).replace(/\s+/g, ' ').startsWith(rt.replace(/\s+/g, ' '))) note(`${where}: 맞는 식 '${rt}'이 차시 식과 다름`);
    if (!right(pk) || pk.choices.length < 2) note(`${where}: 식 고르기 보기 문제`);
    if (new Set(pk.choices.map((c) => toText(c))).size !== pk.choices.length) note(`${where}: 보기 겹침`);
    // 두 수가 이야기에 그대로
    for (const x of rt.split(/ [+−×÷] /)) if (!text.includes(x.trim())) note(`${where}: 이야기에 ${x}가 없음 — ${text}`);
    if (JSON.stringify(storyOf(L.id, p, i * 7919 + 3).story) !== JSON.stringify(s.story)) note(`${where}: 같은 seed 인데 다른 이야기`);
    // ⑧ 글 기준(QUALITY.md) — 맞춤법 · 조사 · 띄어쓰기 · 되풀이(lint_ko) · 물음 꼴 · 길이
    const g = Number(L.u[0]);
    for (const e of lintKo(text, { nouns: VOCAB })) note(`${where}: ${e} — ${text}`);
    if (!/까요\?$/.test(text) || (text.match(/\?/g) || []).length !== 1) note(`${where}: 물음이 '…까요?' 하나로 끝나지 않음 — ${text}`);
    const sents = text.split(/(?<=[.?])\s/);
    if (sents.length > 4 || sents.some((x) => x.length > 75)) note(`${where}: 문장이 길거나 많음 — ${text}`);
    if (text.length > (g <= 2 ? 100 : 130)) note(`${where}: 글이 김(${text.length}자) — ${text}`);
    // ⑨ 물음의 단위 = 답 칸의 단위 · '얼마'는 양(L · kg · m · 원)에만
    const unit = s.unit.trim(), ask = sents[sents.length - 1];
    if (/얼마/.test(text) && !/ (L|kg|m)\b|원/.test(text)) note(`${where}: 셀 수 있는 것에 '얼마' — ${text}`);
    if (!s.rem && unit && !/얼마/.test(ask) && !new RegExp(`몇 ?${unit}`).test(ask) && !(unit === '일' && /며칠/.test(ask)) && !(unit === '개' && /몇 개/.test(ask))) note(`${where}: 물음 단위와 답 단위(${unit})가 다름 — ${text}`);
    // ⑩ 교육과정 — 그 학년이 안 배운 연산은 식 고르기 보기에도 없음 · 4학년 분수는 약분하지 않음
    const ops = pk.choices.map((c) => toText(c)).join(' ');
    if ((g === 1 || L.u.startsWith('2-1')) && /[×÷]/.test(ops)) note(`${where}: 안 배운 연산(× ÷)이 보기에 — ${ops}`);
    if (L.u.startsWith('2-2') && /÷/.test(ops)) note(`${where}: 안 배운 연산(÷)이 보기에 — ${ops}`);
    if (g === 4 && /\//.test(s.ans)) { const dd = new Set([...text.matchAll(/\/(\d+)/g)].map((m) => m[1])); for (const m of String(s.ans).matchAll(/\/(\d+)/g)) if (!dd.has(m[1])) note(`${where}: 4학년 답을 약분함 ${s.ans} — ${text}`); }
    // ⑪ 그럴듯한 수
    for (const [re, ok, name] of REAL) { const m = text.match(re); if (m && !ok(...m.slice(1))) note(`${where}: ${name} — ${text}`); }
    for (const sen of sents) for (const [w, mx] of Object.entries(MAXOF)) if (new RegExp(`(^|[^가-힣])${w}`).test(sen) && !/한 (봉지|묶음|상자)에/.test(sen)) for (const m of sen.matchAll(/(\d+)(개|자루)/g)) if (+m[1] > mx) note(`${where}: ${w} ${m[1]}${m[2]}는 너무 많음 — ${text}`);
  }
  if (tried && ok < tried * 0.9) note(`${L.id} (${L.kid}): 이야기로 바뀐 비율 ${ok}/${tried}`);
}
for (const m of bad) console.log('FAIL', m);
console.log(`기본 문장제 시험 — 차시 ${lessons}개 · 이야기 ${made}개 · 구조 ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(' · ')} · ${bad.length ? 'FAIL ' + bad.length : 'PASS'}`);
process.exit(bad.length ? 1 : 0);
