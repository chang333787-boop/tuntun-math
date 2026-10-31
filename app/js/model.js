// 자릿값 모형 — 받아올림 · 받아내림을 '묶음 바꾸기'로 먼저 보여 줌(모형 → 그림 → 식 [B-R2][B-R5][B-R13])
//  비례가 맞게(낱개 10개 = 십 막대 하나 길이 · 십 막대 10개 = 백 판 하나) · 밋밋한 선화(장식 없음 [B-R28]) · 흑백에서도 보임
import { readExpr } from '../../engine/errors.js';
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
