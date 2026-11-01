// 이번 주 점검의 계산(화면 X) — 주 가르기 · 묶음 → 주마다 점 · 고를 칸 · 선 그래프 · 선 방향
//  근거 · 설계는 week.js 머리말 · 아이 기기(kidstore 요약)와 선생님 화면이 같이 씀
import { byId, gradeIdx, UNITS, unitById, NODES } from '../../engine/lessons/index.js';
import { LES } from '../../paper/js/gen.js';
import { prepPlan } from './prep.js';
import { esc } from './local.js';

const okRec = (x) => !!(x && x.s && Array.isArray(x.s.it) && Number.isFinite(x.s.made) && x.r && x.r.it && typeof x.r.it === 'object');
export const WEEK = { n: 10 };
// 월요일 날짜로 주를 가름(이 기기 시각)
export const weekKey = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString('sv-SE'); };
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

// 범위 = 학기 하나(T4-2) — 그 학기 단원들의 준비 칸 가운데 지난 학기까지 배운 칸 · 가까운 학기부터 10칸 넘게(이번 학기에 새로 배울 칸은 뺌 — 아직 안 배운 것으로 선이 낮아지지 않게)
//  한 학기 내내 같은 범위라 선이 이어짐(CBM은 같은 범위에서 고르게 뽑은 같은 꼴의 점검) · 재는 것 = 기초 체력(앞 판자가 튼튼해지나) · 이번 학기 진도는 선생님 형성평가로
//  묶음의 unit 칸엔 'T' + 학기를 적음 — 진짜 단원 id('4-2-1')와 겹치지 않게(홈의 '오늘 단원 준비했나'가 단원 id로 봄)
export const termOf = (u) => (u && unitById[u] ? `T${unitById[u].g}` : null);
const termG = (t) => (typeof t === 'string' && /^T\d-\d$/.test(t) ? t.slice(1) : null);
export function termPool(term) {
  const g = termG(term); if (!g) return [];
  const pool = new Set(); UNITS.filter((u) => u.g === g).forEach((u) => prepPlan(u.id).pre.forEach((c) => { if (byId[c] && gradeIdx(LES(c).g) < gradeIdx(g)) pool.add(c); }));
  const all = [...pool].sort((a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (a < b ? -1 : 1));
  // 가까운 학기부터 — 지난 세 학기 안에서 10칸이 되면 거기까지(1~2학년 덧뺄셈이 반을 넘어 4학년이 늘 9~10점에 붙던 것 · 혹평 10-31) · 모자라면 한 학기씩 넓힘
  for (let k = 3; k < 12; k++) { const near = all.filter((c) => gradeIdx(LES(c).g) >= gradeIdx(g) - k); if (near.length >= 10 || near.length === all.length) return near; }
  return all;
}

// 푼 묶음들 → 주마다 점 { t, wk, term, ok, n, med } · 같은 주에 둘이면 먼저 푼 것
export function weeksOf(recs, term = null) {
  const out = new Map();
  Object.values(recs || {}).filter((x) => okRec(x) && x.s.kind === 'week' && !x.r.rush && (!term || x.s.unit === term)).sort((a, b) => a.s.made - b.s.made).forEach((x) => {
    const wk = weekKey(x.s.made); if (out.has(wk)) return;
    const ks = x.s.it.map((i) => i[0]), okK = ks.filter((k) => x.r.it[k] && x.r.it[k].s === 'ok');
    out.set(wk, { t: x.s.made, wk, term: x.s.unit || null, ok: okK.length, n: ks.length, med: median(okK.map((k) => Number((x.ms || {})[k]) || 0).filter((v) => v > 0)) });
  });
  return [...out.values()];
}
// 선 하나 = 마지막 학기의 점들(학기가 바뀌면 새 선)
export const lastLine = (ws) => { const t = ws.length ? ws[ws.length - 1].term : null; return ws.filter((w) => w.term === t); };
export const doneThisWeek = (recs) => weeksOf(recs).some((w) => w.wk === weekKey());
// 아이에게 보일 선 — 학기를 알면 그 학기 · 모르면 마지막 학기(학기가 섞인 선 X)
export const lineOf = (recs, term) => (term ? weeksOf(recs, term) : lastLine(weeksOf(recs)));
// 점검 학기 — 마지막 준비 다리 단원의 학기 → 없으면 지난번 점검한 학기
export const weekTerm = (K) => termOf(K.lastPrep && K.lastPrep.unit) || termOf((Object.values(K.inbox || {}).filter((x) => x && x.kind === 'prep' && x.unit).sort((a, b) => b.t - a.t)[0] || {}).unit) || ((weeksOf(K.recs).slice(-1)[0] || {}).term) || null;   /* 준비 다리 → 선생님이 연 단원 → 지난 점검 학기 */

// 점검할 칸 — 학기 범위에서 학기 · 학년 차례로 고르게 n칸(칸마다 한 문제 · 시작점은 주마다 다름) · 학기를 모르면 판정에 나온 칸
// 이번 학기 칸 — 그 학기 단원들의 차시 전부(아직 안 배운 것도 · CBM은 한 학기 내용을 처음부터 고르게 섞어 재고 배울수록 선이 오름 [B-R18][B-R19])
//  점검은 판정에 안 들어가고(kidstore history) 아이는 점수 대신 선만 봄 — 안 배운 문제를 틀려도 '빈 곳'이 되지 않음(11-01 교사 '굳이 앞 학기만?')
export function curPool(term) {
  const g = termG(term); if (!g) return [];
  const us = new Set(UNITS.filter((u) => u.g === g).map((u) => u.id));
  return NODES.filter((n) => byId[n.id] && us.has(n.u)).map((n) => n.id).sort((a, b) => (a < b ? -1 : 1));
}
const spread = (pool, k) => { if (pool.length <= k) return pool.slice(); const off = Math.random(), step = pool.length / k; return Array.from({ length: k }, (_, i) => pool[Math.min(pool.length - 1, Math.floor((i + off) * step))]); };
// 점검할 칸 — 이번 학기 여섯 + 앞 학기 기초 넷(가까운 학기부터 고르게) · 학기를 모르면 판정에 나온 칸
export const WEEK_MIX = { cur: 6, base: 4 };
export function weekPlan(K, rep, term = weekTerm(K)) {
  const cur = curPool(term), base = termPool(term);
  if (cur.length + base.length >= 4) {
    const c = spread(cur, Math.min(WEEK_MIX.cur + Math.max(0, WEEK_MIX.base - base.length), cur.length)), b = spread(base, Math.min(WEEK.n - c.length, base.length));
    return [...new Set([...b, ...c])];
  }
  const pool = [...new Set([...Object.keys(K.fixed || {}), ...Object.values(rep.L).filter((x) => x.st && x.st !== 'none').map((x) => x.c)])].filter((c) => byId[c]).sort((a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (a < b ? -1 : 1));
  return spread(pool, WEEK.n);
}
// 선 그래프 — 10점으로 맞춤 · 밋밋하게(점 · 선 · 날짜) · marks = 선생님이 지도를 바꾼 때 [{ t, x }] → 세로 점선(번호) — CBM의 '바꾼 때' 줄 [B-R19][B-R20]
export function weekChart(weeks, { w = 420, h = 130, marks = [] } = {}) {
  const ws = (weeks || []).slice(-8); if (!ws.length) return '';
  const wi = (v) => Math.round((new Date(v.wk) - new Date(ws[0].wk)) / (7 * 864e5)), span = Math.max(wi(ws[ws.length - 1]), 1);   /* 빠진 주는 빈칸으로(점 사이를 주 수대로) */
  const P = 26, x = (i) => { const a = Math.floor(i), f = i - a, xa = P + (wi(ws[Math.min(a, ws.length - 1)]) * (w - 2 * P)) / span; return f && a + 1 < ws.length ? xa + f * (P + (wi(ws[a + 1]) * (w - 2 * P)) / span - xa) : xa; }, y = (v) => h - P - ((h - 2 * P) * v) / 10, sc = (v) => (v.ok / v.n) * 10;
  const pts = ws.map((v, i) => `${x(i).toFixed(1)},${y(sc(v)).toFixed(1)}`).join(' ');
  // 바꾼 때 → 점 사이 자리(시간 비율) · 첫 점 앞이면 왼쪽 끝 · 마지막 점 뒤면 오른쪽 끝
  const at = (t) => { if (t <= ws[0].t) return P - 10; for (let i = 0; i < ws.length - 1; i++) if (t < ws[i + 1].t) return x(i + (t - ws[i].t) / (ws[i + 1].t - ws[i].t)); return Math.min(w - 6, x(ws.length - 1) + 12); };
  const ms = (marks || []).filter((m) => m && Number.isFinite(m.t) && m.t >= ws[0].t - 7 * 864e5).slice(-6);
  return `<svg class="runs" viewBox="0 0 ${w} ${h}" role="img" aria-label="이번 주 점검 ${ws.length}번 · 마지막 ${Math.round(sc(ws[ws.length - 1]))}점${ms.length ? ` · 지도를 바꾼 때 ${ms.length}번` : ''}">
    <path d="M${P} ${y(10)} H${w - P} M${P} ${y(5)} H${w - P}" stroke="#e6d9c6" stroke-width="1"/><text x="4" y="${y(10) + 4}" font-size="11" fill="#6f6355">10</text><text x="4" y="${y(5) + 4}" font-size="11" fill="#6f6355">5</text>
    ${ms.map((m, i) => { const mx = at(m.t).toFixed(1); return `<path d="M${mx} ${y(10) - 6} V${h - P + 4}" stroke="#2d6f6a" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${mx}" y="${y(10) - 8}" text-anchor="middle" font-size="11" fill="#2d6f6a">${i + 1}</text>`; }).join('')}
    ${ws.length > 1 ? `<polyline points="${pts}" fill="none" stroke="#3b2a1e" stroke-width="2"/>` : ''}${ws.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(sc(v)).toFixed(1)}" r="4.5" fill="#c99a68" stroke="#3b2a1e" stroke-width="1.5"/><text x="${x(i).toFixed(1)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#6f6355">${esc(v.wk.slice(5).replace('-', '/'))}</text>`).join('')}</svg>`;
}
// 선이 어디로 가나(선생님용) — 마지막 4~6점의 기울기(최소제곱) × 기간 ≥ 2.5점이 **두 주 이어서** 같은 쪽일 때만 오름/내림 · 점 다섯 전엔 말하지 않음
//  열 문제 한 번은 ±1~2점 흔들림 · 칸마다 난이도가 다르고 주마다 뽑는 칸이 달라 더 흔들림 — 14주 모의(칸 난이도 다름): 한 번 규칙은 변화 없는 아이의 27%를 한 번 이상 '내려가요'로 짚음 → 두 주 이어서는 7% · 3점 내림은 6주 안에 75% 잡음(평균 3주 뒤) [혹평 10-31]
const slope = (ys) => { const n = ys.length, mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0; ys.forEach((v, i) => { sxy += (i - mx) * (v - my); sxx += (i - mx) ** 2; }); return sxx ? sxy / sxx : 0; };
const once = (ws) => { const w = ws.slice(-6); if (w.length < 4) return null; const d = slope(w.map((v) => (v.ok / v.n) * 10)) * (w.length - 1); return d >= 2.5 ? 'up' : d <= -2.5 ? 'down' : 'flat'; };
export function weekTrend(weeks) {
  const ws = weeks || []; if (ws.length < 5) return null;
  const a = once(ws), b = once(ws.slice(0, -1));
  return a === b && (a === 'up' || a === 'down') ? a : 'flat';
}
