// 이야기 다리 — 화면과 상관없는 것(차시 고르기 · 문제 고르기 · 기록 · 선생님 요약)
//  한 판 = 문장제 여섯 · 모르는 자리를 고루(결과 · 변화 · 처음 / 큰 · 작은 · 차) · 처음 수 모름은 뒤쪽이지만 꼭 · 불일치 이야기를 섞음 [C ②3][C ②7]
//    덧뺄은 '더'가 있는데 빼는 이야기(차)가 늘 한 문제 · 큰 쪽 · 작은 쪽 모름은 판마다 돌아가며(덜 본 것부터)
//  차시 = 아이 판정에서 '확인'된 계산 차시 가운데 문장제가 있는 것 → 계산이 걸림돌이 되지 않게(없으면 쉬운 차시)
//    고른 차시의 연산이 하나뿐이면(곱셈 칸만 확인 등) 쉬운 차시에서 다른 연산 하나를 섞음 — 한 판이 한 연산으로만 흐르지 않게
//  한 판 안에서 같은 문장 틀(글 첫 8글자)은 두 번까지 · 막대 틀이 셋 서는 이야기만(그럴듯한 틀린 틀 둘 — schema framesOf)
//  식 보기 = schema eqPick(같은 두 수의 다른 연산을 더해 셋 이상)
//  기록: 한 판 = 묶음 하나(form 'w' 문항 · 결과 r.w[k] = { f 식 맞음, a 답 맞음 } — 종이와 같은 판정) + r.sb[k] = 걸음별 맞음
//  K.story = { log:[{ t, sh, k, c, kind, slot, type, inc, s:[유형, 틀, 식, 계산, 답] }] } — 선생님 요약 st.story는 이것 + 서버 기록(다른 기기)
import { NODES, byId } from '../../engine/lessons/index.js';
import { hasWords, storyOf, readItem } from '../../engine/words.js';
import { rng } from '../../engine/math.js';
import { toText } from '../../engine/tokens.js';
import { schemaOf, framesOf, slotOf, famOfLesson, profileOf, familiar, eqPick } from '../../engine/schema.js';

export const STORY_N = 6;
// 한 판의 칸 차례 — 칸마다 고를 수 있는 구조(덜 본 것부터) · 앞은 바로 읽히는 것 · 뒤는 불일치 · 처음 모름 · 나머지 해석
export const SLOTS = {
  as: [['join+', 'take−'], ['combine+', 'part−'], ['diff−'], ['change−'], ['more−', 'less+', 'more+'], ['start+']],
  md: [['groups×', 'rows×', 'rate×'], ['share÷', 'shareR÷'], ['pack÷', 'packR÷'], ['times×', 'of×'], ['timesB÷', 'timesM÷'], ['need÷', 'packR÷', 'shareR÷']],
};
// 확인된 차시가 없을 때 — 계산이 가벼운 차시(학년 이름은 아이에게 보이지 않음)
export const EASY = { as: [['2-1-3:2', '2-1-3:5'], ['1-2-2:2', '1-2-2:4']], md: [['2-2-2:3', '3-1-3:6'], ['2-2-2:2', '3-1-3:6']] };
const KUKU = new Set(['2-2-2:2', '2-2-2:3', '2-2-2:4', '2-2-2:5', '2-2-2:6', '2-2-2:7', '2-2-2:8']);   /* 2-2-2:8(1단과 0의 곱)도 — 1 × ○ 이야기는 이야기 다리에 내지 않음 */
const hash = (s) => [...String(s)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
const ord = (c) => NODES.indexOf(byId[c]);

// 차시마다 낼 수 있는 칸 · 연산(한 번 재어 둠)
const capCache = {};
export function capOf(c) {
  if (capCache[c]) return capCache[c];
  const L = byId[c], out = { op: null, slots: {}, rem: false };
  if (L && hasWords(c)) {
    const r = rng(hash(c));
    for (let i = 0; i < 120; i++) {
      let p; try { p = L.gen(r); } catch (e) { continue; }
      const s = storyOf(c, p, i * 7919 + 13); if (!s) continue;
      const e = readItem(s.steps[1].item); if (!e) continue;
      out.op = out.op || e.op;
      const k = slotOf(s, e.op); out.slots[k] = (out.slots[k] || 0) + 1;
      if (s.rem) out.rem = true;
    }
  }
  return (capCache[c] = out);
}
const famOf = (c) => famOfLesson(byId[c]);
// 판정(kidReport의 L)에서 차시 고르기 — fam: 'as' | 'md' · 확인(ok) 먼저, 없으면 관문 통과(pass) · 맨 위 둘 중 하나(숫자가 달라지게)
export function pickLessons(L, fam, seed = 1) {
  const r = rng(seed);
  const pool = (sts) => Object.values(L || {}).filter((x) => x && sts.includes(x.st) && byId[x.c] && hasWords(x.c) && famOf(x.c) === fam && byId[x.c].fam !== 'ADD3').map((x) => x.c);
  let ok = pool(['ok']); if (!ok.length) ok = pool(['ok', 'pass']);
  const top = (pred) => { const xs = ok.filter(pred).sort((a, b) => ord(b) - ord(a)); return xs.length ? r.pick(xs.slice(0, 2)) : null; };
  let cs;
  if (fam === 'as') cs = [top((c) => capOf(c).op === '+'), top((c) => capOf(c).op === '−')];
  else cs = [top((c) => capOf(c).op === '×'), top((c) => capOf(c).op === '÷' && !capOf(c).rem), top((c) => capOf(c).op === '÷' && capOf(c).rem)];
  cs = [...new Set(cs.filter(Boolean))];
  const bad = (c) => L && L[c] && (L[c].st === 'stuck' || L[c].st === 'shaky');
  if (!cs.length) cs = (EASY[fam].find((xs) => !xs.some(bad)) || EASY[fam][EASY[fam].length - 1]).slice();
  /* 연산이 하나뿐이면 쉬운 차시에서 다른 연산 하나(막힌 · 흔들린 차시는 X) */
  const ops = new Set(cs.map((c) => capOf(c).op));
  for (const op of fam === 'as' ? ['+', '−'] : ['×', '÷']) {
    if (ops.has(op)) continue;
    const c = EASY[fam].flat().find((x) => !bad(x) && !cs.includes(x) && capOf(x).op === op);
    if (c) { cs.push(c); ops.add(op); }
  }
  return { cs, easy: !ok.length };
}

// 이야기 하나 찾기 — 이 칸 · 이 차시에서 · 같은 글 두 번 없음 · 같은 문장 틀(첫 8글자) 두 번까지 · 틀 셋이 서는 것(같은 두 수 X · 말이 되는 틀린 틀 둘) · 곱셈구구는 1 · 0이 끼지 않게
export const HEAD_MAX = 2;
export const headOf = (story) => toText(story).slice(0, 8);
function findStory(cs, slot, r, used, heads = {}) {
  const ok = cs.filter((c) => capOf(c).slots[slot]);
  if (!ok.length) return null;
  for (let k = 0; k < 2000; k++) {
    const c = r.pick(ok), L = byId[c];
    let p; try { p = L.gen(r); } catch (e) { continue; }
    const ws = Math.floor(r.next() * 1e9), s = storyOf(c, p, ws);
    if (!s) continue;
    const sc = schemaOf(s); if (!sc || sc.slot !== slot) continue;
    if (KUKU.has(c)) { const e = readItem(s.steps[1].item); if (!e || val(e.a) < 2 || val(e.b) < 2) continue; }
    if (framesOf(sc, ws).list.length !== 3) continue;
    const pk = eqPick(s, ws); if (pk.choices.length < 2 || (pk.choices.length < 3 && pk.short !== 'op')) continue;   /* 식 보기 셋(그 학년이 다른 연산을 안 배웠으면 둘) */
    const key = toText(s.story), h = headOf(s.story); if (used.has(key) || (heads[h] || 0) >= HEAD_MAX) continue;
    used.add(key); heads[h] = (heads[h] || 0) + 1;
    return { c, p, ws };
  }
  return null;
}
const val = (x) => x.n / x.d;
// 한 판 차례 — cs 차시들 · log 지난 기록(덜 본 칸 먼저)
export function planOf(cs, { seed = 1, log = [], n = STORY_N } = {}) {
  const r = rng(seed), fam = famOf(cs[0]), seen = {};
  for (const e of log || []) if (e && e.slot) seen[e.slot] = (seen[e.slot] || 0) + 1;
  const can = new Set(cs.flatMap((c) => Object.keys(capOf(c).slots)));
  const least = (keys) => { const ks = keys.filter((k) => can.has(k)); if (!ks.length) return null; const m = Math.min(...ks.map((k) => seen[k] || 0)); return r.pick(ks.filter((k) => (seen[k] || 0) === m)); };
  const used = new Set(), heads = {}, out = [], took = [];
  for (const alts of SLOTS[fam]) {
    if (out.length >= n) break;
    const k = least(alts.filter((x) => !took.includes(x))) || least(alts); if (!k) continue;
    const it = findStory(cs, k, r, used, heads); if (it) { out.push(it); took.push(k); }
  }
  // 못 채운 칸 — 이 차시들이 낼 수 있는 다른 구조(덜 본 것 · 아직 안 낸 것부터)
  for (let g = 0; out.length < n && g < 20; g++) {
    const k = least([...can].filter((x) => !took.includes(x))) || least([...can]); if (!k) break;
    const it = findStory(cs, k, r, used, heads); if (it) { out.push(it); took.push(k); } else can.delete(k);
  }
  return out;
}

// 문제 하나 다시 만들기(c · p · ws → 같은 이야기)
export function probOf({ c, p, ws }) {
  const s = storyOf(c, p, ws); if (!s) return null;
  const sc = schemaOf(s); if (!sc) return null;
  s.steps[0].item = eqPick(s, ws);
  return { c, p, ws, s, sc, fr: framesOf(sc, ws) };
}

// ── 기록 ──
//  sh = 묶음(종이와 같은 꼴 · 문항 form 'w') · R = { done:{ W }, it:{}, w:{ k:{ f, a } }, sb:{ k: 걸음 } }
export function sheetOf({ id, items, made = Date.now() }) {
  const its = items.map((x, i) => {
    let s = null; try { s = byId[x.c] ? storyOf(x.c, x.p, x.ws) : null; } catch (e) { s = null; }
    if (!s) return null;
    const calc = s.steps[1].item, pk = s.steps[0].item;
    return { k: i + 1, c: x.c, p: x.p, ch: 'W', form: 'w', cls: 'word', g: byId[x.c].g, gate: false, word: { c: x.c, p: x.p, ws: x.ws, kind: s.kind, story: s.story, ans: s.item.prompt, sol: s.item.sol, calc: { prompt: calc.prompt, sol: calc.sol }, pick: { choices: pk.choices, sol: pk.sol } }, snap: { prompt: s.story, sol: s.item.sol, choices: null } };
  }).filter(Boolean);
  return { v: 1, id, kind: 'story', made, unit: null, items: its, chapters: [{ key: 'W', ks: its.map((x) => x.k) }] };
}
// 걸음 결과 → 묶음 결과 · 로그 줄
//  res[k] = { s:[유형, 틀, 식, 계산, 답] } (유형 · 틀 null = 익숙해서 건너뜀) · 식 맞음 f = 식 첫 번 · 답 맞음 a = 계산과 답이 둘 다 첫 번
export function resultOf(sh, res) {
  const R = { done: { W: true }, it: {}, w: {}, sb: {} };
  for (const it of sh.items) {
    const x = res[it.k]; if (!x) continue;
    const s = x.s;
    R.w[it.k] = { f: s[2] === 1 ? 1 : 0, a: s[3] === 1 && s[4] === 1 ? 1 : 0 };
    R.sb[it.k] = s;
  }
  return R;
}
export function logOf(sh, res, t = Date.now()) {
  return sh.items.filter((it) => res[it.k]).map((it) => { const pr = probOf(it.word); return { t: res[it.k].t || t, sh: sh.id, k: it.k, c: it.c, kind: it.word.kind, slot: pr ? pr.sc.slot : null, type: pr ? pr.sc.type : null, inc: pr ? pr.sc.inc : false, s: res[it.k].s }; });
}
// 이 기기 로그 + 서버에서 받은 이야기 묶음(다른 기기에서 푼 것)
export function storyLog(K) {
  const log = ((K && K.story && K.story.log) || []).filter((e) => e && Array.isArray(e.s));
  const seen = new Set(log.map((e) => `${e.sh}:${e.k}`));
  const more = [];
  for (const [id, x] of Object.entries((K && K.recs) || {})) {
    if (!x || !x.s || x.s.kind !== 'story' || !x.r || !x.r.sb || !Array.isArray(x.s.it)) continue;
    for (const row of x.s.it) {
      const [k, c, p, , , ws] = row, s = x.r.sb[k];
      if (!Array.isArray(s) || seen.has(`${id}:${k}`) || ws == null) continue;
      const pr = probOf({ c, p, ws }); if (!pr) continue;
      more.push({ t: x.s.made, sh: id, k, c, kind: pr.s.kind, slot: pr.sc.slot, type: pr.sc.type, inc: pr.sc.inc, s });
    }
  }
  return [...log, ...more].sort((a, b) => a.t - b.t);
}
export const storySum = (K) => profileOf(storyLog(K));
export const isFamiliar = (K, type, slot) => familiar(storyLog(K), type, slot);
