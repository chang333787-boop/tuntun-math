// 맞춤 연습지 — 선생님이 한 아이에게 고른 칸만 · 주소 # 뒤 JSON: { who, seed, s:[{ t: 갈래 이름, note: 지시 한 줄, it:[{ c: 차시, n: 문제 수, re?: 문제 글 거르기 }] }] }
//  같은 주소 = 같은 문제(씨앗) · 갈래 안에서 같은 답은 둘까지 · 같은 문제 두 번 X · 보기(풀이 채움) 하나 · 끝에 정답 쪽
import { pickItems } from './gen.js';
import { rng } from '../../engine/math.js';
import { toHTML, toText } from '../../engine/tokens.js';

const COL = [['#2f5d3a', '#e8f0e9'], ['#7a4a1d', '#f3ebe2'], ['#b5541f', '#fbeee4'], ['#2c5aa0', '#e7eef8'], ['#1f7a7a', '#e3f1f1'], ['#4f7d2a', '#edf3e6'], ['#8a3f6e', '#f5e8f0']];
const NUM = ['①', '②', '③', '④', '⑤'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function pickSection(sec, r, used) {
  const out = [], ans = {};
  for (const sp of sec.it) {
    const re = sp.re ? new RegExp(sp.re) : null; let got = 0;
    for (let round = 0; round < 12 && got < sp.n; round++) {
      for (const it of pickItems(sp.c, sp.n * 4, r, used)) {
        if (got >= sp.n) break;
        const txt = toText(it.prompt), key = JSON.stringify(it.sol);
        if (re && !re.test(txt)) continue;
        if (!it.choices && (ans[key] || 0) >= 2) continue;   /* 같은 답이 셋째부터는 빼기(16 − 7 · 14 − 5 · 17 − 8이 다 9이던 것) · 고르기는 답이 '짝수/홀수'처럼 늘 겹쳐 빼지 않음 */
        if (out.some((x) => toText(x.prompt) === txt)) continue;
        ans[key] = (ans[key] || 0) + 1; out.push(it); got++;
      }
    }
  }
  return out;
}
const chHTML = (it, mark = null) => `<div class="ch">${it.choices.map((ch, k) => `<span class="${mark === k ? 'on' : ''}">${NUM[k]} ${toHTML(ch, { static: true })}</span>`).join('')}</div>`;
const qHTML = (it, i) => { const long = toText(it.prompt).length > 22; return `<div class="q"><span class="n">${i + 1}</span><div class="p${long ? ' long' : ''}">${toHTML(it.prompt, { static: true })}</div>${it.choices ? chHTML(it) : ''}</div>`; };
const exHTML = (it) => `<div class="ex"><b>보기</b><div>${toHTML(it.prompt, { static: true, vals: it.choices ? null : it.sol })}${it.choices ? chHTML(it, Number(it.sol[0])) : ''}</div></div>`;
const ansText = (it) => (it.choices ? `${NUM[Number(it.sol[0])]} ${toText(it.choices[Number(it.sol[0])] || [])}` : it.sol.join(', '));

const spec = (() => { try { return JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch (e) { return null; } })();
const out = document.getElementById('out');
if (!spec || !Array.isArray(spec.s)) out.innerHTML = '<p class="noprint">주소 # 뒤에 연습지 설정이 없어요.</p>';
else {
  const r = rng(Number(spec.seed) || 1), used = new Set(), who = spec.who ? esc(spec.who) : '';
  const secs = spec.s.map((sec) => { const items = pickSection(sec, r, used), seen = new Set(items.map((x) => toText(x.prompt))); const [ex] = pickItems(sec.it[0].c, 12, r, new Set()).filter((it) => !seen.has(toText(it.prompt)) && (!sec.it[0].re || new RegExp(sec.it[0].re).test(toText(it.prompt)))); return { ...sec, items, ex }; });   /* 보기는 문제와 글이 다른 것(수가 적은 칸은 고른 문제가 다 써서 보기가 비던 것) */
  const total = secs.length + 1;
  out.innerHTML = secs.map((s, k) => { const [c, t] = COL[k % COL.length];
    return `<div class="page" style="--c:${c};--t:${t}"><div class="band"><span class="badge">${k + 1}</span><h1>${esc(s.t)}</h1>${who ? `<span class="who">${who}</span>` : ''}</div>
      ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}${s.ex ? exHTML(s.ex) : ''}
      <div class="grid">${s.items.map(qHTML).join('')}</div>
      <div class="foot"><span>맞춤 연습지</span><span>${k + 1} / ${total}</span></div></div>`; }).join('')
    + `<div class="page key"><h1>정답</h1>${secs.map((s, k) => `<section style="--c:${COL[k % COL.length][0]}"><h2>${k + 1}. ${esc(s.t)}</h2><ol>${s.items.map((it, i) => `<li><b>${i + 1}</b>${esc(ansText(it))}</li>`).join('')}</ol></section>`).join('')}<div class="foot" style="margin-top:auto"><span>맞춤 연습지</span><span>${total} / ${total}</span></div></div>`;
  document.title = `맞춤 연습지${who ? ` — ${spec.who}` : ''}`;
  /* 칸마다 맞춤 — 넘치는 칸만 글자 · 그림을 5%씩 줄임(60%까지 · 쪽 전체를 줄이면 다른 문제까지 작아지던 것) */
  for (const q of document.querySelectorAll('.q')) {
    const over = () => q.scrollHeight > q.clientHeight + 1 || q.scrollWidth > q.clientWidth + 1;
    for (let k = 1; over() && k > 0.6; ) { k = Math.round((k - 0.05) * 100) / 100; q.style.setProperty('--k', k); }
  }
}
