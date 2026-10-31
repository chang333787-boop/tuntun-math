// 글 전체 검사(10-11 교사 '비문 · 맞춤법 · 어순까지') — 아이가 보는 모든 글을 만들어 tests/lint_ko.mjs 로 거른다
//   차시 문제(229개 × 여러 번) · 차시 힌트 · 같이 풀기 단계 글 · 도전 층(유형) · 옛 개념 다리 · 기본 문장제
//   하나라도 걸리면 FAIL — 걸린 글과 규칙을 보여 준다. 기계가 못 보는 어색함은 QUALITY.md의 사람 교정 읽기로 한 번 더.
//   node tests/text.test.mjs   (N=40 기본)
import { NODES, byId, makeItem } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';
import { lintKo } from './lint_ko.mjs';
import { makeType, typesOfUnit, UNIT_TYPES } from '../engine/types/index.js';
import { BRIDGE_LESSONS, bridgeOf } from '../engine/bridges.js';
import { hasWords, storyOf, VOCAB } from '../engine/words.js';

const N = Number(process.env.N || 40), bad = new Map(), seen = new Set();
let texts = 0;
const T = (x) => (x == null ? '' : typeof x === 'string' ? x : toText([].concat(x)));
function check(where, x) {
  const t = T(x);
  if (!t || seen.has(t)) return;
  seen.add(t); texts++;
  for (const m of lintKo(t, { nouns: VOCAB })) {
    const k = m.replace(/'[^']*'/, "'…'").split(':')[0] + ': ' + m.split(': ').slice(1).join(': ');
    if (!bad.has(m)) bad.set(m, `${where} — ${t.slice(0, 140)}`);
    void k;
  }
}
function item(where, it) {
  if (!it) return;
  check(where, it.prompt);
  (it.choices || []).forEach((c) => check(where + ' 보기', c));
  if (it.story) check(where + ' 이야기', it.story);
}
// ① 차시 문제 · 힌트 · 같이 풀기
for (const L of NODES) {
  const r = rng(L.id.length * 7 + 11);
  check(`${L.id} 힌트`, L.hint); check(`${L.id} 팁`, L.tip); check(`${L.id} 다리`, L.bridge);
  for (let i = 0; i < N; i++) {
    let p, it; try { p = L.gen(r); it = makeItem(L.id, p); } catch (e) { continue; }
    item(`${L.id}`, it);
    let steps = []; try { steps = (L.stepsRaw && L.stepsRaw(p)) || []; } catch (e) { steps = []; }
    for (const s of steps.filter(Boolean)) check(`${L.id} 단계`, s.why);
  }
}
// ② 도전 층(유형)
for (const u of Object.keys(UNIT_TYPES)) for (const t of typesOfUnit(u)) for (let i = 1; i <= Math.ceil(N / 2); i++) for (const easy of [false, true]) {
  let a; try { a = makeType(t, u, i * 7919, { easy }); } catch (e) { continue; }
  check(`${u} ${t} 이야기`, a.story);
  for (const s of a.steps) { check(`${u} ${t} 단계`, s.why); item(`${u} ${t} 단계`, s.item); }
}
// ③ 옛 개념 다리
for (const c of BRIDGE_LESSONS) {
  const r = rng(c.length * 31 + 7);
  for (let i = 0; i < N; i++) { const b = bridgeOf(c, byId[c].gen(r)); if (!b) continue; for (const k of ['idea', 'same', 'change', 'leap']) check(`${c} 다리 ${k}`, b[k]); item(`${c} 다리 예전 문제`, b.old.item); }
}
// ④ 기본 문장제
for (const L of NODES.filter((n) => hasWords(n.id))) {
  const r = rng(L.id.length * 131 + 17);
  for (let i = 0; i < N * 3; i++) { const s = storyOf(L.id, L.gen(r), i * 7919 + 3); if (!s) continue; check(`${L.id} 문장제`, s.story); for (const st of s.steps) { check(`${L.id} 문장제 단계`, st.why); item(`${L.id} 문장제 단계`, st.item); } }
}
const rows = [...bad.entries()];
const by = {};
for (const [m] of rows) { const k = m.split(':')[0]; by[k] = (by[k] || 0) + 1; }
for (const [m, w] of rows.slice(0, Number(process.env.SHOW || 60))) console.log('FAIL', m, '|', w);
console.log(`글 전체 검사 — 글 ${texts}개 · ${rows.length ? 'FAIL ' + rows.length + ' ' + JSON.stringify(by) : 'PASS'}`);
process.exit(rows.length ? 1 : 0);
