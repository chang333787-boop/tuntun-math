// 맞춤 연습지 — 선생님이 한 아이에게 고른 칸만 · 주소 # 뒤 JSON: { who, seed, chk?, ex?, key?, s:[{ t: 갈래 이름, note: 지시 한 줄, dup?, mix?, it:[{ c: 차시, n: 문제 수, re?: 문제 글 거르기, want?: 오개념 카드 id }] }] }
//  같은 주소 = 같은 문제(씨앗) · 뽑기는 pick.js(선생님 화면과 같은 것) · 갈래마다 한 쪽(문제 10개까지 · 넘으면 이어서 다음 쪽) · 보기(풀이 채움) 하나 · 끝에 정답 쪽
//  chk: true면 문제마다 '확인' 동그라미 · ex: false면 보기 없음 · key: false면 정답 쪽 없음 · 함정 꼴 문항(want)도 종이엔 표시 없음 · 학년 · 오개념 이름 X
import { buildSheet } from './pick.js';
import { toHTML, toText } from '../../engine/tokens.js';

const COL = [['#2f5d3a', '#e8f0e9'], ['#7a4a1d', '#f3ebe2'], ['#b5541f', '#fbeee4'], ['#2c5aa0', '#e7eef8'], ['#1f7a7a', '#e3f1f1'], ['#4f7d2a', '#edf3e6'], ['#8a3f6e', '#f5e8f0']];
const NUM = ['①', '②', '③', '④', '⑤'];
const PER = 10;   /* 한 쪽에 문제 10개(두 줄 × 다섯 칸) */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const chHTML = (it, mark = null) => `<div class="ch">${it.choices.map((ch, k) => `<span class="${mark === k ? 'on' : ''}">${NUM[k]} ${toHTML(ch, { static: true })}</span>`).join('')}</div>`;
let CHK = false;   /* 실수가 잦은 아이 — 문제마다 '확인' 동그라미(풀고 거꾸로 셈으로 확인하면 ✓) */
const qHTML = (it, i) => { const long = toText(it.prompt).length > 22; return `<div class="q"><span class="n">${i + 1}</span>${CHK ? '<span class="ck"><i></i>확인</span>' : ''}<div class="p${long ? ' long' : ''}">${toHTML(it.prompt, { static: true })}</div>${it.choices ? chHTML(it) : ''}</div>`; };
const exHTML = (it) => `<div class="ex"><b>보기</b><div>${toHTML(it.prompt, { static: true, vals: it.choices ? null : it.sol })}${it.choices ? chHTML(it, Number(it.sol[0])) : ''}</div></div>`;
const hasB = (t) => t && typeof t === 'object' && ('b' in t || ['f', 'm'].some((k) => Array.isArray(t[k]) && t[k].some((x) => x && typeof x === 'object' && 'b' in x)));
/* 정답 = 빈칸이 든 토막만 값을 채워 글로(분수는 17/18 · 대분수는 1 5/18 — 쉼표로 늘어놓으면 '1, 5, 18'로 읽힘 · 11-07) */
const ansText = (it) => (it.choices ? `${NUM[Number(it.sol[0])]} ${toText(it.choices[Number(it.sol[0])] || [])}` : (it.prompt || []).filter(hasB).map((t) => toText([t], it.sol)).join(', ') || it.sol.join(', '));
const foot = '<div class="foot"><span>맞춤 연습지</span><span class="pg"></span></div>';

const spec = (() => { try { return JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch (e) { return null; } })();
const out = document.getElementById('out');
if (!spec || !Array.isArray(spec.s) || !spec.s.length) out.innerHTML = '<p class="noprint">주소 # 뒤에 연습지 설정이 없어요.</p>';
else {
  const who = spec.who ? esc(spec.who) : '';
  CHK = !!spec.chk;
  const showEx = spec.ex !== false, showKey = spec.key !== false;
  const secs = buildSheet(spec);
  const band = (s, k) => `<div class="band"><span class="badge">${k + 1}</span><h1>${esc(s.t)}</h1>${who ? `<span class="who">${who}</span>` : ''}</div>`;
  out.innerHTML = secs.map((s, k) => { const [c, t] = COL[k % COL.length], pages = [];
    for (let from = 0; from < Math.max(1, s.items.length); from += PER) {
      const first = from === 0, its = s.items.slice(from, from + PER);
      pages.push(`<div class="page${first ? '' : ' more'}" style="--c:${c};--t:${t}">${band(s, k)}
      ${first && (s.note || CHK) ? `<p class="note">${esc(s.note || '')}${CHK ? ' <span class="cknote">다 풀면 거꾸로 셈으로 확인하고 ○에 ✓ 해요.</span>' : ''}</p>` : ''}${first && showEx && s.ex ? exHTML(s.ex) : ''}
      <div class="grid">${its.map((it, i) => qHTML(it, from + i)).join('')}</div>${foot}</div>`);
    }
    return pages.join(''); }).join('')
    + (showKey ? `<div class="page key"><h1>정답</h1><div class="kbody">${secs.map((s, k) => `<section style="--c:${COL[k % COL.length][0]}"><h2>${k + 1}. ${esc(s.t)}</h2><ol>${s.items.map((it, i) => `<li><b>${i + 1}</b>${esc(ansText(it))}</li>`).join('')}</ol></section>`).join('')}</div>${foot}</div>` : '');
  document.title = `맞춤 연습지${who ? ` — ${spec.who}` : ''}`;
  /* 정답 쪽이 넘치면 갈래를 다음 쪽으로(문제 수를 15 · 20으로 늘리면 한 쪽에 다 들어가지 않음) */
  for (let key = out.querySelector('.page.key:last-child'); key && key.scrollHeight > key.clientHeight + 1; key = out.querySelector('.page.key:last-child')) {
    const body = key.querySelector('.kbody'), moved = [];
    while (body.children.length > 1 && key.scrollHeight > key.clientHeight + 1) moved.unshift(body.lastElementChild), body.lastElementChild.remove();
    if (!moved.length) break;
    key.insertAdjacentHTML('afterend', `<div class="page key"><h1>정답 (이어서)</h1><div class="kbody"></div>${foot}</div>`);
    moved.forEach((x) => out.querySelector('.page.key:last-child .kbody').appendChild(x));
  }
  const all = out.querySelectorAll('.page');
  all.forEach((p, i) => { p.querySelector('.pg').textContent = `${i + 1} / ${all.length}`; });
  /* 칸마다 맞춤 — 넘치는 칸만 글자 · 그림을 5%씩 줄임(60%까지 · 쪽 전체를 줄이면 다른 문제까지 작아지던 것) */
  for (const q of document.querySelectorAll('.q')) {
    const over = () => q.scrollHeight > q.clientHeight + 1 || q.scrollWidth > q.clientWidth + 1;
    for (let k = 1; over() && k > 0.6; ) { k = Math.round((k - 0.05) * 100) / 100; q.style.setProperty('--k', k); }
  }
}
