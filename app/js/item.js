// 문제 카드 하나 — 자신감 세 칸(풀기 전 짐작 [D-1][D-3]) · 빈칸 · 보기 · '못 풀겠어요 · 넘어가기'
//  draw(root, { prompt, sol, choices, tag, dots, conf, onAnswer, given, hide, say }) — sol은 칸 넘기기 자리 수에만(wireBlanks) — onAnswer({ vals, raws } | { idk:true }, conf, ms)
//  짐작은 정말 '풀기 전'에 — 문제를 보인 뒤 짐작을 고르기 전에는 답 칸 · 보기가 잠겨 있음(답을 먼저 쓰고 고르거나 보기를 눌렀다 무시되지 않게 · 혹평 11-01)
//  given = { 빈칸 번호: 값 } 튼튼이가 채워 둔 빈칸(함께) · hide = [보기 번호] 튼튼이가 지운 보기(함께) · say = 카드 위 튼튼이 말(그 문제 숫자로)
//  틀렸는지는 이 카드가 말하지 않는다(점검은 담담하게) — 되먹임은 부르는 쪽이 정함
//  모양(docs/ui.md 2차): 넓으면 두 칸 — 왼쪽 .qmain(진행 · extra · 문제) · 오른쪽 .qside(lead 튼튼이 말 · 짐작 · 보기 · 단추 · 되먹임) · 좁으면 한 줄(lead가 맨 위)
//    act = 활동 색 · 아이콘(icons.js ACT 열쇠 — 꼬리표에) · 되먹임 상자는 fbSlot(root)에 붙이고 qcard에 'answered'(쓴 단추 줄을 숨김)
import { toHTML, toText } from '../../engine/tokens.js';
import { parseNum } from '../../engine/math.js';
import { P } from '../../engine/concepts/kit.js';
import { mascot } from '../../paper/js/mascot.js';
import { esc } from './local.js';
import { icon, ACT } from './icons.js';

export const CONF = [[2, '자신 있어요'], [1, '조금 헷갈려요'], [0, '자신 없어요']];   /* '잘 모르겠어요'는 '못 풀겠어요 · 넘어가기'와 뜻이 겹쳐 답을 안 쓰고 누르기 쉬움(처음 보는 눈 11-07) */
// 진행 — 카드 오른쪽 위 같은 자리 · dots = [지금까지 푼 수, 모두] · 12개까지 칸 막대 · 넘으면 긴 막대(준비 다리는 판 전체 · 많아야 18 · 24 · 36) · 새로 찬 만큼만 200ms
export function progHTML([i, n]) {
  if (!n || n < 0) return `<span class="qprog" role="img" aria-label="${i + 1}번째 문제"><span class="cnt">문제 <b>${i + 1}</b>${n < 0 ? ` <small>· 많아야 ${-n}문제</small>` : ''}</span></span>`;   /* n < 0 = 많아야 |n|문제(일찍 끝날 수 있음) */   /* 끝이 정해지지 않은 판(오늘 단원 점검 — 찾으면 일찍 끝남)은 분모 없이(11-07 '1 / 18인데 12에서 끝남') */
  const k = Math.min(i + 1, n), lab = `${n}문제 가운데 ${k}번째`, pc = (x) => Math.round((Math.max(0, Math.min(x, n)) / n) * 100);
  const show = n > 12 ? `<span class="pbar"><i style="width:${pc(i)}%;--p0:${pc(i - 1)}%"></i></span>` : `<span class="pseg">${Array.from({ length: n }, (_, j) => `<i class="${j < i ? 'on' : j === i ? 'cur' : ''}${j === i - 1 ? ' nw' : ''}"></i>`).join('')}</span>`;
  return `<span class="qprog" role="img" aria-label="${lab}">${show}<span class="cnt"><b>${k}</b> / ${n}</span></span>`;
}
// 꼬리표(활동 이름) — 활동 색 + 아이콘
export const tagHTML = (tag, act = '') => { const a = ACT[act]; return tag ? `<span class="tag${a ? ` act-${a[1]}` : ''}">${a ? icon(a[0], 18) : ''}${esc(tag)}</span>` : ''; };
// 되먹임 상자를 붙일 자리(오른쪽 칸) · 답한 뒤 쓴 단추 줄 숨김
export const fbSlot = (root) => { const c = root.querySelector('.qcard'); if (c) c.classList.add('answered'); return root.querySelector('.qside') || c || root; };

// 빈칸 오가기 — 여러 칸 문제를 손 덜 쓰고 풀게(11-08 교사 '하나 누르면 다음 칸으로')
//  ① 문제 · 답의 수가 모두 두 자리까지(소수 X · 답을 모르면 X — 3, 6, 9, □의 12)면 그 자리 수만큼 쓰면 다음 빈 칸 — 마지막 칸 · 분수 칸은 X(틀린 답이 더 길 수 있음: 8 + 1 = 10 · 6 10/8)
//  ② 칸 사이 기호(+ − × ÷ / = : 띄어쓰기)를 치면 다음 칸 — 식을 쓰듯 '8 + 1 = 9' · 빈 칸에서 친 기호는 버림 · 쉼표는 큰 수(1,000)가 없는 문제에서만
//  ③ Enter = 다음 빈 칸 → 다 차면 onDone · 빈 칸에서 ⌫ = 앞 칸 · 글자 끝에서 ← → = 앞 · 뒤 칸 · 칸은 쓴 글자만큼 넓어짐(아홉 자리도 다 보이게)
const SEP = /^[\s+\-−*xX×÷/=:;…]$/;
export const fitBlank = (b) => { const n = b.value.length; b.style.width = n > 3 ? `${(0.56 * n + 0.9).toFixed(2)}em` : ''; };
//  ④ 손가락만 쓰는 기기(휴대폰 · 태블릿)는 앱 숫자판 — place(숫자판)로 놓을 자리를 받음 · 기기 자판은 숨김(문제와 단추를 반쯤 가리고 아이폰 숫자판엔 '다음 칸' 키가 없음)
export const touchOnly = () => typeof matchMedia === 'function' && matchMedia('(hover: none) and (pointer: coarse)').matches;
export function wireBlanks(open, { prompt = null, sol = null, onDone = null, onEnd = null, place = null } = {}) {
  const txt = `${toText(prompt || [])} ${(sol || []).join(' ')}`, nums = txt.match(/\d+/g) || [], dec = /\d\.\d/.test(txt);
  const cap = !sol || dec ? 0 : Math.max(0, ...nums.map((x) => x.length)), big = nums.some((x) => x.length >= 4);
  const go = (b, end = false) => { b.focus(); if (end) { const n = b.value.length; b.setSelectionRange(n, n); } else b.select(); };
  const nextEmpty = (i) => open.slice(i + 1).find((x) => !x.value.trim()) || open.slice(0, i).find((x) => !x.value.trim());
  open.forEach((b, i) => {
    const last = i === open.length - 1, auto = cap > 0 && cap <= 2 && !last && !b.closest('.fr, .mx');
    b.enterKeyHint = last ? 'done' : 'next';   /* 휴대폰 숫자판의 Enter 자리에 '다음' · '완료' */
    b.addEventListener('beforeinput', (e) => {
      if (open.length < 2 || e.inputType !== 'insertText' || !e.data || !(SEP.test(e.data) || (e.data === ',' && !big))) return;
      e.preventDefault(); if (!last && b.value.trim()) go(open[i + 1]);
    });
    b.addEventListener('input', (e) => {
      if (/[０-９．]/.test(b.value)) b.value = b.value.replace(/[０-９．]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));   /* 전각 숫자(한글 자판 설정) */
      fitBlank(b);
      if (auto && e.inputType === 'insertText' && /^\d+$/.test(b.value) && b.value.length === cap && b.selectionEnd === b.value.length) { const nx = open.slice(i + 1).find((x) => !x.value.trim()); if (nx) go(nx); }
    });
    b.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'Enter') { e.preventDefault(); if (!b.value.trim()) return; const nx = nextEmpty(i); if (nx) go(nx); else if (onDone) onDone(); return; }   /* 빈 칸에서 Enter는 그대로(저절로 넘어온 칸을 건너뛰지 않게) */
      if (e.key === 'Backspace' && !b.value && i > 0) { e.preventDefault(); go(open[i - 1], true); }
      else if (e.key === 'ArrowLeft' && i > 0 && b.selectionStart === 0 && b.selectionEnd === 0) { e.preventDefault(); go(open[i - 1], true); }
      else if (e.key === 'ArrowRight' && !last && b.selectionStart === b.value.length) { e.preventDefault(); go(open[i + 1], true); }
    });
  });
  if (place && open.length && touchOnly()) numPad(open, { dec, go, nextEmpty, onEnd, place });
}
function numPad(open, { dec, go, nextEmpty, onEnd, place }) {
  let cur = open.find((x) => !x.value.trim()) || open[0];
  const kp = document.createElement('div'), many = open.length > 1, key = (d) => `<button type="button" data-d="${d}">${d}</button>`;
  kp.className = `kpad${dec ? ' dec' : ''}${many ? '' : ' one'}`; kp.setAttribute('role', 'group'); kp.setAttribute('aria-label', '숫자판');
  kp.innerHTML = `${[...'12345'].map(key).join('')}${dec ? key('.') : ''}<button type="button" class="kp-bs" data-a="bs">지우기</button>${[...'67890'].map(key).join('')}${many ? `<button type="button" class="kp-nx" data-a="nx">다음 칸${icon('arrow', 18)}</button>` : ''}`;
  open.forEach((b) => { b.inputMode = 'none'; b.addEventListener('focus', () => { cur = b; }); });
  kp.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) e.preventDefault(); });   /* 누르는 동안 칸이 포커스를 잃지 않게 */
  kp.addEventListener('click', (e) => {
    const k = e.target.closest('button'), b = cur; if (!k || k.disabled || !b || b.disabled) return;
    /* 계산기처럼 늘 끝에서 쓰고 지움 — 손가락으로 칸 앞쪽을 누르면 커서가 맨 앞에 가서 '지우기'가 앞 칸으로 넘어가던 것 · 칸 전체가 골라져 있으면(다음 칸으로 넘어온 칸) 바꿔 씀 */
    const i = open.indexOf(b), all = b.value.length > 0 && document.activeElement === b && b.selectionStart === 0 && b.selectionEnd === b.value.length;
    const put = (v, type, data) => { b.focus(); b.value = v; b.setSelectionRange(v.length, v.length); b.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: type, data })); };
    if (k.dataset.d) return put(all ? k.dataset.d : b.value + k.dataset.d, 'insertText', k.dataset.d);
    if (k.dataset.a === 'bs') { if (!b.value) { if (i > 0) go(open[i - 1], true); return; } return put(all ? '' : b.value.slice(0, -1), 'deleteContentBackward', null); }
    if (i < open.length - 1) go(open[i + 1]); else { const x = nextEmpty(i); if (x) go(x); else if (onEnd) onEnd(); }
  });
  place(kp);
}

export function draw(root, { prompt, sol = null, choices = null, tag = '', act = '', dots = null, conf = true, idk = true, extra = '', lead = '', given = null, hide = null, say = null, okLabel = '다 풀었어요', onAnswer }) {
  const t0 = performance.now();
  let cf = null;
  const gone = new Set((hide || []).map(Number));
  /* 자신감(conf) = 답을 쓰고 '얼마나 자신 있는지' 단추 셋 가운데 하나로 냄(처음 쓰는 아이 셋 모두 '먼저 짐작 고르기 → 답 칸 열림'에서 막힘 — 11-07 사용감 점검 · 고르기 문항은 보기를 고른 뒤 단추) */
  root.innerHTML = `<div class="qcard"><div class="qgrid">
    <div class="qmain">
      <div class="qtop">${tagHTML(tag, act)}${dots ? progHTML(dots) : ''}</div>
      ${extra}
      <div class="math" id="q">${toHTML(prompt)}</div>
    </div>
    <div class="qside">
      ${lead ? `<div class="qlead">${lead}</div>` : ''}
      ${say && say.length ? `<div class="tsay">${say.map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
      ${choices ? `<div class="choices">${choices.map((ch, k) => `<button type="button" data-k="${k}"${gone.has(k) ? ' class="gone" aria-label="튼튼이가 지운 보기"' : ''}><span class="math">${toHTML(ch, { static: true })}</span></button>`).join('')}</div>` : ''}
      <div class="qmsg" id="msg" role="alert"></div>
      ${conf ? `<div class="conf"><p><b>답 내기</b> — ${choices ? '보기를 고르고' : '답을 쓰고'} 얼마나 자신 있는지 하나 눌러요</p><div class="row">${CONF.map(([v, t]) => `<button type="button" class="cfs" data-cf="${v}">${icon('send', 16)}${t}</button>`).join('')}</div></div>` : ''}
      <div class="qact">
        ${choices || conf ? '' : `<button class="pri big" id="ok">${esc(okLabel)}</button>`}
        ${idk ? '<button id="idk">못 풀겠어요 · 넘어가기</button>' : ''}
      </div>
    </div>
  </div></div>`;
  const msg = root.querySelector('#msg'), card = root.querySelector('.qcard');
  const blanks = [...root.querySelectorAll('.blank')].sort((a, b) => a.dataset.i - b.dataset.i);
  if (given) blanks.forEach((b) => { const v = given[b.dataset.i]; if (v != null) { b.value = String(v); b.readOnly = true; b.classList.add('given'); b.tabIndex = -1; b.setAttribute('aria-label', `튼튼이가 채운 빈칸 ${v}`); fitBlank(b); } });
  const open = blanks.filter((b) => !b.readOnly);
  if (blanks.length === 2 && /÷.*…/.test(toText(prompt || [])) && !given) { blanks[0].placeholder = '몫'; blanks[1].placeholder = '나머지'; }   /* □ … □ 두 칸이 무엇인지(처음 보는 눈 11-08) */
  const nudge = (t, el) => { msg.classList.remove('soft'); msg.textContent = t; card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); if (el) el.focus(); };
  const ok = root.querySelector('#ok');
  const lock = (on) => {
    card.classList.toggle('locked', on);
    open.forEach((b) => (b.disabled = on));
    root.querySelectorAll('[data-k]').forEach((b) => (b.disabled = on || gone.has(Number(b.dataset.k))));
    root.querySelectorAll('.kpad button').forEach((b) => (b.disabled = on));
    if (ok) ok.disabled = on;
  };
  lock(false);
  /* 답을 다 쓰고 10초 동안 내지 않으면 한 줄 알림 + 내는 단추 테두리(흔들기 X · 첫 시범 '답만 쓰고 멈췄나' 대비 · 11-07) */
  let idleT = 0;
  const armIdle = () => { clearTimeout(idleT); idleT = setTimeout(() => {
    if (!card.isConnected || card.classList.contains('locked')) return;
    if (!(choices ? pick != null : open.length && open.every((x) => x.value.trim()))) return;
    msg.classList.add('soft'); msg.textContent = conf ? '답을 다 썼으면 아래 단추 중 하나를 눌러 내요.' : `답을 다 썼으면 '${okLabel}'를 눌러요.`;
    const c = root.querySelector('.conf') || ok; if (c) c.classList.add('wake');
  }, 10000); };
  open.forEach((x) => x.addEventListener('input', armIdle));
  root.querySelectorAll('[data-k]').forEach((x) => x.addEventListener('click', armIdle));
  const done = (a) => { clearTimeout(idleT); onAnswer(a, conf ? cf : null, Math.round(performance.now() - t0)); };
  let pick = null;   /* 자신감이 있는 고르기 문항 — 보기를 먼저 고르고(초록 테두리) 자신감 단추로 냄 */
  const readBlanks = () => {
    const raws = blanks.map((b) => b.value.trim().replace(/,/g, ''));
    if (raws.some((x) => !x)) { nudge(idk ? '빈칸을 모두 채워 주세요. 모르면 "못 풀겠어요 · 넘어가기"를 눌러요.' : '빈칸을 모두 채워 주세요. 모르면 위 튼튼이 말을 다시 읽어 봐요.', open.find((b) => !b.value.trim()));   /* 넘어가기 단추가 없는 화면(배우기)에서 없는 단추를 가리키지 않게 */ return null; }
    const vals = raws.map(parseNum);
    if (vals.some((v) => Number.isNaN(v))) { nudge('숫자로 써 주세요.', blanks[vals.findIndex((v) => Number.isNaN(v))]); return null; }
    return { vals, raws };
  };
  if (ok) ok.addEventListener('click', () => { const a = readBlanks(); if (a) done(a); });
  root.querySelectorAll('[data-cf]').forEach((b) => b.addEventListener('click', () => {
    if (choices) { if (pick == null) return nudge('먼저 보기를 하나 골라요.'); cf = Number(b.dataset.cf); return done({ vals: [pick], raws: [String(pick)] }); }
    const a = readBlanks(); if (!a) return;
    cf = Number(b.dataset.cf); done(a);
  }));
  wireBlanks(open, { prompt, sol, onDone: () => { if (ok) ok.click(); else { const c1 = root.querySelector('[data-cf="2"]'); if (c1) c1.focus(); } },
    onEnd: () => { const c = root.querySelector('.conf') || ok; if (c) { c.classList.add('wake'); c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } },   /* 숫자판 '다음 칸'은 내지 않고 내는 자리만 보여 줌 */
    place: (kp) => { const at = root.querySelector('.qside > .conf, .qside > .qact'); if (at) at.before(kp); } });
  root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    if (!conf) return done({ vals: [Number(b.dataset.k)], raws: [b.dataset.k] });
    pick = Number(b.dataset.k); root.querySelectorAll('[data-k]').forEach((x) => x.classList.toggle('on', x === b)); msg.textContent = '';
    const cr = root.querySelector('.conf'); if (cr) cr.classList.add('ready');   /* 보기를 고르면 '이제 이걸 눌러 내요'가 보이게 */
  }));
  const ik = root.querySelector('#idk');
  if (ik) ik.addEventListener('click', () => onAnswer({ idk: true }, 0, Math.round(performance.now() - t0)));
  if (open[0]) open[0].focus();
}

// 찍기 멈춤 — 2초 안에 틀린 답이 세 번 이어지면 잠깐 멈춤 · 찍기는 학습 저하와 가장 세게 묶인다 [A-R29]
//  '넘어가기'는 솔직한 모름이라 세지 않음(찍은 오답만) · 준비 다리 · 다듬기에서 같이 씀(선생님 화면의 K.rush는 부르는 쪽이 셈)
// 맞았을 때 잠깐 ✓ — 맞혀도 아무 말이 없으면 틀릴 때만 화면이 말을 거는 꼴(벌 받는 느낌 · '맞은 거야 넘어간 거야?' — 11-07 사용감 점검) · 0.6초 뒤 저절로 다음
export function okFlash(root, then, ms = 650) {
  root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button, .qcard .conf button, .qcard .kpad button').forEach((x) => (x.disabled = true));
  const box = document.createElement('div'); box.className = 'fb ok flash'; box.textContent = '맞았어요!';
  fbSlot(root).appendChild(box); setTimeout(() => { if (box.isConnected) then(); }, ms);   /* 0.6초 안에 '처음 화면'을 누르면 그 화면에 지난 활동의 다음 문제를 덮어 그리던 것(코덱스 11-07) */
}
export function rushGuard() {
  let n = 0;
  return (ms, a, ok) => { n = a.idk ? n : ms < 2000 && !ok ? n + 1 : 0; if (n >= 3) { n = 0; return true; } return false; };
}
/* 멈춤 단추 — 남은 초를 단추에 보이고(꺼진 단추로만 보여 눌러도 안 되는 줄 알던 것 · 처음 보는 눈 11-08) 다 되면 켬 */
export function waitBtn(b, sec = 3) { const lab = b.textContent; let k = sec; b.disabled = true; b.textContent = `${lab} (${k})`; const iv = setInterval(() => { k--; if (k > 0) { b.textContent = `${lab} (${k})`; return; } clearInterval(iv); b.textContent = lab; b.disabled = false; b.focus(); }, 1000); }
export function rushPause(root, onGo) {
  root.innerHTML = `<div class="card msg"><div class="say">${mascot('think', 104)}<div class="bub">잠깐! 조금 빨라요. 문제를 <b>끝까지 읽고</b> 풀어요.<br>모르는 문제는 '못 풀겠어요 · 넘어가기'를 눌러도 괜찮아요.</div></div><div class="acts"><button class="pri big" id="r" disabled>다시 해 볼게요</button></div></div>`;
  const b = root.querySelector('#r'); waitBtn(b);
  b.addEventListener('click', onGo);
}

// 단계 하나(이미 푼 모습) — 쪼갠 풀이 보기용 · why: false = 식만(고치기 시범 — 글은 튼튼이 말풍선에)
export const stepHTML = (st, { vals = null, marks = null, cls = '', why = true } = {}) => `<li class="${cls}">${why ? `<span class="why">${esc(st.why)}</span>` : ''}<span class="math">${toHTML(st.prompt, { static: true, vals: vals || st.sol, marks })}</span></li>`;
export const staticHTML = (prompt, vals, marks) => `<span class="math">${toHTML(prompt, { static: true, vals, marks })}</span>`;

// 답 보여 주기 — 고르기 문항의 sol은 보기 번호라서 보기 글로 바꿔 보인다('답 0'이 아니라 '답 8.21')
//  it = { sol, choices? } (문항 · snap 둘 다) · ansHTML = 굵게 쓸 답 · ansSay = '답은 ○○이에요/예요'(받침 맞춤)
const ansPlain = (it) => (it.choices ? toText(it.choices[Number(it.sol[0])] || []) : (it.sol || []).join(', '));
export const ansHTML = (it) => (it.choices ? toHTML(it.choices[Number(it.sol[0])] || [], { static: true }) : esc((it.sol || []).join(', ')));
export function ansSay(it, lead = '답은') {
  const t = ansPlain(it).trim(), word = /[가-힣]$/.test(t);
  return `${lead} <b>${word ? `‘${ansHTML(it)}’` : ansHTML(it)}</b>${P(t, '이에요', '예요')}.`;   /* 글 답도 받침대로('서른이에요' · '아흔이에요') */
}
