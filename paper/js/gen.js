// 끊긴 곳 찾기 — 점검지 묶음 만들기(브라우저 · node 둘 다)
//  묶음(sheet) = 한 번 만든 뒤 바뀌지 않는 문제 모음 { v, id, kind, made, eng, seed, range, items:[…], chapters:[…] }
//  문항 = { k(번호), c(차시), p(그 차시 params), form, cls, ch(장 묶음), snap:{prompt, sol, choices}, word? }
//  같은 (c, p)면 엔진이 같은 문항을 다시 만듦 — 채점은 엔진의 check, 화면 · 종이는 snap(엔진이 바뀌어도 옛 종이를 그대로 보임)
import { NODES, byId, makeItem, allPre, gradeIdx, unitById } from '../../engine/lessons/index.js';
import { toText } from '../../engine/tokens.js';
import { rng } from '../../engine/math.js';
import { readExpr, __predict } from '../../engine/errors.js';
import { storyOf } from '../../engine/words.js';

export const ENG = 'eng-2026-10-31';
export const GRADES = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1'];
export const GL = (g) => g.replace(/^(\d)-(\d)$/, '$1학년 $2학기');
const sk = (s) => (s === 'DEC' ? 'F' : s);
export const STRAND = { N: '수', A: '덧셈 · 뺄셈', M: '곱셈', D: '나눗셈', F: '분수 · 소수', R: '규칙' };
export const STRANDS = ['N', 'A', 'M', 'D', 'F', 'R'];
export const strandOf = (c) => (LES(c) ? sk(LES(c).s) : 'N');
const hash = (s) => [...String(s)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newId = (r = Math.random) => Array.from({ length: 4 }, () => ALPHA[Math.floor(r() * ALPHA.length)]).join('');

// ── 어림셈(엔진 밖 두 차시) — 몇백 · 몇십으로 어림한 식과 값 · 반올림 경계(50 · 5)는 피함 ──
const B = (i) => ({ b: i });
export const EST = {
  'est:3-2': { id: 'est:3-2', g: '3-2', s: 'M', u: '3-2-1', kid: '어림셈 — 앞의 수를 몇백으로', sec: 30, tip: '298 × 3은 약 300 × 3 = 900처럼 앞의 수를 몇백으로 어림해요. 계산한 뒤 어림한 값과 견주어 자리를 잘못 쓴 큰 실수를 스스로 찾게 해요.',
    gen: (r) => ({ A: r.int(2, 8) * 100 + (r.next() < 0.5 ? -1 : 1) * r.int(1, 9), k: r.int(2, 9) }),
    make: (p) => { const A0 = Math.round(p.A / 100) * 100; return { prompt: [`${p.A} × ${p.k}`, { br: 1 }, '→ 약 ', B(0), ` × ${p.k} = `, B(1)], sol: [A0, A0 * p.k] }; } },
  'est:4-1': { id: 'est:4-1', g: '4-1', s: 'M', u: '4-1-3', kid: '어림셈 — 몇백 · 몇십으로', sec: 40, tip: '516 × 21 → 약 500 × 20 = 10000처럼 어림한 식과 값을 함께 써요. 나눗셈은 나누어떨어지는 수로 어림하면 몫을 가늠하기 쉬워요.',
    gen: (r) => {
      const sg = () => (r.next() < 0.5 ? -1 : 1);
      if (r.next() < 0.34) { const [A0, B0] = r.pick([[400, 20], [600, 20], [800, 40], [600, 30], [900, 30], [800, 20]]); return { div: true, A: A0 + sg() * r.int(1, 9), B: B0 + sg() * r.int(1, 2) }; }
      return { A: r.int(2, 8) * 100 + sg() * r.int(1, 9), B: r.int(2, 8) * 10 + sg() * r.int(1, 3) };
    },
    make: (p) => { const A0 = Math.round(p.A / 100) * 100, B0 = Math.round(p.B / 10) * 10; return { prompt: [`${p.A} ${p.div ? '÷' : '×'} ${p.B}`, { br: 1 }, '→ 약 ', B(0), p.div ? ' ÷ ' : ' × ', B(1), ' = ', B(2)], sol: [A0, B0, p.div ? A0 / B0 : A0 * B0] }; } },
};
export const LES = (c) => EST[c] || byId[c];
export function itemOf(c, p) {
  if (EST[c]) { const it = EST[c].make(p); it.c = c; it.p = p; it.check = (vals) => ({ ok: it.sol.every((s, i) => Number(vals[i]) === s) }); return it; }
  return makeItem(c, p);
}
export const lessonName = (c) => (LES(c) ? LES(c).kid : c);
export const unitName = (c) => { const L = LES(c); const u = L && unitById[L.u]; return u ? u.nm : ''; };

// ── 범위 안 차시 · 장 묶음(학기 × 영역) ──
export function lessonsIn(from, to) {
  const a = gradeIdx(from), b = gradeIdx(to);
  const ids = NODES.filter((n) => gradeIdx(n.g) >= a && gradeIdx(n.g) <= b).map((n) => n.id);
  for (const e of Object.values(EST)) if (gradeIdx(e.g) >= a && gradeIdx(e.g) <= b) ids.push(e.id);
  return ids;
}
export const groupKey = (c) => `${LES(c).g}|${strandOf(c)}`;
const order = (c) => gradeIdx(LES(c).g) * 1000 + STRANDS.indexOf(strandOf(c)) * 100 + (byId[c] ? NODES.indexOf(byId[c]) / 1000 : 99);

// 위 차시를 맞히면 그 아래(선수)도 된다고 보는 덮개 — 같은 장 묶음 안에서만
const closCache = {};
export function closure(c) {
  if (closCache[c]) return closCache[c];
  const s = new Set([c]);
  if (byId[c]) for (const p of allPre(c)) for (const q of closure(p)) s.add(q);
  return (closCache[c] = s);
}
// 선별 관문 — 학기 × 영역마다 덮개가 가장 넓은 차시를 차례로(남는 낱 차시가 셋 이상이면 '고루 한 문제씩' 묶음 관문)
export function gatesIn(from, to) {
  const ids = lessonsIn(from, to), groups = {};
  ids.forEach((c) => (groups[groupKey(c)] = groups[groupKey(c)] || []).push(c));
  const out = [];
  for (const [g, cs] of Object.entries(groups)) {
    const left = new Set(cs), gates = [];
    while (left.size) {
      let best = null, bc = 0;
      for (const c of cs) { const n = [...closure(c)].filter((x) => left.has(x)).length; if (n > bc) { bc = n; best = c; } }
      if (bc < 2 && gates.length) break;
      gates.push({ c: best, covers: [...closure(best)].filter((x) => left.has(x)) });
      closure(best).forEach((x) => left.delete(x));
    }
    if (left.size) gates.push({ mix: [...left].slice(0, 6), covers: [...left] });   // 덮이지 않는 낱 차시는 한 문제씩 고루
    out.push({ g, gates });
  }
  return out.sort((a, b) => order(a.gates[0].c || a.gates[0].mix[0]) - order(b.gates[0].c || b.gates[0].mix[0]));
}

// ── 문항 뽑기 ── 같은 묶음 안에서 같은 문제 두 번 없음(그림까지 견줌) · 곱셈구구는 1 · 0이 끼지 않게 · 두 단을 함께 보는 칸은 단마다 고루
const KUKU = new Set(['2-2-2:2', '2-2-2:3', '2-2-2:4', '2-2-2:5', '2-2-2:6', '2-2-2:7']);
const TWO = { '2-2-2:4': [3, 6], '2-2-2:5': [4, 8] };
const keyOf = (it) => JSON.stringify([it.prompt, it.choices || null]);
function okItem(c, it) {
  if (KUKU.has(c)) { const X = readExpr(it); return !!X && X.A.i >= 2 && X.B.i >= 2; }
  return true;
}
//  want(p) = 이 꼴만(오개념을 가려내는 함정 문항 — engine/mis.js want) · 모자라면 꼴 없이 채움
export function pickItems(c, n, r, used = new Set(), want = null) {
  const L = LES(c), out = [], dan = {};
  for (let k = 0; k < n * (want ? 200 : 60) && out.length < n; k++) {
    let it; try { it = itemOf(c, L.gen(r)); } catch (e) { continue; }
    const key = keyOf(it);
    if (used.has(key) || !okItem(c, it)) continue;
    if (want) { let w = false; try { w = !!want(it.p); } catch (e) { w = false; } if (!w) continue; it.trap = true; }
    if (TWO[c]) { const X = readExpr(it), d = TWO[c].includes(X.A.i) ? X.A.i : X.B.i; if (!TWO[c].includes(d) || (dan[d] || 0) >= Math.ceil(n / 2)) continue; dan[d] = (dan[d] || 0) + 1; }
    used.add(key); out.push(it);
  }
  if (want && out.length < n) out.push(...pickItems(c, n - out.length, r, used));
  return out;
}

// 두 원인이 같은 답을 내던 차시는 두 원인의 예측이 서로 다르고 정답과도 다른 수로(가르는 문항)
export function pickDiscriminating(c, n, r, used, hypIds) {
  if (!hypIds || hypIds.filter((h) => !String(h).startsWith('lesson:')).length < 2) return pickItems(c, n, r, used);
  const ids = hypIds.filter((h) => !String(h).startsWith('lesson:'));
  const cand = pickItems(c, n * 8, r, new Set(used));
  const score = (it) => { const ps = ids.map((id) => { try { const v = __predict(it, id); return v && JSON.stringify(v) !== JSON.stringify(it.sol) ? JSON.stringify(v) : null; } catch (e) { return null; } }).filter(Boolean); return new Set(ps).size * 2 + (ps.length === ids.length ? 1 : 0); };
  const ranked = cand.map((it) => ({ it, s: score(it) })).sort((a, b) => b.s - a.s);
  const split = ranked.filter((x) => x.s >= 4);   // 예측이 둘 이상으로 갈림(서로 다르고 정답과도 다름)
  const best = [...split, ...ranked.filter((x) => x.s < 4)].slice(0, n).map((x) => x.it);
  best.forEach((it) => used.add(keyOf(it)));
  best.splitCount = Math.min(split.length, n);
  return best;
}

// ── 문장제 — 학년마다 구조를 고루(같은 차시 식 그대로) ──
//  kind: join 더 생김 · combine 합치기 · take 덜어 내기 · part 부분 · diff 차이 · more/less 더 많은/적은 수 · start 처음 수 · change 바뀐 수 · add3 · groups 묶음 · rows 배열 · times 몇 배 · share 똑같이 나누기 · pack 몇씩 덜어 내기
export const KIND = { join: '더 생김', combine: '모두 합치기', take: '덜어 내기', part: '전체 중 나머지', diff: '두 수의 차이', more: '~보다 더 많은 수', less: '~보다 더 적은 수', start: '처음 수 구하기', change: '바뀐 수 구하기', add3: '세 수의 덧셈', groups: '같은 수씩 묶음', rows: '줄과 칸', times: '몇 배', share: '똑같이 나누기', pack: '몇씩 덜어 내기' };
export const WORDS = {
  1: [['1-1-3:6', 'join'], ['1-1-3:6', 'combine'], ['1-1-3:10', 'take'], ['1-1-3:10', 'diff'], ['1-2-4:2', 'add3'], ['1-2-6:4', 'part']],
  2: [['2-1-3:3', 'more'], ['2-1-3:2', 'start'], ['2-1-3:7', 'take'], ['2-1-3:6', 'change'], ['2-2-2:6', 'groups'], ['2-2-2:5', 'times']],
  3: [['3-1-1:4', 'less'], ['3-1-1:7', 'diff'], ['3-1-3:6', 'share'], ['3-1-3:6', 'pack'], ['3-1-4:3', 'rows'], ['3-2-1:4', 'times'], ['3-2-2:7', 'share'], ['3-2-2:10', 'pack']],
  4: [['4-1-3:3', 'groups'], ['4-1-3:5', 'share'], ['4-1-3:6', 'pack'], ['4-1-3:7', 'share']],
};
export function pickWord(c, kind, r, used) {
  const L = byId[c]; if (!L) return null;
  for (let k = 0; k < 3000; k++) {
    let p; try { p = L.gen(r); } catch (e) { continue; }
    const ws = Math.floor(r.next() * 1e9);
    const s = storyOf(c, p, ws);
    if (!s || s.kind !== kind) continue;
    const calc = s.steps && s.steps[1] && s.steps[1].item;
    if (KUKU.has(c) && calc) { const X = readExpr(calc); if (!X || X.A.i < 2 || X.B.i < 2) continue; }
    const key = 'W' + toText(s.story);
    if (used.has(key)) continue;
    used.add(key);
    return { c, p, ws, kind, story: s.story, ans: s.item.prompt, sol: s.item.sol, calc: calc ? { prompt: calc.prompt, sol: calc.sol } : null, pick: s.steps && s.steps[0] && s.steps[0].item ? { choices: s.steps[0].item.choices, sol: s.steps[0].item.sol } : null };
  }
  return null;
}

// ── 문항 꼴 · 배치 갈래 ──
const SV = (it) => /svg/.test(JSON.stringify(it.prompt)) || (it.choices || []).some((c) => /svg/.test(JSON.stringify(c)));
export function formOf(it) {
  // 교과서가 세로로 쓰는 셈만 세로 — 덧셈 · 뺄셈은 2학년 1학기부터 두 자리끼리(또는 합 · 차가 세 자리), 곱셈은 3학년 1학기부터 위 수가 두 자리 이상, 나눗셈은 3학년 2학기부터
  const X = readExpr(it), L = LES(it.c);
  const tail = it.prompt.filter((t) => t && typeof t === 'object').length, oneLine = it.prompt.length <= 2 && tail === 1;
  if (!X || X.st !== 'W' || !L) return 'h';
  const gi = gradeIdx(L.g);
  if (X.op === '÷') return gi >= gradeIdx('3-2') && it.sol.length <= 2 && it.prompt.length <= 4 && X.A.i >= 10 ? 'd' : 'h';
  if (!oneLine || String(X.A.i).length < String(X.B.i).length) return 'h';
  if ((X.op === '+' || X.op === '−') && gi >= gradeIdx('2-1') && X.A.i >= 10 && (X.B.i >= 10 || X.A.i >= 100 || gi >= gradeIdx('2-1'))) return 'v';
  if (X.op === '×' && gi >= gradeIdx('3-1') && X.A.i >= 10) return 'v';
  return 'h';
}
const lenOf = (it) => toText(it.prompt).length + (it.choices ? it.choices.map((c) => toText(c)).join('').length + 6 : 0);
function clsOf(it, form) {
  if (form === 'v' || form === 'd') return form;
  if (SV(it)) return 'pic';
  const L = lenOf(it);
  return L <= 20 ? 'short' : L <= 40 ? 'mid' : 'long';
}
export const CLS_ORDER = ['short', 'mid', 'long', 'pic', 'v', 'd'];

// ── 묶음 만들기 ──
//  kind: 'gate' 선별 · 'full' 모든 차시 · 'detail' 고른 차시 자세히 · 'check' 확인지 · 'retest' 다시 보기
//  lessons: [{ c, n }] · words: true면 학년 문장제 · mixed: 장 안에서 같은 꼴끼리 섞음(칸 이름 · 순서로 답을 흘리지 않게)
let madeSeq = 0;   // 같은 1ms 안에 만든 묶음도 차례가 정해지게
export function makeSheet({ kind, from = '1-1', to = '4-1', lessons = null, words = true, wordList = null, n = 3, id = null, seed = null, title = '', note = '', mixed = true }) {
  id = id || newId();
  seed = seed == null ? hash(id + ENG) : seed;
  const r = rng(seed), used = new Set(), warn = [];
  let plan = lessons;
  if (!plan) {
    if (kind === 'gate') plan = gatesIn(from, to).flatMap(({ gates }) => gates.flatMap((G) => (G.mix ? G.mix.map((c) => ({ c, n: 1, gate: true, covers: [c] })) : [{ c: G.c, n, gate: true, covers: G.covers }])));
    else plan = lessonsIn(from, to).map((c) => ({ c, n }));
  }
  plan = plan.filter((x) => LES(x.c)).sort((a, b) => order(a.c) - order(b.c));
  // 장 묶음 = 학기 × 영역(종이에서 한 덩어리) — 이름은 영역만(학년은 선생님 화면에만)
  const chapters = [], byCh = {};
  for (const x of plan) {
    const ch = groupKey(x.c);
    if (!byCh[ch]) { byCh[ch] = { key: ch, g: LES(x.c).g, s: strandOf(x.c), items: [] }; chapters.push(byCh[ch]); }
    const its = x.hyps ? pickDiscriminating(x.c, x.n, r, used, x.hyps) : x.want ? [...pickItems(x.c, x.trapN == null ? x.n : Math.min(x.trapN, x.n), r, used, x.want), ...(x.trapN != null && x.trapN < x.n ? pickItems(x.c, x.n - x.trapN, r, used) : [])] : pickItems(x.c, x.n, r, used);
    if (its.length < x.n) warn.push(`${x.c} ${x.n}문제 중 ${its.length}개만 만듦`);
    if (x.hyps && its.splitCount === 0) warn.push(`${lessonName(x.c)}: 두 원인(${x.hyps.join(', ')})이 이 차시 문제에서는 늘 같은 답을 내서 가르는 문제를 못 만듦 — 풀이 과정을 보고 판단해 주세요`);
    its.forEach((it) => { const form = formOf(it); byCh[ch].items.push({ c: x.c, p: it.p, form, cls: clsOf(it, form), gate: !!x.gate, covers: x.covers || null, ...(it.trap ? { trap: 1 } : {}), snap: { prompt: it.prompt, sol: it.sol, choices: it.choices || null } }); });
  }
  // 장 안 차례: 같은 배치 갈래끼리 모아 섞음(같은 차시가 나란히 몰리지 않게)
  for (const ch of chapters) {
    const byCls = {}; ch.items.forEach((it) => (byCls[it.cls] = byCls[it.cls] || []).push(it));
    ch.items = CLS_ORDER.flatMap((k) => { const xs = byCls[k] || []; if (!mixed) return xs; const rr = rng(hash(id + ch.key + k)); for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rr.next() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; });
  }
  // 문장제 — 범위의 학년마다 한 장
  const wordItems = [];
  if (wordList) for (const [c, k] of wordList) { for (let j = 0; j < 2; j++) { const w = pickWord(c, k, r, used); if (w) wordItems.push({ c, form: 'w', cls: 'word', g: byId[c].g, word: w }); } }
  else if (words) {
    const grades = [...new Set(plan.map((x) => Number(LES(x.c).g[0])))];
    for (const gr of grades) {
      const list = (WORDS[gr] || []).filter(([c]) => byId[c] && gradeIdx(byId[c].g) >= gradeIdx(from) && gradeIdx(byId[c].g) <= gradeIdx(to));
      const pick = kind === 'gate' ? list.filter((_, i) => i % 2 === 0) : list;
      for (const [c, k] of pick) { const w = pickWord(c, k, r, used); if (w) wordItems.push({ c, form: 'w', cls: 'word', g: byId[c].g, word: w }); else warn.push(`${c} '${k}' 문장제를 못 만듦`); }
    }
  }
  // 번호
  let k = 0;
  const items = [];
  for (const ch of chapters) for (const it of ch.items) { it.k = ++k; it.ch = ch.key; items.push(it); }
  if (wordItems.length) { const wch = { key: 'W', g: wordItems[wordItems.length - 1].g, s: 'W', items: wordItems }; chapters.push(wch); for (const it of wordItems) { it.k = ++k; it.ch = 'W'; items.push(it); } }
  // 마무리 — 맨 끝은 쉬운 두 문제(가장 아래 차시) — 판정에도 씀
  const easy = plan.length ? plan[0].c : null;
  if (easy && kind !== 'check') {
    const its = pickItems(easy, 2, r, used);
    if (its.length) { const end = { key: 'END', g: LES(easy).g, s: strandOf(easy), items: [] }; its.forEach((it) => { const form = formOf(it); end.items.push({ c: easy, p: it.p, form, cls: clsOf(it, form), k: ++k, ch: 'END', snap: { prompt: it.prompt, sol: it.sol, choices: it.choices || null } }); }); chapters.push(end); items.push(...end.items); }
  }
  return { v: 1, id, kind, made: Date.now() + (++madeSeq) / 1000, eng: ENG, seed, range: { from, to }, title, note, chapters: chapters.map((c) => ({ key: c.key, g: c.g, s: c.s, ks: c.items.map((it) => it.k) })), items, warn };
}
