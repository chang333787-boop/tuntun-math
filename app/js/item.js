// 문제 카드 하나 — 자신감 세 칸(풀기 전 짐작 [D-1][D-3]) · 빈칸 · 보기 · '몰라서 넘어갈래요'
//  draw(root, { prompt, choices, tag, dots, conf, onAnswer, given, hide, say }) — onAnswer({ vals, raws } | { idk:true }, conf, ms)
//  짐작은 정말 '풀기 전'에 — 문제를 보인 뒤 짐작을 고르기 전에는 답 칸 · 보기가 잠겨 있음(답을 먼저 쓰고 고르거나 보기를 눌렀다 무시되지 않게 · 혹평 11-01)
//  given = { 빈칸 번호: 값 } 튼튼이가 채워 둔 빈칸(함께) · hide = [보기 번호] 튼튼이가 지운 보기(함께) · say = 카드 위 튼튼이 말(그 문제 숫자로)
//  틀렸는지는 이 카드가 말하지 않는다(점검은 담담하게) — 되먹임은 부르는 쪽이 정함
import { toHTML, toText } from '../../engine/tokens.js';
import { parseNum } from '../../engine/math.js';
import { P } from '../../engine/concepts/kit.js';
import { mascot } from '../../paper/js/mascot.js';
import { esc } from './local.js';

export const CONF = [[2, '자신 있어요'], [1, '조금 헷갈려요'], [0, '잘 모르겠어요']];
// 진행 — 카드 오른쪽 위 같은 자리 · dots = [지금까지 푼 수, 모두] · 12개 넘으면 막대(준비 다리는 판 전체 · 많아야 18 · 24 · 36)
export function progHTML([i, n]) {
  const k = Math.min(i + 1, n), lab = `${n}문제 가운데 ${k}번째`;
  const show = n > 12 ? `<span class="pbar"><i style="width:${Math.round((Math.min(i, n) / n) * 100)}%"></i></span>` : `<span class="dots">${Array.from({ length: n }, (_, j) => `<i class="${j < i ? 'on' : ''}"></i>`).join('')}</span>`;
  return `<span class="qprog" role="img" aria-label="${lab}">${show}<span class="cnt"><b>${k}</b> / ${n}</span></span>`;
}

export function draw(root, { prompt, choices = null, tag = '', dots = null, conf = true, idk = true, extra = '', given = null, hide = null, say = null, onAnswer }) {
  const t0 = performance.now();
  let cf = null;
  const gone = new Set((hide || []).map(Number));
  root.innerHTML = `<div class="qcard${conf ? ' locked' : ''}">
    <div class="qtop">${tag ? `<span class="tag">${esc(tag)}</span>` : ''}${dots ? progHTML(dots) : ''}</div>
    ${extra}
    ${say && say.length ? `<div class="tsay">${say.map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
    <div class="math" id="q">${toHTML(prompt)}</div>
    ${conf ? `<div class="conf"><p>풀기 전에 — 풀 수 있을 것 같아요?</p><div class="row">${CONF.map(([v, t]) => `<button type="button" data-cf="${v}">${t}</button>`).join('')}</div><p class="small muted" id="cfh">짐작을 고르면 답 칸이 열려요.</p></div>` : ''}
    ${choices ? `<div class="choices">${choices.map((ch, k) => `<button type="button" data-k="${k}"${gone.has(k) ? ' class="gone" aria-label="튼튼이가 지운 보기"' : ''}><span class="math">${toHTML(ch, { static: true })}</span></button>`).join('')}</div>` : ''}
    <div class="qmsg" id="msg" role="alert"></div>
    <div class="qact">
      ${choices ? '' : '<button class="pri big" id="ok">다 풀었어요</button>'}
      ${idk ? '<button id="idk">몰라서 넘어갈래요</button>' : ''}
    </div>
  </div>`;
  const msg = root.querySelector('#msg'), card = root.querySelector('.qcard');
  const blanks = [...root.querySelectorAll('.blank')].sort((a, b) => a.dataset.i - b.dataset.i);
  if (given) blanks.forEach((b) => { const v = given[b.dataset.i]; if (v != null) { b.value = String(v); b.readOnly = true; b.classList.add('given'); b.tabIndex = -1; b.setAttribute('aria-label', `튼튼이가 채운 빈칸 ${v}`); } });
  const open = blanks.filter((b) => !b.readOnly);
  const nudge = (t, el) => { msg.textContent = t; card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); if (el) el.focus(); };
  const ok = root.querySelector('#ok');
  const lock = (on) => {
    card.classList.toggle('locked', on);
    open.forEach((b) => (b.disabled = on));
    root.querySelectorAll('[data-k]').forEach((b) => (b.disabled = on || gone.has(Number(b.dataset.k))));
    if (ok) ok.disabled = on;
  };
  lock(!!conf);
  root.querySelectorAll('[data-cf]').forEach((b) => b.addEventListener('click', () => {
    cf = Number(b.dataset.cf);
    root.querySelectorAll('[data-cf]').forEach((x) => x.classList.toggle('on', x === b));
    msg.textContent = '';
    const h = root.querySelector('#cfh'); if (h) h.textContent = '';
    lock(false);
    const e = open.find((x) => !x.value.trim()); if (e) e.focus(); else { const c0 = root.querySelector('[data-k]:not(:disabled)'); if (c0) c0.focus(); }
  }));
  const done = (a) => onAnswer(a, conf ? cf : null, Math.round(performance.now() - t0));
  if (ok) ok.addEventListener('click', () => {
    const raws = blanks.map((b) => b.value.trim().replace(/,/g, ''));
    if (raws.some((x) => !x)) return nudge('빈칸을 모두 채워 주세요. 모르면 "몰라서 넘어갈래요"를 눌러요.', open.find((b) => !b.value.trim()));
    const vals = raws.map(parseNum);
    if (vals.some((v) => Number.isNaN(v))) return nudge('숫자로 써 주세요.', blanks[vals.findIndex((v) => Number.isNaN(v))]);
    done({ vals, raws });
  });
  open.forEach((b, i) => b.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < open.length - 1 && !open[i + 1].value) open[i + 1].focus(); else ok && ok.click();
  }));
  root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { if (b.disabled) return; done({ vals: [Number(b.dataset.k)], raws: [b.dataset.k] }); }));
  const ik = root.querySelector('#idk');
  if (ik) ik.addEventListener('click', () => onAnswer({ idk: true }, 0, Math.round(performance.now() - t0)));
  if (!conf && open[0]) open[0].focus();
}

// 찍기 멈춤 — 2초 안에 틀린 답이 세 번 이어지면 잠깐 멈춤 · 찍기는 학습 저하와 가장 세게 묶인다 [A-R29]
//  '넘어가기'는 솔직한 모름이라 세지 않음(찍은 오답만) · 준비 다리 · 다듬기에서 같이 씀(선생님 화면의 K.rush는 부르는 쪽이 셈)
export function rushGuard() {
  let n = 0;
  return (ms, a, ok) => { n = a.idk ? n : ms < 2000 && !ok ? n + 1 : 0; if (n >= 3) { n = 0; return true; } return false; };
}
export function rushPause(root, onGo) {
  root.innerHTML = `<div class="card"><div class="say">${mascot('think', 72)}<div class="bub">잠깐! 조금 빨라요. 문제를 <b>끝까지 읽고</b> 풀어요.<br>모르면 넘어가도 괜찮아요 — 찍지만 않으면 돼요.</div></div><button class="pri big" id="r" disabled>다시 해 볼게요</button></div>`;
  const b = root.querySelector('#r'); setTimeout(() => { b.disabled = false; b.focus(); }, 3000);
  b.addEventListener('click', onGo);
}

// 단계 하나(이미 푼 모습) — 쪼갠 풀이 보기용
export const stepHTML = (st, { vals = null, marks = null, cls = '' } = {}) => `<li class="${cls}"><span class="why">${esc(st.why)}</span><span class="math">${toHTML(st.prompt, { static: true, vals: vals || st.sol, marks })}</span></li>`;
export const staticHTML = (prompt, vals, marks) => `<span class="math">${toHTML(prompt, { static: true, vals, marks })}</span>`;

// 답 보여 주기 — 고르기 문항의 sol은 보기 번호라서 보기 글로 바꿔 보인다('답 0'이 아니라 '답 8.21')
//  it = { sol, choices? } (문항 · snap 둘 다) · ansHTML = 굵게 쓸 답 · ansSay = '답은 ○○이에요/예요'(받침 맞춤)
const ansPlain = (it) => (it.choices ? toText(it.choices[Number(it.sol[0])] || []) : (it.sol || []).join(', '));
export const ansHTML = (it) => (it.choices ? toHTML(it.choices[Number(it.sol[0])] || [], { static: true }) : esc((it.sol || []).join(', ')));
export function ansSay(it, lead = '답은') {
  const t = ansPlain(it).trim(), word = /[가-힣]$/.test(t);
  return `${lead} <b>${word ? `‘${ansHTML(it)}’` : ansHTML(it)}</b>${P(word ? '요' : t, '이에요', '예요')}.`;
}
