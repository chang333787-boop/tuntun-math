// 끊긴 곳 찾기 — 종이(아이 종이 · 정답 겹쳐 보기 · 보충지) 그리기와 쪽 나누기(브라우저)
//  아이 종이: 학년 · 칸 이름 · 채점 표시 · 시간 칸 없음 · 답 칸이 자릿수를 알려 주지 않음 · 나눗셈은 모두 몫 · 나머지 칸 · 쪽 번호만(전체 쪽 수 없음)
//  쪽 나누기는 실제로 그려 재서 — 넘치면 줄째 다음 쪽으로 · 남는 높이는 줄마다 나눠 풀이 자리로
import { toHTML, toText } from '../../engine/tokens.js';
import { readExpr } from '../../engine/errors.js';
import { LES, lessonName, STRAND, GL, KIND, strandOf } from './gen.js';
import { mascot, plankStrip, STRAND_ICON } from './mascot.js';
// 아이에게 보이는 영역 이름 — '○○ 다리'
const BRIDGE = { N: '수 다리', A: '덧셈 · 뺄셈 다리', M: '곱셈 다리', D: '나눗셈 다리', F: '분수 · 소수 다리', R: '규칙 다리' };
const POSES = ['point', 'think', 'hi', 'fix'];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NUMS = '①②③④⑤⑥⑦⑧⑨';
// 문장이 끝난 뒤 식이 오면 줄을 바꿈
const withBr = (ts) => ts.flatMap((t, i) => (typeof t === 'string' && /[.?]\s*$/.test(t) && /[가-힣]/.test(t) && i < ts.length - 1 && !(ts[i + 1] && ts[i + 1].br) ? [t.trimEnd(), { br: 1 }] : [t]));
const digits = (n) => String(n).split('');
const ansStr = (it) => {   // 빈칸 값만 차례로 — 분수 칸은 분수 꼴 · 몫 … 나머지
  const p = it.snap.prompt, v = it.snap.sol.map(String), isB = (x) => x && typeof x === 'object' && 'b' in x, val = (x) => (isB(x) ? v[x.b] : String(x)), out = [];
  if (it.snap.choices) return `${NUMS[Number(v[0])] || ''} ${toText(it.snap.choices[Number(v[0])])}`.replace('[그림]', '그림');
  let dots = false;
  for (const t of p) {
    if (typeof t === 'string') { if (t.includes('…') && out.length) dots = true; else if (/\S/.test(t)) dots = false; continue; }
    let piece = null;
    if (isB(t)) piece = val(t); else if (t && 'f' in t && t.f.some(isB)) piece = `${val(t.f[0])}/${val(t.f[1])}`; else if (t && 'm' in t && t.m.some(isB)) piece = `${val(t.m[0])} ${val(t.m[1])}/${val(t.m[2])}`;
    if (piece == null) continue;
    if (dots) { out[out.length - 1] += ` … ${piece}`; dots = false; } else out.push(piece);
  }
  return out.join(' · ');
};
export { ansStr };

// ── 문항 한 칸 ──
function vertical(it, key) {
  const X = readExpr(it.snap); if (!X) return null;
  const A = X.A.i, Bn = X.B.i, op = X.op, ans = Number(it.snap.sol[it.snap.sol.length - 1]);
  const two = op === '×' && Bn >= 10 && Bn % 10 !== 0 && A >= 10;
  // 칸 폭은 두 수의 자릿수로만(정답 자릿수를 흘리지 않게) — 덧셈 · 뺄셈 = 긴 수 + 1 · 곱셈 = 두 수 자릿수의 합
  const la = String(A).length, lb = String(Bn).length;
  const W = (op === '×' ? la + lb : Math.max(la, lb) + 1) + 1;
  const row = (s, cls = '', lead = '') => { const ds = s != null ? digits(s) : []; return `<tr class="${cls}"><td class="op">${lead}</td>${Array.from({ length: W - 1 - ds.length }, () => '<td></td>').join('')}${ds.map((d) => `<td>${d}</td>`).join('')}</tr>`; };
  const line = (cls, val) => (val != null ? row(val, `${cls} ans`) : `<tr class="${cls}"><td class="op"></td>${Array.from({ length: W - 1 }, () => '<td></td>').join('')}</tr>`);
  return `<table class="vt"><tr class="carry"><td class="op"></td>${Array.from({ length: W - 1 }, () => '<td></td>').join('')}</tr>${row(A)}${row(Bn, 'opb', op)}${two ? `${line('line', null)}${line('', null)}${line('line', key ? ans : null)}` : line('line', key ? ans : null)}</table>`;
}
function longDiv(it, key) {
  const X = readExpr(it.snap); if (!X) return null;
  const q = it.snap.sol[0], r = it.snap.sol.length === 2 ? it.snap.sol[1] : 0;
  return `<div class="ld"><div class="ldq">${key ? `<span class="kv">${q}</span>` : ''}</div><div class="ldr"><span class="dv">${X.B.i}</span><span class="dd">${X.A.i}</span></div><div class="ldw"></div>
    <div class="lda"><span>몫 <span class="bx">${key ? `<b class="kv">${q}</b>` : ''}</span></span><span>나머지 <span class="bx">${key ? `<b class="kv">${r}</b>` : ''}</span></span></div></div>`;
}
function plain(it, key) {
  const vals = key ? it.snap.sol.map(String) : null;
  let h = `<span class="math">${toHTML(withBr(it.snap.prompt), { static: true, vals })}</span>`;
  if (it.snap.choices) h += `<div class="ch">${it.snap.choices.map((ch, i) => `<span class="${key && Number(it.snap.sol[0]) === i ? 'kc' : ''}">${NUMS[i]} <span class="math">${toHTML(ch, { static: true })}</span></span>`).join('')}</div>`;
  return h;
}
function word(it, key) {
  const w = it.word;
  const calc = key && w.calc ? toText(w.calc.prompt, w.calc.sol.map(String)) : '';
  const ans = key ? toText(w.ans, w.sol.map(String)).replace(/^답\s*/, '') : '';
  return `<div class="st">${toHTML(w.story, { static: true })}</div><div class="wk"></div>
    <div class="wl"><b>식</b><span class="ln">${key ? `<span class="kv">${esc(calc)}</span>` : ''}</span></div><div class="wl"><b>답</b><span class="ln">${key ? `<span class="kv">${esc(ans)}</span>` : ''}</span></div>`;
}
export function cellHTML(it, { key = false } = {}) {
  const body = it.form === 'v' ? vertical(it, key) : it.form === 'd' ? longDiv(it, key) : it.form === 'w' ? word(it, key) : null;
  const inner = body || plain(it, key);
  const chip = key ? `<span class="kchip">${esc(LES(it.c) ? `${LES(it.c).g} ${lessonName(it.c)}` : it.c)}${it.form === 'w' ? ` · ${KIND[it.word.kind] || ''}` : ''}</span>` : '';
  return `<div class="q f-${body ? it.form : 'h'} c-${it.cls}" data-k="${it.k}"><span class="no">${it.k}</span>${chip}${inner}</div>`;
}

// ── 배치: 장 묶음 → 줄(같은 갈래끼리 cols개) ──
function colsOf(cls, items) {
  if (cls === 'short') return 4;
  if (cls === 'mid') return 3;
  if (cls === 'long') return 2;
  if (cls === 'pic') return items.some((it) => toText(it.snap.prompt).length > 34 || (it.snap.choices || []).length > 2) ? 2 : 3;
  if (cls === 'v') { const w = Math.max(...items.map((it) => { const X = readExpr(it.snap); return X ? Math.max(String(X.A.i).length, String(it.snap.sol[0]).length) : 3; })); return w >= 5 ? 3 : 4; }
  if (cls === 'd') return items.some((it) => { const X = readExpr(it.snap); return X && X.B.i >= 10; }) ? 3 : 4;
  if (cls === 'word') return 2;
  return 3;
}
export function rowsOf(sheet) {
  const byK = Object.fromEntries(sheet.items.map((it) => [it.k, it]));
  const rows = [];
  for (const ch of sheet.chapters) {
    const its = ch.ks.map((k) => byK[k]);
    rows.push({ head: ch });
    let i = 0;
    while (i < its.length) {
      const cls = its[i].cls; let j = i; while (j < its.length && its[j].cls === cls) j++;
      const grp = its.slice(i, j), cols = colsOf(cls, grp);
      for (let a = 0; a < grp.length; a += cols) rows.push({ cls, cols, items: grp.slice(a, a + cols) });
      i = j;
    }
  }
  return rows;
}
const MINH = { v: 30, d: 44, word: 62, pic: 22, long: 16, mid: 14, short: 12 };   // 줄의 최소 높이(mm) — 풀이 자리

// ── 쪽 나누기 ── host에 실제 크기로 그려 재고 나눔 · 결과 = 쪽마다 줄 목록(아이 종이와 정답 겹쳐 보기가 같은 배치를 씀)
export function paginate(host, sheet, { kidLabel = '' } = {}) {
  const rows = rowsOf(sheet), pages = [];
  host.innerHTML = '';
  let page = null, body = null, cur = null;
  const newPage = () => {
    page = document.createElement('article'); page.className = 'page';
    page.innerHTML = headHTML(sheet, pages.length + 1, false, kidLabel) + '<div class="body"></div>' + footHTML(1, 1, false);
    host.append(page); body = page.querySelector('.body'); cur = { rows: [] }; pages.push(cur);
  };
  newPage();
  page.dataset.first = '1';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const el = rowEl(r, false);
    body.append(el);
    // 장 머리는 다음 줄과 함께 다녀야 함(쪽 끝에 머리만 남지 않게)
    let over = body.scrollHeight > body.clientHeight + 1;
    if (!over && r.head && rows[i + 1]) { const nx = rowEl(rows[i + 1], false); body.append(nx); over = body.scrollHeight > body.clientHeight + 1; nx.remove(); }
    if (over && cur.rows.length) { el.remove(); newPage(); body.append(el); }
    cur.rows.push(r);
  }
  return pages;
}
function headHTML(sheet, n, key, kidLabel) {
  const first = n === 1;
  const ttl = key ? `정답 겹쳐 보기 · 판 ${sheet.id}` : '';
  return `<header><div class="hm">${mascot(first ? 'hi' : POSES[n % POSES.length], 44)}</div><div class="hb"><b class="brand">튼튼 수 다리</b>${ttl ? ` <span class="kt">${ttl}</span>` : ''}</div><div class="hn">이름 <u>${esc(kidLabel || '')}</u></div><div class="hc">판 ${sheet.id} · ${n}쪽</div></header>${first ? `<div class="lead"${key ? ' style="visibility:hidden"' : ''}><span class="bub">시험이 아니야! 수 다리가 어디까지 튼튼한지 같이 건너 보자. 모르는 문제는 <b>?</b>를 쓰고 지나가도 돼. 고르는 문제는 번호에 ○ 해 줘.</span></div>` : ''}`;
}
const footHTML = (n, total, key) => `<footer>${key ? '정답 겹쳐 보기 — 아이 종이와 같은 자리' : `<span class="pl">${plankStrip(total, n)}</span><span class="pt">다 풀면 판자를 색칠해요</span>`}</footer>`;
function rowEl(r, key) {
  const el = document.createElement('div');
  if (r.head) { el.className = 'chh'; const W = r.head.s === 'W', E = r.head.key === 'END'; const s = W ? '이야기 다리 — 식을 먼저 쓰고, 계산해서 답을 써요' : E ? '마지막 칸 — 쉬운 문제로 마무리!' : BRIDGE[r.head.s] || STRAND[r.head.s] || ''; el.innerHTML = `<span class="ci">${STRAND_ICON[E ? 'END' : W ? 'W' : r.head.s] || ''}</span><span>${esc(s)}</span>${E ? `<span class="em">${mascot('cheer', 30)}</span>` : ''}${key && !E && !W ? `<em>${esc(GL(r.head.g))}</em>` : ''}`; return el; }
  el.className = `row r-${r.cls}`; el.style.gridTemplateColumns = `repeat(${r.cols}, minmax(0, 1fr))`; el.style.minHeight = `${MINH[r.cls] || 14}mm`;
  el.innerHTML = r.items.map((it) => cellHTML(it, { key })).join('');
  return el;
}
// 나눈 배치대로 다시 그림(아이 종이 · 정답) — 남는 높이는 줄에 고루
//  정답 겹쳐 보기 = 아이 종이를 그대로 그린 뒤 칸 위에 정답 · 차시 이름만 덧씌움(자리가 구조적으로 같음)
export function drawPages(host, sheet, pages, { key = false, kidLabel = '' } = {}) {
  host.innerHTML = pages.map((p, i) => `<article class="page${key ? ' key' : ''}">${headHTML(sheet, i + 1, key, kidLabel)}<div class="body"></div>${footHTML(i + 1, pages.length, key)}</article>`).join('');
  host.querySelectorAll('.page').forEach((pg, i) => { const body = pg.querySelector('.body'); pages[i].rows.forEach((r) => body.append(rowEl(r, false))); });
  host.querySelectorAll('.row').forEach((el) => { el.style.flexGrow = el.classList.contains('r-short') ? '0.6' : '1'; });
  if (!key) return;
  const byK = Object.fromEntries(sheet.items.map((it) => [it.k, it]));
  host.querySelectorAll('.q[data-k]').forEach((q) => {
    const it = byK[q.dataset.k]; if (!it) return;
    const lab = LES(it.c) ? `${LES(it.c).g} ${lessonName(it.c)}${it.form === 'w' ? ` · ${KIND[it.word.kind] || ''}` : ''}` : it.c;
    const ans = it.form === 'w' ? `식 ${it.word.calc ? toText(it.word.calc.prompt, it.word.calc.sol.map(String)) : ''} · 답 ${toText(it.word.ans, it.word.sol.map(String)).replace(/^답\s*/, '')}` : it.form === 'd' ? `몫 ${it.snap.sol[0]} · 나머지 ${it.snap.sol.length === 2 ? it.snap.sol[1] : 0}` : ansStr(it);
    const ov = document.createElement('div'); ov.className = 'ov'; ov.innerHTML = `<span class="kchip">${esc(lab)}</span><span class="ka">${esc(ans)}</span>`;
    q.append(ov);
  });
}

// ── 보충지(가르치기용) — 차시마다: 이렇게 풀어요 · 같은 숫자로 한 단계씩 · 연습 · 맨 뒤 정답 ──
export function practiceHTML({ id, lessons }) {
  const parts = lessons.map(({ c, ex, items }, li) => {
    const L = LES(c);
    const exH = ex ? `<div class="pex"><b>같은 숫자로 한 단계씩</b>${ex.steps.map((s, i) => `<div class="prow"><span>${i + 1}. ${esc(s.why || '')}</span><span class="math">${toHTML(s.item.prompt, { static: true, vals: s.item.sol.map(String) })}</span></div>`).join('')}<div class="prow fin"><span>그래서</span><span class="math">${toHTML(ex.item.prompt, { static: true, vals: ex.item.sol.map(String) })}</span></div></div>` : '';
    return `<section class="pfl"><h2>${NUMS[li]} ${esc(L.kid)}</h2>${L.hint ? `<div class="pk"><b>이렇게 풀어요</b> ${esc(L.hint)}</div>` : ''}${exH}
      <div class="pq">${items.map((it, i) => `<div class="q c-${it.cls} f-${it.form}"><span class="no">${i + 1}</span>${it.form === 'v' ? vertical(it, false) : it.form === 'd' ? longDiv(it, false) : plain(it, false)}</div>`).join('')}</div></section>`;
  }).join('');
  const keys = lessons.map(({ c, items }, li) => `<div class="pak"><b>${NUMS[li]} ${esc(LES(c).kid)}</b> ${items.map((it, i) => `<span>${i + 1}) ${esc(ansStr(it))}</span>`).join(' ')}</div>`).join('');
  return `<article class="page flow"><header><div class="hm">${mascot('fix', 44)}</div><div class="hb"><b class="brand">튼튼이와 판자 고치기</b> <span class="kt">판 ${id}</span></div><div class="hn">이름 <u></u></div><div class="hc">날짜 <u></u></div></header><div class="lead"><span class="bub">같은 숫자로 한 단계씩 보고, 아래 문제로 판자를 튼튼하게 고쳐 보자!</span></div>${parts}<section class="pans"><h2>정답(다 풀고 맞춰 봐요)</h2>${keys}</section></article>`;
}
// 아이에게 주는 한 쪽 — 「○○의 수 다리」: 영역마다 판자(차시) · 튼튼한 판자는 색칠 · 고칠 판자는 망치 표시 · 학년 표시 없음
export function letterHTML(label, rep) {
  const ord = (c) => { const x = LES(c); return x ? Number(x.g[0]) * 100 + Number(x.g[2]) * 10 + (x.n || 0) / 100 : 9999; };
  const xs = Object.values(rep.L).filter((x) => LES(x.c)).sort((a, b) => ord(a.c) - ord(b.c));
  const good = (x) => x.st === 'ok' || x.st === 'pass' || x.st === 'near';
  const fix = new Set([...rep.start.map((s) => s.c), ...rep.below.map((b) => b.c), ...rep.under.map((u) => u.c)]);
  const rows = ['N', 'A', 'M', 'D', 'F', 'R'].map((s) => { const ys = xs.filter((x) => strandOf(x.c) === s); return ys.length ? `<div class="lrow"><span class="ln1">${STRAND_ICON[s]} ${BRIDGE[s]}</span><span class="lps">${ys.map((x) => `<i class="pk ${good(x) ? 'g' : fix.has(x.c) ? 'f' : 'm'}" title="${esc(lessonName(x.c))}"></i>`).join('')}</span></div>` : ''; }).join('');
  const nGood = xs.filter(good).length, fixes = [...fix].filter((c) => LES(c));
  return `<article class="page letter"><header><div class="hm">${mascot('cheer', 52)}</div><div class="hb"><b class="brand">${esc(label)}의 수 다리</b></div><div class="hc">${new Date().toLocaleDateString('ko-KR')}</div></header>
    <div class="lead"><span class="bub">${esc(label)}, 다리를 끝까지 같이 건너 줘서 고마워! 튼튼한 판자가 <b>${nGood}개</b>였어. 색이 칠해진 판자를 보면 돼.</span></div>
    <div class="lbr">${rows}</div>
    <div class="lkey"><span><i class="pk g"></i> 튼튼한 판자</span><span><i class="pk f"></i> 같이 고칠 판자</span><span><i class="pk m"></i> 한 번 더 볼 판자</span></div>
    ${fixes.length ? `<h2>${mascot('fix', 34)} 다음에 튼튼이랑 같이 고칠 판자</h2><ul class="lfix">${fixes.map((c) => `<li>${esc(lessonName(c))}</li>`).join('')}</ul>` : `<h2>${mascot('hi', 34)} 고칠 판자가 없어! 다음 다리도 같이 건너 보자.</h2>`}
    <div class="lnote"><b>선생님 한마디</b><div class="lline"></div><div class="lline"></div></div>
    <div class="lme"><b>내가 해낸 것 한 가지</b><div class="lline"></div></div></article>`;
}
