// 빠르기 재기 — 구구단(2~9단) · 덧셈(한 자리 + 한 자리). 화면과 상관없는 순수 로직
import { rng } from './math.js';

export const SETS = {
  mul: { name: '구구단', op: '×', rows: [2, 3, 4, 5, 6, 7, 8, 9], cols: [2, 3, 4, 5, 6, 7, 8, 9], f: (a, b) => a * b, sec: 4 },
  add: { name: '덧셈', op: '+', rows: [2, 3, 4, 5, 6, 7, 8, 9], cols: [2, 3, 4, 5, 6, 7, 8, 9], f: (a, b) => a + b, sec: 4 },
};
// 구구단 단 → 개념 id (학생 표에 합칠 때)
// 구구단 단 → 차시 id (2-2-2 곱셈구구)
export const MUL_GROUP = { 2: '2-2-2:2', 5: '2-2-2:3', 3: '2-2-2:4', 6: '2-2-2:4', 4: '2-2-2:5', 8: '2-2-2:5', 7: '2-2-2:6', 9: '2-2-2:7' };

// size: 'short' = 행마다 3개(24문항) · 'all' = 64문항
export function newFluency({ id, sid, set = 'mul', size = 'short', seed = 1, now = Date.now() }) {
  const S0 = SETS[set], r = rng(seed);
  let facts = [];
  for (const a of S0.rows) {
    const cs = size === 'all' ? S0.cols.slice() : r.shuffle(S0.cols).slice(0, 3);
    cs.forEach((b) => facts.push([a, b]));
  }
  facts = r.shuffle(facts);
  return { v: 1, kind: 'flu', id, sid, set, size, t0: now, facts, items: [], done: false };
}
export const currentFact = (F) => (F.done ? null : F.facts[F.items.length]);

export function answerFact(F, { val, ms = 0, idk = false, t = Date.now() }) {
  const fct = currentFact(F);
  if (!fct) return F;
  const [a, b] = fct, ans = SETS[F.set].f(a, b);
  F.items.push({ a, b, ans, val: idk ? null : val, ok: !idk && val === ans, ms, idk, t });
  if (F.items.length >= F.facts.length) { F.done = true; F.result = summarize(F); }
  return F;
}

export function stopFluency(F) { if (!F.done) { F.done = true; F.stopped = true; F.result = summarize(F); } return F; }

export function summarize(F) {
  const S0 = SETS[F.set], it = F.items, okIt = it.filter((x) => x.ok);
  const ms = okIt.map((x) => x.ms).sort((a, b) => a - b);
  const med = ms.length ? ms[Math.floor(ms.length / 2)] : 0;
  const total = it.reduce((s, x) => s + x.ms, 0);
  const perMin = total ? Math.round((okIt.length / (total / 60000)) * 10) / 10 : 0;
  const lim = S0.sec * 1000;
  const cell = (x) => (!x.ok ? 'wrong' : x.ms <= lim ? 'auto' : x.ms <= lim * 2 ? 'known' : 'slow');
  const byRow = {};
  for (const a of S0.rows) {
    const xs = it.filter((x) => x.a === a);
    const m = xs.filter((x) => x.ok).map((x) => x.ms).sort((p, q) => p - q);
    byRow[a] = { n: xs.length, ok: xs.filter((x) => x.ok).length, med: m.length ? m[Math.floor(m.length / 2)] : 0 };
  }
  const slowest = okIt.slice().sort((p, q) => q.ms - p.ms).slice(0, 5);
  const wrong = it.filter((x) => !x.ok);
  return { n: it.length, ok: okIt.length, med, total, perMin, byRow, slowest, wrong, cells: it.map((x) => ({ a: x.a, b: x.b, s: cell(x), ms: x.ms, val: x.val })) };
}

// 학생 표에 합치기 — 구구단만 (단 차시별: 2번 이상 틀리면 불안정, 4번 이상이면 처음 막힌 곳, 다 맞으면 속도로 자동/앎/느림)
export function fluencyStates(F) {
  if (F.set !== 'mul' || !F.result) return {};
  const lim = SETS.mul.sec * 1000, out = {};
  const groups = {};
  F.items.forEach((x) => { const g = MUL_GROUP[x.a]; (groups[g] = groups[g] || []).push(x); });
  for (const [cid, xs] of Object.entries(groups)) {
    if (xs.length < 3) continue;
    const bad = xs.filter((x) => !x.ok).length;
    const m = xs.filter((x) => x.ok).map((x) => x.ms).sort((p, q) => p - q);
    const med = m.length ? m[Math.floor(m.length / 2)] : 0;
    let s;
    if (bad >= 4 || bad / xs.length >= 0.5) s = 'gap';
    else if (bad >= 2) s = 'unstable';
    else s = med <= lim ? 'auto' : med <= lim * 2 ? 'known' : 'slow';
    out[cid] = { s, ms: med, n: xs.length, ok: xs.length - bad };
  }
  return out;
}
