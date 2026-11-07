// 자릿값 모형 — 받아올림 · 받아내림을 '묶음 바꾸기'로 먼저 보여 줌(모형 → 그림 → 식 [B-R2][B-R5][B-R13])
//  비례가 맞게(낱개 10개 = 십 막대 하나 길이 · 십 막대 10개 = 백 판 하나) · 밋밋한 선화(장식 없음 [B-R28]) · 흑백에서도 보임
import { readExpr } from '../../engine/errors.js';
import { toText } from '../../engine/tokens.js';
import { P } from '../../engine/concepts/kit.js';
import { esc } from './local.js';
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

// ── 묶음 바꾸기 움직임(docs/motion.md ① 받아내림 · ② 받아올림 — '같은 양인데 모양만 바뀜'은 정지 그림 둘로는 잇기 어려움 [M-3])
//  modelHTML과 같은 문제에서만(덧셈 낱개 합 ≥ 10 · 뺄셈 낱개 모자람 + 십의 자리 0 아님) · 문제 숫자 그대로 · 한 번 움직이고 끝 모습에서 멈춤 · [다시 보기]
//  기본 = 바꾼 뒤 모습(끝 모습만 봐도 읽히게 — 옮겨 간 자리는 점선 · 새로 생긴 묶음은 청록) · pre = 바꾸기 전 · anim = 전 → 뒤 한 번(뺄셈 약 1.5초 · 덧셈 약 1.8초)
//  움직이는 것은 <g>의 transform · opacity만(app.css .rg) · 동작 줄이기 설정이면 끝 모습 · 세로셈 숫자가 같은 때에 나타나게 rgLag(colView lag)
const TINT = '#cfe6e3', TEAL = '#0E6F68', SP = U + 2;
const rodT = (x, y) => rod(x, y).replace(`fill="${FILL}"`, `fill="${TINT}"`);
const cubeT = (x, y) => cube(x, y).replace(`fill="${FILL}"`, `fill="${TINT}"`);
const flatsW = (h) => (h > 2 ? U * 10 + 44 : h * (U * 10 + 6));
function flats(h, x, y) {
  if (h > 2) return flat(x, y) + `<text x="${x + U * 10 + 6}" y="${y + U * 5 + 6}" font-size="16" fill="${INK}">× ${h}</text>`;
  return Array.from({ length: h }, (_, i) => flat(x + i * (U * 10 + 6), y)).join('');
}
const gp = (xo, y0, i) => ({ x: xo + (i % 5) * SP, y: y0 + U * 10 - (Math.floor(i / 5) + 1) * SP });   /* 낱개 자리(다섯씩 · 아래 줄부터) */
const px = (o) => Object.entries(o).map(([k, v]) => `--${k}:${Math.round(v)}px`).join(';');
const rgOf = (it) => {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  if (!X || X.st !== 'W' || !(X.op === '+' || X.op === '−')) return null;
  const a = X.A.i, b = X.B.i;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a > 999 || b > 999 || a < 10 || b < 0) return null;
  if (X.op === '+') return (a % 10) + (b % 10) >= 10 ? { a, b, op: '+' } : null;
  return a % 10 < b % 10 && a >= b && Math.floor(a / 10) % 10 > 0 ? { a, b, op: '−' } : null;
};
/* 세로셈에서 이 움직임과 같은 때에 나타날 표시(ms) — 뺄셈: 막대가 낱개로 바뀌는 때 빗금 · 위 숫자, 낱개가 펼쳐진 뒤 답 · 덧셈: 십 막대가 생기는 때 올린 1과 답 */
export const rgLag = (it) => { const R = rgOf(it); return !R ? null : R.op === '−' ? { mk: 600, put: 1450 } : { mk: 1300, put: 1300 }; };
export function regroupHTML(it, { pre = false, anim = false } = {}) {
  const R = rgOf(it); if (!R) return '';
  const { a, b } = R, y0 = 4, x0 = 70;
  const label = (t, y) => `<text x="0" y="${y + U * 5 + 6}" font-size="18" fill="${INK}" font-weight="700">${t}</text>`;
  let svg = '', w = 0, h = 0, cap = '', aria = '';
  if (R.op === '−') {
    const H = Math.floor(a / 100), t = Math.floor(a / 10) % 10, o = a % 10, ob = b % 10;
    const rs = x0 + flatsW(H), rx = rs + (t - 1) * (U + 3), xo = rs + t * (U + 3) + 4, xn = xo + (o ? 5 * SP + 8 : 0);
    svg += label(String(a), y0) + flats(H, x0, y0);
    for (let i = 0; i < t - 1; i++) svg += rod(rs + i * (U + 3), y0);
    for (let i = 0; i < o; i++) { const p = gp(xo, y0, i); svg += cube(p.x, p.y); }
    /* 옮겨 간 십 막대 자리(점선) + 낱개 쪽으로 가는 굽은 화살표 — 끝 모습에서 '어디서 왔나' */
    const ex = xn + 2 * SP, ey = y0 + U * 10 - 2 * SP - 8;
    svg += `<g class="ghost"><rect x="${rx}" y="${y0}" width="${U}" height="${U * 10}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".55"/></g><g class="arr"><path d="M${rx + U / 2} ${y0 - 1}Q${(rx + ex) / 2} ${y0 - 26} ${ex} ${ey - 6}" fill="none" stroke="${TEAL}" stroke-width="2"/><path d="M${ex} ${ey}l-5 -9h10z" fill="${TEAL}"/></g>`;   /* 화살표는 움직임이 끝난 뒤에(움직이는 동안 낱개를 가로지르지 않게) */
    svg += `<g class="rod-mv" style="${px({ dx: xn - rx })}">${rod(rx, y0)}<rect class="hi" x="${rx - 3}" y="${y0 - 3}" width="${U + 6}" height="${U * 10 + 6}" rx="3" fill="none" stroke="${TEAL}" stroke-width="2.5"/></g>`;
    for (let k = 0; k < 10; k++) { const f = gp(xn, y0, k); svg += `<g class="c-new" style="${px({ sx: xn - f.x, sy: y0 + U * 10 - (k + 1) * U - f.y })};--k:${k}">${cubeT(f.x, f.y)}</g>`; }
    w = xn + 5 * SP + 6; h = y0 + U * 10 + 6;
    cap = pre ? (o ? `낱개 ${o}개에서 ${ob}개를 뺄 수 없어요.` : `낱개가 없어서 ${ob}개를 뺄 수 없어요.`) : `십 막대 1개를 낱개 10개로 바꿨어요. 이제 낱개 ${o + 10}개${t > 1 ? `, 십 막대 ${t - 1}개` : ''} — 수는 그대로 ${a}${P(String(a), '이에요', '예요')}.`;
    aria = pre ? `${a} 모형 — 십 막대 ${t}개, 낱개 ${o}개` : `${a} 모형 — 십 막대 1개를 낱개 10개로 바꿔 낱개 ${o + 10}개${t > 1 ? `, 십 막대 ${t - 1}개` : ''}`;
  } else {
    const ha = Math.floor(a / 100), ta = Math.floor(a / 10) % 10, oa = a % 10, hb = Math.floor(b / 100), tb = Math.floor(b / 10) % 10, ob = b % 10, s = oa + ob;
    const yB = y0 + U * 10 + 14, rs = x0 + Math.max(flatsW(ha), flatsW(hb)), slot = rs + ta * (U + 3), xo = rs + Math.max(ta + 1, tb) * (U + 3) + 4, xg = xo + 5 * SP + 8;
    svg += label(String(a), y0) + flats(ha, x0, y0) + label(`+ ${b}`, yB) + flats(hb, x0, yB);
    for (let i = 0; i < ta; i++) svg += rod(rs + i * (U + 3), y0);
    for (let i = 0; i < tb; i++) svg += rod(rs + i * (U + 3), yB);
    svg += `<g class="ghost b">${Array.from({ length: ob }, (_, j) => { const p = gp(xo, yB, j); return `<rect x="${p.x}" y="${p.y}" width="${U}" height="${U}" fill="none" stroke="${INK}" stroke-dasharray="3 2" opacity=".5"/>`; }).join('')}</g>`;
    /* 낱개 s개 — 아래 s − 10개(처음 수의 낱개)는 그대로 · 나머지 10개(위 줄 + 더하는 수의 낱개 전부)가 모여 십 막대 1개 */
    const go = (gi, from) => { const f = gp(xo, y0, gi), m = gi - (s - 10); return `<g class="go" style="${px({ x0: from.x - f.x, y0: from.y - f.y, x2: xg - f.x, y2: y0 + U * 10 - (m + 1) * U - f.y })}">${cube(f.x, f.y)}<rect class="hi" x="${f.x - 2}" y="${f.y - 2}" width="${U + 4}" height="${U + 4}" fill="none" stroke="${TEAL}" stroke-width="2"/></g>`; };
    for (let i = 0; i < oa; i++) { const p = gp(xo, y0, i); svg += i < s - 10 ? cube(p.x, p.y) : go(i, p); }
    for (let j = 0; j < ob; j++) svg += go(oa + j, gp(xo, yB, j));
    svg += `<g class="rod-new" style="${px({ dx: xg - slot })}">${rodT(slot, y0)}</g>`;
    w = xg + U + 6; h = yB + U * 10 + 6;
    cap = pre ? `${a}${P(String(a).slice(-1), '과', '와')} ${b}${P(String(b).slice(-1), '을', '를')} 모형으로 나타냈어요.` : (s > 10 ? `낱개끼리 모으면 ${s}개 — 그중 10개를 십 막대 1개로 바꿨어요. 이제 낱개 ${s - 10}개예요.` : '낱개끼리 모으면 10개 — 십 막대 1개로 바꿨어요. 남은 낱개는 없어요.');
    aria = pre ? `${a}${P(String(a).slice(-1), '과', '와')} ${b} 모형` : `${a} 더하기 ${b} 모형 — 낱개 ${s}개 중 10개를 십 막대 1개로 바꿔 낱개 ${s - 10}개`;
  }
  const re = pre ? '' : '<button type="button" class="rg-re">다시 보기</button>';
  return `<div class="model rg${pre ? ' pre' : ''}${anim && !pre ? ' anim' : ''}"><p>${esc(cap)}</p><svg viewBox="0 0 ${w} ${h}" style="--w:${Math.min(w, 640)}px" role="img" aria-label="${esc(aria)}">${svg}</svg>${re}</div>`;
}
/* [다시 보기] — 끝 모습에서 처음부터 한 번 더(꼬리표를 뗐다 붙여 CSS 움직임을 다시 시작) */
if (typeof document !== 'undefined') document.addEventListener('click', (e) => {
  const f = e.target && e.target.closest ? e.target.closest('.rg-re') : null, g = f && f.closest('.rg'); if (!g) return;
  g.classList.remove('anim'); void g.offsetWidth; g.classList.add('anim');
});

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
//  lag = { mk, put }(ms · rgLag) — 이 단계에서 새로 생긴 빗금 · 위 숫자 · 답을 그만큼 늦게 나타냄(모형이 바뀌는 순간과 같은 때 [M-18])
export function colView(C, k, lag = null) {
  const n = C.at.length, cur = k ? C.at[Math.min(k, n) - 1] : -1, upto = !k ? -1 : k >= n || cur < 0 ? C.plan.length - 1 : cur;
  const W = Math.max(ln(C.a), ln(C.b), ln(C.ans)), mk = {}, put = {};
  for (let q = 0; q <= upto; q++) { C.plan[q].mk.forEach((m) => (mk[m.at] = m)); C.plan[q].put.forEach((m) => (put[m.at] = m.v)); }
  const now = cur, lead0 = now >= 0 && put[now] === 0 && now >= ln(C.ans);
  const LP = lag && cur >= 0 ? C.plan[cur] : null, lmk = new Set(LP ? LP.mk.map((m) => m.at) : []), lput = new Set(LP ? LP.put.map((m) => m.at) : []);
  const lg = (on, inner, ms) => (on && inner ? `<span class="lag" style="--lag:${ms}ms">${inner}</span>` : inner);
  const cell = (pos, inner, cls = '', st = '') => `<td class="${[cls, pos === now ? 'now' : ''].filter(Boolean).join(' ')}"${st ? ` style="${st}"` : ''}>${inner}</td>`;
  const row = (f) => Array.from({ length: W }, (_, j) => f(W - 1 - j)).join('');
  const html = `<table class="vcol" role="img" aria-label="${C.a} ${C.op === '+' ? '더하기' : '빼기'} ${C.b} 세로셈"><tbody>
    <tr class="mk"><td class="op"></td>${row((p) => cell(p, lg(lmk.has(p), mk[p] ? String(mk[p].v) : '', lag && lag.mk)))}</tr>
    <tr><td class="op"></td>${row((p) => cell(p, p < ln(C.a) ? String(dg(C.a, p)) : '', mk[p] && mk[p].x ? (lmk.has(p) ? 'x lag' : 'x') : '', mk[p] && mk[p].x && lmk.has(p) ? `--lag:${lag.mk}ms` : ''))}</tr>
    <tr><td class="op">${C.op}</td>${row((p) => cell(p, p < ln(C.b) ? String(dg(C.b, p)) : ''))}</tr>
    <tr class="ans"><td class="op"></td>${row((p) => cell(p, lg(lput.has(p), put[p] != null && (p < ln(C.ans) || (C.ans === 0 && p === 0)) ? String(put[p]) : '', lag && lag.put)))}</tr>
  </tbody></table>`;
  return { html, lead0 };
}
// 답 보기가 그림인가 — 시범 끝 말풍선에 그림을 다시 넣지 않고 '✓ 표시한 보기'로 가리킴(kid.js fixView)
export const picAns = (it) => !!(it && it.choices) && toText(it.choices[Number(it.sol[0])] || []).includes('[그림]');

// 10칸 틀 둘 — 10을 넘는 한 자리 덧셈(7 + 8)과 십몇 − 몇(16 − 7)의 '10 만들기 · 10에서 빼기'(교사 11-07 '7 + 8이면 7 + 3 + 5 · 7 + 3은 10 · 그다음 15')
//  moved = false → 처음 모습(앞 틀의 빈칸을 셀 수 있게 — 떠올리기 그림 · 답을 말하지 않음)
//  moved = true  → 덧셈: 뒤 틀의 바둑돌이 앞 틀 빈칸으로 옮겨 10 · 뺄셈: 앞 틀(10)에서 뺄 만큼 지움
//  anim = true면 옮기는 모습을 한 번(0.45초 · 하나씩 0.12초 차이 · 동작 줄이기 설정이면 끝 모습만 — app.css .tf)
export function tenFrameHTML(it, { moved = false, anim = false } = {}) {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  if (!X || X.st !== 'W') return '';
  const a = X.A.i, b = X.B.i;
  const add = X.op === '+' && a >= 1 && a <= 9 && b >= 1 && b <= 9 && a + b > 10;
  const sub = X.op === '−' && a >= 11 && a <= 18 && b >= 1 && b <= 9 && a % 10 < b;
  if (!add && !sub) return '';
  const S = 36, G = 4, F = 5 * S + 4 * G, GAP = 30, R = 13;
  const cellXY = (f, k) => ({ x: f * (F + GAP) + (k % 5) * (S + G) + S / 2, y: Math.floor(k / 5) * (S + G) + S / 2 });
  const frame = (f) => Array.from({ length: 10 }, (_, k) => { const { x, y } = cellXY(f, k); return `<rect x="${x - S / 2}" y="${y - S / 2}" width="${S}" height="${S}" rx="4" fill="#fff" stroke="#8a8076" stroke-width="1.5"/>`; }).join('');
  const dot = (x, y, cls, extra = '') => `<g class="${cls}"${extra}><circle cx="${x}" cy="${y}" r="${R}"/></g>`;
  let dots = '';
  if (add) {
    const need = 10 - a;
    for (let k = 0; k < a; k++) { const p = cellXY(0, k); dots += dot(p.x, p.y, 'd1'); }
    for (let k = 0; k < b; k++) {
      const p = cellXY(1, k);
      if (k < need && moved) { const t = cellXY(0, a + k); dots += dot(p.x, p.y, `d2 mv${anim ? '' : ' done'}`, ` style="--dx:${t.x - p.x}px;--dy:${t.y - p.y}px;animation-delay:${k * 120}ms"`); }
      else dots += dot(p.x, p.y, k < need ? 'd2 will' : 'd2');
    }
  } else {
    for (let k = 0; k < 10; k++) { const p = cellXY(0, k); dots += dot(p.x, p.y, moved && k >= 10 - b ? `d1 gone${anim ? '' : ' done'}` : 'd1', moved && k >= 10 - b ? ` style="animation-delay:${(k - 10 + b) * 120}ms"` : ''); }
    for (let k = 0; k < a - 10; k++) { const p = cellXY(1, k); dots += dot(p.x, p.y, 'd2'); }
  }
  const W = 2 * F + GAP, H = 2 * S + G;
  return `<figure class="tf${anim ? ' anim' : ''}"><svg viewBox="-2 -2 ${W + 4} ${H + 4}" width="${W}" height="${H}" role="img" aria-label="10칸 틀 두 개 — ${a} ${add ? '더하기' : '빼기'} ${b}">${frame(0)}${frame(1)}${dots}</svg></figure>`;
}
