// 선생님 ② 반 표 · ③ 보충 주기(docs/what.md · 교사 11-05 '아 얘가 이게 부족하구나 한눈에 → 보충으로 문제 줘야지')
//  반 표 = 줄은 기능(engine/skills.js — 맞춤 연습지 카드와 같은 이름 · 가로 글씨) · 칸은 아이 번호 · 표시는 셋(✕ 부족 · △ 흔들 · ○ 됨 · 빈칸 = 안 봄)
//    줄 = 아이들 기록에 나온 차시마다 그 차시를 가장 좁게 겨누는 기능 하나(skillsOf(c)[0]) — 같은 차시가 여러 줄에 겹쳐 나오지 않게
//    칸 = 그 기능의 갈래 차시들 가운데 가장 나쁜 것 · 여기서부터(판정 start)는 진한 ✕
//  보충 주기 = 기능 하나 · 아이 고르기 · 문제 수 → 아이마다 in/<id> { kind: 'give', sk, n, seed, t } + tc/<반>/<열쇠>/tasks/<id>
//    같은 씨앗으로 종이 맞춤 연습지(paper/practice.html)도 같은 문제 · 아이 화면은 app/js/give.js · 결과는 요약 gv
import { SKILLS, SKILL, GROUPS, COUNTS, gText, skillsOf, secOf } from '../../engine/skills.js';
import { examplesOf } from '../../paper/js/pick.js';
import { MIS, WANT } from '../../engine/mis.js';
import { LES } from '../../paper/js/gen.js';
import * as db from './db.js';
import { prepPlan } from './prep.js';
import { esc, rand, lsGet } from './local.js';
import { staticHTML } from './item.js';
import { unitLabel } from './kid.js';
import { pullAll, nm } from './teacher.js';
import { icon } from './icons.js';
import { P } from '../../engine/concepts/kit.js';
import { REVIEW_DAYS } from './kidstore.js';

const cls = (C) => (lsGet('tt.t', { classes: {} }).classes || {})[C];
const glOf = (s) => gText(s).replace(/(\d)-(\d)/g, '$1학년 $2학기');   /* '1-2 ~ 2-1' → '1학년 2학기 ~ 2학년 1학기'(11-07 처음 쓰는 선생님) */
const intro = (html) => `<p class="intro">${html}</p>`;
const qs = () => new URLSearchParams((location.hash.split('?')[1] || ''));
const ORDER = Object.fromEntries(SKILLS.map((s, i) => [s.id, i]));
const SIGN = { root: ['c-root', '✕'], bad: ['c-stuck', '✕'], shaky: ['c-shaky', '△'], ok: ['c-ok', '○'], '': ['c-none', ''] };
const LACK = (v) => v === 'root' || v === 'bad';

// 아이 한 명 × 기능 하나 — 'root'(여기서부터) · 'bad'(부족) · 'shaky'(흔들) · 'ok'(됨) · ''(안 봄)
export function skillState(st, s) {
  if (!st) return '';
  let any = false, bad = false, sh = false, root = false;
  for (const p of s.parts) {
    if (st.start.includes(p.c)) { any = true; root = true; continue; }
    const v = st.L[p.c]; if (!v || v === 'none') continue;
    any = true; if (v === 'stuck') bad = true; else if (v === 'shaky' || v === 'need') sh = true;
  }
  return !any ? '' : root ? 'root' : bad ? 'bad' : sh ? 'shaky' : 'ok';
}
// 배운 칸의 길(고리 닫기 · direction_1110 차례 3) — 배우기 확인 통과(fixed) → 매일 연습 다시 보기 1 · 3 · 7일(rv[0] = 맞힌 수) → 세 번 다 맞힘 = 메움
//  다시 보기에서 틀리면 맞힌 수가 0으로 돌아가고 그때가 배운 때보다 뒤 = '다시'(내일 다시 나옴) · 요약에 rv가 없던 예전 기록은 '다시 보기 0'
export const md = (t) => new Date(t).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
export function closeOf(st, c) {
  const f = st && st.fixed ? Number(st.fixed[c]) || 0 : 0; if (!f) return null;
  const v = st.rv && Array.isArray(st.rv[c]) ? st.rv[c] : [0, f], n = Number(v[0]) || 0, t = Number(v[1]) || f, again = n === 0 && t > f;
  return { c, f, n, t, again, done: !again && n >= REVIEW_DAYS.length, gap: st.gap ? Number(st.gap[c]) || 0 : 0 };
}
// 기능 하나 — 갈래 차시 가운데 배운 것만 · 하나라도 다시 틀렸으면 'again' · 모두 세 번 맞혔고 칸이 됨이면 'done' · 그 밖은 'learn'(가장 적게 맞힌 차시의 수)
export function skillClose(st, s) {
  const xs = s.parts.map((p) => closeOf(st, p.c)).filter(Boolean); if (!xs.length) return null;
  const ag = xs.filter((x) => x.again);
  if (ag.length) return { k: 'again', f: Math.max(...ag.map((x) => x.f)), t: Math.max(...ag.map((x) => x.t)) };
  const gap = Math.min(...xs.map((x) => x.gap || Infinity)), base = { f: Math.max(...xs.map((x) => x.f)), gap: Number.isFinite(gap) ? gap : 0 };
  if (xs.every((x) => x.done) && skillState(st, s) === 'ok') return { k: 'done', ...base, t: Math.max(...xs.map((x) => x.t)) };
  return { k: 'learn', ...base, n: Math.min(...xs.map((x) => x.n)) };
}
const closeSay = (x) => (!x ? '' : x.k === 'done' ? ` · ${x.gap ? `${md(x.gap)} 틀림 → ` : ''}${md(x.f)} 배움 → 다시 보기 세 번 다 맞힘(${md(x.t)}) = 메움` : x.k === 'again' ? ` · ${md(x.f)} 배움 → ${md(x.t)} 다시 보기에서 틀림(다음 날 다시 나와요)` : ` · ${md(x.f)} 배움 · 다시 보기 ${x.n}/${REVIEW_DAYS.length} 맞힘`);
// 이 기능에서 보인 틀린 생각(engine/mis.js 카드 — 카드 차시가 기능 갈래와 겹침) · 아이 요약 mis: s = 여러 번 보임 · m = 한 번 · r = 고침(뺌)
//  다른 프로그램에 없는 것(교사 11-07 '경쟁력') — '얘가 이걸 못하네'에 '이렇게 생각해서 틀리네'를 붙여 보여 줌
export function skillMinds(K, S, s) {
  const cs = new Set(s.parts.map((p) => p.c)), nos = Array.from({ length: K.n }, (_, i) => String(i + 1));
  return MIS.filter((m) => m.lessons.some((c) => cs.has(c))).map((m) => {
    const rep = [], once = [];
    for (const no of nos) { const st = S && S[no] && S[no].st; if (st && skillState(st, s) === 'ok') continue; const v = st && st.mis ? st.mis[m.id] : null; if (v === 's') rep.push(no); else if (v === 'm') once.push(no); }   /* 이 기능이 '됨'인 아이는 빼고(다른 기능에서 보인 생각이 ○ 칸에 찍히던 것) */
    return { m, rep, once };
  }).filter((x) => x.rep.length || x.once.length).sort((a, b) => b.rep.length - a.rep.length || b.once.length - a.once.length);
}
const kidMinds = (st, s) => { const cs = new Set(s.parts.map((p) => p.c)); return st && st.mis ? MIS.filter((m) => (st.mis[m.id] === 's' || st.mis[m.id] === 'm') && m.lessons.some((c) => cs.has(c))) : []; };
// 함정 꼴(그 생각으로 풀면 틀리는 문제) — 기능 갈래 차시마다 보인 생각 하나(engine/mis.js WANT) · 보충 · 종이 연습지에 절반 섞음(pick.js)
export function wantOf(minds, s) {
  const want = {};
  for (const x of minds) for (const p of s.parts) if (!want[p.c] && WANT[x.m.id] && WANT[x.m.id][p.c]) want[p.c] = x.m.id;
  return want;
}
// 반 표의 줄 — 기록에 나온 차시마다 가장 좁은 기능 · 오늘 단원만이면 그 단원 준비 칸 · 아래 칸에 든 기능만
export const skillCmp = (a, b) => (a.g < b.g ? -1 : a.g > b.g ? 1 : ORDER[a.id] - ORDER[b.id]);   /* 낮은 학년 → 같은 학년이면 기능 차례(반 표 · 아이 자세히가 같은 '먼저') */
export function skillRows(K, S, { unit = null } = {}) {
  const nos = Array.from({ length: K.n }, (_, i) => String(i + 1));
  const P = unit ? prepPlan(unit) : null, inUnit = P ? new Set([...P.pre, ...P.below]) : null;
  const ids = new Set(), shown = new Set();   /* ids = 아이에게 보인 모든 기능('가장 아래'는 단원과 상관없이) · shown = 단원으로 좁힌 표에 보일 것 */
  for (const no of nos) { const st = S[no] && S[no].st; if (!st) continue; for (const c of [...Object.keys(st.L), ...st.start]) { if (!LES(c)) continue; const sk = skillsOf(c)[0]; if (!sk) continue; ids.add(sk.id); if (!inUnit || inUnit.has(c)) shown.add(sk.id); } }
  const rows = [...ids].map((id) => {
    const s = SKILL[id], cells = nos.map((no) => skillState(S[no] && S[no].st, s));
    const lack = nos.filter((no, i) => LACK(cells[i])), shaky = nos.filter((no, i) => cells[i] === 'shaky'), seen = cells.filter(Boolean).length;
    const cl = nos.map((no) => skillClose(S[no] && S[no].st, s)), done = nos.filter((no, i) => cl[i] && cl[i].k === 'done'), learn = nos.filter((no, i) => cl[i] && cl[i].k !== 'done');
    return { s, cells, cl, lack, shaky, seen, done, learn };
  });
  /* 아이마다 가장 아래(낮은 학년)의 부족한 기능 — 더 아래가 빈 아이에게 위 기능 보충이 먼저 가지 않게(first = 이 기능부터인 아이 · later = 더 아래부터 · 처음 보는 눈 11-07) */
  const low = {}, isRoot = (r, no) => r.cells[nos.indexOf(no)] === 'root'; for (const r of rows) r.lack.forEach((no) => { const o = low[no]; if (!o || (isRoot(r, no) && !isRoot(o, no)) || (isRoot(r, no) === isRoot(o, no) && skillCmp(r.s, o.s) < 0)) low[no] = r; });   /* '여기서부터'(진한 ✕)가 있으면 그것이 먼저 — 아이 자세히 '먼저 배울 곳'과 같게 */
  rows.forEach((r) => { r.first = r.lack.filter((no) => low[no] === r); r.later = r.lack.filter((no) => low[no] !== r).map((no) => [no, low[no].s]); });
  return rows.filter((r) => shown.has(r.s.id)).sort((a, b) => b.lack.length - a.lack.length || b.shaky.length - a.shaky.length || ORDER[a.s.id] - ORDER[b.s.id]);
}
// 반 화면 카드 ②에 넣는 짧은 줄 — 부족한 아이가 많은 기능 셋
export function tableCard(C, K, S) {
  if (!S) return '<p class="small muted">불러오는 중…</p>';
  const all = skillRows(K, S), rows = all.filter((r) => r.lack.length).slice(0, 3), nD = all.reduce((m, r) => m + r.done.length, 0), nL = all.reduce((m, r) => m + r.learn.length, 0);
  const cl = nD || nL ? `<p class="c3-close">배워서 메운 칸 <b>${nD}</b>개 · 배우고 다시 보는 중 <b>${nL}</b>개 <span class="small muted">(다시 보기 1 · 3 · 7일을 다 맞히면 메움)</span></p>` : '';
  if (!rows.length) return cl + `<p class="c3-none">${Object.values(S).some((x) => x && x.st) ? '부족한 기능이 아직 없어요' : '아이들이 점검을 하면 여기에 떠요'}</p>`;
  return cl + `<ul class="c3-list t-lines">${rows.map((r) => `<li><a href="#/t/c/${C}/give?sk=${r.s.id}&who=${r.first.join(',')}"><b>${esc(r.s.name)}</b><span>부족 ${r.lack.length}명 — ${r.lack.map((no) => esc(nm(K, no))).join(', ')}</span></a></li>`).join('')}</ul>`;
}

// ── ② 반 표 ──
export function tableView(root, C) {
  const K = cls(C); if (!K) { location.hash = '#/t'; return; }
  let S = null, alive = true, only = qs().get('u') === '1' && !!(K.today && K.today.unit);
  const nos = Array.from({ length: K.n }, (_, i) => String(i + 1));
  function render() {
    const unit = only && K.today ? K.today.unit : null;
    const rows = S ? skillRows(K, S, { unit }) : [], open = rows.filter((r) => r.lack.length || r.shaky.length), fine = rows.filter((r) => !r.lack.length && !r.shaky.length);
    const sx = (root.querySelector('.stab') || {}).scrollLeft || 0;
    const head = `<tr><th class="sk">기능</th>${nos.map((no) => `<th class="kn"><a href="#/t/c/${C}/k/${no}" title="${esc(nm(K, no))} 자세히">${no}${K.names && K.names[no] ? `<small>${esc(String(K.names[no]).slice(0, 3))}</small>` : ''}</a></th>`).join('')}<th class="lack">보충할 아이</th></tr>`;
    const many = K.n > 16;   /* 28명 반이 1366 한 화면에(비판 C6) — 칸 좁게 · 틀린 생각 하나 · 보충할 아이 칸은 수만(번호는 칸에 이미 보임) */
    const row = (r) => { const mds = S ? skillMinds(K, S, r.s).slice(0, many ? 1 : 2) : [];
      return `<tr><th class="sk"><b>${esc(r.s.name)}</b><small>${esc(glOf(r.s))}</small>${mds.length ? `<span class="sk-m">${mds.map((x) => `<a href="#/t/c/${C}/m/${x.m.id}" title="${esc(x.m.plain || x.m.title)}">${many ? `틀린 생각 <b>${x.rep.length + x.once.length}명</b> — ${esc(x.m.title)}` : `틀린 생각: ${esc(x.m.title)} <b>${x.rep.length + x.once.length}명</b>`}</a>`).join('')}</span>` : ''}</th>${r.cells.map((v, i) => { const [c, t] = SIGN[v], km = S && v !== 'ok' ? kidMinds(S[nos[i]] && S[nos[i]].st, r.s) : [], lab = `${nm(K, nos[i])} ${r.s.name} ${{ root: '부족(먼저 배울 곳)', bad: '부족', shaky: '가끔 틀림', ok: '됨', '': '아직 안 풂' }[v]}${km.length ? ` · 생각: ${km.map((m) => m.title).join(', ')}` : ''}`; const x = r.cl[i], st1 = S && S[nos[i]] && S[nos[i]].st, lt = st1 && st1.Lt ? Math.max(0, ...r.s.parts.map((p) => st1.Lt[p.c] || 0)) : 0, lab2 = lab + (v && lt ? ` · ${md(lt)}에 푼 것으로 판정` : '') + closeSay(x), sub = !x ? '' : x.k === 'done' ? '<small class="cl">메움</small>' : x.k === 'again' ? '<small class="cl ag">다시</small>' : `<small class="cl">${x.n}/${REVIEW_DAYS.length}</small>`; return `<td class="${x && x.k === 'done' ? 'c-ok c-done' : c}${km.length ? ' has-m' : ''}"><a href="#/t/c/${C}/k/${nos[i]}" title="${esc(lab2)}" aria-label="${esc(lab2)}">${x && x.k === 'done' ? '◎' : t}${sub}</a></td>`; }).join('')}
      <td class="lack"><div class="lk">${r.lack.length ? `<span>${many ? `부족 ${r.lack.length}명` : `${r.lack.map((no) => esc(no)).join(' · ')}번`}</span><a class="btn teal mini" href="#/t/c/${C}/give?sk=${r.s.id}&who=${r.first.join(',')}">${icon('send', 16)}보충 주기</a>` : r.shaky.length ? `<span class="muted">가끔 틀림 ${r.shaky.length}명</span><a class="btn mini" href="#/t/c/${C}/give?sk=${r.s.id}&who=${r.shaky.join(',')}">보충 주기</a>` : ''}</div>${r.done.length ? `<p class="cl-n">배워서 메움 ${many ? `${r.done.length}명` : `${r.done.map((no) => esc(no)).join(' · ')}번`}</p>` : ''}</td></tr>`; };
    root.innerHTML = `<div class="card tview">
      <div class="tv-h"><h2>반 표 <small>${esc(C)} · ${K.n}명 · 기능 × 아이</small></h2><a class="btn" href="#/t/c/${C}">반 화면으로</a></div>
      ${intro('가로줄 = <b>셈 기능</b> · 세로줄 = <b>아이 번호</b>. 줄 끝 <b>[보충 주기]</b>를 누르면 그 아이들에게 그 기능 문제가 바로 가요. <b>틀린 생각</b>은 아이가 쓴 틀린 답으로 짐작한 것이에요(주황 점 = 그 생각이 보인 아이).')}
      <div class="tv-bar"><div class="legend2"><span><i class="c-stuck">✕</i>부족<small>(진한 ✕ = 여기서부터 배울 것)</small></span><span><i class="c-shaky">△</i>가끔 틀림</span><span><i class="c-ok">○</i>됨</span><span><i class="c-none"></i>아직 안 풂</span><span><b class="cl-k">1/3</b>배운 뒤 다시 보기(1 · 3 · 7일) 맞힌 수</span><span><i class="c-ok c-done">◎</i>메움<small>(다시 보기 세 번 다 맞힘)</small></span><span><b class="cl-k ag">다시</b>배운 뒤 다시 틀림</span></div>
        ${K.today && K.today.unit ? `<div class="seg"><a class="${only ? '' : 'on'}" href="#/t/c/${C}/table">모든 기능</a><a class="${only ? 'on' : ''}" href="#/t/c/${C}/table?u=1">오늘 단원(${esc(unitLabel(K.today.unit))})에 필요한 것</a></div>` : ''}</div>
      ${!S ? '<p class="muted">불러오는 중…</p>' : !rows.length ? '<p class="muted">아직 기록이 없어요. 아이들이 점검을 하면 여기에 떠요.</p>'
        : `<div class="stab"><table${many ? ' class="tight"' : ''}>${head}${open.map(row).join('')}</table></div>
        ${open.length ? '' : '<p class="okc">부족하거나 가끔 틀리는 기능이 없어요.</p>'}
        ${fine.length ? `<details class="more"><summary>모두 된 기능 ${fine.length}개${fine.some((r) => r.done.length) ? ` — 그 가운데 배워서 메운 아이가 있는 기능 ${fine.filter((r) => r.done.length).length}개` : ''}</summary><div class="stab"><table${many ? ' class="tight"' : ''}>${head}${fine.map(row).join('')}</table></div></details>` : ''}`}
      <p class="small muted">${S ? '15초마다 새로 봐요(이 화면이 열려 있을 때만).' : ''}</p></div>`;
    const tb = root.querySelector('.stab'); if (tb && sx) tb.scrollLeft = sx;
  }
  async function refresh() { if (!alive) return; const d = await pullAll(C, K); if (!alive) return; S = d; render(); }
  render(); refresh();
  const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
  return () => { alive = false; clearInterval(timer); };
}

// ── ③ 보충 주기 ──
const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');
export function giveTView(root, C) {
  const K = cls(C); if (!K) { location.hash = '#/t'; return; }
  const q = qs(), nos = Array.from({ length: K.n }, (_, i) => String(i + 1));
  let sk = SKILL[q.get('sk')] ? q.get('sk') : null, n = 10, S = null, sent = [], alive = true, trap = true;
  const seed = Math.floor(Math.random() * 1e9), opened = Date.now();   /* opened = 이 화면을 연 때 → 보낼 때 고르는 데 걸린 초(dur · 선생님 시간 증거 · 11-07) */   /* 이 화면에서 보내는 것과 '같은 문제 종이로'가 같은 씨앗(따로 뽑아 숫자가 달랐던 것 · 코덱스 11-07) */
  const paperURL = (sk1, n1, seed1, want1) => `../paper/practice.html#${encodeURIComponent(JSON.stringify({ v: 2, seed: seed1, who: '', s: [secOf(SKILL[sk1], n1, { want: want1 || {} })] }))}`;
  let who = new Set((q.get('who') || '').split(',').filter((x) => nos.includes(x)));
  const exHTML = (s) => { let xs = []; try { xs = examplesOf(s); } catch (e) { xs = []; } return xs.map((e) => `<span class="gx">${staticHTML(e.it.prompt, null)}</span>`).join(''); };
  function render(msg = '') {
    const s = sk ? SKILL[sk] : null;
    const rows = S ? skillRows(K, S) : [], lackRows = rows.filter((r) => r.lack.length || r.shaky.length);
    const r0 = s ? rows.find((r) => r.s.id === s.id) : null;
    const pick = !s ? `<h3>어떤 기능을 줄까요?</h3>
      ${!S ? '<p class="muted">불러오는 중…</p>' : lackRows.length ? `<p class="small muted">우리 반에서 부족하거나 가끔 틀리는 아이가 있는 기능이에요.</p><div class="gpick">${lackRows.slice(0, 12).map((r) => `<a class="gcard" href="#/t/c/${C}/give?sk=${r.s.id}&who=${(r.lack.length ? r.first : r.shaky).join(',')}"><b>${esc(r.s.name)}</b><span class="gex">${exHTML(r.s)}</span><span class="small">${r.lack.length ? `부족 ${r.lack.length}명` : ''}${r.lack.length && r.shaky.length ? ' · ' : ''}${r.shaky.length ? `가끔 틀림 ${r.shaky.length}명` : ''}</span></a>`).join('')}</div>` : '<p class="muted">부족한 기능이 아직 없어요. 아래에서 직접 골라도 돼요.</p>'}
      <div class="row"><label for="sel">다른 기능</label><select id="sel" class="sel"><option value="">기능 고르기</option>${GROUPS.map((g) => `<optgroup label="${esc(g)}">${SKILLS.filter((x) => x.group === g).map((x) => `<option value="${x.id}">${esc(x.name)} (${esc(glOf(x))})</option>`).join('')}</optgroup>`).join('')}</select></div>`
      : `<div class="gsel"><div><span class="small muted">고른 기능</span><h3>${esc(s.name)} <small>${esc(glOf(s))}</small></h3><div class="gex">${exHTML(s)}</div></div><a class="btn mini" href="#/t/c/${C}/give">다른 기능</a></div>
      ${(() => { const md = S ? skillMinds(K, S, s) : [], wt = wantOf(md, s); return md.length ? `<div class="gmind"><h3>이 기능에서 보인 틀린 생각</h3><ul>${md.slice(0, 3).map((x) => `<li><b>${esc(x.m.title)}</b><span class="small">${esc(x.m.plain || '')}</span><span class="small muted">${x.rep.length ? `자주 보인 아이: ${x.rep.map((no) => esc(nm(K, no))).join(', ')}` : ''}${x.rep.length && x.once.length ? ' / ' : ''}${x.once.length ? `한 문제에서만: ${x.once.map((no) => esc(nm(K, no))).join(', ')}` : ''}</span></li>`).join('')}</ul>${Object.keys(wt).length ? `<label class="gtrap"><input type="checkbox" id="trap" ${trap ? 'checked' : ''}> 이 생각을 고쳤는지 보는 문제를 섞어요 <span class="small muted">(아이 화면 · 종이 모두 표시 없음 · 다 풀면 아래 '보낸 보충'에 함정 몇 개를 맞혔는지 떠요)</span></label>` : ''}</div>` : ''; })()}
      <h3>누구에게 <small>${who.size}명</small></h3>
      ${(() => { const busy = [...who].filter((no) => sent.some((x) => x.sk === s.id && (x.who || []).map(String).includes(no) && !(S && S[no] && S[no].st && S[no].st.gv[x.id]))).sort((p, q) => p - q); return busy.length ? `<p class="small g-later"><b>${busy.map((no) => esc(nm(K, no))).join(' · ')}</b>${P(nm(K, busy[0]), '은', '는')} 같은 보충을 아직 푸는 중이에요 — 또 보내면 두 개가 돼요. 빼려면 번호를 눌러요.</p>` : '';   /* 겹쳐 보내기 알림 */ })()}
      <div class="kchips">${nos.map((no) => { const v = r0 ? r0.cells[nos.indexOf(no)] : ''; return `<label class="kchip ${SIGN[v][0]}${who.has(no) ? ' on' : ''}"><input type="checkbox" value="${no}" ${who.has(no) ? 'checked' : ''}><b>${who.has(no) ? '✓ ' : ''}${no}</b>${K.names && K.names[no] ? `<small>${esc(String(K.names[no]).slice(0, 3))}</small>` : ''}<i>${{ root: '부족', bad: '부족', shaky: '가끔 틀림', ok: '됨', '': '' }[v]}</i></label>`;   /* 칩 위 ✕는 '닫기'로 읽혀서 아래 작은 글로(11-07 처음 쓰는 선생님) */ }).join('')}</div>
      ${r0 && r0.later.length ? `<p class="small g-later">${r0.later.map(([no, ls]) => `<b>${esc(nm(K, no))}</b>`).join(' · ')}${P(nm(K, r0.later[0][0]), '은', '는')} 더 아래 기능이 먼저예요 — ${[...new Set(r0.later.map(([, ls]) => ls.name))].map((x) => `<b>${esc(x)}</b>`).join(' · ')}부터 권해요. 그래도 넣으려면 번호를 눌러 고르세요.</p>` : ''}
      <div class="acts sub">${r0 && r0.first.length ? `<button type="button" data-w="lack">이 기능부터인 아이(${r0.first.length})</button>` : ''}${r0 && r0.later.length ? `<button type="button" data-w="later">더 아래가 먼저인 아이까지</button>` : ''}${r0 && r0.shaky.length ? `<button type="button" data-w="shaky">가끔 틀리는 아이까지</button>` : ''}<button type="button" data-w="all">모두</button><button type="button" data-w="none">지우기</button></div>
      <h3>몇 문제</h3><div class="seg">${COUNTS.map((k) => `<button type="button" class="${k === n ? 'on' : ''}" data-n="${k}">${k}문제</button>`).join('')}</div>
      <div class="acts give-go"><button class="pri big" id="send" ${who.size ? '' : 'disabled'}>${icon('send', 22)}아이 화면으로 보내기</button><button class="big" id="paper">같은 문제 종이로</button><span class="give-sum">${who.size ? `<b>${[...who].sort((x, y) => x - y).join(' · ')}번</b>에게 ${n}문제` : '보낼 아이를 골라 주세요'}</span></div>
      <p class="small muted">아이 처음 화면의 <b>'배울 것'</b> 카드에 '선생님이 준 문제'로 떠요(30초 안). 종이로 뽑아도 아이 화면과 같은 문제예요.</p>`;
    const sentHTML = sent.length ? `<div class="card"><h2>보낸 보충 <small>최근 ${Math.min(sent.length, 10)}개</small></h2><ul class="sent">${sent.slice(0, 10).map((x) => { const sx = SKILL[x.sk]; const res = (x.who || []).map((no) => { const g = S && S[no] && S[no].st && S[no].st.gv[x.id]; return g ? `<span class="pill ${g[0] / g[1] >= 0.8 ? 'okc' : g[0] / g[1] < 0.5 ? 'lowc' : ''}">${esc(nm(K, no))} ${g[0]}/${g[1]}${g[0] / g[1] < 0.5 ? ' · 같이 보기' : ''}${g[4] ? ` · 함정 ${g[3]}/${g[4]}${g[4] >= 2 && g[3] === g[4] ? ' 고친 것 같아요' : ''}` : ''}</span>` : `<span class="pill muted">${esc(nm(K, no))} 아직</span>`; }).join(' ');
      return `<li><b>${esc(sx ? sx.name : x.sk)}</b> <span class="small muted">${x.n}문제 · ${new Date(x.t).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}${Number(x.dur) > 0 ? ` · 고르는 데 ${Number(x.dur) >= 60 ? `${Math.floor(x.dur / 60)}분 ` : ''}${Number(x.dur) % 60}초` : ''}${x.want ? ' · 함정 문항 섞음' : ''}${x.cut ? ' · 안 푼 아이는 거둠' : ''}</span>${sx && Number.isFinite(Number(x.seed)) ? ` <a class="small" href="${esc(paperURL(x.sk, Number(x.n) || 10, Number(x.seed), x.want))}" target="_blank" rel="noopener">종이로</a>` : ''}${(x.who || []).some((no) => !(S && S[no] && S[no].st && S[no].st.gv[x.id])) ? ` <button type="button" class="btn mini" data-cut="${esc(x.id)}" title="아직 안 푼 아이의 처음 화면에서 이 보충을 거둬요(다 푼 아이 결과는 남아요)">거두기</button>` : ''}<div class="whys">${res}</div></li>`; }).join('')}</ul></div>` : '';
    root.innerHTML = `<div class="card gview"><div class="tv-h"><h2>보충 주기 <small>${esc(C)}</small></h2><a class="btn" href="#/t/c/${C}">반 화면으로</a></div>
      ${intro('기능 하나를 골라 부족한 아이에게 그 문제만 보내요. 아이는 틀리면 그 자리에서 풀이를 보고, 다 풀면 결과가 반 표에 들어가요.')}
      ${pick}<p class="qmsg tight${msg ? ' ok' : ''}" id="msg">${esc(msg)}</p></div>${sentHTML}`;
    const sel = root.querySelector('#sel'); if (sel) sel.addEventListener('change', () => { if (sel.value) location.hash = `#/t/c/${C}/give?sk=${sel.value}`; });
    root.querySelectorAll('.kchip input').forEach((x) => x.addEventListener('change', () => { if (x.checked) who.add(x.value); else who.delete(x.value); render(); }));
    root.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { const w = b.dataset.w; who = new Set(w === 'all' ? nos : w === 'none' ? [] : w === 'lack' ? r0.first : w === 'later' ? r0.lack : [...r0.lack, ...r0.shaky]); render(); }));
    root.querySelectorAll('[data-cut]').forEach((b) => b.addEventListener('click', () => cut(b.dataset.cut)));
    root.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { n = Number(b.dataset.n); render(); }));
    const sb = root.querySelector('#send'); if (sb) sb.addEventListener('click', send);
    const tb = root.querySelector('#trap'); if (tb) tb.addEventListener('change', () => { trap = tb.checked; });
    const pb = root.querySelector('#paper'); if (pb) pb.addEventListener('click', () => window.open(paperURL(sk, n, seed, wantNow()), '_blank', 'noopener'));
  }
  const wantNow = () => { const s = SKILL[sk]; if (!s || !trap || !S) return {}; return wantOf(skillMinds(K, S, s), s); };
  async function send() {
    const s = SKILL[sk]; if (!s || !who.size) return;
    const m = root.querySelector('#msg'); m.textContent = '보내는 중…';
    const t = Date.now(), id = `gv${dayKey(t)}${rand(4)}`, list = [...who].sort((a, b) => a - b);
    const w = wantNow(), task = { kind: 'give', sk: s.id, n, seed, t, dur: Math.round((t - opened) / 1000), ...(Object.keys(w).length ? { want: w } : {}) }, up = {};
    for (const no of list) up[`k/${C}/${no}/${K.pins[no]}/in/${id}`] = db.enc(task);
    up[`tc/${C}/${K.T}/tasks/${id}`] = db.enc({ ...task, who: list });
    try { await db.patch('', up); sent = [{ id, ...task, who: list }, ...sent]; render(`보냈어요! ${list.length}명의 처음 화면 '배울 것' 카드에 30초 안에 떠요.`); }
    catch (e) { m.textContent = `보내지 못했어요: ${e.message}`; }
  }
  /* 거두기(비판 C7) — 잘못 보낸 보충을 아직 안 푼 아이의 처음 화면에서 뺌 · 다 푼 아이가 있으면 그 아이들 결과만 남기고(who를 줄임) · 없으면 선생님 기록도 지움 */
  async function cut(id) {
    const x = sent.find((y) => y.id === id); if (!x) return;
    const doneN = (x.who || []).map(String).filter((no) => S && S[no] && S[no].st && S[no].st.gv[id]), left = (x.who || []).map(String).filter((no) => !doneN.includes(no));
    if (!left.length || !confirm(`아직 안 푼 ${left.length}명(${left.join(' · ')}번)의 처음 화면에서 이 보충을 거둘까요?${doneN.length ? ` 다 푼 ${doneN.length}명의 결과는 남아요.` : ''}`)) return;
    const up = {}; for (const no of left) if (K.pins[no]) up[`k/${C}/${no}/${K.pins[no]}/in/${id}`] = null;
    const { id: _id, ...task } = x; up[`tc/${C}/${K.T}/tasks/${id}`] = doneN.length ? db.enc({ ...task, who: doneN.map(Number), cut: Date.now() }) : null;
    try { await db.patch('', up); sent = doneN.length ? sent.map((y) => (y.id === id ? { ...y, who: doneN.map(Number), cut: Date.now() } : y)) : sent.filter((y) => y.id !== id); render(`거뒀어요. ${left.length}명의 처음 화면에서 30초 안에 사라져요.`); }
    catch (e) { const m = root.querySelector('#msg'); if (m) m.textContent = `거두지 못했어요: ${e.message}`; }
  }
  async function refresh() {
    if (!alive) return;
    const [d, tk] = await Promise.all([pullAll(C, K), db.get(`tc/${C}/${K.T}/tasks`).catch(() => null)]);
    if (!alive) return;
    S = d; sent = Object.entries(tk || {}).map(([id, v]) => ({ id, ...(db.dec(v) || {}) })).filter((x) => x.kind === 'give' && SKILL[x.sk]).sort((a, b) => b.t - a.t);
    const a = document.activeElement; if (a && root.contains(a) && /SELECT|INPUT/.test(a.tagName)) return;
    render();
  }
  render(); refresh();
  const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 20000);
  return () => { alive = false; clearInterval(timer); };
}
