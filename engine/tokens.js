// 문제 글을 '조각(token)' 배열로 쓴다. 화면(HTML)과 보고서(글)로 둘 다 바꿀 수 있게.
//   '글자'            일반 글
//   {f:[위, 아래]}    분수 — 위·아래는 수 또는 {b:i}(빈칸)
//   {m:[자연수, 위, 아래]} 대분수
//   {b:i}             수 빈칸 (i번째 답)
//   {svg:'<svg…>'}    그림
//   {br:1}            줄 바꿈

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function partHTML(p, opt) {
  if (p && typeof p === 'object' && 'b' in p) return blankHTML(p.b, opt, p.ph);
  return `<span class="num">${esc(p)}</span>`;
}
function blankHTML(i, opt, ph = '') {
  if (opt.static) {
    const v = opt.vals && opt.vals[i];
    return `<span class="blank-s${opt.marks && opt.marks[i] === false ? ' wrong' : ''}">${v == null || Number.isNaN(v) ? '□' : esc(v)}</span>`;
  }
  return `<input class="blank" data-i="${i}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="빈칸 ${i + 1}${ph ? ` (${esc(ph)})` : ''}"${ph ? ` placeholder="${esc(ph)}"` : ''}>`;   /* ph = 칸 안 흐린 안내(소수로 쓰는 칸) */
}

// 빈칸은 바로 앞 짧은 낱말(= · 5를) · 바로 뒤 첫 낱말(cm예요 · 번 · 개)과 한 덩이로 줄바꿈 — 'cm'나 '번'이 칸에서 떨어져 혼자 다음 줄로 가거나
//  칸만 줄 끝에 떨어져 어느 칸이 무슨 답인지 헷갈리던 것(처음 보는 눈 11-08) · 글자는 그대로 나눠 붙임(종이에서는 보이는 것이 같음)
const isBlank = (t) => t && typeof t === 'object' && 'b' in t;
const txHTML = (s) => `<span class="tx${/[가-힣]/.test(s) ? ' kr' : ''}">${esc(s)}</span>`;
export function toHTML(tokens, opt = {}) {
  const ts = [];
  for (const t of tokens || []) { const s = typeof t === 'number' ? String(t) : t; if (typeof s === 'string' && typeof ts[ts.length - 1] === 'string') ts[ts.length - 1] += s; else ts.push(s); }   /* 이어진 글 조각은 하나로('8877만' + ', ' — 쉼표가 앞 수와 떨어져 ' ,'로 보이던 것) */
  const out = [];
  let pre = '';
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (isBlank(t)) {
      let h = `${pre ? txHTML(pre) : ''}${tokHTML(t, opt)}`, k = i;
      while (typeof ts[k + 1] === 'string' && /^\s?\S{1,3}\s?$/.test(ts[k + 1]) && isBlank(ts[k + 2])) { h += txHTML(ts[k + 1]) + tokHTML(ts[k + 2], opt); k += 2; }   /* □ … □ · □ : □는 끝까지 한 덩이(나머지 칸만 다음 줄로 떨어지던 것) */
      let post = '';
      if (typeof ts[k + 1] === 'string') { const m = ts[k + 1].match(/^(\s?\S{1,8})(\s[\s\S]*)?$/); if (m) { post = m[1]; ts[k + 1] = m[2] || ''; } }
      out.push(pre || post || k > i ? `<span class="glue">${h}${post ? txHTML(post) : ''}</span>` : h);
      pre = ''; i = k; continue;
    }
    if (typeof t === 'string' && isBlank(ts[i + 1])) { const m = t.match(/^([\s\S]*\s)?(\S{1,6}\s?)$/); if (m) { if (m[1]) out.push(txHTML(m[1])); pre = m[2]; continue; } }
    if (t === '') continue;
    out.push(tokHTML(t, opt));
  }
  return out.join('');
}
function tokHTML(t, opt) {
  if (typeof t === 'string' || typeof t === 'number') return `<span class="tx${/[가-힣]/.test(String(t)) ? ' kr' : ''}">${esc(t)}</span>`;
  if (!t || typeof t !== 'object') return '';
  if ('f' in t) return `<span class="fr"><span class="fr-t">${partHTML(t.f[0], opt)}</span><span class="fr-b">${partHTML(t.f[1], opt)}</span></span>`;
  if ('m' in t) return `<span class="mx">${partHTML(t.m[0], opt)}<span class="fr"><span class="fr-t">${partHTML(t.m[1], opt)}</span><span class="fr-b">${partHTML(t.m[2], opt)}</span></span></span>`;
  if ('b' in t) return blankHTML(t.b, opt, t.ph);
  if ('svg' in t) return `<div class="pic">${t.svg}</div>`;
  if ('br' in t) return '<span class="br"></span>';
  return '';
}

function partText(p, vals) {
  if (p && typeof p === 'object' && 'b' in p) {
    const v = vals && vals[p.b];
    return v == null || Number.isNaN(v) ? '□' : String(v);
  }
  return String(p);
}
export function toText(tokens, vals) {
  return (tokens || []).map((t) => {
    if (typeof t === 'string' || typeof t === 'number') return String(t);
    if ('f' in t) return `${partText(t.f[0], vals)}/${partText(t.f[1], vals)}`;
    if ('m' in t) return `${partText(t.m[0], vals)} ${partText(t.m[1], vals)}/${partText(t.m[2], vals)}`;
    if ('b' in t) return partText(t, vals);
    if ('svg' in t) return '[그림]';
    if ('br' in t) return ' ';
    return '';
  }).join('').replace(/\s+/g, ' ').trim();
}

// 빈칸 개수 = 가장 큰 번호 + 1
export function blankCount(tokens) {
  let n = 0;
  const see = (p) => { if (p && typeof p === 'object' && 'b' in p) n = Math.max(n, p.b + 1); };
  (tokens || []).forEach((t) => {
    if (t && typeof t === 'object') {
      if ('b' in t) see(t);
      if ('f' in t) t.f.forEach(see);
      if ('m' in t) t.m.forEach(see);
    }
  });
  return n;
}

// ── 그림 ── 색은 CSS(currentColor·클래스)로 — 밝은/어두운 화면 둘 다
export function dots(n, { cols = 5, r = 9, gap = 26 } = {}) {
  const rows = Math.ceil(n / cols);
  const w = Math.min(n, cols) * gap + 8, h = rows * gap + 8;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = 4 + gap / 2 + (i % cols) * gap, y = 4 + gap / 2 + Math.floor(i / cols) * gap;
    s += `<circle cx="${x}" cy="${y}" r="${r}" class="dot"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="점 ${n}개">${s}</svg>`;
}

// k묶음 × 각 n개 — 묶음마다 둥근 테두리
export function groups(k, n, { r = 8, gap = 22 } = {}) {
  const cols = Math.min(n, 5), rows = Math.ceil(n / cols);
  const gw = cols * gap + 10, gh = rows * gap + 10;
  const per = Math.min(k, 5);
  const W = per * (gw + 10) + 4, H = Math.ceil(k / per) * (gh + 10) + 4;
  let s = '';
  for (let g = 0; g < k; g++) {
    const ox = 4 + (g % per) * (gw + 10), oy = 4 + Math.floor(g / per) * (gh + 10);
    s += `<rect x="${ox}" y="${oy}" width="${gw}" height="${gh}" rx="10" class="grp"/>`;
    for (let i = 0; i < n; i++) {
      const x = ox + 5 + gap / 2 + (i % cols) * gap, y = oy + 5 + gap / 2 + Math.floor(i / cols) * gap;
      s += `<circle cx="${x}" cy="${y}" r="${r}" class="dot"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${n}개씩 ${k}묶음">${s}</svg>`;
}

// 막대를 d칸으로 똑같이 나누고 앞의 n칸 색칠
export function bar(d, n, { w = 300, h = 46 } = {}) {
  let s = '';
  const cw = w / d;
  for (let i = 0; i < d; i++) s += `<rect x="${2 + i * cw}" y="2" width="${cw}" height="${h}" class="${i < n ? 'cell on' : 'cell'}"/>`;
  return `<svg viewBox="0 0 ${w + 4} ${h + 4}" width="${w + 4}" height="${h + 4}" role="img" aria-label="${d}칸 중 ${n}칸 색칠">${s}</svg>`;
}

// 원을 d조각으로 똑같이 나누고 n조각 색칠
export function pie(d, n, { r = 70 } = {}) {
  const c = r + 4;
  let s = '';
  for (let i = 0; i < d; i++) {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    s += `<path d="M${c} ${c}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" class="${i < n ? 'cell on' : 'cell'}"/>`;
  }
  return `<svg viewBox="0 0 ${2 * c} ${2 * c}" width="${2 * c}" height="${2 * c}" role="img" aria-label="원 ${d}조각 중 ${n}조각 색칠">${s}</svg>`;
}

// 두 막대(같은 길이)를 위아래로 — 단위분수 크기 비교용
export function twoBars(d1, n1, d2, n2, { w = 300, h = 34 } = {}) {
  const row = (d, n, y) => {
    let s = ''; const cw = w / d;
    for (let i = 0; i < d; i++) s += `<rect x="${2 + i * cw}" y="${y}" width="${cw}" height="${h}" class="${i < n ? 'cell on' : 'cell'}"/>`;
    return s;
  };
  return `<svg viewBox="0 0 ${w + 4} ${2 * h + 16}" width="${w + 4}" height="${2 * h + 16}" role="img" aria-label="두 막대">${row(d1, n1, 2)}${row(d2, n2, h + 12)}</svg>`;
}

// 수직선 — 0부터 max까지를 1/d씩 눈금 · 자연수 눈금은 길게 + 숫자 · at번째 눈금 위에 ▼ (분수를 수직선 위의 '수'로 [B-R22][B-R25])
export function numLine(d, max, at, { w = 440 } = {}) {
  const x0 = 18, x1 = w - 18, n = d * max, step = (x1 - x0) / n, y = 44;
  let s = `<path d="M${x0} ${y} H${x1 + 8}" stroke="currentColor" stroke-width="2"/><path d="M${x1 + 8} ${y} l-7 -5 v10z" fill="currentColor"/>`;
  for (let k = 0; k <= n; k++) {
    const x = (x0 + k * step).toFixed(1), big = k % d === 0;
    s += `<path d="M${x} ${y - (big ? 11 : 7)} V${y + (big ? 11 : 7)}" stroke="currentColor" stroke-width="${big ? 2 : 1.4}"/>`;
    if (big) s += `<text x="${x}" y="${y + 30}" text-anchor="middle" font-size="17" fill="currentColor">${k / d}</text>`;
  }
  const ax = (x0 + at * step).toFixed(1);
  s += `<path d="M${ax} ${y - 14} l-7 -12 h14z" fill="currentColor"/>`;
  return `<svg viewBox="0 0 ${w} 82" width="${w}" height="82" role="img" aria-label="0부터 ${max}까지 수직선을 ${d}칸씩 똑같이 나누고 ${at}번째 눈금을 가리킨 그림">${s}</svg>`;
}
