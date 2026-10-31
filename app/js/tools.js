// 검산 도구 다섯 — 오개념 처방을 아이 손의 '내 답 확인하기'로(docs/mis_flow.md)
//  거꾸로 셈 · 어림 · 수직선 · 저울 · 다시 읽기 — 틀린 답을 넣고 도구가 직접 계산해 '어긋남'을 보여 줌(아이가 스스로 찾게)
//  어떤 도구인지 = 그 칸 오개념 카드(engine/mis.js)의 갈래 · 계산이 안 되거나 어긋남을 못 보이면 다음 도구
import { readExpr } from '../../engine/errors.js';
import { misFor } from '../../engine/mis.js';
import { toText, toHTML } from '../../engine/tokens.js';
import { esc } from './local.js';
import { ansSay, stepHTML } from './item.js';
import { stepsOf, ruleFor } from './fix.js';

export const TOOLS = {
  inverse: { name: '거꾸로 셈', ro: '거꾸로 셈으로', how: '뺄셈은 더해 보고, 나눗셈은 곱해 봐요 — 처음 수가 나오나요?' },
  estimate: { name: '어림', ro: '어림으로', how: '계산하기 전에 대충 얼마쯤인지 — 답이 그 근처인가요?' },
  line: { name: '수직선', ro: '수직선으로', how: '두 수를 수직선에 놓아 봐요 — 오른쪽이 더 커요' },
  balance: { name: '저울', ro: '저울로', how: '=의 양쪽을 따로 계산해 같은지 봐요' },
  reread: { name: '다시 읽기', ro: '다시 읽기로', how: '묻는 말을 다시 읽어요 — 내 답이 그 물음에 맞나요?' },
};
export const CARD_TOOL = {
  'add.carry': 'inverse', 'sub.borrow': 'inverse', 'sub.zero': 'inverse', 'mul.algo': 'inverse', 'mul.dist': 'inverse', 'div.rem': 'inverse', 'div.zero': 'inverse', 'inv.addsub': 'inverse', 'three': 'inverse',
  'mul.add': 'estimate', 'mul.bigger': 'estimate', 'mul.tens': 'estimate', 'dec.mulPoint': 'estimate', 'dec.divPoint': 'estimate', 'fr.addBoth': 'estimate', 'fr.mul': 'estimate', 'fr.div': 'estimate', 'dec.align': 'estimate', 'pct': 'estimate', 'ratio.add': 'estimate',
  'dec.long': 'line', 'dec.short': 'line', 'dec.trunc': 'line', 'fr.unitBig': 'line', 'fr.cmpGap': 'line', 'fr.line': 'line', 'cmp.ones': 'line', 'fd.recip': 'line', 'fr.lessOne': 'line',
  'eq.answer': 'balance', 'box.visible': 'balance',
  'div.remSense': 'reread', 'word.timesRev': 'reread', 'ratio.base': 'reread', 'ord.card': 'reread',
};
const fv = (f) => f.n / f.d;
const num = (x) => String(Math.round(x * 1000) / 1000);
const josa = (n, a, b) => { const s = String(n), last = s[s.length - 1]; return /[013678]$/.test(last) ? a : /\d$/.test(last) ? b : a; };   // 숫자 끝소리로 이/가 · 은/는(영 · 일 · 삼 · 육 · 칠 · 팔 = 받침)
const valOfChoice = (ch) => { const t = (ch || []).find((x) => x && typeof x === 'object' && 'f' in x); if (t) return t.f[0] / t.f[1]; const s = toText(ch).replace(/[^\d.]/g, ''); return s && !Number.isNaN(Number(s)) ? Number(s) : null; };

function inv(X, A, B, w, vals) {
  if (X.op === '−') { const s = w + B; return s === A ? null : { html: `${w} + ${B} = <b>${s}</b> → 처음 수 ${A}${josa(A, '이', '가')} 나와야 해요!` }; }
  if (X.op === '+') { const s = w - B; return s === A ? null : { html: `${w} − ${B} = <b>${s}</b> → 처음 수 ${A}${josa(A, '이', '가')} 나와야 해요!` }; }
  if (X.op === '×') { if (w % B) return { html: `${w} ÷ ${B}${josa(B, '은', '는')} 나누어떨어지지 않아요 → ${A} × ${B}의 답이 아니에요!` }; const q = w / B; return q === A ? null : { html: `${w} ÷ ${B} = <b>${q}</b> → ${A}${josa(A, '이', '가')} 나와야 해요!` }; }
  if (X.op === '÷' && vals.length >= 2) { const r = Number(vals[1]) || 0, s = B * w + r; if (r >= B) return { html: `남은 수 ${r}${josa(r, '이', '가')} 나누는 수 ${B}보다 크거나 같아요 → 한 번 더 나눌 수 있어요!` }; return s === A ? null : { html: `${B} × ${w} + ${r} = <b>${s}</b> → 처음 수 ${A}${josa(A, '이', '가')} 나와야 해요!` }; }
  if (X.op === '÷') { const s = B * w; return s === A ? null : { html: `${B} × ${w} = <b>${s}</b> → ${A}${josa(A, '이', '가')} 나와야 해요!` }; }
  return null;
}
// 도구 하나로 확인 — 어긋남을 보이면 { tool, html, off:true } · 맞거나 계산 못 하면 null
function check(tool, it, vals) {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  const w = vals && vals.length ? Number(vals[0]) : null;
  if (tool === 'inverse' && X && X.st === 'W' && w != null && !Number.isNaN(w)) {
    const A = X.A.i, B = X.B.i, how = { '+': '덧셈은 빼 봐요', '−': '뺄셈은 더해 봐요', '×': '곱셈은 나눠 봐요', '÷': '나눗셈은 곱해 봐요' }[X.op] + ' — 처음 수가 나오나요?';   /* 그 문제의 셈에 맞는 말로 */
    const r = inv(X, A, B, w, vals); return r ? { ...r, how } : null;
  }
  if (tool === 'estimate' && X && w != null && !Number.isNaN(w)) {
    if (X.st === 'W') {
      const rd = (n) => { if (n < 10) return n; const k = 10 ** (String(n).length - 1); return Math.round(n / k) * k; };
      const a = rd(X.A.i), b = rd(X.B.i), e = X.op === '+' ? a + b : X.op === '−' ? a - b : X.op === '×' ? a * b : b ? Math.round(a / b) : null;
      if (e == null || e <= 0) return null;
      const far = Math.abs(w - e) > Math.max(e * 0.5, 10);
      return far ? { html: `대충 ${a} ${X.op} ${b} = 약 <b>${e}</b> → ${w}${josa(w, '은', '는')} 너무 ${w > e ? '커요' : '작아요'}!` } : null;
    }
    if (X.st === 'F' || X.st === 'FS') {
      const A = fv(X.A.v), B = fv(X.B.v), W = vals.length >= 2 && Number(vals[1]) ? Number(vals[0]) / Number(vals[1]) : w;
      const big = A >= B ? X.A : X.B, bigT = big.k === 'F' ? toText([big.w ? { m: [big.w, big.n, big.d] } : { f: [big.n, big.d] }]) : num(fv(big.v));
      if (X.op === '+' && W < Math.max(A, B) - 1e-9) return { html: `더했는데 더한 수보다 작아졌어요! 적어도 ${esc(bigT)}보다 커야 해요.` };
      if (X.op === '+' && A >= 0.5 && B >= 0.5 && W < 1) return { html: '두 수가 다 1/2보다 크거나 같으니 더하면 1보다 커야 해요!' };
      if (X.op === '×' && B < 1 && W > A + 1e-9) return { html: `1보다 작은 수를 곱하면 처음 수의 '일부' — ${num(A)}보다 작아야 해요!` };
      if (X.op === '÷' && B < 1 && W < A - 1e-9) return { html: `1보다 작은 수로 나누면 '몇 번 들어가나' — ${num(A)}보다 커야 해요!` };
      return null;
    }
  }
  if (tool === 'estimate' && it.choices && it.p && (it.p.dir || it.p.v === 'dir')) {
    const p = it.p, mul = !!p.dir;
    return { html: mul ? `${p.n}/${p.d}${josa(p.n, '은', '는')} 1보다 작아요 → ${p.N}의 ${p.n}/${p.d}만큼이니 <b>${p.N}보다 작아요</b>.` : `${p.N} 안에 ${p.n}/${p.d}${josa(p.n, '이', '가')} 몇 번 들어갈까요? 1 안에도 한 번보다 많이 들어가니 <b>${p.N}보다 커요</b>.` };
  }
  if (tool === 'line' && it.choices && it.choices.length >= 2) {
    const vs = it.choices.map(valOfChoice); if (vs.filter((v) => v != null).length < 2) return null;
    const ok = vs.filter((v) => v != null), lo = Math.floor(Math.min(...ok)), hi = Math.max(lo + 1, Math.ceil(Math.max(...ok) + 1e-9));
    const W = 420, x0 = 20, x1 = W - 20, X1 = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const marks = vs.map((v, i) => (v == null ? '' : `<circle cx="${X1(v).toFixed(1)}" cy="40" r="6" fill="#d96c1e"/><text x="${X1(v).toFixed(1)}" y="${i % 2 ? 72 : 24}" text-anchor="middle" font-size="15" fill="currentColor">${esc(toText(it.choices[i]))}</text>`)).join('');
    const ticks = Array.from({ length: (hi - lo) * 10 + 1 }, (_, k) => { const x = x0 + (k / ((hi - lo) * 10)) * (x1 - x0); return `<path d="M${x.toFixed(1)} ${k % 10 ? 35 : 30} V${k % 10 ? 45 : 50}" stroke="currentColor" stroke-width="${k % 10 ? 1 : 2}"/>`; }).join('');
    return { html: `<svg viewBox="0 0 ${W} 84" width="100%" style="max-width:${W}px" role="img" aria-label="수직선에 놓은 수"><path d="M${x0} 40 H${x1}" stroke="currentColor" stroke-width="2"/>${ticks}<text x="${x0}" y="64" font-size="13" fill="currentColor">${lo}</text><text x="${x1}" y="64" font-size="13" text-anchor="end" fill="currentColor">${hi}</text>${marks}</svg><br>오른쪽에 있는 수가 더 커요.` };
  }
  if (tool === 'balance' && it.p && w != null && !Number.isNaN(w)) {
    const p = it.p;
    if (p.eq) { const L = p.a + p.b, R = w + p.c; return L === R ? null : { html: `왼쪽 ${p.a} + ${p.b} = <b>${L}</b> · 오른쪽 ${w} + ${p.c} = <b>${R}</b> → 저울이 기울어요! 양쪽이 같아야 해요.` }; }
    if (p.s != null && p.a != null) { const s = w + p.a; return s === p.s ? null : { html: `□에 ${w}${josa(w, '을', '를')} 넣으면 ${w} + ${p.a} = <b>${s}</b> → ${p.s}${josa(p.s, '이', '가')} 되어야 해요!` }; }
  }
  return null;
}
// 이 문항 · 이 틀린 답에 맞는 도구 — prefer = 아이에게 보인 원인 id(카드를 고르는 데 씀)
export function toolFor({ it, vals, c, bug = null }) {
  const order = [];
  const push = (t) => { if (t && !order.includes(t)) order.push(t); };
  if (bug) misFor({ bug, lesson: c }).forEach((m) => push(CARD_TOOL[m.id]));
  misFor({ lesson: c }).forEach((m) => push(CARD_TOOL[m.id]));
  ['inverse', 'balance', 'estimate', 'line'].forEach(push);   // 그 밖에 계산되는 것
  for (const t of order) { if (t === 'reread') continue; const r = check(t, it, vals); if (r) return { tool: t, ...TOOLS[t], ...r }; }
  return null;
}
// 화면 조각 — 틀린 답 아래 '🔍 도구로 확인' → 보여 주고 → 한 번 다시 써 보기(스스로 고침)
//  seen() = 아이가 이미 답을 봤나 — 봤으면 다시 써서 맞혀도 '스스로 고친 횟수'에 넣지 않음(답을 베낀 것 · 혹평 11-01)
export function toolBox(box, { it, vals, c, bug = null, onSelfFix, onDone, seen = () => false, T = null }) {
  T = T || toolFor({ it, vals, c, bug });
  if (!T) return false;
  const b = document.createElement('div'); b.className = 'toolbox';
  b.innerHTML = `<button type="button" class="tbtn">🔍 ${esc(T.ro)} 확인해 볼까요?</button>`;
  box.appendChild(b);
  b.querySelector('.tbtn').addEventListener('click', () => {
    b.innerHTML = `<p class="small muted">${esc(T.how)}</p><p class="tcheck">${T.html}</p>${it.choices ? '' : `<div class="retry"><span class="math">${toHTML(it.prompt)}</span><button type="button" class="pri" id="rt">다시 써 보기</button></div>`}`;
    const rt = b.querySelector('#rt');
    if (rt) { const f = b.querySelector('.blank'); if (f) f.focus(); }
    if (!rt && onDone) onDone(null);
    if (rt) rt.addEventListener('click', () => {
      const raws = [...b.querySelectorAll('.blank')].sort((x, y) => x.dataset.i - y.dataset.i).map((x) => x.value.trim());
      if (raws.some((x) => !x)) return;
      let ok = false; try { ok = !!it.check(raws.map(Number), raws).ok; } catch (e) { ok = false; }
      const self = ok && !seen();
      b.querySelector('.retry').innerHTML = self ? `<b>스스로 고쳤어요!</b> ${esc(T.name)} 도구로 찾아서 고쳤어요.` : ok ? '맞게 고쳐 썼어요.' : `아직 아니에요. ${ansSay(it)}`;
      if (self && onSelfFix) onSelfFix(T.tool);
      if (onDone) onDone(ok);
    });
  });
  return T;
}

// 틀린 뒤 — 다음에 할 한 가지([D-13][D-15] · 혹평 11-01 '답은 X예요'만 주지 않게)
//  ① 검산 도구가 맞는 문항: 답을 보기 전에 도구로 먼저(답 보기는 작은 단추) · 도구로 고치면 '스스로 고친 횟수'
//  ② 도구가 없으면: 답 + 그 칸의 첫 단계(같은 숫자로) · ③ 단계도 없으면: 답 + 방법 한 줄(이 문제 숫자만)
//  it = 문항(check · prompt · sol · choices) · 돌려주는 값 = 쓴 방법('tool' | 'step' | 'rule' | 'ans')
export function nextStep(box, { it, vals = [], c, bug = null, idk = false, onSelfFix, after = '' }) {
  let seen = false;
  const T = idk ? null : toolFor({ it, vals, c, bug });
  const p = document.createElement('div'); p.className = 'next';
  box.appendChild(p);
  const showAns = (el) => { seen = true; el.innerHTML = `${ansSay(it)}${after ? ` ${esc(after)}` : ''}`; };
  if (T) {
    p.innerHTML = `<p>아직 아니에요. 답을 보기 전에 <b>${esc(T.ro)}</b> 내 답을 확인해 봐요.</p><p class="ans small"><button type="button" class="link" data-ans>답 보기</button></p>`;
    const a = p.querySelector('.ans');
    a.querySelector('[data-ans]').addEventListener('click', () => showAns(a));
    toolBox(p, { it, vals, c, bug, T, onSelfFix, seen: () => seen, onDone: (ok) => { if (ok === null) { if (!seen) showAns(a); return; } if (ok === false) seen = true; if (ok === false || !seen) a.innerHTML = after ? esc(after) : ''; } });   /* 보기 문항(다시 쓰기 없음) → 도구 뒤 답 · 다시 써서 틀림 → 답은 다시 쓰기 칸에 */
    p.insertBefore(p.querySelector('.toolbox'), a);
    return 'tool';
  }
  let st = null; try { st = (stepsOf({ c: it.c || c, p: it.p }) || [])[0] || null; } catch (e) { st = null; }
  const rule = st ? '' : ruleFor(c, it);
  seen = true;
  p.innerHTML = `<p>${idk ? '' : '아직 아니에요. '}${ansSay(it)}${after ? ` ${esc(after)}` : ''}</p>${st ? `<p class="small">다음엔 이렇게 시작해요 — <b>${esc(st.why)}</b></p><ol class="steps">${stepHTML(st)}</ol>` : rule ? `<p class="small">다음엔 — ${esc(rule)}</p>` : ''}`;
  return st ? 'step' : rule ? 'rule' : 'ans';
}
