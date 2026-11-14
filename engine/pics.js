// 그림 틀 — 문제의 수로 그리는 작은 SVG(방향 11-10 차례 1 · docs/direction_1110.md '그림 틀이 공통 병목')
//  틀: split 가르기 띠 · tiles 똑같은 칸 · array 배열 · share 똑같이 나눈 묶음 · bars 분수 띠 · line 눈금(수직선 · 뛰어 세기) · clock 시계 · grid 모눈
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
      s += `<rect x="${x}" y="${y}" width="${tl}" height="${rh}" class="cell on"/>${tl >= 16 ? T(x + tl / 2, y + rh / 2 + 5, 1, 14, '', 'middle', true) : ''}${gone ? cross(x, y, tl, rh) : ''}`;   /* 온전한 하나에 '1' — 분수 띠 한 칸과 크기가 달라도 1로 읽히게 */
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

// ── 눈금 ── 수직선(min~max) · ticks = [{ v, big, lab }] · marks = [{ v, lab }](깃발 · dot이면 선 위에 점만 — open이면 ○) · arcs = [{ a, b, da(점선 — 넘어감), lab }] 뛰어 세기 · gap = [a, b] 굵게 칠할 사이
export function line({ min = 0, max, ticks = [], marks = [], arcs = [], gap = null, w = 440, label = '' }) {
  if (!(max > min)) return '';
  const x0 = 24, x1 = w - 24, xv = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0), y = arcs.length ? 76 : marks.some((m) => !m.dot) ? 44 : 16;
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
    if (m.dot) { s += `<circle cx="${r1(xv(m.v))}" cy="${y}" r="6" class="p-pt${m.open ? ' op' : ''}"/>`; return; }   /* 수의 범위 — ● 들어감 · ○ 안 들어감 */
    const x = r1(xv(m.v)), top = arcs.length ? 22 : 20;
    s += `<path d="M${x} ${y} V${top}" class="p-ln da th"/><circle cx="${x}" cy="${y}" r="4.5" class="p-pt"/>` + T(Math.max(18, Math.min(w - 18, x)), top - 5, m.lab != null ? m.lab : m.v, 15, '', 'middle', true);
  });
  return wrap(w, y + 36, label || `${min}부터 ${max}까지 수직선${marks.length ? ` — ${marks.map((m) => (m.lab != null ? m.lab : m.v)).join(', ')} 표시` : ''}${arcs.length ? ` · ${arcs.filter((a) => !a.da).length}번 뛰어 세기` : ''}`, s);
}

// ── 시계 ── h시 m분 · sweep = 긴바늘이 한 바퀴 도는 화살표(1시간 = 60분) · gap = 짧은바늘이 있는 두 숫자 사이를 칠함(지나온 숫자가 '시')
//   jumps = 12에서 긴바늘까지 숫자 한 칸씩 뛰는 화살(두 칸부터 첫 칸에 '5분') + 숫자를 지나 더 간 작은 눈금을 굵게
export function clock({ h = 12, m = 0, sweep = false, gap = false, jumps = false, r = 60, label = '' }) {
  const c = r + (jumps ? 30 : sweep ? 18 : 6), pt = (deg, len) => [c + len * Math.sin((deg * Math.PI) / 180), c - len * Math.cos((deg * Math.PI) / 180)];
  const k5 = Math.floor(m / 5), xy = (deg, len) => { const [x, y] = pt(deg, len); return `${r1(x)} ${r1(y)}`; };
  let s = `<circle cx="${c}" cy="${c}" r="${r}" class="p-box"/>`;
  if (gap) s += `<path d="M${c} ${c} L${xy((h % 12) * 30, r - 2)} A${r - 2} ${r - 2} 0 0 1 ${xy((h % 12) * 30 + 30, r - 2)} Z" class="p-f1"/>`;
  for (let k = 0; k < 60; k++) {
    const big = k % 5 === 0, on = jumps && k > k5 * 5 && k <= m;
    s += `<path d="M${xy(k * 6, r - (big || on ? 8 : 4))} L${xy(k * 6, r - 1)}" class="${on ? 'p-arc' : `p-ln${big ? '' : ' th'}`}"/>`;
  }
  s += `<path d="M${c} ${c} L${xy(((h % 12) + m / 60) * 30, r * 0.5)}" class="p-hand"/><path d="M${c} ${c} L${xy(m * 6, r * 0.84)}" class="p-hand min"/><circle cx="${c}" cy="${c}" r="3.5" class="p-pt"/>`;
  /* 숫자는 바늘 위에 흰 테를 둘러 그림(긴바늘이 7 · 6을 덮던 것) · gap이면 짧은바늘이 지나온 숫자를 진하게 */
  for (let k = 1; k <= 12; k++) { const [x, yy] = pt(k * 30, r - 19), on = gap && k === ((h - 1) % 12) + 1; s += T(x, yy + 5, k, on ? 15 : 13, on ? 'ac halo' : 'halo', 'middle', on); }
  if (jumps) {
    for (let j = 1; j <= k5; j++) s += `<path d="M${xy(j * 30 - 27, r + 4)} Q${xy(j * 30 - 15, r + 17)} ${xy(j * 30 - 3, r + 4)}" class="p-arc"/>`;
    if (k5 >= 2) { const [x, y] = pt(15, r + 21); s += T(x, y + 4, '5분', 12, 'ac', 'middle', true); }
  }
  if (sweep) { const R = r + 9, [ax, ay] = pt(8, R), [bx, by] = pt(352, R); s += `<path d="M${r1(ax)} ${r1(ay)} A${R} ${R} 0 1 1 ${r1(bx)} ${r1(by)}" class="p-arc"/><path d="M${r1(bx + 9)} ${r1(by - 5)} L${r1(bx)} ${r1(by)} L${r1(bx + 2)} ${r1(by + 10)}" class="p-arc"/>`; }
  return wrap(2 * c, 2 * c, label || `${h}시${m ? ` ${m}분을` : '를'} 가리키는 시계${sweep ? ' — 긴바늘이 한 바퀴 돎' : ''}`, s);
}

// ── 자 ── 0~max cm 눈금 자에 색 테이프를 올림(a 눈금부터 b 눈금까지) · cells = 테이프를 1 cm 칸으로 나눔(칸을 셈) · hi = 양 끝 눈금의 숫자를 진하게
export function ruler({ a = 0, b = 5, max = 10, cells = false, hi = false, label = '' }) {
  if (!(b > a) || a < 0 || b > max || max > 12) return '';
  const u = Math.min(24, 252 / max), x0 = 14, xv = (v) => r1(x0 + v * u), W = x0 + max * u + 14, yt = 6, ht = 24, yr = 32, hr = 40;
  let s = `<rect x="${xv(a)}" y="${yt}" width="${r1((b - a) * u)}" height="${ht}" class="p-f1 ol"/>`;
  if (cells) for (let k = a + 1; k < b; k++) s += `<path d="M${xv(k)} ${yt} v${ht}" class="p-ln th"/>`;
  s += `<rect x="2" y="${yr}" width="${r1(W - 4)}" height="${hr}" rx="3" class="p-box"/>`;
  for (let k = 0; k <= max; k++) {
    const on = hi && (k === a || k === b);
    s += `<path d="M${xv(k)} ${yr} v13" class="p-ln th"/>` + T(x0 + k * u, yr + 30, k, 13, on ? 'ac' : '', 'middle', on);   /* 1 cm 눈금만(반 눈금이 있으면 1 cm가 두 칸으로 보임 · 2학년 자) */
  }
  return wrap(W, yr + hr + 4, label || `자 위의 색 테이프 — 왼쪽 끝은 눈금 ${a}, 오른쪽 끝은 눈금 ${b}`, s);
}

// ── 모눈 ── 가로 w칸 · 세로 h칸 직사각형 · mode 'area' = 칸을 칠함(넓이) · 'peri' = 테두리를 굵게(둘레) · wl · hl = 변에 적는 글
//  size = 한 칸의 크기를 정해 줌(칸 하나를 크게 — 1 m² 정사각형) · mid = 가운데에 적는 글
export function grid({ w, h, mode = 'area', wl = '', hl = '', size = 0, mid = '', label = '' }) {
  if (!(w >= 1) || !(h >= 1) || w > 30 || h > 20) return '';
  const cs = size > 0 ? Math.min(size, Math.floor(280 / w), Math.floor(118 / h)) : Math.max(8, Math.min(28, Math.floor(280 / w), Math.floor(118 / h))), LX = hl ? tw(hl, 14) + 12 : 4, TY = wl ? 22 : 4;
  let s = '';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) s += `<rect x="${LX + i * cs}" y="${TY + j * cs}" width="${cs}" height="${cs}" class="cell${mode === 'area' ? ' on' : ''} thin"/>`;
  s += `<rect x="${LX}" y="${TY}" width="${w * cs}" height="${h * cs}" class="${mode === 'peri' ? 'p-edge' : 'p-ln'}"/>`;
  if (wl) s += T(LX + (w * cs) / 2, 15, wl, 14, '', 'middle', true);
  if (hl) s += T(LX - 6, TY + (h * cs) / 2 + 5, hl, 14, '', 'end', true);
  if (mid) s += T(LX + (w * cs) / 2, TY + (h * cs) / 2 + 6, mid, 16, '', 'middle', true);
  return wrap(LX + w * cs + 4, TY + h * cs + 4, label || `가로 ${w}칸, 세로 ${h}칸 모눈 직사각형${mode === 'peri' ? ' — 테두리 표시' : ''}`, s);
}

// ── 자리 표 ── 자리 이름(10 · 1 · 0.1 …) 아래 한 칸에 숫자 하나 · 소수점은 일의 자리 칸 오른쪽 금 위에
//  rows = [{ ds: 칸마다 숫자('' = 빈칸), on: 지금 볼 칸(여럿이면 배열) }] · hop = { from, to, text } 첫 줄 칸에서 둘째 줄 칸으로 가는 화살표
export function place({ cols = [], rows = [], hop = null, label = '' }) {
  if (!cols.length || !rows.length) return '';
  const cw = Math.min(74, Math.floor(440 / cols.length)), W = cw * cols.length + 4, rh = 46, gap = 44, dot = cols.indexOf('1');
  const cx = (i) => 2 + cw * i + cw / 2, ys = [];
  let s = cols.map((c, i) => T(cx(i), 17, c, 15, 'mu')).join(''), y = 26;
  rows.forEach((r, k) => {
    ys.push(y);
    cols.forEach((_, i) => {
      const d = r.ds ? r.ds[i] : '';
      s += `<rect x="${2 + cw * i}" y="${y}" width="${cw}" height="${rh}" class="p-box${[].concat(r.on).includes(i) ? ' now' : ''}"/>`;
      if (d != null && d !== '') s += T(cx(i), y + 33, d, 28, '', 'middle', true);
    });
    if (dot >= 0 && dot < cols.length - 1) s += `<circle cx="${2 + cw * (dot + 1)}" cy="${y + rh - 10}" r="4.2" class="p-t"/>`;   /* 소수점 — 글자 '.'은 작아 안 보여 점으로 */
    y += rh + (k < rows.length - 1 ? gap : 0);
  });
  if (hop && rows.length > 1) {
    const x0 = cx(hop.from), y0 = ys[0] + rh + 4, x1 = cx(hop.to), y1 = ys[1] - 5, a = Math.atan2(y1 - y0, x1 - x0), right = x1 > x0;
    const wing = (t) => `L${r1(x1 - 9 * Math.cos(a + t))} ${r1(y1 - 9 * Math.sin(a + t))}`;
    s += `<path d="M${r1(x0)} ${r1(y0)} L${r1(x1)} ${r1(y1)} ${wing(0.5)} M${r1(x1)} ${r1(y1)} ${wing(-0.5)}" class="p-arc"/>`;
    if (hop.text) s += T((x0 + x1) / 2 + (right ? 8 : -8), y0 + 11, hop.text, 15, 'ac', right ? 'start' : 'end', true);
  }
  return wrap(W, y + 2, label, s);
}

// ── 식 꼴 칸 ── 식 모양 그대로 [칸] + [칸] = [칸] · 칸 위에 이름(더해지는 수 …) · 칸 안에 앞 식보다 바뀐 만큼('20 커짐' · '그대로' · '?')
export function eqbox({ heads = [], ops = [], vals = [], on = -1, label = '' }) {
  if (!vals.length) return '';
  const bw = Math.round(Math.min(122, Math.max(92, ...vals.map((v) => tw(v, 19) + 22), ...heads.map((h) => tw(h, 15) + 10)))), og = 34, bh = 40, y = 22;
  let s = '', x = 2;
  vals.forEach((v, j) => {
    if (j) { s += T(x + og / 2, y + 28, ops[j - 1] || '', 24, '', 'middle', true); x += og; }
    s += T(x + bw / 2, 15, heads[j] || '', 15, 'mu');
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" class="p-box${on === j ? ' now' : ''}"/>`;
    s += T(x + bw / 2, y + 27, v, v === '?' ? 24 : 19, v === '그대로' || v === '?' ? '' : 'ac', 'middle', true);
    x += bw;
  });
  return wrap(x + 2, y + bh + 2, label, s);
}

// ── 도형 그림(측정) ── 각 · 삼각형 · 사각형 · 넓이 도형 · 상자 — 문제 속 그림으로도 씀(engine/lessons/me.js · 길이와 각도를 그림에서 읽음)
//  각도는 그 크기대로 그림 · 길이는 어림(큰 수일수록 길게 — 꼭 맞는 비율은 아님) · 도움 사다리에서는 같은 그림에 색만 얹음
const RAD = Math.PI / 180, clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pt = (p) => `${r1(p[0])} ${r1(p[1])}`;
const polyD = (ps) => `M${ps.map(pt).join(' L')} Z`;
/* 꼭짓점 V의 각 — 두 변 쪽 점 P · N 사이에 작은 호 + 각 안쪽에 글(좁은 각일수록 글이 멀리) · fill = 부채꼴 칠 */
const cornerOf = (V, P, N) => {
  const a1 = Math.atan2(P[1] - V[1], P[0] - V[0]), a2 = Math.atan2(N[1] - V[1], N[0] - V[0]);
  let da = a2 - a1; while (da <= -Math.PI) da += 2 * Math.PI; while (da > Math.PI) da -= 2 * Math.PI;
  return { a1, a2, da, at: (ang, len) => [V[0] + len * Math.cos(ang), V[1] + len * Math.sin(ang)] };
};
const cornerLab = (c, lab, r = 16) => c.at(c.a1 + c.da / 2, clamp((tw(lab, 15) / 2 + 6) / Math.tan(Math.min(Math.abs(c.da) / 2, 1.5)), r + 13, 82));
function corner(V, P, N, lab, { r = 16, fill = '' } = {}) {
  const c = cornerOf(V, P, N), { a1, a2, da, at } = c, arc = `${pt(at(a1, r))} A${r} ${r} 0 0 ${da > 0 ? 1 : 0} ${pt(at(a2, r))}`;
  const sq = !fill && Math.abs(Math.abs(da) - Math.PI / 2) < 0.01, q1 = at(a1, 11), q2 = at(a2, 11);   /* 직각은 호 대신 네모 표시 */
  let s = (fill ? `<path d="M${pt(V)} L${arc} Z" class="${fill}"/>` : '') + (sq ? `<path d="M${pt(q1)} L${pt([q1[0] + q2[0] - V[0], q1[1] + q2[1] - V[1]])} L${pt(q2)}" class="p-ln th"/>` : `<path d="M${arc}" class="p-ln th"/>`);
  if (lab) { const [x, y] = cornerLab(c, lab, r); s += T(x, y + 5.5, lab, 15, '', 'middle', true); }
  return s;
}
/* 각의 크기(도)로 삼각형 · 사각형 꼭짓점 — 밑변 1 · y는 위쪽 · 차례는 왼쪽 아래부터 시계 반대 방향 */
function polyPts(angs) {
  const [A, B, C] = angs.map((v) => v * RAD);
  if (angs.length === 3) { const b = Math.sin(B) / Math.sin(C); return [[0, 0], [1, 0], [b * Math.cos(A), b * Math.sin(A)]]; }
  let best = null;
  for (let t = 0.3; t <= 3.01; t += 0.05) {   /* 오른쪽 변 길이를 바꿔 가며 네 변이 고른 모양을 고름 */
    const e1 = 1 - t * Math.cos(B), e2 = t * Math.sin(B), det = Math.sin(A + B + C), sd = (e1 * Math.sin(B + C) + e2 * Math.cos(B + C)) / det, rd = (Math.cos(A) * e2 - Math.sin(A) * e1) / det;
    if (!(sd > 0.2) || !(rd > 0.2)) continue;
    const ps = [[0, 0], [1, 0], [1 - t * Math.cos(B), t * Math.sin(B)], [sd * Math.cos(A), sd * Math.sin(A)]], xs = ps.map((q) => q[0]), ys = ps.map((q) => q[1]);
    const sc = Math.min(1, t, sd, rd) / Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * 2);
    if (!best || sc > best.sc) best = { sc, ps };
  }
  return best && best.ps;
}
const fitPts = (m, mw, mh, ox = 6, oy = 6) => {
  const xs = m.map((q) => q[0]), ys = m.map((q) => q[1]), x0 = Math.min(...xs), y1 = Math.max(...ys), w = Math.max(...xs) - x0, h = y1 - Math.min(...ys), sc = Math.min(mw / w, mh / h);
  return { ps: m.map(([x, y]) => [ox + (x - x0) * sc, oy + (y1 - y) * sc]), w: w * sc, h: h * sc };
};

// ── 각 ── kind 'line' = 직선을 두 각으로 · 'round' = 한 바퀴를 두 각으로 · a = 첫 각(도) · labs = 두 각에 적는 글 · whole = 두 각의 호 대신 직선 · 한 바퀴 전체를 도는 굵은 호 하나
export function ang({ kind = 'line', a = 60, labs = [], whole = false, label = '' }) {
  const round = kind === 'round';
  if (!(a > 5) || a >= (round ? 355 : 175)) return '';
  const L = round ? 66 : 96, dir = (deg, len) => [len * Math.cos(deg * RAD), -len * Math.sin(deg * RAD)], pts = [[0, 0], dir(0, round ? L : 118), dir(a, L)];
  if (!round) pts.push(dir(180, 118));
  const parts = [], arcOf = (from, span, r, cls) => `<path d="M${pt(dir(from, r))} A${r} ${r} 0 ${span > 180 ? 1 : 0} 0 ${pt(dir(from + span, r))}" class="${cls}"/>`;
  const mark = (from, span, r, text) => {
    if (!whole) parts.push(arcOf(from, span, r, 'p-ln th'));
    if (!text) return;
    const [x, y] = dir(from + span / 2, clamp((tw(text, 15) / 2 + 6) / Math.tan(Math.min(span / 2, 85) * RAD), (whole ? 32 : r) + 14, 84)), hw = tw(text, 15) / 2 + 2;
    parts.push(T(x, y + 5.5, text, 15, '', 'middle', true)); pts.push([x - hw, y - 10], [x + hw, y + 10]);
  };
  mark(0, a, 22, labs[0] || ''); mark(a, (round ? 360 : 180) - a, round ? 31 : 15, labs[1] || '');
  if (round) pts.push([-33, -33], [33, 33]);
  if (whole) parts.push(round ? '<circle cx="0" cy="0" r="27" class="p-arc"/>' : arcOf(0, 180, 27, 'p-arc'));
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), x0 = Math.min(...xs) - 6, y0 = Math.min(...ys) - 6, W = Math.max(...xs) - x0 + 6, H = Math.max(...ys) - y0 + 8;
  const ray = (q) => `<path d="M0 0 L${pt(q)}" class="p-ln"/>`;
  const body = (round ? ray(dir(0, L)) : `<path d="M${pt(dir(180, 118))} L${pt(dir(0, 118))}" class="p-ln"/>`) + ray(dir(a, L)) + parts.join('') + '<circle cx="0" cy="0" r="3" class="p-t"/>';
  return wrap(W, H, label || `${round ? '한 바퀴를' : '직선을'} 두 각으로 나눈 그림${labs.filter(Boolean).length ? ` — ${labs.filter(Boolean).join(', ')}` : ''}`, `<g transform="translate(${r1(-x0)} ${r1(-y0)})">${body}</g>`);
}

/* 삼각형 · 사각형을 몇 번째 각부터 그릴지 — k0부터 차례로 돌려 보고, 납작하지 않고 각 글이 서로 · 변에 안 닿는 첫 자리(없으면 가장 나은 자리) · 문제와 도움 그림이 같은 자리를 씀 */
const turned = (xs, k) => xs.map((_, i) => xs[(i + k) % xs.length]);
function polyBad(angs) {
  const m = polyPts(angs); if (!m) return 1e6;
  const n = angs.length, { ps, w } = fitPts(m, 250, 122), side = (k) => Math.hypot(ps[(k + 1) % n][0] - ps[k][0], ps[(k + 1) % n][1] - ps[k][1]);
  let bad = Math.max(0, 118 - w) * 2 + Math.max(0, 54 - Math.min(...ps.map((_, k) => side(k)))) * 2;
  const bx = ps.map((V, k) => { const [x, y] = cornerLab(cornerOf(V, ps[(k + n - 1) % n], ps[(k + 1) % n]), '140°'); return [x - 19, y - 10, x + 19, y + 10]; });
  const inside = ([x, y]) => ps.every((A, k) => { const B = ps[(k + 1) % n]; return (B[0] - A[0]) * (y - A[1]) - (B[1] - A[1]) * (x - A[0]) < 0.5; });   /* 화면 좌표(y 아래쪽)에서 시계 반대 방향 꼭짓점 → 안쪽은 음수 */
  bx.forEach((b, i) => {
    if (![[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]].every(inside)) bad += 40;
    for (let j = i + 1; j < n; j++) if (b[0] < bx[j][2] && bx[j][0] < b[2] && b[1] < bx[j][3] && bx[j][1] < b[3]) bad += 100;
  });
  return bad;
}
export function polyTurn(angs, k0 = 0) {
  const n = angs.length; let best = 0, bv = Infinity;
  for (let i = 0; i < n; i++) { const k = (k0 + i) % n, v = polyBad(turned(angs, k)); if (v === 0) return k; if (v < bv) { bv = v; best = k; } }
  return best;
}
export const polyTurned = turned;
// ── 삼각형 · 사각형(각) ── angs = 각의 크기(왼쪽 아래부터 시계 반대 방향) · labs = 각마다 적는 글 · diag = 사각형을 대각선으로 나눈 두 삼각형(두 색 · 각 글은 그대로)
export function poly({ angs = [], labs = [], diag = false, label = '' }) {
  const n = angs.length;
  if ((n !== 3 && n !== 4) || Math.abs(angs.reduce((x, y) => x + y, 0) - (n - 2) * 180) > 0.5 || angs.some((v) => !(v > 5 && v < 175))) return '';
  const m = polyPts(angs); if (!m) return '';
  const { ps, w, h } = fitPts(m, 250, 122);
  let s = '';
  if (diag && n === 4) s += `<path d="${polyD([ps[0], ps[1], ps[2]])}" class="p-f2"/><path d="${polyD([ps[0], ps[2], ps[3]])}" class="p-f1"/>`;
  s += `<path d="${polyD(ps)}" class="p-ln"/>`;
  if (diag && n === 4) {   /* 대각선 점선은 두 끝의 각 글을 피해 가운데만(두 삼각형은 색으로 보임) */
    const len = Math.hypot(ps[2][0] - ps[0][0], ps[2][1] - ps[0][1]), at = (t) => [ps[0][0] + (ps[2][0] - ps[0][0]) * t, ps[0][1] + (ps[2][1] - ps[0][1]) * t];
    const gap = (k) => { if (!labs[k]) return 0; const [x, y] = cornerLab(cornerOf(ps[k], ps[(k + 3) % 4], ps[(k + 1) % 4]), labs[k]); return (Math.hypot(x - ps[k][0], y - ps[k][1]) + 15) / len; };
    const t0 = gap(0), t1 = 1 - gap(2);
    if (t1 - t0 > 0.15) s += `<path d="M${pt(at(t0))} L${pt(at(t1))}" class="p-ln da"/>`;
  }
  ps.forEach((V, k) => { s += corner(V, ps[(k + n - 1) % n], ps[(k + 1) % n], labs[k] || ''); });
  const said = labs.filter(Boolean).length ? ` — 각 ${labs.filter(Boolean).join(', ')}` : '';
  return wrap(w + 12, h + 12, label || `${n === 3 ? '삼각형' : '사각형'}${diag ? ' — 대각선으로 삼각형 두 개로 나눔' : ''}${said}`, s);
}

// ── 세 각 모으기 ── 삼각형의 세 각(색칠한 부채꼴)을 한 점에 모으면 직선 — 왼쪽 삼각형 → 오른쪽 모은 모습 · labs = 각마다 적는 글
export function gather({ angs = [], labs = [], label = '' }) {
  if (angs.length !== 3 || Math.abs(angs[0] + angs[1] + angs[2] - 180) > 0.5 || angs.some((v) => !(v > 5 && v < 175))) return '';
  const F = ['p-f1', 'p-f2', 'p-f3'], { ps, w, h } = fitPts(polyPts(angs), 150, 80, 6, 0), top = 96 - h;
  const tp = ps.map(([x, y]) => [x, y + top]);
  let s = `<path d="${polyD(tp)}" class="p-ln"/>`;
  tp.forEach((V, k) => { s += corner(V, tp[(k + 2) % 3], tp[(k + 1) % 3], '', { r: 19, fill: F[k] }); });
  s += `<path d="${polyD(tp)}" class="p-ln"/>`;
  const ax = w + 22, cx = ax + 44 + 88, cy = 96, R = 58, dir = (deg, len) => [cx + len * Math.cos(deg * RAD), cy - len * Math.sin(deg * RAD)];
  s += `<path d="M${ax} 56 H${ax + 28} M${ax + 20} 49 L${ax + 28} 56 L${ax + 20} 63" class="p-arc"/>`;
  let from = 0;
  [0, 2, 1].forEach((k) => {   /* 직선 위에 왼쪽 아래 각 · 위 각 · 오른쪽 아래 각 차례로 */
    const v = angs[k];
    s += `<path d="M${cx} ${cy} L${pt(dir(from, R))} A${R} ${R} 0 0 0 ${pt(dir(from + v, R))} Z" class="${F[k]} ol"/>`;
    if (labs[k]) { const [x, y] = dir(from + v / 2, R + 6 + tw(labs[k], 14) / 2); s += T(x, Math.min(y + 5, cy - 4), labs[k], 14, '', 'middle', true); }
    from += v;
  });
  s += `<path d="M${cx - 88} ${cy} H${cx + 88}" class="p-ln"/>`;
  return wrap(cx + 96, cy + 8, label || '삼각형의 세 각을 한 점에 모으면 직선이 되는 그림', s);
}

// ── 넓이 도형 ── shape 'para' 평행사변형 · 'tri' 삼각형 · a 밑변 · h 높이(점선 + 직각 표시) · s 다른 한 변(없으면 0)
//  hi = 밑변과 높이를 굵게(다른 한 변의 글은 흐리게) · move = 평행사변형의 왼쪽 삼각형을 오른쪽으로 옮김 · twin = 똑같은 삼각형을 하나 더 붙임
export function areaf({ shape = 'para', a = 1, h = 1, s = 0, hi = false, move = false, twin = false, label = '' }) {
  const tri = shape === 'tri';
  if (!(a > 0) || !(h > 0)) return '';
  const sl = s ? `${s} cm` : '', LX = sl ? tw(sl, 15) + 14 : 6, T0 = 6, H = clamp(40 + h * 6, tri ? 80 : 58, tri ? 110 : 104);
  const fx = clamp(s > h ? Math.sqrt(s * s - h * h) / a : tri ? 0.42 : 0.3, tri ? 0.2 : 0.16, tri ? 0.8 : 0.5);
  /* 그림 폭 한도 — 옮기기 · 붙이기 그림은 432, 그 밖은 280(밑변이 긴 평행사변형이 370까지 넓어져 종이 칸에서 길이 글자가 5pt로 줄었음) */
  const W = Math.min(clamp(70 + a * 9, tri ? 170 : 110, tri ? 230 : 210), twin || move ? (424 - LX) / (1 + fx) : (272 - LX) / (tri ? 1 : 1 + fx)), dx = fx * W;
  const yb = T0 + H, A = [LX, yb], B = [LX + W, yb], Cq = tri ? [LX + dx, T0] : [LX + W + dx, T0], D = [LX + dx, T0], F = [LX + dx, yb];
  const right = !tri || W - dx >= dx, e = hi ? 'p-edge' : 'p-ln';
  let g = '';
  if (move && !tri) g += `<path d="${polyD([A, F, D])}" class="p-f1"/><path d="${polyD([B, [B[0] + dx, yb], Cq])}" class="p-f1 gh"/>`;
  if (twin && tri) g += `<path d="${polyD([B, [B[0] + dx, T0], Cq])}" class="p-f2 gh"/>`;
  g += `<path d="${polyD(tri ? [A, B, Cq] : [A, B, Cq, D])}" class="p-ln"/>`;
  g += `<path d="M${pt(D)} L${pt(F)}" class="p-ln da${hi ? ' hi' : ''}"/><path d="M${r1(F[0] + (right ? 8 : -8))} ${yb} v-8 H${r1(F[0])}" class="p-ln th"/>`;
  if (hi) g += `<path d="M${pt(A)} L${pt(B)}" class="${e}"/>`;
  if (move && !tri) { const y = T0 + H * 0.45, x0 = LX + dx * 0.55, x1 = B[0] + dx * 0.45; g += `<path d="M${r1(x0)} ${r1(y)} Q${r1((x0 + x1) / 2)} ${r1(y - 34)} ${r1(x1)} ${r1(y)} M${r1(x1 - 9)} ${r1(y - 7)} L${r1(x1)} ${r1(y)} L${r1(x1 - 10)} ${r1(y + 3)}" class="p-arc"/>`; }
  g += T((A[0] + B[0]) / 2, yb + 19, `${a} cm`, 15, hi ? 'ac' : '', 'middle', true);
  g += T(F[0] + (right ? 12 : -12), tri ? yb - 14 : T0 + H * 0.52 + 5, `${h} cm`, 15, hi ? 'ac' : '', right ? 'start' : 'end', true);
  if (sl) g += T((A[0] + D[0]) / 2 - 10, (A[1] + D[1]) / 2 - 3, sl, 15, hi ? 'mu' : '', 'end', true);
  const WW = Math.max(B[0], Cq[0], twin || move ? B[0] + dx : 0) + 8;
  return wrap(WW, yb + 26, label || `${tri ? '삼각형' : '평행사변형'} — 밑변 ${a} cm, 높이 ${h} cm${sl ? `, 다른 한 변 ${sl}` : ''}`, g);
}

// ── 상자 ── 직육면체 · a 가로 · b 세로(뒤로 들어가는 모서리) · c 높이 · faces = 칠할 면('top' · 'side' · 'front' — 차례대로 다른 색) · one = 한 색으로만
//  cubes = 쌓기나무 금 · layer = 맨 아래 한 층을 칠함
export function box({ a = 1, b = 1, c = 1, faces = [], one = false, cubes = false, layer = false, label = '' }) {
  if (!(a > 0) || !(b > 0) || !(c > 0)) return '';
  const wa = clamp(40 + (a - 2) * 12, 40, 170), hc = clamp(34 + (c - 2) * 8, 34, 90), dxx = clamp(20 + (b - 2) * 4.5, 20, 54), dyy = dxx * 0.55;
  const la = `${a} cm`, lb = `${b} cm`, lc = `${c} cm`, x = tw(lc, 15) + 12, y = 6 + dyy;
  const f = [[x, y + hc], [x + wa, y + hc], [x + wa, y], [x, y]], k = f.map(([px, py]) => [px + dxx, py - dyy]);
  const FACE = { front: [f[0], f[1], f[2], f[3]], top: [f[3], f[2], k[2], k[3]], side: [f[1], k[1], k[2], f[2]] }, TONE = { top: 'p-f2', side: 'p-f3', front: 'p-f1' };
  let s = '';
  faces.forEach((n) => { if (FACE[n]) s += `<path d="${polyD(FACE[n])}" class="${one ? 'p-f1' : TONE[n]}"/>`; });
  if (layer && cubes) { const yy = hc / c; s += `<path d="${polyD([f[0], f[1], [f[1][0], f[1][1] - yy], [f[0][0], f[0][1] - yy]])}" class="p-f1"/><path d="${polyD([f[1], k[1], [k[1][0], k[1][1] - yy], [f[1][0], f[1][1] - yy]])}" class="p-f1"/>`; }
  if (cubes && a <= 14 && b <= 10 && c <= 10) {
    let d = '';
    for (let i = 1; i < a; i++) { const px = x + (wa * i) / a; d += `M${r1(px)} ${r1(y + hc)} V${r1(y)} l${r1(dxx)} ${r1(-dyy)}`; }
    for (let j = 1; j < c; j++) { const py = y + (hc * j) / c; d += `M${r1(x)} ${r1(py)} H${r1(x + wa)} l${r1(dxx)} ${r1(-dyy)}`; }
    for (let q = 1; q < b; q++) { const ox = (dxx * q) / b, oy = (dyy * q) / b; d += `M${r1(x + ox)} ${r1(y - oy)} H${r1(x + wa + ox)} V${r1(y + hc - oy)}`; }
    s += `<path d="${d}" class="p-ln th mu"/>`;
  }
  if (!cubes && (one || faces.length < 2)) s += `<path d="M${pt(f[0])} L${pt(k[0])} L${pt(k[1])} M${pt(k[0])} L${pt(k[3])}" class="p-ln da"/>`;   /* 가려진 모서리 — 쌓기나무 · 세 면을 칠한 그림은 속이 찬 덩어리라 안 그림 */
  s += `<path d="${polyD(FACE.front)} ${polyD(FACE.top)} ${polyD(FACE.side)}" class="p-ln"/>`;
  s += T(x + wa / 2, y + hc + 19, la, 15, '', 'middle', true) + T(x - 7, y + hc / 2 + 5, lc, 15, '', 'end', true) + T((f[1][0] + k[1][0]) / 2 + 8, (f[1][1] + k[1][1]) / 2 + 14, lb, 15, '', 'start', true);
  return wrap(x + wa + Math.max(dxx + 4, dxx / 2 + 10 + tw(lb, 15)) + 4, y + hc + 26, label || `직육면체 — 가로 ${la}, 세로 ${lb}, 높이 ${lc}`, s);
}

// ── 원 ── r = 반지름 · d = 지름(준 쪽만 긋고 길이를 적음 · 둘 다 없으면 '반지름' 글자) · both = 다른 쪽을 진하게(지름 = 반지름 두 개)
//   sq = 반지름 × 반지름 정사각형을 칠함(원의 넓이) · roll = 한 바퀴 굴린 길이(원주 — 지름의 세 배보다 조금 더 · 굴린 길이에 수는 적지 않음 · d를 주면 원의 지름에 길이를 적음 — 문제 그림 자리에 그려도 준 수가 보이게)
export function circle({ r = 0, d = 0, both = false, sq = false, roll = false, label = '' }) {
  if (roll) {
    const R = 38, D = 2 * R, L = 3.14 * D, x0 = R + 8, cy = 8 + R, yl = cy + R + 2;
    let g = `<circle cx="${r1(x0 + L)}" cy="${cy}" r="${R}" class="p-ring"/><circle cx="${x0}" cy="${cy}" r="${R}" class="p-edge"/><path d="M${x0 - R} ${cy} H${x0 + R}" class="p-ln"/>` + T(x0, cy - 7, d ? `${d} cm` : '지름', 13);
    g += `<path d="M${x0} ${yl} H${r1(x0 + L)}" class="p-edge"/>`;
    for (let j = 0; j <= 3; j++) g += `<path d="M${x0 + j * D} ${yl - 6} v12" class="p-ln"/>`;
    g += `<path d="M${r1(x0 + L)} ${yl - 6} v12" class="p-ln"/>`;
    for (let j = 0; j < 3; j++) g += T(x0 + (j + 0.5) * D, yl + 22, '지름', 14, 'ac', 'middle', true);
    return wrap(x0 + L + R + 8, yl + 30, label || `${d ? `지름 ${d} cm인 ` : ''}원을 한 바퀴 굴린 길이 — 지름의 세 배보다 조금 더 김`, g);
  }
  const R = 54, cx = 8 + R, cy = 8 + R, sqt = '반지름 × 반지름';
  let g = sq ? `<path d="${polyD([[cx, cy], [cx + R, cy], [cx + R, cy - R], [cx, cy - R]])}" class="p-f1"/>` : '';
  g += `<circle cx="${cx}" cy="${cy}" r="${R}" class="p-ln"/>`;
  if (d) {
    g += `<path d="M${cx - R} ${cy} H${cx + R}" class="p-ln"/>` + (both ? `<path d="M${cx} ${cy} H${cx + R}" class="p-edge"/>` + T(cx, cy + 22, `지름 ${d} cm`, 14, '', 'middle', true) + T(cx + R / 2, cy - 9, '반지름', 13, 'ac', 'middle', true) : T(cx, cy - 9, `${d} cm`, 15, '', 'middle', true));
  } else {
    g += (both ? `<path d="M${cx - R} ${cy} H${cx + R}" class="p-edge"/>` + T(cx, cy + 22, '지름', 14, 'ac', 'middle', true) : `<path d="M${cx} ${cy} H${cx + R}" class="p-ln"/>`) + T(cx + R / 2, cy - 9, r ? `${r} cm` : '반지름', 15, '', 'middle', true);
  }
  g += `<circle cx="${cx}" cy="${cy}" r="3" class="p-pt"/>`;
  if (sq) g += T(cx + R + 10, cy - R / 2 + 5, sqt, 15, 'ac', 'start', true);
  return wrap(2 * R + 16 + (sq ? tw(sqt, 15) + 14 : 0), 2 * R + 16, label || (d ? `원 — 지름 ${d} cm` : r ? `원 — 반지름 ${r} cm` : '원'), g);
}

// ── 마름모 ── a = 가로 대각선 · b = 세로 대각선(비율대로 — 짧은 쪽이 아주 짧으면 44까지만 줄임) · 길이는 도형 밖 꺾쇠에 · boxed = 둘러싼 직사각형(점선) + 마름모 칠 · hi = 길이 글을 진하게
export function rhom({ a = 1, b = 1, boxed = false, hi = false, label = '' }) {
  if (!(a > 0) || !(b > 0)) return '';
  const k = Math.min(200 / a, 110 / b), W = Math.max(44, a * k), H = Math.max(44, b * k), bl = `${b} cm`, LX = tw(bl, 15) + 22, T0 = 6;
  const cx = LX + W / 2, cy = T0 + H / 2, Q = [[LX, cy], [cx, T0], [LX + W, cy], [cx, T0 + H]], yb = T0 + H + 9, xl = LX - 9;
  let g = boxed ? `<rect x="${r1(LX)}" y="${T0}" width="${r1(W)}" height="${r1(H)}" class="p-ln da"/>` : '';
  g += `<path d="${polyD(Q)}" class="${boxed ? 'p-f1 ol' : 'p-ln'}"/><path d="M${pt(Q[0])} L${pt(Q[2])} M${pt(Q[1])} L${pt(Q[3])}" class="p-ln da"/>`;
  g += `<path d="M${r1(LX)} ${r1(yb - 4)} V${r1(yb)} H${r1(LX + W)} V${r1(yb - 4)}" class="p-ln th mu"/>` + T(cx, yb + 17, `${a} cm`, 15, hi ? 'ac' : '', 'middle', true);
  g += `<path d="M${r1(xl + 4)} ${T0} H${r1(xl)} V${r1(T0 + H)} H${r1(xl + 4)}" class="p-ln th mu"/>` + T(xl - 5, cy + 5, bl, 15, hi ? 'ac' : '', 'end', true);
  return wrap(LX + W + 8, yb + 23, label || `마름모 — 한 대각선 ${a} cm, 다른 대각선 ${b} cm`, g);
}

// ── 사다리꼴 ── a = 윗변 · b = 아랫변 · h = 높이 · twin = 똑같은 것을 거꾸로 붙임(평행사변형 — 밑변이 아랫변 + 윗변) · hi 'ab' = 윗변 · 아랫변을 진하게 · 'h' = 높이를 진하게
export function trap({ a = 1, b = 1, h = 1, twin = false, hi = '', label = '' }) {
  if (!(a > 0) || !(b > 0) || !(h > 0)) return '';
  const big = Math.max(a, b), LX = 8, T0 = 24, H = clamp(40 + h * 6, 58, 100), yb = T0 + H;
  const k = Math.min(clamp(70 + big * 8, 120, 200) / big, twin ? 400 / (a + b + 0.35 * Math.abs(a - b)) : 999);
  const wa = a * k, wb = b * k, off = Math.abs(wb - wa) * 0.35, down = wb >= wa, Lt = LX + (down ? off : 0), Lb = LX + (down ? 0 : off), hx = LX + off;
  const A = [Lb, yb], B = [Lb + wb, yb], C = [Lt + wa, T0], D = [Lt, T0], A2 = [Lt + wa + wb, T0], D2 = [Lb + wb + wa, yb], ab = hi === 'ab';
  let g = twin ? `<path d="${polyD([C, A2, D2, B])}" class="p-f2 gh"/>` : '';
  g += `<path d="${polyD([A, B, C, D])}" class="p-ln"/>`;
  g += `<path d="M${r1(hx)} ${T0} V${yb}" class="p-ln da${hi === 'h' ? ' hi' : ''}"/><path d="M${r1(hx + 8)} ${down ? yb : T0} v${down ? -8 : 8} H${r1(hx)}" class="p-ln th"/>`;
  if (ab) g += `<path d="M${pt(D)} L${pt(C)}" class="p-edge"/><path d="M${pt(A)} L${pt(twin ? D2 : B)}" class="p-edge"/>`;
  g += T((D[0] + C[0]) / 2, T0 - 7, `${a} cm`, 15, ab ? 'ac' : '', 'middle', true) + T((A[0] + B[0]) / 2, yb + 19, `${b} cm`, 15, ab ? 'ac' : '', 'middle', true);
  if (twin) g += T(B[0] + wa / 2, yb + 19, `${a} cm`, 15, ab ? 'ac' : 'mu', 'middle', true);
  g += T(hx + 10, T0 + H * 0.52 + 5, `${h} cm`, 15, hi === 'h' ? 'ac' : '', 'start', true);
  return wrap(Math.max(B[0], C[0], twin ? A2[0] : 0, twin ? D2[0] : 0) + 8, yb + 26, label || `사다리꼴 — 윗변 ${a} cm, 아랫변 ${b} cm, 높이 ${h} cm`, g);
}

const KINDS = { split, tiles, array, share, bars, line, clock, ruler, grid, place, eqbox, ang, poly, gather, areaf, box, circle, rhom, trap };
/* spec = { t: 틀 이름, …그 틀의 값 } → SVG 글자(틀이 없거나 그릴 수 없으면 '') */
//  k = 화면에 그리는 배율(문제 속 그림은 도움 그림보다 크게 — 좌표는 그대로 · width · height만)
export function picSVG(spec, k = 1) {
  if (!spec || !KINDS[spec.t]) return '';
  try {
    const svg = KINDS[spec.t](spec) || '';
    return k === 1 ? svg : svg.replace(/ width="([\d.]+)" height="([\d.]+)"/, (m, w, h) => ` width="${r1(w * k)}" height="${r1(h * k)}"`);
  } catch (e) { return ''; }
}
