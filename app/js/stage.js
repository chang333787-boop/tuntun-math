// 칸(차시)마다 익힘 표 셋: 정확 → 빠르게 → 오래(화면과 상관없는 순수 로직)
//  옛 스테이지 · 다듬기 화면(stageview.js)은 11-08에 지움 — 표는 배울 것 통과 · 점검(kid.js grantAccurate) · 매일 연습(run.js)이 올리고 선생님 반 표가 읽음
//  근거: 정확해진 뒤에 빠르기 [B-R13] · 내 지난 기록과만 견줌(순위 X) [B-R13][D-20] · 간격 두고 다시 꺼내도 되는지 = 오래 [D-6][D-8]
//    정답률이 낮으면 시계를 감추고 정확하게 먼저 [B-R16] · 완료에 거는 보상 X → 판자가 바뀌는 것으로(나무 → 못 박은 나무 → 돌) [D-19]
//  시간은 늘 잰다(문항마다 ms) — 시계는 다듬기에서 아이가 켤 때만 보임(기본 꺼짐 · 혹평 11-01 · 근거 §1 '고를 수 있게') · 준비 다리 · 확인 문제는 조용히 잼
//  '빠르게' 표는 셈 사실 칸에만(isFact) — 빠르기 연습의 근거는 셈 사실 1~5분 [B-R10][B-R13] · 큰 수 읽기 · 비교 · 분수 뜻 같은 칸은 정확 → 오래 두 표
//  mx[차시] = { tier: 0~3, best: { ok, n, med, total }, runs: [{ t, ok, n, med }], t1: '정확'을 딴 때, t2: '빠르게'를 딴 때, slow: 시계 감춤 }
//    tier는 그대로 0 아직 · 1 정확 · 2 빠르게 · 3 오래 — 셈 사실이 아닌 칸은 1 → 3(정확을 딴 지 3일 뒤 그대로면)
import { byId } from '../../engine/lessons/index.js';
import { makeSheet, itemOf } from '../../paper/js/gen.js';

export const TIER = ['', '정확', '빠르게', '오래'];
const DAY = 864e5;
export const target = (c) => (byId[c] ? byId[c].sec : 20) * 1000;   // '빠르게' 기준 = 엔진의 기준 시간(한 문제 가운데값)
// 셈 사실 칸 = 엔진이 시간 재기(timed · fact)로 표시한 칸(한 자리 덧셈 · 뺄셈 · 10 만들기 · 받아올림 · 받아내림 한 자리 · 곱셈구구)
//  + 기준 시간 8초 이하인 연산 칸(덧셈 · 뺄셈 · 곱셈 · 나눗셈 갈래: 0 더하기 · 빼기 · 구구단으로 나누기) — 수 · 분수 · 소수 갈래는 짧아도 셈 사실이 아님
export const isFact = (c) => { const x = byId[c]; return !!x && (x.fact || (x.sec <= 8 && ['A', 'M', 'D'].includes(x.s))); };
export const tiersOf = (c) => (isFact(c) ? [1, 2, 3] : [1, 3]);
export const drillN = (c) => { const s = byId[c] ? byId[c].sec : 20; return s >= 40 ? 5 : s >= 20 ? 6 : 8; };
export const need = (n) => (n >= 6 ? n - 1 : n);   // 정확 = 8문제 중 7 · 6문제 중 5 · 5문제는 다
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };

//  want = 이 아이에게 보인 생각을 가려내는 함정 꼴(engine/mis.js WANT) — 있으면 절반을 함정 짝으로 [D-10][D-12]
export function newDrill({ c, id, clock, want = null }) {
  const n = drillN(c);
  const sh = makeSheet({ kind: 'drill', words: false, id, lessons: [want ? { c, n, want, trapN: Math.ceil(n / 2) } : { c, n }], mixed: true });
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((ch) => ch.key !== 'END');
  return { v: 1, c, id, clock: !!clock, sheet: sh, i: 0, R: { done: {}, it: {} }, ms: {}, done: false };
}
export const drillItem = (D) => (D.done ? null : D.sheet.items[D.i]);
export function answerDrill(D, a, ms) {
  const it = drillItem(D); if (!it) return null;
  let ok = false;
  if (a.idk) D.R.it[it.k] = { s: 'q' };
  else { let r = null; try { r = itemOf(it.c, it.p).check(a.vals, a.raws); } catch (e) { r = null; } ok = !!(r && r.ok); D.R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
  D.ms[it.k] = Math.max(0, Math.round(ms));
  D.i++;
  if (D.i >= D.sheet.items.length) { D.done = true; D.sheet.chapters.forEach((ch) => (D.R.done[ch.key] = true)); }
  return { ok, sol: it.snap.sol };
}
// 시계는 문제를 보는 동안만(되먹임 보는 시간은 빼고)
export const elapsed = (D) => Object.values(D.ms).reduce((a, b) => a + b, 0);
export function resultOf(D) {
  const ks = D.sheet.items.map((it) => it.k);
  const ok = ks.filter((k) => D.R.it[k] && D.R.it[k].s === 'ok').length;
  const okMs = ks.filter((k) => D.R.it[k] && D.R.it[k].s === 'ok').map((k) => D.ms[k] || 0);
  const traps = D.sheet.items.filter((it) => it.trap).map((it) => it.k);
  return { n: ks.length, ok, med: okMs.length ? median(okMs) : null, total: elapsed(D), trapN: traps.length, trapOk: traps.filter((k) => D.R.it[k] && D.R.it[k].s === 'ok').length };
}

// 한 판 결과 → 표 · 내 기록(나와만 견줌)
export function applyRun(mx, c, res, now = Date.now()) {
  const m = mx[c] || { tier: 0, best: null, runs: [], t2: 0 };
  const before = m.tier, T = target(c), good = res.ok >= need(res.n), traps = !res.trapN || res.trapOk === res.trapN;
  if (good && m.tier < 1) { m.tier = 1; m.t1 = now; }
  if (isFact(c)) {
    if (good && m.tier >= 1 && res.med != null && res.med <= T && m.tier < 2) { m.tier = 2; m.t2 = now; }
    else if (good && m.tier === 2 && res.med != null && res.med <= T * 1.2 && now - (m.t2 || now) >= 3 * DAY && traps) m.tier = 3;   // 오래 = 함정 짝까지 맞아야(그 생각이 정말 고쳐졌나)
  } else if (good && traps && lastReady(m, c, now)) m.tier = 3;   // 셈 사실이 아닌 칸: 정확을 딴 지 3일 뒤에도 그대로 = 오래(빠르기는 따지지 않음)
  const better = !m.best || res.ok / res.n > m.best.ok / m.best.n || (res.ok / res.n === m.best.ok / m.best.n && res.med != null && (m.best.med == null || res.med < m.best.med));
  const record = !!(m.best && better);
  if (better) m.best = { ok: res.ok, n: res.n, med: res.med, total: res.total };
  m.runs = [...(m.runs || []), { t: now, ok: res.ok, n: res.n, med: res.med }].slice(-10);
  m.slow = res.ok / res.n < 0.75 ? true : good ? false : !!m.slow;   // 정답률이 낮으면 다음 판은 시계 없이 정확하게 먼저
  mx[c] = m;
  return { before, after: m.tier, gained: m.tier > before ? tiersOf(c).filter((t) => t > before && t <= m.tier).map((t) => TIER[t]) : [], record, good, T };
}
// '오래'를 딸 수 있나 — 셈 사실: 빠르게를 딴 지 3일 · 그 밖: 정확을 딴 지 3일(t1이 없는 옛 기록은 첫 기록 때로)
export function lastReady(m, c, now = Date.now()) {
  if (!m) return false;
  if (isFact(c) || m.tier === 2) return m.tier === 2 && now - (m.t2 || now) >= 3 * DAY;   /* 셈 사실이 아닌 칸에 예전에 딴 '빠르게'(옛 기록)도 같은 규칙 */
  const t1 = m.t1 || Math.min(...(m.runs || []).map((r) => r.t), now);
  return m.tier === 1 && now - t1 >= 3 * DAY;
}
// 판자 고치기 통과 · 준비 다리에서 셋 다 맞힘 → '정확' 표
export function grantAccurate(mx, c, now = Date.now()) { const m = mx[c] || { tier: 0, best: null, runs: [], t2: 0 }; if (m.tier < 1) { m.tier = 1; m.t1 = now; } mx[c] = m; return m; }
// 이 아이 · 이 칸에서 겨눌 함정 꼴 — 지금 보이는 생각 또는 예전에 보였던 생각(고친 뒤에도 다질 때 섞음)
import { mindsOf, wantFor } from '../../engine/mis.js';
export function wantOf(rep, minds, c) {
  const ids = new Set([...Object.entries(mindsOf(rep)).filter(([, e]) => e.c.has(c)).map(([id]) => id), ...Object.keys(minds || {})]);
  for (const id of ids) { const w = wantFor(id, c); if (w) return w; }
  return null;
}
