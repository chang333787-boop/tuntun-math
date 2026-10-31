// 차시 그물 시험: node tests/lessons.test.mjs   (ONLY=g3 → 3학년 파일만 · N=문항 수 · STRICT=1 → 빠진 차시도 실패)
import { NODES, byId, CATALOG, STRANDS, makeItem, genItem, stepsOf, preOf, toLesson, resolve } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
const CATIDS = new Set(CATALOG.map((l) => l.id));
import { toText, toHTML } from '../engine/tokens.js';

const ONLY = process.env.ONLY || '';
const N = Number(process.env.N || 200);
const gradeOf = (id) => `g${id[0]}`;
const mine = (id) => !ONLY || gradeOf(id) === ONLY;
let fails = 0, warns = 0, items = 0, stepsN = 0;
const bad = (msg) => { fails++; if (fails <= 80) console.log('✗', msg); };
const WSEEN = new Set();
const warn = (msg) => { if (WSEEN.has(msg)) return; WSEEN.add(msg); warns++; if (process.env.WARN) console.log('△', msg); };
const uOrder = (u) => { const [a, b, c] = u.split('-'); return (Number(a) * 10 + Number(b)) * 10 + Number(c); };
const before = (x, y) => uOrder(x.u) < uOrder(y.u) || (x.u === y.u && x.n < y.n);

function verify(it, where) {
  items++;
  const text = toText(it.prompt) + (it.choices ? ' | ' + it.choices.map((c) => toText(c)).join(' / ') : '');
  if (/undefined|NaN|null|Infinity|\[object/.test(text)) bad(`${where}: 글에 이상한 값 — ${text}`);
  if (/(^|[^0-9])-\d/.test(text.replace(/− /g, ''))) bad(`${where}: 음수 — ${text}`);
  if (/\d\.\d{7,}/.test(text)) bad(`${where}: 소수 끝자리 오류 — ${text}`);
  toHTML(it.prompt);
  if (!Array.isArray(it.sol)) { bad(`${where}: sol 없음`); return; }
  const res = it.check(it.sol.map(Number), it.sol.map(String));
  if (!res.ok) bad(`${where}: 정답을 틀렸다고 함 — ${text} · sol=${JSON.stringify(it.sol)} · ${JSON.stringify(res.bug)}`);
  if (res.bug) bad(`${where}: 정답에 오답 모양이 붙음`);
  if (it.choices) {
    if (it.choices.length < 2) bad(`${where}: 보기 부족`);
    const ts = it.choices.map((c) => toText(c));
    if (new Set(ts).size !== ts.length) bad(`${where}: 같은 보기 — ${ts}`);
    it.choices.forEach((_, k) => { if (k !== it.sol[0] && it.check([k]).ok) bad(`${where}: 오답 보기를 맞다고 함 — ${text}`); });
  } else {
    if (it.nBlanks < 1) bad(`${where}: 빈칸 없음 — ${text}`);
    const first = it.sol.findIndex((x) => x != null);
    const wrong = it.sol.map((x, i) => (i === first ? Number(x) + 1 : Number(x)));
    if (it.check(wrong, wrong.map(String)).ok) bad(`${where}: 오답(+1)을 맞다고 함 — ${text}`);
    if (it.check(it.sol.map(() => NaN), []).ok) bad(`${where}: 빈칸을 맞다고 함`);
  }
}

// 1. 빠진 차시
const missing = CATALOG.filter((l) => l.test && mine(l.id) && !byId[l.id]);
if (missing.length) { (process.env.STRICT ? bad : warn)(`정의 안 된 차시 ${missing.length}개: ${missing.map((l) => l.id).join(' ')}`); if (!process.env.STRICT) console.log(`△ 아직 정의 안 된 차시 ${missing.length}개`); }

const strandKeys = new Set(STRANDS.map(([k]) => k));
for (const c of NODES.filter((x) => mine(x.id))) {
  // 2. 필드
  for (const k of ['name', 'kid', 'gen', 'makeRaw', 'hint']) if (!c[k]) bad(`${c.id}: ${k} 없음`);
  if (c.name && c.name.length > 26) bad(`${c.id}: name이 너무 김 (${c.name.length}자) — ${c.name}`);
  if (!strandKeys.has(c.s)) bad(`${c.id}: 영역 s=${c.s}`);
  if (c.prev) { const p = byId[c.prev]; if (!p) bad(`${c.id}: 없는 prev ${c.prev}`); else if (p.u !== c.u || p.n >= c.n) bad(`${c.id}: prev ${c.prev}는 같은 단원 앞 차시여야 함`); }
  // 3. 문항
  const r = rng(4242 + c.id.length * 31 + c.n);
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    let p, it;
    try { p = c.gen(r); } catch (e) { bad(`${c.id}: gen 오류 ${e.message}`); break; }
    try { it = makeItem(c.id, p); } catch (e) { bad(`${c.id}: make 오류 ${e.message} ${JSON.stringify(p)}`); continue; }
    verify(it, `${c.id} ${JSON.stringify(p)}`);
    seen.add(toText(it.prompt) + (it.choices ? it.choices.map((x) => toText(x)).join() : ''));
    if (c.is) { let ok = false; try { ok = c.is(p); } catch (e) { /* */ } if (!ok) bad(`${c.id}: 자기 gen이 is에 안 맞음 ${JSON.stringify(p)}`); }
    if (c.fam && c.is) {
      const hits = NODES.filter((o) => o.fam === c.fam && o.is && (() => { try { return o.is(p); } catch (e) { return false; } })()).map((o) => o.id);
      if (hits.length !== 1) bad(`${c.id}: 같은 가족 ${c.fam}에서 is가 ${hits.length}개 맞음 [${hits}] ${JSON.stringify(p)}`);
    }
    const pre = typeof c.preRaw === 'function' ? c.preRaw(p) : c.preRaw;
    for (const x of pre || []) {
      const t = byId[toLesson(x, null)];
      if (!t) { if (CATIDS.has(x)) { const cx = CATALOG.find((l) => l.id === x); if (!before(cx, c)) bad(`${c.id}: 앞 차시 ${x}가 뒤에 있음`); else warn(`${c.id}: 앞 차시 ${x} 아직 정의 안 됨`); } else bad(`${c.id}: 없는 앞 차시 ${x}`); }
      else if (!before(t, c)) bad(`${c.id}: 앞 차시 ${x}가 뒤에 있음`);
    }
    // 4. 단계
    if (i < 60 && c.stepsRaw) {
      for (const s of c.stepsRaw(p).filter(Boolean)) {
        const rs = resolve(s.c, s.p), to = rs.c;
        if (!to) { if (rs.want && CATIDS.has(rs.want)) warn(`${c.id}: 단계 차시 ${rs.want} 아직 정의 안 됨`); else if (process.env.STRICT) bad(`${c.id}: 단계 ${s.c}의 차시를 못 찾음 ${JSON.stringify(s.p)}`); else warn(`${c.id}: 단계 ${s.c}를 쓰는 차시가 아직 없음`); continue; }
        s.p = rs.p;
        if (!s.why) bad(`${c.id}→${to}: why 없음`);
        let si; try { si = makeItem(to, s.p); } catch (e) { bad(`${c.id}→${to}: make 오류 ${e.message} ${JSON.stringify(s.p)}`); continue; }
        stepsN++;
        verify(si, `${c.id}→단계 ${to} ${JSON.stringify(s.p)}`);
        const T = byId[to];
        if (T.is) { let ok = false; try { ok = T.is(s.p); } catch (e) { /* */ } if (!ok) warn(`${c.id}→${to}: 단계 params가 그 차시 유형이 아님 ${JSON.stringify(s.p)}`); }
        if (to === c.id) bad(`${c.id}: 단계가 자기 자신`);
      }
    }
  }
  if (seen.size < Math.min(6, N / 4) && !c.lowVariety) bad(`${c.id}: 문항이 너무 적게 다양함 (${seen.size})`);
  const a = genItem(c.id, 99), b = genItem(c.id, 99);
  if (toText(a.prompt) !== toText(b.prompt)) bad(`${c.id}: 씨앗 재현 안 됨`);
}
// 5. 줄이 돌지 않는지
const state = {};
const dfs = (id, path) => { if (state[id] === 2) return; if (state[id] === 1) { bad(`앞 차시 고리: ${[...path, id].join(' → ')}`); return; } state[id] = 1; preOf(id, null).forEach((x) => dfs(x, [...path, id])); state[id] = 2; };
NODES.forEach((c) => dfs(c.id, []));

const def = NODES.filter((x) => mine(x.id)).length, tot = CATALOG.filter((l) => l.test && mine(l.id)).length;
console.log(`차시 ${def}/${tot}${ONLY ? ` (${ONLY})` : ''} · 문항 ${items} · 단계 ${stepsN} · 실패 ${fails}${warns ? ` · 주의 ${warns} (WARN=1로 보기)` : ''}`);
process.exit(fails ? 1 : 0);
