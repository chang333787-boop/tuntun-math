// 자릿값 모형 — 받아올림 · 받아내림을 '묶음 바꾸기'로 먼저 보여 줌(모형 → 그림 → 식 [B-R2][B-R5][B-R13])
//  비례가 맞게(낱개 10개 = 십 막대 하나 길이 · 십 막대 10개 = 백 판 하나) · 밋밋한 선화(장식 없음 [B-R28]) · 흑백에서도 보임
import { readExpr } from '../../engine/errors.js';
import { toText } from '../../engine/tokens.js';
const U = 12, INK = '#3b2a1e', FILL = '#f1e2cc';
const cube = (x, y) => `<rect x="${x}" y="${y}" width="${U}" height="${U}" fill="${FILL}" stroke="${INK}" stroke-width="1"/>`;
const rod = (x, y) => `<rect x="${x}" y="${y}" width="${U}" height="${U * 10}" fill="${FILL}" stroke="${INK}" stroke-width="1.2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${x} ${y + U * (i + 1)} h${U}" stroke="${INK}" stroke-width=".5"/>`).join('')}`;
const flat = (x, y) => `<rect x="${x}" y="${y}" width="${U * 10}" height="${U * 10}" fill="${FILL}" stroke="${INK}" stroke-width="1.4"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${x + U * (i + 1)} ${y} v${U * 10}M${x} ${y + U * (i + 1)} h${U * 10}" stroke="${INK}" stroke-width=".4"/>`).join('')}`;
// 수 하나 → 백 판 · 십 막대 · 낱개(낱개는 다섯씩 두 줄)
function numG(n, x0, y0) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  let x = x0, out = '';
  if (h > 2) { out += flat(x, y0) + `<text x="${x + U * 10 + 6}" y="${y0 + U * 5 + 6}" font-size="16" fill="${INK}">× ${h}</text>`; x += U * 10 + 44; }   // 백 판이 많으면 하나만 그리고 '× 개수'(낱개 · 십 막대가 작아지지 않게)
  else for (let i = 0; i < h; i++) { out += flat(x, y0); x += U * 10 + 6; }
  for (let i = 0; i < t; i++) { out += rod(x, y0); x += U + 3; }
  if (t) x += 4;
  for (let i = 0; i < o; i++) out += cube(x + (i % 5) * (U + 2), y0 + U * 10 - (Math.floor(i / 5) + 1) * (U + 2));
  if (o) x += 5 * (U + 2);
  return { svg: out, w: x - x0 };
}
const row = (label, n, y) => { const g = numG(n, 70, y); return { svg: `<text x="0" y="${y + U * 5 + 6}" font-size="18" fill="${INK}" font-weight="700">${label}</text>${g.svg}`, w: 70 + g.w }; };

export function modelHTML(it) {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  if (!X || X.st !== 'W' || !(X.op === '+' || X.op === '−')) return '';
  const a = X.A.i, b = X.B.i;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a > 999 || b > 999 || a < 10) return '';
  const H = U * 10 + 14;
  if (X.op === '+') {
    const o = (a % 10) + (b % 10);
    if (o < 10) return '';
    const r1 = row(String(a), a, 4), r2 = row(`+ ${b}`, b, 4 + H);
    // 낱개 모으기: o개 → 10개를 묶어 십 막대 1개
    const y3 = 4 + 2 * H + 10;
    let cubes = '';
    for (let i = 0; i < o; i++) cubes += cube(70 + i * (U + 3), y3 + 30);
    const box = `<rect x="66" y="${y3 + 26}" width="${10 * (U + 3) + 2}" height="${U + 8}" rx="5" fill="none" stroke="#b4482b" stroke-width="1.8" stroke-dasharray="5 3"/>`;
    const ax = 70 + o * (U + 3) + 18;
    const arrow = `<path d="M${ax} ${y3 + 34} h34" stroke="${INK}" stroke-width="2"/><path d="M${ax + 34} ${y3 + 34} l-7 -5 v10z" fill="${INK}"/>`;
    const w = Math.max(r1.w, r2.w, ax + 150);
    const svg = `<svg viewBox="0 0 ${w} ${y3 + 30 + U * 10 + 6}" style="max-width:${Math.min(w, 640)}px;width:100%;height:auto" role="img" aria-label="${a} 더하기 ${b} 모형 — 낱개 ${o}개 중 10개를 십 막대 1개로 바꿔요">${r1.svg}${r2.svg}
      <text x="0" y="${y3 + 14}" font-size="15" fill="${INK}">낱개끼리 모으면 ${o}개</text>${cubes}${box}${arrow}${rod(ax + 44, y3 + 30 - U * 4)}<text x="${ax + 60}" y="${y3 + 30 + U * 6}" font-size="14" fill="${INK}">십 막대 1개</text></svg>`;
    return `<div class="model"><p><b>모형으로 먼저 봐요.</b> 낱개가 10개 모이면 <b>십 막대 1개</b>로 바꿔요 — 이게 받아올림이에요.</p>${svg}</div>`;
  }
  const oa = a % 10, ob = b % 10;
  if (oa >= ob || a < b || Math.floor(a / 10) % 10 === 0) return '';   // 십의 자리가 0이면(백에서 받아내림) 모형 대신 단계로
  const r1 = row(String(a), a, 4);
  const y3 = 4 + H + 10;
  let cubes = '';
  for (let i = 0; i < 10; i++) cubes += cube(70 + 44 + i * (U + 3), y3 + 30 + U * 4);
  const svg = `<svg viewBox="0 0 ${Math.max(r1.w, 300)} ${y3 + 30 + U * 10 + 6}" style="max-width:${Math.min(Math.max(r1.w, 300), 640)}px;width:100%;height:auto" role="img" aria-label="${a} 빼기 ${b} 모형 — 십 막대 1개를 낱개 10개로 바꿔요">${r1.svg}
    <text x="0" y="${y3 + 14}" font-size="15" fill="${INK}">낱개 ${oa}개에서 ${ob}개를 뺄 수 없어요</text>${rod(70, y3 + 30)}<path d="M${70 + U + 8} ${y3 + 30 + U * 5} h20" stroke="${INK}" stroke-width="2"/><path d="M${70 + U + 28} ${y3 + 30 + U * 5} l-7 -5 v10z" fill="${INK}"/>${cubes}</svg>`;
  return `<div class="model"><p><b>모형으로 먼저 봐요.</b> 낱개가 모자라면 <b>십 막대 1개를 낱개 10개</b>로 바꿔요 — 이게 받아내림이에요.</p>${svg}</div>`;
}

// ── 세로셈(11-05 교사 '풀이 화면 배치' · '받아내려 말만으로는 모름') — 덧셈 · 뺄셈 두 자리 ~ 네 자리를 시범 단계와 함께
//  지금 단계의 자리에 옅은 청록 띠 · 받아내림은 바뀐 자리 숫자에 빗금 + 위에 지금 값(36 − 28 → 십의 자리 3에 빗금 · 위에 2 / 일의 자리 6에 빗금 · 위에 16)
//  받아올림은 다음 자리 위에 작은 1 · 맨 앞자리의 0은 쓰지 않음(교과서 그대로)
//  colPlan = 자리마다 { i, sa · sb(뺄셈 단계 식의 두 수) · tot(덧셈 자리 합) · put:[{ at, v }] 답 줄 · mk:[{ at, v, x }] 위 줄 } — ops.js addColumns · subColumns와 같은 계산
const dg = (n, k) => Math.floor(n / 10 ** k) % 10, ln = (n) => String(n).length;
function colPlan(a, b, op) {
  const out = [];
  if (op === '+') {
    const L = Math.max(ln(a), ln(b));
    let c = 0;
    for (let i = 0; i < L; i++) {
      const s = dg(a, i) + dg(b, i) + c, put = [{ at: i, v: s % 10 }], mk = [];
      if (s >= 10) { if (i === L - 1) put.push({ at: L, v: 1 }); else mk.push({ at: i + 1, v: 1 }); }
      out.push({ i, tot: s, put, mk });
      c = s >= 10 ? 1 : 0;
    }
    return out;
  }
  const cur = Array.from({ length: ln(a) }, (_, k) => dg(a, k));
  for (let i = 0; i < cur.length; i++) {
    const y = dg(b, i), mk = [];
    if (cur[i] < y) {
      let k = i + 1;
      while (cur[k] === 0) k++;
      cur[k]--; mk.push({ at: k, v: cur[k], x: true });
      for (let j = i + 1; j < k; j++) { cur[j] = 9; mk.push({ at: j, v: 9, x: true }); }
      cur[i] += 10; mk.push({ at: i, v: cur[i], x: true });
    }
    out.push({ i, sa: cur[i], sb: y, put: [{ at: i, v: cur[i] - y }], mk });
  }
  return out;
}
const fits = (e, p, op) => !!p && (op === '−' ? p.fam === 'SUB' && p.a === e.sa && p.b === e.sb : (p.fam === 'ADD' || p.fam === 'ADD3') && p.a + p.b + (p.c || 0) === e.tot);
// 시범 문제와 단계 → 세로셈 계획 · 단계마다 자리 번호(못 찾으면 -1 — 마지막 '합치기' 단계만 허용: 27 + 5의 '20 + 12' · 32 − 5의 '10개씩 묶음')
//  10을 만들어 빼는 십몇 − 몇(16 − 8 → 10 − 2)처럼 첫 단계가 자리 계산이 아니면 세로셈을 쓰지 않음(단계 식 목록으로)
export function colOf(it, steps) {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  if (!X || X.st !== 'W' || !(X.op === '+' || X.op === '−') || !steps || !steps.length) return null;
  const a = X.A.i, b = X.B.i;
  if (![a, b].every(Number.isInteger) || a < 0 || b < 0 || Math.max(a, b) < 10 || Math.max(a, b) > 9999 || (X.op === '−' && a < b)) return null;
  const plan = colPlan(a, b, X.op), at = [];
  let j = 0;
  for (const s of steps) { let f = -1; for (let k = j; k < plan.length; k++) if (fits(plan[k], s.p, X.op)) { f = k; break; } at.push(f); if (f >= 0) j = f + 1; }
  if (at.slice(0, -1).some((x) => x < 0) || at[0] < 0) return null;
  return { a, b, op: X.op, plan, at, ans: X.op === '+' ? a + b : a - b };
}
// k = 보인 단계 수(0 = 처음 · 단계 수 = 끝) → { html, lead0: 지금 자리 답이 맨 앞 0이라 쓰지 않음 }
export function colView(C, k) {
  const n = C.at.length, cur = k ? C.at[Math.min(k, n) - 1] : -1, upto = !k ? -1 : k >= n || cur < 0 ? C.plan.length - 1 : cur;
  const W = Math.max(ln(C.a), ln(C.b), ln(C.ans)), mk = {}, put = {};
  for (let q = 0; q <= upto; q++) { C.plan[q].mk.forEach((m) => (mk[m.at] = m)); C.plan[q].put.forEach((m) => (put[m.at] = m.v)); }
  const now = cur, lead0 = now >= 0 && put[now] === 0 && now >= ln(C.ans);
  const cell = (pos, inner, cls = '') => `<td class="${[cls, pos === now ? 'now' : ''].filter(Boolean).join(' ')}">${inner}</td>`;
  const row = (f) => Array.from({ length: W }, (_, j) => f(W - 1 - j)).join('');
  const html = `<table class="vcol" role="img" aria-label="${C.a} ${C.op === '+' ? '더하기' : '빼기'} ${C.b} 세로셈"><tbody>
    <tr class="mk"><td class="op"></td>${row((p) => cell(p, mk[p] ? String(mk[p].v) : ''))}</tr>
    <tr><td class="op"></td>${row((p) => cell(p, p < ln(C.a) ? String(dg(C.a, p)) : '', mk[p] && mk[p].x ? 'x' : ''))}</tr>
    <tr><td class="op">${C.op}</td>${row((p) => cell(p, p < ln(C.b) ? String(dg(C.b, p)) : ''))}</tr>
    <tr class="ans"><td class="op"></td>${row((p) => cell(p, put[p] != null && (p < ln(C.ans) || (C.ans === 0 && p === 0)) ? String(put[p]) : ''))}</tr>
  </tbody></table>`;
  return { html, lead0 };
}
// 답 보기가 그림인가 — 시범 끝 말풍선에 그림을 다시 넣지 않고 '✓ 표시한 보기'로 가리킴(kid.js fixView)
export const picAns = (it) => !!(it && it.choices) && toText(it.choices[Number(it.sol[0])] || []).includes('[그림]');
