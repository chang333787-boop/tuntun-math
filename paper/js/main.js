// 끊긴 곳 찾기 — 화면(#주소)
//  흐름: ① 선별 점검지 → ② 결과 넣기(틀린 문제만 · 아이 답) → ③ 아이 보기(여기서부터 · 가능한 원인 · 다음 할 일) → ④ 확인지 · 보충지 · 다시 보기 → ⑤ 반 표
import * as S from './store.js';
import { makeSheet, GRADES, GL, LES, lessonName, unitName, STRAND, STRANDS, strandOf, KIND, newId, pickItems, formOf } from './gen.js';
import { kidReport, readItem, ST, bugName, classTable } from './judge.js';
import { paginate, drawPages, practiceHTML, ansStr, letterHTML } from './paper.js';
import { mascot } from './mascot.js';
const say = (pose, html) => `<div class="say">${mascot(pose, 72)}<div class="bub">${html}</div></div>`;
import { workedSteps } from '../../engine/practice.js';
import { toText } from '../../engine/tokens.js';
import { rng } from '../../engine/math.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const view = $('#view');
// 확인지는 아래 차시부터 열 개씩(3~4쪽) — 가상 아이 시험에서 한 번에 다 내는 것보다 정확하고 문항도 적었음(sheets/test/sim.mjs)
const CHECK_CAP = 10;
const KINDS = { gate: '선별 점검', full: '모든 차시 점검', detail: '자세히 점검', check: '확인지', retest: '다시 보기' };
const KDESC = { gate: '학기 × 영역마다 관문 차시만 — 처음 할 것', full: '범위의 모든 차시를 3문제씩', detail: '막힌 관문 아래 차시를 자세히', check: '흔들리거나 아직 안 본 아래 차시 · 두 원인을 가르는 문제', retest: '보충한 차시를 새 숫자로' };
const dateOf = (t) => new Date(t).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
const ord = (c) => { const x = LES(c); return x ? Number(x.g[0]) * 10 + Number(x.g[2]) : 99; };
const nameOf = (c) => `${LES(c) ? LES(c).g : ''} ${lessonName(c)}`;

function nav(active) {
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === active));
}
function route() {
  const h = location.hash.replace(/^#\/?/, ''), [a, b, c] = h.split('/');
  window.scrollTo(0, 0);
  try {
    if (!a) return home();
    if (a === 'new') return newView(b || 'gate');
    if (a === 's') return sheetView(b);
    if (a === 'r') return resultView(b, c);
    if (a === 'k') return kidView(b);
    if (a === 'class') return classView();
    if (a === 'help') return helpView();
    if (a === 'data') return dataView();
    home();
  } catch (e) { console.error(e); view.innerHTML = `<div class="card warn">화면을 그리다 문제가 생겼어요: ${esc(e.message)}</div>`; }
}
window.addEventListener('hashchange', route);

// ── 처음 화면 ──
function home() {
  nav('home');
  const kids = S.kids(), sheets = S.sheets();
  const prog = (s) => (s.kids || []).map((k) => `<a class="pill ${S.hasResult(s.id, k) ? 'done' : ''}" href="#/r/${s.id}/${k}">${esc((S.kid(k) || {}).label || '?')}${S.hasResult(s.id, k) ? ' ✓' : ''}</a>`).join('');
  view.innerHTML = `
  <section class="intro">
    ${say('hi', '<b>안녕하세요, 튼튼이예요!</b> 아이들과 수 다리를 건너며 어디서 끊겼는지 같이 찾아요.')}
    <ol class="flow4"><li><span class="st">1</span><b>선별 점검지</b>를 인쇄해 풀게 해요<small>학기마다 관문 차시만 · 9쪽 안팎</small></li><li><span class="st">2</span>장마다 <b>틀린 문제만</b> 눌러요<small>아이 답을 넣으면 그 숫자로 가능한 원인을 찾아요</small></li><li><span class="st">3</span>아이 보기에서 <b>여기서부터</b>를 봐요<small>아래 먼저 확인할 곳도 함께</small></li><li><span class="st">4</span><b>확인지 · 보충지 · 다리 편지</b>를 뽑아요<small>새 숫자로 다시 보기까지</small></li></ol>
  </section>
  <section class="card">
    <h2>우리 반 아이 <small>이름 대신 번호나 별명 · 이 기기에만 저장돼요</small></h2>
    <div class="kids">${kids.map((k) => `<div class="kid"><a href="#/k/${k.id}">${esc(k.label)}</a><button class="x" data-del-kid="${k.id}" title="지우기">✕</button></div>`).join('') || say('point', '먼저 아이를 더해 주세요. 이름 대신 <b>번호나 별명</b>이면 충분해요.')}</div>
    <form class="addkid"><input name="label" placeholder="예: 3번 · 하늘" maxlength="20" aria-label="번호나 별명"><button>더하기</button><button type="button" data-many>1~25번 한 번에</button></form>
  </section>
  <section class="card">
    <h2>점검지 만들기</h2>
    <div class="mk">${['gate', 'full'].map((k) => `<a class="big ${k === 'gate' ? 'pri' : ''}" href="#/new/${k}"><b>${KINDS[k]}</b><span>${KDESC[k]}</span></a>`).join('')}</div>
    <p class="muted">확인지 · 보충지 · 다시 보기는 아이 보기에서 그 아이에게 맞춰 만들어요.</p>
  </section>
  <section class="card">
    <h2>만든 점검지</h2>
    ${sheets.length ? `<table class="list"><tr><th>판</th><th>종류</th><th>범위</th><th>문항</th><th>만든 날</th><th>결과 넣기</th><th></th></tr>${sheets.map((s) => `<tr><td><a href="#/s/${s.id}"><b>${s.id}</b></a></td><td>${KINDS[s.kind] || s.kind}</td><td>${s.range ? `${s.range.from} ~ ${s.range.to}` : ''}</td><td>${s.items.length}</td><td>${dateOf(s.made)}</td><td>${prog(s)}</td><td><button class="x" data-del-sheet="${s.id}" title="지우기">✕</button></td></tr>`).join('')}</table>` : say('think', '아직 만든 점검지가 없어요. 위에서 <b>선별 점검</b>부터 만들어 볼까요?')}
  </section>`;
  view.querySelector('.addkid').onsubmit = (e) => { e.preventDefault(); const v = e.target.label.value.trim(); if (v) { S.addKid(v); home(); } };
  view.querySelector('[data-many]').onclick = () => { if (!confirm('1번부터 25번까지 더할까요? (나중에 별명으로 바꿀 수 있어요)')) return; for (let i = 1; i <= 25; i++) if (!S.kids().some((k) => k.label === `${i}번`)) S.addKid(`${i}번`); home(); };
  view.querySelectorAll('[data-del-kid]').forEach((b) => (b.onclick = () => { const k = S.kid(b.dataset.delKid); if (confirm(`${k.label}을(를) 지울까요? 결과도 함께 지워져요.`)) { S.removeKid(k.id); home(); } }));
  view.querySelectorAll('[data-del-sheet]').forEach((b) => (b.onclick = () => { if (confirm(`판 ${b.dataset.delSheet}와 그 결과를 지울까요?`)) { S.removeSheet(b.dataset.delSheet); home(); } }));
}

// ── 만들기 ──
function newView(kind, preset = null) {
  nav('home');
  const kids = S.kids();
  const opt = (sel) => GRADES.map((g) => `<option value="${g}" ${g === sel ? 'selected' : ''}>${GL(g)}</option>`).join('');
  view.innerHTML = `<section class="card">
    <h2>${KINDS[kind]} 만들기 <small>${KDESC[kind]}</small></h2>
    <form class="newf">
      <label>범위 <select name="from">${opt('1-1')}</select> ~ <select name="to">${opt('4-1')}</select></label>
      <fieldset><legend>누가 풀어요</legend>${kids.length ? kids.map((k) => `<label class="chk"><input type="checkbox" name="kid" value="${k.id}" checked> ${esc(k.label)}</label>`).join('') : '<span class="muted">아이를 먼저 더하면 결과를 넣을 수 있어요(종이만 뽑아도 돼요).</span>'}</fieldset>
      <fieldset><legend>숫자</legend><label class="chk"><input type="radio" name="same" value="1" checked> 반 전체 같은 숫자(정답 한 벌로 채점)</label><label class="chk"><input type="radio" name="same" value="0"> 아이마다 다른 숫자(베끼기를 막음 · 아이마다 판이 따로)</label></fieldset>
      <label class="chk"><input type="checkbox" name="words" checked> 이야기 문제(문장제) 넣기 — 식과 답을 따로 봐요</label>
      <button class="pri">만들기</button>
    </form></section>`;
  view.querySelector('.newf').onsubmit = (e) => {
    e.preventDefault();
    const f = e.target, from = f.from.value, to = f.to.value;
    if (GRADES.indexOf(from) > GRADES.indexOf(to)) { alert('범위의 앞이 뒤보다 늦어요.'); return; }
    const who = [...f.querySelectorAll('[name=kid]:checked')].map((x) => x.value), same = f.same.value === '1', words = f.words.checked;
    const made = [];
    if (same || !who.length) { const sh = makeSheet({ kind, from, to, words }); sh.kids = who; S.putSheet(sh); made.push(sh); }
    else for (const k of who) { const sh = makeSheet({ kind, from, to, words }); sh.kids = [k]; S.putSheet(sh); made.push(sh); }
    location.hash = made.length === 1 ? `#/s/${made[0].id}` : '#/';
  };
}

// ── 점검지 보기 · 인쇄 ──
function measureHost() { let m = $('#measure'); if (!m) { m = document.createElement('div'); m.id = 'measure'; m.className = 'paper'; document.body.append(m); } return m; }
function layout(sh, kidLabel = '') { const m = measureHost(); const pages = paginate(m, sh, { kidLabel }); m.innerHTML = ''; return pages; }
function printPages(html) {
  let p = $('#print'); if (!p) { p = document.createElement('div'); p.id = 'print'; p.className = 'paper'; document.body.append(p); }
  p.innerHTML = html; document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); p.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); setTimeout(() => window.print(), 120);
}
function printSheet(sh, key, kidIds) {
  const host = document.createElement('div'); let html = '';
  const who = kidIds && kidIds.length ? kidIds : [null];
  for (const k of who) { const lab = k ? (S.kid(k) || {}).label || '' : ''; const pages = layout(sh, key ? '' : lab); drawPages(host, sh, pages, { key, kidLabel: key ? '' : lab }); html += host.innerHTML; if (key) break; }
  printPages(html);
}
function sheetView(id) {
  nav('home');
  const sh = S.sheet(id); if (!sh) { view.innerHTML = '<div class="card">이 점검지가 없어요.</div>'; return; }
  const kids = (sh.kids || []).map((k) => S.kid(k)).filter(Boolean);
  const nWord = sh.items.filter((it) => it.form === 'w').length, lessons = new Set(sh.items.filter((it) => it.form !== 'w').map((it) => it.c)).size;
  view.innerHTML = `<section class="card">
    <h2>${KINDS[sh.kind] || sh.kind} · 판 <b>${sh.id}</b> <small>${sh.range ? `${GL(sh.range.from)} ~ ${GL(sh.range.to)} · ` : ''}${sh.items.length}문항(이야기 문제 ${nWord}) · 차시 ${lessons}개 · ${dateOf(sh.made)}</small></h2>
    ${sh.note ? `<p class="muted">${esc(sh.note)}</p>` : ''}
    <div class="acts"><button class="pri" data-p="kid">아이 종이 인쇄${kids.length > 1 ? `(${kids.length}명 이름 넣어)` : ''}</button><button data-p="key">정답 겹쳐 보기 인쇄</button>
    ${kids.map((k) => `<a class="btn" href="#/r/${sh.id}/${k.id}">${esc(k.label)} 결과 넣기${S.hasResult(sh.id, k.id) ? ' ✓' : ''}</a>`).join('')}</div>
    ${(sh.warn || []).length ? `<p class="warn">${sh.warn.map(esc).join(' · ')}</p>` : ''}
    ${S.kids().length ? `<details class="who"><summary>이 판을 푸는 아이 고치기(${kids.length}명)</summary>${S.kids().map((k) => `<label class="chk"><input type="checkbox" data-who="${k.id}" ${(sh.kids || []).includes(k.id) ? 'checked' : ''}> ${esc(k.label)}</label>`).join('')}</details>` : ''}
    <p class="muted">인쇄 창에서 용지 A4 · 배율 100%(맞춤 없음) · 여백 없음으로 뽑아요. 흑백으로 뽑아도 돼요.</p>
  </section><div class="paper preview" id="pv"></div>`;
  const pages = layout(sh, kids.length === 1 ? kids[0].label : '');
  drawPages($('#pv'), sh, pages, { kidLabel: kids.length === 1 ? kids[0].label : '' });
  view.querySelector('[data-p=kid]').onclick = () => printSheet(sh, false, kids.map((k) => k.id));
  view.querySelectorAll('[data-who]').forEach((c) => (c.onchange = () => { sh.kids = [...view.querySelectorAll('[data-who]:checked')].map((x) => x.dataset.who); S.putSheet(sh); sheetView(sh.id); }));
  view.querySelector('[data-p=key]').onclick = () => printSheet(sh, true);
}

// ── 결과 넣기 ──
function resultView(sid, kidId) {
  nav('home');
  const sh = S.sheet(sid), k = S.kid(kidId);
  if (!sh || !k) { view.innerHTML = '<div class="card">점검지나 아이를 찾지 못했어요.</div>'; return; }
  const r = S.result(sid, kidId);
  const byK = Object.fromEntries(sh.items.map((it) => [it.k, it]));
  const chTitle = (ch) => (ch.key === 'W' ? '이야기 문제' : ch.key === 'END' ? '마무리' : `${STRAND[ch.s] || ''} · ${GL(ch.g)}`);
  const card = (it) => {
    if (it.form === 'w') {
      const w = r.w[it.k] || {};
      return `<div class="rc w" data-k="${it.k}"><div class="rt"><span class="no">${it.k}</span>${esc(toText(it.word.story).slice(0, 70))}…</div><div class="ra">식 <b>${esc(it.word.calc ? toText(it.word.calc.prompt, it.word.calc.sol.map(String)) : '')}</b> · 답 <b>${esc(toText(it.word.ans, it.word.sol.map(String)).replace(/^답\s*/, ''))}</b></div>
        <div class="rb"><button data-w="f" class="${w.f === 0 ? 'on' : ''}">식 ✕</button><button data-w="a" class="${w.a === 0 ? 'on' : ''}">답 ✕</button></div></div>`;
    }
    const m = r.it[it.k] || {}, s = m.s || '';
    const dv = it.form === 'd', n = it.snap.choices ? 1 : dv ? 2 : it.snap.sol.length;   // 나눗셈 세로는 종이처럼 몫 · 나머지 두 칸
    const lab = (i) => (dv ? (i ? '나머지 ' : '몫 ') : '');
    const inputs = s === 'x' ? `<div class="ri">아이 답 ${it.snap.choices ? `<select data-a="0"><option value="">고른 번호</option>${it.snap.choices.map((_, i) => `<option value="${i}" ${String((m.a || [])[0]) === String(i) ? 'selected' : ''}>${'①②③④⑤'[i]}</option>`).join('')}</select>` : Array.from({ length: n }, (_, i) => `${lab(i)}<input data-a="${i}" inputmode="decimal" value="${esc((m.a || [])[i] ?? '')}" aria-label="아이가 쓴 ${dv ? lab(i) : `${i + 1}번째 칸`}">`).join(!dv && it.snap.prompt.some((t) => typeof t === 'string' && t.includes('…')) ? ' … ' : ' ')}<span class="why"></span></div>` : '';
    return `<div class="rc ${s}" data-k="${it.k}"><div class="rt"><span class="no">${it.k}</span>${esc(toText(it.snap.prompt).replace('[그림]', '(그림) ').slice(0, 60))}</div><div class="ra">정답 <b>${esc(ansStr(it))}</b></div>
      <div class="rb"><button data-s="x" class="${s === 'x' ? 'on' : ''}">✕ 틀림</button><button data-s="q" class="${s === 'q' ? 'on' : ''}">? 모름</button><button data-s="h" class="${s === 'h' ? 'on' : ''}">도움</button></div>${inputs}</div>`;
  };
  view.innerHTML = `<section class="card"><h2>${esc(k.label)} · 판 ${sh.id} 결과 넣기 <small>${KINDS[sh.kind] || ''}</small></h2>
    <p>장마다 <b>틀린 문제만</b> 누르고 <b>이 장 채점 끝</b>을 켜요. 표시 안 한 문제는 맞음으로 셈해요(채점 끝을 켠 장만). 아이가 쓴 답을 넣으면 그 숫자로 가능한 원인을 바로 보여 줘요(넣지 않아도 돼요).</p>
    <div class="acts"><a class="btn" href="#/k/${kidId}">${esc(k.label)} 보기 →</a></div></section>
    ${sh.chapters.map((ch) => `<section class="card rch ${r.done[ch.key] ? 'done' : ''}" data-ch="${ch.key}"><h3>${esc(chTitle(ch))} <small>${ch.ks[0]}~${ch.ks[ch.ks.length - 1]}번</small></h3>
      <div class="rgrid">${ch.ks.map((kk) => card(byK[kk])).join('')}</div>
      <div class="rf"><label class="chk"><input type="checkbox" data-done ${r.done[ch.key] ? 'checked' : ''}> 이 장 채점 끝</label><label>걸린 시간 <input data-t inputmode="numeric" value="${esc(r.t[ch.key] ?? '')}" size="3">분</label></div></section>`).join('')}`;
  const refreshWhy = (el) => {
    const kk = Number(el.dataset.k), it = byK[kk], w = el.querySelector('.why'); if (!w) return;
    const x = readItem(sh, it, { done: { [it.ch]: true }, it: { [kk]: r.it[kk] } });
    if (!x || x.ok) { w.textContent = x && x.fix ? x.fix : ''; return; }
    if (x.remNote) { w.textContent = x.remNote; return; }
    if (x.note) { w.textContent = `이 보기를 고르면 흔히: ${x.note}(고르기 문제라 원인으로 세지는 않아요)`; return; }
    const d = x.d;
    w.textContent = !r.it[kk].a || !r.it[kk].a.some((v) => v !== '') ? '' : d && d.hyps.length ? `가능한 원인: ${d.hyps.map((h) => h.name).join(' / ')}${d.slip ? ` · 또는 ${d.slip}` : ''}` : d && d.slip ? `계산 실수로 보여요(${d.slip})` : '알려진 틀린 방법과 맞지 않아요 — 풀이를 봐 주세요';
  };
  view.querySelectorAll('.rc').forEach((el) => bindCard(el));
  function bindCard(el) {
    const kk = Number(el.dataset.k);
    if (el.classList.contains('w')) { el.querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => { const w = (r.w[kk] = r.w[kk] || {}); w[b.dataset.w] = w[b.dataset.w] === 0 ? 1 : 0; w.t = r.at = Date.now(); b.classList.toggle('on', w[b.dataset.w] === 0); S.save(true); })); return; }
    el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { const cur = (r.it[kk] || {}).s, now = Date.now(); r.it[kk] = cur === b.dataset.s ? { s: 'ok', t: now } : { ...(r.it[kk] || {}), s: b.dataset.s, t: now }; if (r.it[kk].s !== 'x') delete r.it[kk].a; r.at = now; S.save(); const nel = document.createElement('div'); nel.innerHTML = card(byK[kk]); const ne = nel.firstElementChild; el.replaceWith(ne); bindCard(ne); const inp = ne.querySelector('[data-a]'); if (inp) inp.focus(); }));
    el.querySelectorAll('[data-a]').forEach((inp) => { inp.oninput = () => { const m = r.it[kk]; m.a = m.a || []; m.a[Number(inp.dataset.a)] = inp.value.trim(); m.t = r.at = Date.now(); S.save(); refreshWhy(el); }; inp.onchange = () => { inp.oninput(); S.save(true); }; });
    refreshWhy(el);
  }
  view.querySelectorAll('.rch').forEach((sec) => {
    const ch = sec.dataset.ch;
    sec.querySelector('[data-done]').onchange = (e) => { if (e.target.checked) r.done[ch] = true; else delete r.done[ch]; sec.classList.toggle('done', e.target.checked); r.at = Date.now(); S.save(true); };
    sec.querySelector('[data-t]').oninput = (e) => { r.t[ch] = e.target.value; S.save(); };
    sec.querySelector('[data-t]').onchange = () => S.save(true);
  });
}

// ── 아이 보기 ──
function kidSheets(kidId) { return S.sheets().filter((s) => (s.kids || []).includes(kidId) && S.hasResult(s.id, kidId)); }
function rangeOf(shs) { const gs = shs.flatMap((s) => (s.range ? [s.range.from, s.range.to] : [])); if (!gs.length) return { from: '1-1', to: '4-1' }; gs.sort((a, b) => GRADES.indexOf(a) - GRADES.indexOf(b)); return { from: gs[0], to: gs[gs.length - 1] }; }
const CHIP = { ok: 'c-ok', near: 'c-near', pass: 'c-pass', shaky: 'c-shaky', stuck: 'c-stuck', need: 'c-need', none: 'c-none' };
function kidView(kidId) {
  nav('home');
  const k = S.kid(kidId); if (!k) { view.innerHTML = '<div class="card">아이를 찾지 못했어요.</div>'; return; }
  const shs = kidSheets(kidId), range = rangeOf(shs);
  if (!shs.length) { view.innerHTML = `<section class="card"><h2>${esc(k.label)}</h2>${say('think', '아직 결과가 없어요. 점검지를 만들고 <b>결과 넣기</b>에서 채점 끝을 켜면 여기에 다리가 그려져요.')}<a class="btn pri" href="#/new/gate">선별 점검지 만들기</a></section>`; return; }
  const rep = kidReport(shs, S.results(), kidId, range);
  const evTxt = (h) => h.ev.slice(0, 3).map((e) => { const sh = S.sheet(e.sheet), it = sh && sh.items.find((x) => x.k === e.k); return it ? `${shs.length > 1 ? `판 ${e.sheet} ` : ''}${e.k}번 ${toText(it.snap.prompt).replace(/= □.*$/, '').replace('[그림]', '').trim()} → ${(e.a || []).join(' … ')}` : ''; }).filter(Boolean).join(' · ');
  const whyRows = Object.values(rep.L).filter((x) => x.why && (x.why.sure.length || x.why.maybe.length || x.why.slips)).sort((a, b) => ord(a.c) - ord(b.c));
  const ladder = STRANDS.map((s) => { const xs = Object.values(rep.L).filter((x) => strandOf(x.c) === s && LES(x.c)).sort((a, b) => ord(a.c) - ord(b.c) || (LES(a.c).n || 0) - (LES(b.c).n || 0)); return xs.length ? `<div class="lad"><b>${STRAND[s]}</b><div>${xs.map((x) => `<span class="chip ${CHIP[x.st]}" title="${esc(`${GL(LES(x.c).g)} ${lessonName(x.c)} — ${ST[x.st]}${x.tot ? ` ${x.ok}/${x.tot}` : ''}${x.via ? ` (관문: ${lessonName(x.via)})` : ''}`)}">${esc(LES(x.c).g)} ${esc(lessonName(x.c))}${x.tot ? ` <i>${x.ok}/${x.tot}</i>` : ''}${x.first ? ` <i class="fd">처음 ${x.first.ok}/${x.first.tot}</i>` : ''}</span>`).join('')}</div></div>` : ''; }).join('');
  view.innerHTML = `<section class="card"><h2>${esc(k.label)} <small>점검지 ${shs.length}장 결과 · ${GL(range.from)} ~ ${GL(range.to)}</small></h2>
    <div class="sum">
      <div><h3>여기서부터 가르쳐요</h3>${rep.start.length ? `<ul>${rep.start.map((s) => `<li><b>${esc(nameOf(s.c))}</b> <span class="muted">— 막혔고, 그 아래 차시는 모두 됨</span></li>`).join('')}</ul>` : '<p class="muted">아직 없어요.</p>'}</div>
      <div><h3>아래를 먼저 확인해요</h3>${rep.below.length ? `<ul>${rep.below.map((b) => `<li>${esc(nameOf(b.c))} 막힘 <span class="muted">→ 아래 ${b.check.map((c) => esc(lessonName(c))).join(' · ')}를 아직 안 봄</span></li>`).join('')}</ul>` : '<p class="muted">없어요.</p>'}
        ${rep.under.length ? `<p class="muted">아래 때문일 수 있는 것: ${rep.under.map((u) => `${esc(lessonName(u.c))}(← ${u.because.map((c) => esc(lessonName(c))).join(', ')})`).join(' · ')}</p>` : ''}</div>
      <div><h3>가능한 원인</h3>${whyRows.length ? `<ul>${whyRows.map((x) => `<li><b>${esc(nameOf(x.c))}</b>: ${x.why.sure.map((h) => `${esc(h.name)} <span class="tag hi">${h.s}번 맞아떨어짐</span> <span class="ev">${esc(evTxt(h))}</span>`).join(' · ')}${x.why.maybe.map((h) => `혹시 ${esc(h.name)} <span class="tag">1번</span> <span class="ev">${esc(evTxt(h))}</span>`).join(' · ')}${!x.why.sure.length && !x.why.maybe.length && x.why.slips ? `계산 실수로 보임(${x.why.slips}번)` : ''}${x.amb ? ' <span class="tag">두 원인이 같은 답 → 확인지가 가르는 문제를 냄</span>' : x.split ? ` <span class="tag hi">가르는 문제로 갈림: ${esc(bugName(x.split))}</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted">틀린 문제에 아이 답을 넣으면 여기에 나와요.</p>'}</div>
      <div><h3>이야기 문제</h3>${rep.wsum.n ? `<p>식 ${rep.wsum.f}/${rep.wsum.n} · 답 ${rep.wsum.a}/${rep.wsum.n}${rep.wsum.calcOnly ? ` · 식은 맞고 계산이 틀림 ${rep.wsum.calcOnly}` : ''}</p>${rep.wsum.setup.length ? `<p class="muted">식을 못 세운 구조: ${rep.wsum.setup.map((w) => esc(KIND[w.kind] || w.kind)).join(' · ')}</p>` : ''}` : '<p class="muted">아직 없어요.</p>'}</div>
    </div>
    <h3>다음 할 일</h3>
    <div class="acts">
      <button class="pri" data-mk="check" ${rep.checkList.length ? '' : 'disabled'}>확인지 만들기 (${rep.checkList.length > CHECK_CAP ? `아래부터 ${CHECK_CAP}차시 · 남은 ${rep.checkList.length - CHECK_CAP}차시는 다음 확인지` : `${rep.checkList.length}차시`})</button>
      <button data-mk="practice" ${rep.teach.length ? '' : 'disabled'}>보충지 인쇄 (${rep.teach.length}차시)</button>
      <button data-mk="retest" ${Object.values(rep.L).some((x) => x.st === 'stuck' || x.st === 'shaky') ? '' : 'disabled'}>다시 보기 만들기</button>
      ${rep.wordCheck.length ? `<button data-mk="words">이야기 문제 다시 보기 (${rep.wordCheck.map((w) => esc(KIND[w[1]] || w[1])).join(' · ')})</button>` : ''}
      <button data-mk="letter">아이에게 줄 다리 편지 인쇄</button>
      <button data-mk="sum">한 쪽 요약 인쇄(선생님용)</button>
    </div>
    ${rep.thin.length ? `<p class="muted">한두 문제만 보고 맞힌 차시 ${rep.thin.length}개는 더 확인하지 않아도 되지만, 걱정되면 확인지에 넣을 수 있어요. <button class="link" data-mk="thin">넣어서 만들기</button></p>` : ''}
  </section>
  <section class="card"><h2>영역별 차시 <small>초록 확인 · 연두 관문 통과 · 흰 거의(한두 문제) · 노랑 흔들림 · 빨강 막힘 · 점선 자세히 볼 것</small></h2>${ladder}</section>
  <section class="card"><h2>가정에 보낼 글 <small>고쳐 써도 돼요 · 저장하지 않아요</small></h2><textarea rows="7">${esc(parentText(k, rep))}</textarea></section>`;
  const mkSheet = (kind, lessons, note) => { const sh = makeSheet({ kind, lessons, words: false, n: 4, from: range.from, to: range.to, note }); sh.kids = [kidId]; S.putSheet(sh); location.hash = `#/s/${sh.id}`; };
  view.querySelectorAll('[data-mk]').forEach((b) => (b.onclick = () => {
    const t = b.dataset.mk;
    if (t === 'check' || t === 'thin') { const cs = (t === 'thin' ? [...rep.checkList, ...rep.thin] : rep.checkList).slice(0, CHECK_CAP); mkSheet('check', cs.map((c) => ({ c, n: 4, hyps: rep.L[c] && rep.L[c].amb ? rep.L[c].amb : null })), `${k.label} 확인지 — ${cs.map(lessonName).join(' · ')}`); }
    if (t === 'retest') { const cs = Object.values(rep.L).filter((x) => x.st === 'stuck' || x.st === 'shaky').map((x) => x.c); mkSheet('retest', cs.map((c) => ({ c, n: 4 })), `${k.label} 다시 보기 — ${cs.map(lessonName).join(' · ')}`); }
    if (t === 'practice') printPractice(rep.teach);
    if (t === 'words') { const sh = makeSheet({ kind: 'check', lessons: [], wordList: rep.wordCheck, from: range.from, to: range.to, note: `${k.label} 이야기 문제 다시 보기 — ${rep.wordCheck.map((w) => KIND[w[1]] || w[1]).join(' · ')} 구조를 숫자만 바꿔` }); sh.kids = [kidId]; S.putSheet(sh); location.hash = `#/s/${sh.id}`; }
    if (t === 'sum') printSummary(k, rep, range);
    if (t === 'letter') printPages(letterHTML(k.label, rep));
  }));
}
function printPractice(cs) {
  const r = rng(Date.now() % 1e9), used = new Set();
  const lessons = cs.map((c) => { const base = pickItems(c, 1, r, used)[0]; let ex = null; try { ex = base ? { item: base, steps: workedSteps(c, base.p) } : null; } catch (e) { ex = null; } const items = pickItems(c, 8, r, used).map((it, i) => ({ k: i + 1, c, p: it.p, form: formOf(it), cls: 'mid', snap: { prompt: it.prompt, sol: it.sol, choices: it.choices || null } })); return { c, ex, items }; });
  printPages(practiceHTML({ id: newId(), lessons }));
}
function printSummary(k, rep, range) {
  const li = (arr, f) => (arr.length ? `<ul>${arr.map(f).join('')}</ul>` : '<p>없음</p>');
  printPages(`<article class="page flow sumpage"><header><div class="hb">끊긴 곳 찾기 <b>한 쪽 요약</b></div><div class="hn">${esc(k.label)}</div><div class="hc">${new Date().toLocaleDateString('ko-KR')}</div></header>
    <h2>여기서부터 가르칠 곳</h2>${li(rep.start, (s) => `<li>${esc(GL(LES(s.c).g))} ${esc(unitName(s.c))} — ${esc(lessonName(s.c))}${LES(s.c).tip ? `<br><small>가르치는 법: ${esc(LES(s.c).tip)}</small>` : ''}</li>`)}
    <h2>아래를 먼저 확인할 곳</h2>${li(rep.below, (b) => `<li>${esc(lessonName(b.c))} → ${b.check.map((c) => esc(lessonName(c))).join(', ')}</li>`)}
    <h2>가능한 원인(아이 답에서)</h2>${li(Object.values(rep.L).filter((x) => x.why && x.why.sure.length), (x) => `<li>${esc(lessonName(x.c))}: ${x.why.sure.map((h) => `${esc(h.name)}(${h.s}번)`).join(' · ')}</li>`)}
    <h2>이야기 문제</h2><p>${rep.wsum.n ? `식 ${rep.wsum.f}/${rep.wsum.n} · 답 ${rep.wsum.a}/${rep.wsum.n}${rep.wsum.setup.length ? ` · 식을 못 세운 구조: ${rep.wsum.setup.map((w) => esc(KIND[w.kind] || w.kind)).join(', ')}` : ''}` : '없음'}</p>
    <h2>막히거나 흔들린 차시</h2>${li(Object.values(rep.L).filter((x) => x.st === 'stuck' || x.st === 'shaky').sort((a, b) => ord(a.c) - ord(b.c)), (x) => `<li>${esc(GL(LES(x.c).g))} ${esc(lessonName(x.c))} — ${ST[x.st]} ${x.ok}/${x.tot}${x.first ? ` (처음 ${x.first.ok}/${x.first.tot})` : ''}</li>`)}
    <p class="note">이 결과는 점검지 문제에서 본 것이에요. '가능한 원인'은 아이가 쓴 답을 알려진 틀린 방법으로 다시 계산해 맞아떨어진 것이고, 확정이 아니에요. 확인지로 한 번 더 보고 판단해요.</p></article>`);
}
function parentText(k, rep) {
  const lines = [`[수와 연산 점검 결과] ${k.label}`];
  if (rep.start.length) lines.push(`· 다시 다질 곳: ${rep.start.map((s) => `${GL(LES(s.c).g)} '${unitName(s.c)}' 단원의 ${lessonName(s.c)}`).join(', ')}`);
  const sure = Object.values(rep.L).filter((x) => x.why && x.why.sure.length);
  if (sure.length) lines.push(`· 자주 보인 실수: ${sure.map((x) => x.why.sure[0].name).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);
  if (rep.wsum.n && rep.wsum.setup.length) lines.push('· 이야기 문제는 식을 세우기 전에 그림이나 막대로 상황을 그려 보면 도움이 돼요.');
  lines.push('· 집에서는 하루 10분, 학교에서 보낸 보충지를 함께 풀고 아이가 어떻게 풀었는지 말로 설명해 보게 해 주세요.');
  return lines.join('\n');
}

// ── 반 표 ──
function classView() {
  nav('class');
  const kids = S.kids().filter((k) => kidSheets(k.id).length);
  if (!kids.length) { view.innerHTML = `<section class="card"><h2>반 표</h2>${say('think', '결과를 넣은 아이가 아직 없어요.')}</section>`; return; }
  const shs = S.sheets(), range = rangeOf(shs);
  const T = classTable(shs.filter((s) => (s.kids || []).some((k) => kids.some((x) => x.id === k))), S.results(), kids, range);
  const rows = T.rows.filter((c) => kids.some((k) => T.reps[k.id].L[c] && T.reps[k.id].L[c].st !== 'pass'));
  view.innerHTML = `<section class="card"><h2>반 표 <small>${kids.length}명 · 직접 본 차시 ${rows.length}개</small></h2>
    ${Object.keys(T.groups).length ? `<h3>같이 가르칠 수 있어요(같은 '여기서부터')</h3><ul>${Object.entries(T.groups).sort((a, b) => b[1].length - a[1].length).map(([c, ks]) => `<li><b>${esc(nameOf(c))}</b> — ${ks.map((id) => esc(S.kid(id).label)).join(', ')}</li>`).join('')}</ul>` : ''}
    <div class="ctab"><table><tr><th></th>${kids.map((k) => `<th><a href="#/k/${k.id}">${esc(k.label)}</a></th>`).join('')}</tr>
    ${rows.map((c) => `<tr><th>${esc(LES(c).g)} ${esc(lessonName(c))}</th>${kids.map((k) => { const x = T.reps[k.id].L[c]; return `<td class="${x ? CHIP[x.st] : ''}" title="${x ? `${ST[x.st]} ${x.ok}/${x.tot}` : ''}">${x && x.tot ? `${x.ok}/${x.tot}` : x ? ST[x.st].slice(0, 2) : ''}</td>`; }).join('')}</tr>`).join('')}</table></div></section>`;
}

// ── 사용 안내 · 백업 ──
function helpView() {
  nav('help');
  view.innerHTML = `<section class="card prose"><h2>사용 안내</h2>
  <h3>무엇을 하나요</h3><p>1학년 1학기부터 4학년 1학기까지 수와 연산 차시를 학년을 넘는 선수 관계로 이어 두고, 아이가 어디서부터 끊겼는지와 왜 틀렸는지를 찾아요. 문제는 그때그때 새로 만들어요(같은 판 번호면 같은 문제).</p>
  <h3>판정 규칙(숫자로 · 사람마다 다르지 않게)</h3><ul><li><b>확인</b> 셋 이상 다 맞음(도움 없이) · <b>거의</b> 다 맞았지만 한두 문제만 봤거나 도움 · <b>흔들림</b> 60% 이상 맞음, 또는 한두 문제만 보고 틀림(확인지로 더 봐요) · <b>막힘</b> 60% 미만(두 문제 이상) · <b>안 봄</b></li><li>선별 점검의 <b>관문</b>을 확인하면 그 아래 차시는 <b>관문 통과</b>(직접 본 것과 따로 표시) · 관문이 흔들리거나 막히면 그 아래는 <b>자세히 볼 것</b></li><li><b>여기서부터</b> = 막힌 차시 가운데 아래 차시(학년을 넘는 선수 차시)가 모두 된 것 · 아래를 안 봤으면 <b>아래 먼저 확인</b></li><li><b>가능한 원인</b> = 아이가 쓴 답을 알려진 틀린 방법 25여 가지로 그 문제 숫자에 다시 계산해 맞아떨어진 것. 두 번 맞아떨어지고 반대 증거가 더 많지 않아야 '맞아떨어짐'으로 보여요. 두 원인이 같은 답을 내면 확인지가 둘을 가르는 숫자로 문제를 내요.</li></ul>
  <h3>한계</h3><p>아직 여러 학교에서 시험해 본 자료(규준 · 신뢰도)는 없어요. 결과는 '확정 진단'이 아니라 다음에 무엇을 확인하고 가르칠지 정하는 근거로 써 주세요. 차시 이름은 이 앱이 붙인 이름이에요 — 교과서 출판사마다 차시 순서와 이름이 다를 수 있어요.</p>
  <h3>개인정보</h3><p>서버로 아무것도 보내지 않아요. 아이 이름 대신 번호나 별명을 쓰고, 기록은 이 기기의 브라우저에만 남아요. 공용 기기라면 <a href="#/data">백업</a>에서 파일로 내보내 보관하고, 다 쓴 뒤 지워 주세요.</p></section>`;
}
function dataView() {
  nav('data');
  view.innerHTML = `<section class="card"><h2>백업</h2><p>이 기기에만 저장돼요. 다른 기기로 옮기거나 보관하려면 파일로 내보내요.</p>
    <div class="acts"><button class="pri" data-ex>파일로 내보내기</button><label class="btn">파일 가져오기 <input type="file" accept=".json,application/json" data-im hidden></label><button data-wipe>모두 지우기</button></div>
    ${S.loadError() ? `<p class="warn">저장된 기록을 읽지 못해 새로 시작했어요(이전 기록은 따로 보관됨): ${esc(S.loadError().message)}</p>` : ''}</section>`;
  view.querySelector('[data-ex]').onclick = () => { const b = new Blob([S.exportJSON()], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `끊긴곳찾기_${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  view.querySelector('[data-im]').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = S.importJSON(await f.text()); alert(`가져왔어요: 아이 ${r.nk}명 · 점검지 ${r.ns}장(결과는 최근 것으로 합침)`); } catch (err) { alert(err.message); } };
  view.querySelector('[data-wipe]').onclick = () => { if (confirm('이 기기의 아이 · 점검지 · 결과를 모두 지울까요? 되돌릴 수 없어요.')) { S.wipe(); location.hash = '#/'; } };
}

S.load();
{ const m = document.getElementById('logo-m'); if (m) m.innerHTML = mascot('plain', 34); }
route();
