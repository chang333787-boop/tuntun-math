// 점검 내기(선생님 화면 #/t/c/<반>/check) — 고를 것 셋: ① 오늘 단원 점검 ② 점검지(종이와 같은 문제) ③ 이번 주 점검(저절로)
//  ① 단원을 열면 아이마다 in/prep<날짜> = { kind:'prep', unit, t, len } + tc/<반>/<열쇠>/live (반 화면 openToday를 옮긴 것 · 길이 12 · 18 · 24)
//  ② 점검지를 내면 아이마다 in/<id> = { kind:'check', id, from, to, words:false, n, seed, t } + 선생님 기록 tc/<반>/<열쇠>/tasks/<id> = 같은 것
//     같은 id · seed → 같은 문제(paper/js/gen.js makeSheet) — 아이 화면(check.js) · 인쇄(#/t/c/<반>/check/<id>/print)가 같은 문제 · 같은 판정
//     다 푼 아이 = 아이 요약 st.ck[id](푼 문항 수 · kidstore summaryOf)가 문제 수에 닿은 아이
//  ③ 이번 주 점검은 아이 화면에 저절로(week.js) — 단추 없음
//  이름은 이 기기에만(서버엔 번호만) · 반 정보는 localStorage tt.t(teacher.js와 같음)
import { UNITS, gradeIdx, GRADES } from '../../engine/lessons/index.js';
import { GL } from '../../paper/js/gen.js';
import { paginate, drawPages } from '../../paper/js/paper.js';
import * as PS from '../../paper/js/store.js';
import * as db from './db.js';
import { prepPlan, LEN, PREP } from './prep.js';
import { lsGet, lsSet, esc, rand } from './local.js';
import { go, unitLabel } from './kid.js';
import { CK, okTask, checkSheet } from './check.js';

const TK = 'tt.t';
const tget = () => lsGet(TK, { classes: {} });
const cls = (C) => tget().classes[C];
const putCls = (C, f) => { const X = tget(); if (!X.classes[C]) return null; f(X.classes[C]); lsSet(TK, X); return X.classes[C]; };
const gl = (g) => GL(String(g || ''));
const nm = (K, no) => (K.names && K.names[no] ? `${no} ${K.names[no]}` : `${no}번`);
const nos = (K) => Array.from({ length: K.n }, (_, i) => String(i + 1));
const MIN = { 12: 5, 18: 8, 24: 10 };
const TIMES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const times = (k) => (TIMES[k] ? `${TIMES[k]} 번` : `${k}번`);
const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; };
const day = (t) => new Date(t).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
const when = (t) => new Date(t).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const units = (K) => UNITS.filter((u) => prepPlan(u.id).fringe.length && gradeIdx(u.g) <= gradeIdx(K.g) + 1);
// 기본 범위 = 반 학기 바로 앞 두 학기
export function defaultRange(g) {
  const i = Math.max(0, gradeIdx(g));
  return { from: GRADES[Math.max(0, i - 2)], to: GRADES[Math.max(0, i - 1)] };
}

// 낸 점검지 — 이 기기 사본(classes[C].checks)과 서버(tc/<반>/<열쇠>/tasks)를 합침 · 서버가 정본
export async function syncChecks(C) {
  const K = cls(C); if (!K) return {};
  let srv = null; try { srv = await db.get(`tc/${C}/${K.T}/tasks`); } catch (e) { return K.checks || {}; }
  const got = {};
  for (const [id, s] of Object.entries(srv || {})) { const x = db.dec(s); if (okTask(id, x)) got[id] = x; }
  const Y = putCls(C, (k) => { k.checks = { ...(k.checks || {}), ...got }; });
  return (Y && Y.checks) || got;
}
const latest = (checks) => Object.entries(checks || {}).filter(([id, x]) => okTask(id, x)).sort((a, b) => (Number(b[1].t) || 0) - (Number(a[1].t) || 0));
// 아이 요약에서 점검에 쓰는 것만(모양을 맞춰 읽음 — 한 아이의 이상한 값이 화면을 멈추지 않게)
const normLite = (st) => {
  if (!st || typeof st !== 'object') return null;
  const ck = {}; if (st.ck && typeof st.ck === 'object') for (const [k, v] of Object.entries(st.ck)) if (/^[A-Za-z0-9-]{1,30}$/.test(k) && Number.isFinite(Number(v))) ck[k] = Number(v);
  const cko = {}; if (st.cko && typeof st.cko === 'object') for (const [k, v] of Object.entries(st.cko)) if (/^[A-Za-z0-9-]{1,30}$/.test(k) && Number.isFinite(Number(v))) cko[k] = Number(v);   /* 점검지마다 맞힌 수(사전 · 사후) */
  const prep = st.prep && typeof st.prep === 'object' && typeof st.prep.u === 'string' ? { u: st.prep.u, why: String(st.prep.why || ''), t: Number(st.prep.t) || 0 } : null;
  return { ck, cko, prep };
};
// 아이 요약 모으기(8개씩 · 짧은 요청만 — teacher.js pullAll과 같은 방법)
async function pullSt(C, K) {
  const out = {}, all = nos(K);
  for (let i = 0; i < all.length; i += 8) {
    await Promise.all(all.slice(i, i + 8).map(async (no) => {
      try { out[no] = { st: normLite(db.dec(await db.get(`k/${C}/${no}/${K.pins[no]}/st`))) }; } catch (e) { out[no] = { err: true }; }
    }));
  }
  return out;
}
// 점검지 하나 — 다 푼 아이 · 하는 중 · 안 함
function progressOf(K, S, id, n) {
  const g = { done: [], doing: [], none: [] };
  for (const no of nos(K)) { const st = S[no] && S[no].st, v = st && st.ck ? st.ck[id] || 0 : 0; g[v >= n ? 'done' : v > 0 ? 'doing' : 'none'].push(no); }
  return g;
}
const prepDone = (K, S) => (K.today ? nos(K).filter((no) => { const p = S[no] && S[no].st && S[no].st.prep; return p && p.u === K.today.unit && p.t >= K.today.t; }).length : 0);

// 반 화면 맨 위 카드 ①에 넣을 짧은 글(두세 줄) — S = pullAll 결과({ [번호]: { st, now } }) · K = 반 정보(cls(C))
export function checkCard(C, K, S = {}) {
  const today = K.today && K.today.unit ? `<b>${esc(unitLabel(K.today.unit))}</b> · 끝낸 아이 <b>${prepDone(K, S)}</b>/${K.n}` : '<span class="muted">아직 연 단원이 없어요</span>';
  const [top] = latest(K.checks);
  let sheet;
  if (top) { const [id, x] = top, g = progressOf(K, S, id, Number(x.n)); sheet = `${esc(gl(x.from))} ~ ${esc(gl(x.to))} · ${Number(x.n)}문제 · 다 푼 아이 <b>${g.done.length}</b>/${K.n}${g.doing.length ? ` · 하는 중 ${g.doing.length}` : ''}`; }
  else {
    const ids = [...new Set(nos(K).flatMap((no) => Object.keys((S[no] && S[no].st && S[no].st.ck) || {})))].filter((id) => /^ck\d{8}/.test(id)).sort().reverse();
    sheet = ids.length ? `푼 아이 <b>${nos(K).filter((no) => S[no] && S[no].st && S[no].st.ck && S[no].st.ck[ids[0]]).length}</b>명 <span class="muted small">(문제 수는 점검 내기 화면에서)</span>` : '<span class="muted">아직 낸 점검지가 없어요</span>';
  }
  return `<div class="ckc"><p class="ckc-r"><span class="ckc-k">오늘 단원 점검</span><span class="ckc-v">${today}</span></p><p class="ckc-r"><span class="ckc-k">점검지</span><span class="ckc-v">${sheet} <a class="small" href="#/t/c/${esc(C)}/paper">종이로 푼 결과 넣기</a></span></p></div>`;   /* 단추는 반 화면 카드 ①의 [점검 내기] 하나만 · 종이 결과는 글 링크로(더 보기 맨 끝에 숨어 있던 것 · 11-07) */
}

// 사전 · 사후 비교하기(시범 운영 · 연구 기록) — 가장 최근 '사전'과 그 뒤 가장 최근 '사후' · 아이마다 맞힌 비율(푼 문제 기준) 전 → 후 · 반 평균 · 사전 아래 30% 아이들 평균
//  같은 범위일 때 비교하기가 바로 됨(다르면 한 줄 알림) · 종이로 푼 것은 세지 않음(화면에서 푼 것만 — 종이는 반 표에 들어감)
function prePost(K, S, list) {
  const pre = list.find(([, x]) => x.lab === 'pre'), post = pre ? list.find(([, x]) => x.lab === 'post' && Number(x.t) > Number(pre[1].t)) : null;
  if (!pre) return '';
  const head = `<section class="card ck-pp"><h2>사전 · 사후 비교 <small>시범 운영 기록</small></h2>`;
  if (!post) return `${head}<p class="muted">사전 점검(${esc(day(Number(pre[1].t)))} · ${esc(gl(pre[1].from))} ~ ${esc(gl(pre[1].to))})을 냈어요. 몇 주 뒤 같은 범위로 <b>사후 점검</b>을 내면 여기에서 아이마다 전 → 후를 비교해요.</p></section>`;
  if (!S) return `${head}<p class="muted">불러오는 중…</p></section>`;
  const [pid, px] = pre, [qid, qx] = post;
  const pc = (no, id) => { const st = S[no] && S[no].st, n = st && st.ck ? st.ck[id] || 0 : 0, o = st && st.cko ? st.cko[id] || 0 : 0; return n ? { o, n, p: Math.round((o / n) * 100) } : null; };
  const rows = nos(K).map((no) => ({ no, a: pc(no, pid), b: pc(no, qid) }));
  const both = rows.filter((r) => r.a && r.b), avg = (xs) => (xs.length ? Math.round(xs.reduce((t, v) => t + v, 0) / xs.length) : null);
  const low = both.slice().sort((x, y) => x.a.p - y.a.p).slice(0, Math.max(1, Math.round(both.length * 0.3)));
  const cell = (v) => (v ? `${v.p}% <span class="small muted">(${v.o}/${v.n})</span>` : '<span class="muted">—</span>');
  const same = px.from === qx.from && px.to === qx.to;
  return `${head}<p class="intro">사전 ${esc(day(Number(px.t)))}(${esc(gl(px.from))} ~ ${esc(gl(px.to))}) → 사후 ${esc(day(Number(qx.t)))}(${esc(gl(qx.from))} ~ ${esc(gl(qx.to))})${same ? '' : ' · <b>범위가 달라요</b> — 같은 범위로 내야 바로 비교할 수 있어요'}. 맞힌 비율은 화면에서 푼 문제 기준이에요.</p>
    ${both.length ? `<p class="ck-pps">둘 다 푼 아이 <b>${both.length}</b>명 · 반 평균 <b>${avg(both.map((r) => r.a.p))}% → ${avg(both.map((r) => r.b.p))}%</b> · 사전 아래 30%(${low.length}명) <b>${avg(low.map((r) => r.a.p))}% → ${avg(low.map((r) => r.b.p))}%</b></p>` : ''}
    <div class="ck-tw"><table class="list ck-t"><thead><tr><th>아이</th><th>사전</th><th>사후</th><th>변화</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(nm(K, r.no))}</td><td>${cell(r.a)}</td><td>${cell(r.b)}</td><td>${r.a && r.b ? `<b class="${r.b.p >= r.a.p ? 'okc' : ''}">${r.b.p - r.a.p >= 0 ? '+' : ''}${r.b.p - r.a.p}</b>` : ''}</td></tr>`).join('')}</tbody></table></div></section>`;
}

export function checkView(root, C) {
  const K0 = cls(C); if (!K0) return go('#/t');
  let K = K0, S = null, alive = true, timer = null;
  const us = units(K);
  let unit = (K.today && K.today.unit) || (us.find((u) => u.g === K.g) || us[us.length - 1] || {}).id || '';
  let len = LEN.includes(Number(K.len)) ? Number(K.len) : PREP.budget;
  let range = defaultRange(K.g), lab = '';   /* 쓰임 — '' 보통 · pre 사전 · post 사후(시범 운영 · 연구 기록 · 11-07) */
  const upto = GRADES.slice(0, Math.max(1, gradeIdx(K.g) + 1));
  const cntOf = (r) => { const sh = checkSheet('ckCOUNT', { kind: 'check', from: r.from, to: r.to, n: 1 }); return sh ? sh.items.length : 0; };
  let cnt = cntOf(range);
  const cntLine = () => (cnt ? `<b>한 번에 ${Math.min(cnt, CK.per)}문제</b>${cnt > CK.per ? ` · ${times(Math.ceil(cnt / CK.per))}에 나눠 풀어요(모두 ${cnt}문제)` : ''}` : '범위를 다시 골라 주세요');   /* 한 번 분량을 먼저(11-05 '36개면 애들이 안 지치려나') */
  function render() {
    const keepY = window.scrollY;
    const opt = (sel) => upto.map((g) => `<option value="${g}"${g === sel ? ' selected' : ''}>${esc(gl(g))}</option>`).join('');
    const list = latest(K.checks);
    const rows = list.map(([id, x]) => {
      const n = Number(x.n), g = S ? progressOf(K, S, id, n) : null, who = (xs, cnt) => xs.map((no) => `${esc(nm(K, no))}${cnt ? ` ${(S[no].st.ck || {})[id] || 0}/${n}` : ''}`).join(' · ');
      return `<tr><td class="ck-d">${esc(day(Number(x.t) || Date.now()))}<span class="small muted">${esc(id)}</span></td><td>${x.lab ? `<span class="pill ck-lab">${x.lab === 'pre' ? '사전' : '사후'}</span>` : ''}<span class="ck-rgt">${esc(gl(x.from))} ~ ${esc(gl(x.to))}</span><span class="small muted">${n}문제</span></td>
        <td class="ck-n">${g ? `<b>${g.done.length}</b>/${K.n}` : '…'}</td><td class="ck-n">${g ? `<b>${g.doing.length}</b>${g.doing.length ? `<span class="small muted">${who(g.doing, true)}</span>` : ''}` : '…'}</td><td class="ck-n">${g ? `<b>${g.none.length}</b>${g.none.length && g.none.length < K.n ? `<span class="small muted">${who(g.none)}</span>` : ''}` : '…'}</td>
        <td><a class="btn ck-pr" href="#/t/c/${esc(C)}/check/${esc(id)}/print">같은 문제 인쇄</a></td></tr>`;
    }).join('');
    root.innerHTML = `<div class="ck-bar"><a class="btn" href="#/t/c/${esc(C)}">반 화면으로</a><h2 class="sec">점검 내기 <small>${esc(C)} · ${esc(gl(K.g))} · ${K.n}명</small></h2></div>
    ${list.length ? '' : '<p class="ck-first">처음이면 <b>② 점검지</b> 하나만 내 보세요. 우리 반이 어디까지 아는지 한 번에 보여요. ①은 수업 시작 5~10분에, ③은 저절로 떠요.</p>'}
    <div class="ck-pick">
      <section class="card ck-c"><h3><span class="ck-no">1</span>오늘 단원 점검</h3>
        <p class="intro">오늘 배울 단원에 꼭 필요한 앞 학년 셈을 봐요. 틀리면 더 쉬운 앞 단계 문제로 이어지고, 남으면 다음 시간에 이어서 풀어요.</p>
        <label class="ck-f"><span>단원</span><select id="u" class="sel">${us.map((u) => `<option value="${u.id}"${u.id === unit ? ' selected' : ''}>${esc(gl(u.g))} · ${esc(u.nm)}</option>`).join('')}</select></label>
        <label class="ck-f"><span>한 번에 풀 문제</span><select id="len" class="sel">${LEN.map((v) => `<option value="${v}"${v === len ? ' selected' : ''}>${v}문제 · 약 ${MIN[v]}분${v === PREP.budget ? '(기본)' : ''}</option>`).join('')}</select></label>
        <div class="kid-pv"><span class="pv-k">아이 화면에 이렇게 떠요</span><div class="pv-card"><b>점검</b><span>오늘 단원 점검 — 선생님이 연 단원 · 약 ${MIN[len] || 8}분</span></div></div>
        <div class="acts"><button class="${list.length || K.today ? 'pri' : ''}" id="open">오늘 단원 점검 내기</button></div>
        <p class="small ck-s">${K.today ? `지금 열린 단원: <b>${esc(unitLabel(K.today.unit))}</b> <span class="muted">(${esc(when(K.today.t))}에 열었어요)</span> · 끝낸 아이 <b>${S ? prepDone(K, S) : '…'}</b>/${K.n}` : '<span class="muted">아직 연 단원이 없어요</span>'}</p>
        <p class="qmsg tight" id="m1" role="status"></p></section>
      <section class="card ck-c${list.length ? '' : ' rec'}"><h3><span class="ck-no">2</span>점검지 — 종이와 같은 문제${list.length ? '' : ' <span class="rec-b">처음이면 이걸 권해요</span>'}</h3>
        <p class="intro">종이 점검지와 <b>같은 문제 · 같은 판정</b>이에요. 화면에서 풀면 결과가 바로 반 표에 들어가요.</p>
        <div class="ck-f"><span>범위</span><span class="ck-rg"><select id="from" class="sel" aria-label="범위 시작">${opt(range.from)}</select> ~ <select id="to" class="sel" aria-label="범위 끝">${opt(range.to)}</select></span></div>
        <label class="ck-f"><span>점검 종류</span><select id="lab" class="sel"><option value="">보통 점검</option><option value="pre"${lab === 'pre' ? ' selected' : ''}>사전 점검(시작할 때)</option><option value="post"${lab === 'post' ? ' selected' : ''}>사후 점검(몇 주 뒤 · 같은 범위)</option></select></label>
        <p class="ck-cnt" id="cnt">${cntLine()}</p>
        <div class="kid-pv"><span class="pv-k">아이 화면에 이렇게 떠요</span><div class="pv-card"><b>점검</b><span>선생님이 낸 점검지 — 12문제씩 이어서 풀어요</span></div></div>
        <div class="acts"><button class="pri" id="give"${cnt ? '' : ' disabled'}>점검지 내기</button></div>
        <p class="small muted">종이로 푼 아이는 반 화면의 <a href="#/t/c/${esc(C)}/paper">종이 결과 가져오기</a>로 넣어요.</p>
        <p class="qmsg tight" id="m2" role="status"></p></section>
      <section class="card ck-c ck-w"><h3><span class="ck-no">3</span>이번 주 점검</h3>
        <p class="intro">주마다 한 번, 섞은 <b>10문제</b>가 아이 화면에 저절로 떠요. 따로 낼 것은 없어요. 결과는 반 화면에서 봐요.</p></section>
    </div>
    <section class="card ck-list"><h2>낸 점검지 <small>${list.length}개</small><button class="mini" id="re" type="button">새로 보기</button></h2>
      ${list.length ? `<div class="ck-tw"><table class="list ck-t"><thead><tr><th>낸 날</th><th>범위</th><th>다 푼 아이</th><th>하는 중</th><th>안 함</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="small muted">${S ? '화면에서 푼 문제만 세요. 30초마다 새로 봐요(이 화면이 열려 있을 때만).' : '아이 기록을 불러오는 중…'}</p>` : '<p class="muted">아직 낸 점검지가 없어요. 위 2에서 범위를 고르고 내면 여기에 나와요.</p>'}</section>
    ${prePost(K, S, list)}`;
    if (S) window.scrollTo(0, keepY);
    root.querySelector('#u').addEventListener('change', (e) => { unit = e.target.value; });
    root.querySelector('#len').addEventListener('change', (e) => { len = LEN.includes(Number(e.target.value)) ? Number(e.target.value) : PREP.budget; });
    root.querySelector('#open').addEventListener('click', openToday);
    const pickR = (which) => {
      let from = root.querySelector('#from').value, to = root.querySelector('#to').value;
      if (gradeIdx(from) > gradeIdx(to)) { if (which === 'from') to = from; else from = to; }   /* 앞이 뒤보다 늦으면 방금 고른 쪽에 맞춤 */
      range = { from, to }; cnt = cntOf(range);
      root.querySelector('#from').value = from; root.querySelector('#to').value = to;
      root.querySelector('#cnt').innerHTML = cntLine(); root.querySelector('#give').disabled = !cnt;
    };
    root.querySelector('#from').addEventListener('change', () => pickR('from'));
    root.querySelector('#to').addEventListener('change', () => pickR('to'));
    root.querySelector('#lab').addEventListener('change', (e) => { lab = e.target.value; });
    root.querySelector('#give').addEventListener('click', give);
    root.querySelector('#re').addEventListener('click', refresh);
  }
  async function openToday() {
    const msg = root.querySelector('#m1'), b = root.querySelector('#open'); msg.textContent = '여는 중…'; b.disabled = true;
    const t = Date.now(), id = `prep${new Date(t).toISOString().slice(0, 10).replace(/-/g, '')}`, up = {};
    for (const no of nos(K)) up[`k/${C}/${no}/${K.pins[no]}/in/${id}`] = db.enc({ kind: 'prep', unit, t, len });
    up[`tc/${C}/${K.T}/live`] = db.enc({ unit, t, len });
    try {
      await db.patch('', up);
      K = putCls(C, (k) => { k.today = { unit, t, len }; k.len = len; }) || K;
      if (!alive) return;
      render(); root.querySelector('#m1').textContent = '열었어요! 아이들 처음 화면 1번 점검 카드에 30초 안에 떠요.';
    } catch (e) { msg.textContent = `열지 못했어요: ${e.message}`; b.disabled = false; }
  }
  async function give() {
    const msg = root.querySelector('#m2'), b = root.querySelector('#give'); b.disabled = true; msg.textContent = '내는 중…';
    const t = Date.now(), id = `ck${ymd(t)}${rand(4)}`, sh = checkSheet(id, { kind: 'check', from: range.from, to: range.to, n: 1 });
    if (!sh) { msg.textContent = '범위를 다시 골라 주세요.'; b.disabled = false; return; }
    const task = { kind: 'check', id, from: range.from, to: range.to, words: false, n: sh.items.length, seed: sh.seed, t, ...(lab ? { lab } : {}) }, v = db.enc(task), up = {};
    for (const no of nos(K)) up[`k/${C}/${no}/${K.pins[no]}/in/${id}`] = v;
    up[`tc/${C}/${K.T}/tasks/${id}`] = v;
    try {
      await db.patch('', up);
      K = putCls(C, (k) => { k.checks = { ...(k.checks || {}), [id]: task }; }) || K;
      if (!alive) return;
      render(); root.querySelector('#m2').textContent = `냈어요! 아이들 처음 화면에 '선생님이 낸 점검지'로 떠요(${task.n}문제).`;
    } catch (e) { msg.textContent = `내지 못했어요: ${e.message}`; b.disabled = false; }
  }
  async function refresh() {
    if (!alive) return;
    await syncChecks(C); K = cls(C) || K;
    const d = await pullSt(C, K); if (!alive) return;
    S = d;
    const a = document.activeElement; if (a && root.contains(a) && /SELECT|INPUT|TEXTAREA/.test(a.tagName)) return;   /* 고르는 중엔 다시 그리지 않음 */
    render();
  }
  render(); refresh();
  timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000);
  return () => { alive = false; clearInterval(timer); };
}

// ── 같은 문제 인쇄(#/t/c/<반>/check/<id>/print) — 종이 점검지와 같은 쪽(paper.js paginate · drawPages) · 정답 겹쳐 보기도 ──
//  종이 css는 이 화면에서만 붙임 · 이 판을 이 기기의 종이 앱(끊긴 곳 찾기)에도 넣어 둠 → 종이 앱에서 채점 → '종이 결과 가져오기'로 아이 기록에
function paperCSS() {
  let l = document.getElementById('paper-css');
  if (l && l.dataset.ok) return Promise.resolve();
  if (!l) { l = document.createElement('link'); l.id = 'paper-css'; l.rel = 'stylesheet'; l.href = '../paper/css/paper.css'; document.head.append(l); }
  return new Promise((res) => { l.addEventListener('load', () => { l.dataset.ok = '1'; res(); }, { once: true }); l.addEventListener('error', () => res(), { once: true }); setTimeout(res, 4000); });
}
function layout(sh) {
  let m = document.getElementById('measure');
  if (!m) { m = document.createElement('div'); m.id = 'measure'; m.className = 'paper'; document.body.append(m); }
  const pages = paginate(m, sh); m.innerHTML = '';
  return pages;
}
function printNow(sh, pages, key) {
  const host = document.createElement('div');
  drawPages(host, sh, pages, { key });
  let p = document.getElementById('print');
  if (!p) { p = document.createElement('div'); p.id = 'print'; p.className = 'paper'; document.body.append(p); }
  p.innerHTML = host.innerHTML; document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); p.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); setTimeout(() => window.print(), 120);
}
export function checkPrintView(root, C, id) {
  const K = cls(C); if (!K) return go('#/t');
  let alive = true;
  root.innerHTML = '<div class="card">점검지를 만드는 중…</div>';
  (async () => {
    let x = (K.checks || {})[id];
    if (!okTask(id, x)) { try { x = db.dec(await db.get(`tc/${C}/${K.T}/tasks/${id}`)); } catch (e) { x = null; } }
    const sh = checkSheet(id, x);
    if (!alive) return;
    if (!sh) { root.innerHTML = `<div class="card"><p>이 점검지를 찾지 못했어요.</p><div class="acts"><a class="btn" href="#/t/c/${esc(C)}/check">점검 내기로</a></div></div>`; return; }
    await paperCSS();
    if (!alive) return;
    try { if (!PS.sheet(id)) PS.putSheet({ ...sh, kids: [], note: '튼튼 수 다리 앱에서 낸 점검지 — 화면과 같은 문제' }); } catch (e) { /* 종이 앱 저장이 막혀도 인쇄는 그대로 */ }
    root.innerHTML = `<div class="card no-print ckp-h"><div class="ck-bar"><a class="btn" href="#/t/c/${esc(C)}/check">점검 내기로</a><h2 class="sec">같은 문제 인쇄 <small>판 ${esc(id)} · ${esc(gl(x.from))} ~ ${esc(gl(x.to))} · ${sh.items.length}문제</small></h2></div>
      <div class="acts"><button class="pri" id="pk">아이 종이 인쇄</button><button id="pa">정답 겹쳐 보기 인쇄</button></div>
      <p class="small muted">화면에서 푸는 문제와 같아요(문제 번호도 같음). 인쇄 창에서 용지 A4 · 배율 100% · 여백 없음으로 뽑아요.</p>
      <p class="small">종이로 푼 아이는 <a href="../paper/#/s/${esc(id)}" target="_blank" rel="noopener">종이 앱에서 이 판</a>에 채점 결과를 넣고, 반 화면의 <a href="#/t/c/${esc(C)}/paper">종이 결과 가져오기</a>로 아이 기록에 넣어요.</p></div>
      <div class="paper preview ckp-pv" id="pv"></div>`;
    const pages = layout(sh);
    drawPages(root.querySelector('#pv'), sh, pages, {});
    root.querySelector('#pk').addEventListener('click', () => printNow(sh, pages, false));
    root.querySelector('#pa').addEventListener('click', () => printNow(sh, pages, true));
  })();
  return () => {
    alive = false;
    document.body.classList.remove('printing');
    ['measure', 'print', 'paper-css'].forEach((x) => { const el = document.getElementById(x); if (el) el.remove(); });
  };
}
