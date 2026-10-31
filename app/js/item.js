// 문제 카드 하나 — 자신감 세 칸(풀기 전 짐작 [D-1][D-3]) · 빈칸 · 보기 · '몰라서 넘어갈래요'
//  draw(root, { prompt, choices, tag, dots, conf, onAnswer }) — onAnswer({ vals, raws } | { idk:true }, conf, ms)
//  틀렸는지는 이 카드가 말하지 않는다(점검은 담담하게) — 되먹임은 부르는 쪽이 정함
import { toHTML, toText } from '../../engine/tokens.js';
import { parseNum } from '../../engine/math.js';
import { P } from '../../engine/concepts/kit.js';
import { esc } from './local.js';

export const CONF = [[2, '자신 있어요'], [1, '조금 헷갈려요'], [0, '잘 모르겠어요']];

export function draw(root, { prompt, choices = null, tag = '', dots = null, conf = true, idk = true, extra = '', onAnswer }) {
  const t0 = performance.now();
  let cf = null;
  root.innerHTML = `<div class="qcard">
    <div class="qtop">${tag ? `<span class="tag">${esc(tag)}</span>` : ''}${dots ? `<span class="dots" aria-hidden="true">${Array.from({ length: dots[1] }, (_, i) => `<i class="${i < dots[0] ? 'on' : ''}"></i>`).join('')}</span>` : ''}</div>
    ${extra}
    <div class="math" id="q">${toHTML(prompt)}</div>
    ${choices ? `<div class="choices">${choices.map((ch, k) => `<button type="button" data-k="${k}"><span class="math">${toHTML(ch, { static: true })}</span></button>`).join('')}</div>` : ''}
    ${conf ? `<div class="conf"><p>풀기 전에 — 풀 수 있을 것 같아요?</p><div class="row">${CONF.map(([v, t]) => `<button type="button" data-cf="${v}">${t}</button>`).join('')}</div></div>` : ''}
    <div class="qmsg" id="msg" role="alert"></div>
    <div class="qact">
      ${choices ? '' : '<button class="pri big" id="ok">다 풀었어요</button>'}
      ${idk ? '<button id="idk">몰라서 넘어갈래요</button>' : ''}
    </div>
  </div>`;
  const msg = root.querySelector('#msg'), card = root.querySelector('.qcard');
  const blanks = [...root.querySelectorAll('.blank')].sort((a, b) => a.dataset.i - b.dataset.i);
  const nudge = (t, el) => { msg.textContent = t; card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); if (el) el.focus(); };
  root.querySelectorAll('[data-cf]').forEach((b) => b.addEventListener('click', () => {
    cf = Number(b.dataset.cf);
    root.querySelectorAll('[data-cf]').forEach((x) => x.classList.toggle('on', x === b));
    msg.textContent = '';
    const e = blanks.find((x) => !x.value.trim()); if (e) e.focus();
  }));
  const done = (a) => onAnswer(a, conf ? cf : null, Math.round(performance.now() - t0));
  const needConf = () => conf && cf == null;
  const ok = root.querySelector('#ok');
  if (ok) ok.addEventListener('click', () => {
    const raws = blanks.map((b) => b.value.trim().replace(/,/g, ''));
    if (raws.some((x) => !x)) return nudge('빈칸을 모두 채워 주세요. 모르면 "몰라서 넘어갈래요"를 눌러요.', blanks.find((b) => !b.value.trim()));
    const vals = raws.map(parseNum);
    if (vals.some((v) => Number.isNaN(v))) return nudge('숫자로 써 주세요.', blanks[vals.findIndex((v) => Number.isNaN(v))]);
    if (needConf()) return nudge('먼저 위에서 짐작을 하나 골라 주세요.');
    done({ vals, raws });
  });
  blanks.forEach((b, i) => b.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < blanks.length - 1 && !blanks[i + 1].value) blanks[i + 1].focus(); else ok && ok.click();
  }));
  root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { if (needConf()) return nudge('먼저 아래에서 짐작을 하나 골라 주세요.'); done({ vals: [Number(b.dataset.k)], raws: [b.dataset.k] }); }));
  const ik = root.querySelector('#idk');
  if (ik) ik.addEventListener('click', () => onAnswer({ idk: true }, 0, Math.round(performance.now() - t0)));
  if (!conf && blanks[0]) blanks[0].focus();
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
