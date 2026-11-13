// 그림 틀 — 문제의 수로 그리는 작은 SVG(방향 11-10 차례 1 · docs/direction_1110.md '그림 틀이 공통 병목')
//  틀 여덟: split 가르기 띠 · tiles 똑같은 칸 · array 배열 · share 똑같이 나눈 묶음 · bars 분수 띠 · line 눈금(수직선 · 뛰어 세기) · clock 시계 · grid 모눈
//  규칙: 그림은 읽거나 셀 수 있지만 답을 글자로 적지 않는다(10칸 틀과 같은 기준 — 마친 단계의 답만 그 칸에) · 색은 CSS 클래스(.p-* · .cell)로 · 폭 440 · 높이 170 안
//  쓰는 곳: engine/hints/pics.js(차시 → 그림 설명 spec) → app/js/hint.js(도움 사다리). 여기는 spec → SVG 글자만(순수 함수 · DOM X)
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (v) => Math.round(v * 10) / 10;
/* 글자 폭 어림(한글 = 글자 크기 · 숫자 · 기호 = 0.58배 · 빈칸 = 0.3배) — 칸 너비를 글에 맞추는 데만 씀 */
const tw = (s, size) => [...String(s)].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e7f ? 1 : ch === ' ' ? 0.3 : 0.58) * size, 0);
const T = (x, y, s, size = 16, cls = '', anchor = 'middle', bold = false) => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}" font-size="${size}"${bold ? ' font-weight="700"' : ''} class="p-t${cls ? ` ${cls}` : ''}">${X(s)}</text>`;
const wrap = (W, H, label, body) => `<svg viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W)}" height="${r1(H)}" role="img" aria-label="${X(label)}">${body}</svg>`;
/* 위에 얹는 글 + 꺾쇠(이 폭 전체가 이 수라는 뜻) */
const brace = (x0, x1, y, text) => T((x0 + x1) / 2, y, text, 18, '', 'middle', true) + `<path d="M${r1(x0 + 1)} ${y + 20} V${y + 12} H${r1(x1 - 1)} V${y + 20} M${r1((x0 + x1) / 2)} ${y + 12} V${y + 6}" class="p-ln mu"/>`;

// ── 가르기 띠 ── 큰 수 하나를 몇 칸으로 가른 띠(자리마다 갈라 곱하기 · 갈라 나누기 · 단위 바꾸기)
//  cells = [{ t: '30 × 4', v: '120'(그 칸의 단계를 마쳤을 때만), on: 지금 할 칸 }] · top = 가른 수 · foot = 띠 아래 한마디
export function split({ top = '', cells = [], foot = '', label = '' }) {
  if (!cells.length) return '';
  const ws = cells.map((c) => Math.max(84, tw(c.t, 18) + 30, c.v != null ? tw(c.v, 20) + 30 : 0));
  const W = ws.reduce((a, b) => a + b, 0) + 4, y0 = top ? 42 : 2, h = 56;
  let s = top ? brace(2, W - 2, 18, top) : '', x = 2;
  cells.forEach((c, i) => {
    const w = ws[i], cx = x + w / 2, done = c.v != null;
    s += `<rect x="${r1(x)}" y="${y0}" width="${r1(w)}" height="${h}" class="p-box${c.on ? ' now' : done ? ' done' : ''}"/>`;
    s += done ? T(cx, y0 + 21, c.t, 13, 'mu') + T(cx, y0 + 45, c.v, 20, '', 'middle', true) : T(cx, y0 + 35, c.t, 18);
    x += w;
  });
  if (foot) s += T(W / 2, y0 + h + 19, foot, 14, 'mu');
  const said = cells.map((c) => (c.v != null ? `${c.t} = ${c.v}` : c.t)).join(', ');
  return wrap(W, y0 + h + (foot ? 26 : 2), label || `${top ? `${top}, ` : ''}${said}${foot ? ` — ${foot}` : '로 가른 띠'}`, s);
}

// ── 똑같은 칸 여러 개 ── 한 칸의 식(cell)이 n번(58 × 60 = '58 × 6'이 10칸) · 다섯 칸씩 줄 바꿈 · 한 칸만 계산하면 됨
//  v = 그 칸의 답(단계를 마친 뒤 — 모든 칸에) · on = 지금 첫 칸을 계산할 차례
export function tiles({ top = '', n = 10, cols = 5, cell = '', v = null, on = false, foot = '', label = '' }) {
  if (!(n >= 2) || n > 20 || !cell) return '';
  const w = Math.min(88, Math.max(64, tw(cell, 15) + 22, v != null ? tw(v, 17) + 22 : 0)), h = 36, R = Math.ceil(n / cols), W = cols * w + 4, y0 = top ? 42 : 2;
  let s = top ? brace(2, W - 2, 18, top) : '';
  for (let k = 0; k < n; k++) {
    const x = 2 + (k % cols) * w, y = y0 + Math.floor(k / cols) * h, cx = x + w / 2;
    s += `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="${h}" class="p-box${v != null ? ' done' : on && !k ? ' now' : ''}"/>`;
    s += v != null ? T(cx, y + 24, v, 17, '', 'middle', true) : T(cx, y + 23.5, cell, 15, k ? 'mu' : '');
  }
  if (foot) s += T(W / 2, y0 + R * h + 19, foot, 14, 'mu');
  return wrap(W, y0 + R * h + (foot ? 26 : 2), label || `${top ? `${top}, ` : ''}${cell}${v != null ? ` = ${v}` : ''} 칸이 ${n}개`, s);
}

// ── 배열 ── rows줄 · 한 줄을 묶음(groups)으로 가름(곱셈구구를 아는 곱으로 · 묶어 세기 · 나눗셈)
//  groups = [{ n, on(지금 볼 묶음 — 나머지는 옅게), gh(점선 — 없는 칸 · 9 = 10 − 1), lab }] · unit 10 · 100 = 동전 하나가 10 · 100(몇십 · 몇백의 곱)
//  pair = 두 줄씩 짝(5단 — 두 줄이 10) · ring = 줄마다 테두리(한 묶음) · rem = 남는 것(아래 줄에 다른 색)
export function array({ rows = 1, groups = [], unit = 1, pair = false, ring = false, rem = 0, label = '' }) {
  const cols = groups.reduce((a, g) => a + g.n, 0);
  if (!(rows >= 1) || !(cols >= 1) || rows > 12 || cols > 12) return '';
  const g = unit > 1 ? (rows <= 5 ? 28 : rows <= 7 ? 22 : 19) : rows <= 5 && cols <= 8 ? 23 : rows <= 7 ? (ring && rem && rows === 7 ? 18 : 20) : ring ? 15 : 17, r = unit > 1 ? g * 0.43 : g * 0.36;   /* 줄이 많으면 작게(높이 200 안) */
  const anyOn = groups.some((q) => q.on), labs = groups.some((q) => q.lab), GAP = 10, PG = pair ? 7 : ring ? (rows >= 8 ? 3 : 5) : 0;
  const x0 = 6, y0 = labs ? 22 : 6, yOf = (j) => y0 + j * g + (pair ? Math.floor(j / 2) : ring ? j : 0) * PG;
  const W = x0 * 2 + cols * g + (groups.length - 1) * GAP, bodyH = yOf(rows - 1) + g, H = bodyH + (rem ? g + 6 : 0) + 6;
  let s = '', x = x0;
  const one = (cx, cy, cls) => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" class="p-dot${cls}"/>${unit > 1 && !cls.includes('gh') ? T(cx, cy + (g >= 28 ? 4 : 3.2), unit, (g >= 28 ? 11 : g >= 22 ? 9 : 8) - (unit >= 100 ? 1 : 0), 'in') : ''}`;
  if (ring) for (let j = 0; j < rows; j++) s += `<rect x="${x0 - 3}" y="${r1(yOf(j) - 1)}" width="${r1(W - 2 * x0 + 6)}" height="${g + 2}" rx="${r1(g / 2 + 1)}" class="p-ring"/>`;
  if (pair) for (let j = 0; j + 1 < rows; j += 2) s += `<rect x="${x0 - 3}" y="${r1(yOf(j) - 2)}" width="${r1(W - 2 * x0 + 6)}" height="${2 * g + 4}" rx="10" class="p-ring"/>`;
  groups.forEach((q) => {
    const cls = `${unit > 1 ? ' ten' : ''}${q.gh ? ' gh' : anyOn && !q.on ? ' dim' : ''}`;
    if (q.lab) s += T(x + (q.n * g) / 2, 15, q.lab, 13, 'mu');
    for (let j = 0; j < rows; j++) for (let i = 0; i < q.n; i++) s += one(x + i * g + g / 2, yOf(j) + g / 2, cls);
    x += q.n * g + GAP;
  });
  for (let i = 0; i < rem; i++) s += one(x0 + i * g + g / 2, bodyH + 6 + g / 2, `${unit > 1 ? ' ten' : ''} b`);
  const gs = groups.filter((q) => !q.gh).map((q) => q.n);
  return wrap(W, H, label || `한 줄에 ${gs.join('개와 ')}개씩 ${rows}줄${rem ? `, 남는 것 ${rem}개` : ''}`, s);
}

// ── 똑같이 나눈 묶음 ── 전체 total개를 d묶음으로 똑같이 · 앞의 on묶음을 칠함(전체의 몇 분의 몇)
export function share({ total, groups: d, on = 0, label = '' }) {
  const per = Math.round(total / d);
  if (!(per >= 1) || per * d !== total || total > 60 || d > 12) return '';
  const cols = per <= 3 ? per : Math.ceil(Math.sqrt(per)), rws = Math.ceil(per / cols), g = 17;
  const bw = cols * g + 12, bh = rws * g + 12, perRow = Math.max(1, Math.min(d, Math.floor(436 / (bw + 8)))), R = Math.ceil(d / perRow);
  let s = '';
  for (let k = 0; k < d; k++) {
    const ox = 2 + (k % perRow) * (bw + 8), oy = 2 + Math.floor(k / perRow) * (bh + 8);
    s += `<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" rx="9" class="p-box${k < on ? ' now' : ''}"/>`;
    for (let i = 0; i < per; i++) s += `<circle cx="${r1(ox + 6 + (i % cols) * g + g / 2)}" cy="${r1(oy + 6 + Math.floor(i / cols) * g + g / 2)}" r="6" class="p-dot"/>`;
  }
  return wrap(perRow * (bw + 8) - 4, R * (bh + 8) - 4, label || `${total}개를 ${d}묶음으로 똑같이 나눈 그림${on ? ` — ${on}묶음에 색칠` : ''}`, s);
}

// ── 분수 띠 ── 똑같이 나눈 띠에 칸 색칠
//  rows = [{ d, segs: [{ n, k }], min, pre, preX, sub, lab }]
//    segs = 왼쪽부터 이어 칠할 칸 수와 색(k: 'a' 노랑 · 'b' 청록 · 'x' 덜어 낸 칸) · 띠 하나(1)를 넘으면 다음 띠로 · min = 적어도 그릴 띠 수
//    pre = 띠 앞에 놓는 온전한 하나(자연수 부분) 개수 · preX = 그 가운데 덜어 낸 개수(뒤에서부터) · sub = 한 칸을 다시 나눈 수(점선)
//    lab = 왼쪽 글(분수 [n, d] · 대분수 [w, n, d] · 글자) · top = 첫 띠 위에 얹는 글('1시간 = 60분')
export function bars({ rows = [], top = '', label = '' }) {
  if (!rows.length) return '';
  const LW = rows.some((q) => q.lab != null) ? 52 : 0, AW = 436 - LW;
  const tot = (q) => (q.segs || []).reduce((a, sg) => a + sg.n, 0), wholes = (q) => Math.max(q.min || 1, Math.ceil(tot(q) / q.d) || 1);
  const Wn = Math.max(...rows.map(wholes)), Pn = Math.max(0, ...rows.map((q) => q.pre || 0));
  const rh = rows.length >= 3 ? 28 : 34, tl = Pn ? Math.max(14, Math.min(rh, Math.floor((AW * 0.42) / Pn) - 4)) : 0, tilesW = Pn ? Pn * (tl + 4) + 8 : 0;
  const ww = Math.min(Wn > 1 ? 210 : 290, Math.floor((AW - tilesW - 8 * (Wn - 1)) / Wn)), y0 = top ? 42 : 2, bx = 2 + LW + tilesW;
  const frac = (cx, cy, n, d, size = 14) => T(cx, cy - 4, n, size) + `<path d="M${r1(cx - 9)} ${r1(cy)} H${r1(cx + 9)}" class="p-ln th"/>` + T(cx, cy + size, d, size);
  const cross = (x, y, w, h) => `<path d="M${r1(x + 3)} ${y + 4} L${r1(x + w - 3)} ${y + h - 4} M${r1(x + w - 3)} ${y + 4} L${r1(x + 3)} ${y + h - 4}" class="p-x"/>`;
  let s = top ? brace(bx, bx + ww, 18, top) : '';
  rows.forEach((q, k) => {
    const y = y0 + k * (rh + 12), cw = ww / q.d, cy = y + rh / 2;
    if (Array.isArray(q.lab)) s += q.lab.length === 3 ? T(14, cy + 6, q.lab[0], 17) + frac(34, cy, q.lab[1], q.lab[2], 13) : frac(24, cy, q.lab[0], q.lab[1]);
    else if (q.lab != null) s += T(24, cy + 5, q.lab, 14);
    for (let i = 0; i < (q.pre || 0); i++) {
      const x = 2 + LW + i * (tl + 4), gone = i >= (q.pre || 0) - (q.preX || 0);
      s += `<rect x="${x}" y="${y}" width="${tl}" height="${rh}" class="cell on"/>${gone ? cross(x, y, tl, rh) : ''}`;
    }
    const kinds = []; (q.segs || []).forEach((sg) => { for (let i = 0; i < sg.n; i++) kinds.push(sg.k); });
    for (let w = 0; w < wholes(q); w++) for (let i = 0; i < q.d; i++) {
      const kd = kinds[w * q.d + i], x = bx + w * (ww + 8) + i * cw;
      s += `<rect x="${r1(x)}" y="${y}" width="${r1(cw)}" height="${rh}" class="cell${kd === 'a' || kd === 'x' ? ' on' : kd === 'b' ? ' b' : ''}"/>${kd === 'x' ? cross(x, y, cw, rh) : ''}`;
      if (q.sub > 1) for (let j = 1; j < q.sub; j++) s += `<path d="M${r1(x + (cw * j) / q.sub)} ${y + 2} V${y + rh - 2}" class="p-ln da th"/>`;
    }
  });
  const say = (q) => `${q.pre ? `온전한 하나 ${q.pre}개와 ` : ''}${q.d}칸으로 나눈 띠에 ${tot(q)}칸 색칠`;
  return wrap(bx + Wn * (ww + 8) - 6, y0 + rows.length * (rh + 12) - 10, label || rows.map(say).join(' · '), s);
}

// ── 눈금 ── 수직선(min~max) · ticks = [{ v, big, lab }] · marks = [{ v, lab }](깃발) · arcs = [{ a, b, da(점선 — 넘어감), lab }] 뛰어 세기 · gap = [a, b] 굵게 칠할 사이
export function line({ min = 0, max, ticks = [], marks = [], arcs = [], gap = null, w = 440, label = '' }) {
  if (!(max > min)) return '';
  const x0 = 24, x1 = w - 24, xv = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0), y = arcs.length ? 76 : marks.length ? 44 : 16;
  let s = `<path d="M${x0 - 10} ${y} H${x1 + 10}" class="p-ln"/>`;
  if (gap) s += `<path d="M${r1(xv(gap[0]))} ${y} H${r1(xv(gap[1]))}" class="p-gap"/>`;
  ticks.forEach((t) => {
    const x = r1(xv(t.v));
    s += `<path d="M${x} ${y - (t.big ? 10 : 6)} V${y + (t.big ? 10 : 6)}" class="p-ln${t.big ? '' : ' th'}"/>`;
    if (t.lab != null) s += T(x, y + 27, t.lab, 14, t.ac ? 'ac' : '', 'middle', !!t.ac);
  });
  arcs.forEach((a) => {
    const xa = xv(a.a), xb = xv(a.b), hh = Math.min(34, Math.abs(xb - xa) * 0.55);
    s += `<path d="M${r1(xa)} ${y - 3} Q${r1((xa + xb) / 2)} ${r1(y - 3 - 2 * hh)} ${r1(xb)} ${y - 3}" class="p-arc${a.da ? ' da' : ''}"/>`;
    if (a.lab) s += T((xa + xb) / 2, y - hh - 12, a.lab, 13, 'ac', 'middle', true);
  });
  marks.forEach((m) => {
    const x = r1(xv(m.v)), top = arcs.length ? 22 : 20;
    s += `<path d="M${x} ${y} V${top}" class="p-ln da th"/><circle cx="${x}" cy="${y}" r="4.5" class="p-pt"/>` + T(Math.max(18, Math.min(w - 18, x)), top - 5, m.lab != null ? m.lab : m.v, 15, '', 'middle', true);
  });
  return wrap(w, y + 36, label || `${min}부터 ${max}까지 수직선${marks.length ? ` — ${marks.map((m) => (m.lab != null ? m.lab : m.v)).join(', ')} 표시` : ''}${arcs.length ? ` · ${arcs.filter((a) => !a.da).length}번 뛰어 세기` : ''}`, s);
}

// ── 시계 ── h시 m분 · sweep = 긴바늘이 한 바퀴 도는 화살표(1시간 = 60분)
export function clock({ h = 12, m = 0, sweep = false, r = 60, label = '' }) {
  const c = r + (sweep ? 18 : 6), pt = (deg, len) => [c + len * Math.sin((deg * Math.PI) / 180), c - len * Math.cos((deg * Math.PI) / 180)];
  let s = `<circle cx="${c}" cy="${c}" r="${r}" class="p-box"/>`;
  for (let k = 0; k < 60; k++) { const big = k % 5 === 0, [xa, ya] = pt(k * 6, r - (big ? 8 : 4)), [xb, yb] = pt(k * 6, r - 1); s += `<path d="M${r1(xa)} ${r1(ya)} L${r1(xb)} ${r1(yb)}" class="p-ln${big ? '' : ' th'}"/>`; }
  for (let k = 1; k <= 12; k++) { const [x, yy] = pt(k * 30, r - 19); s += T(x, yy + 5, k, 13); }
  const [hx, hy] = pt(((h % 12) + m / 60) * 30, r * 0.5), [mx, my] = pt(m * 6, r * 0.78);
  s += `<path d="M${c} ${c} L${r1(hx)} ${r1(hy)}" class="p-hand"/><path d="M${c} ${c} L${r1(mx)} ${r1(my)}" class="p-hand min"/><circle cx="${c}" cy="${c}" r="3.5" class="p-pt"/>`;
  if (sweep) { const R = r + 9, [ax, ay] = pt(8, R), [bx, by] = pt(352, R); s += `<path d="M${r1(ax)} ${r1(ay)} A${R} ${R} 0 1 1 ${r1(bx)} ${r1(by)}" class="p-arc"/><path d="M${r1(bx + 9)} ${r1(by - 5)} L${r1(bx)} ${r1(by)} L${r1(bx + 2)} ${r1(by + 10)}" class="p-arc"/>`; }
  return wrap(2 * c, 2 * c, label || `${h}시${m ? ` ${m}분을` : '를'} 가리키는 시계${sweep ? ' — 긴바늘이 한 바퀴 돎' : ''}`, s);
}

// ── 모눈 ── 가로 w칸 · 세로 h칸 직사각형 · mode 'area' = 칸을 칠함(넓이) · 'peri' = 테두리를 굵게(둘레) · wl · hl = 변에 적는 글
export function grid({ w, h, mode = 'area', wl = '', hl = '', label = '' }) {
  if (!(w >= 1) || !(h >= 1) || w > 30 || h > 20) return '';
  const cs = Math.max(8, Math.min(28, Math.floor(280 / w), Math.floor(118 / h))), LX = hl ? tw(hl, 14) + 12 : 4, TY = wl ? 22 : 4;
  let s = '';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) s += `<rect x="${LX + i * cs}" y="${TY + j * cs}" width="${cs}" height="${cs}" class="cell${mode === 'area' ? ' on' : ''} thin"/>`;
  s += `<rect x="${LX}" y="${TY}" width="${w * cs}" height="${h * cs}" class="${mode === 'peri' ? 'p-edge' : 'p-ln'}"/>`;
  if (wl) s += T(LX + (w * cs) / 2, 15, wl, 14, '', 'middle', true);
  if (hl) s += T(LX - 6, TY + (h * cs) / 2 + 5, hl, 14, '', 'end', true);
  return wrap(LX + w * cs + 4, TY + h * cs + 4, label || `가로 ${w}칸, 세로 ${h}칸 모눈 직사각형${mode === 'peri' ? ' — 테두리 표시' : ''}`, s);
}

const KINDS = { split, tiles, array, share, bars, line, clock, grid };
/* spec = { t: 틀 이름, …그 틀의 값 } → SVG 글자(틀이 없거나 그릴 수 없으면 '') */
export function picSVG(spec) {
  if (!spec || !KINDS[spec.t]) return '';
  try { return KINDS[spec.t](spec) || ''; } catch (e) { return ''; }
}
