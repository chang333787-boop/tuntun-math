// 맞춤 연습지(선생님 화면 #/t/sheet) — 기능 카드를 눌러 고르고(engine/skills.js · 카드마다 예시 둘) 문제 수 · 차례 · 이름 · 확인 동그라미 · 보기 · 정답 쪽을 정해 paper/practice.html을 새 탭으로
//  선생님 말(11-05): "내가 너를 통하지 않고 프로그램 상에서 방금 한 작업을" — 차시 id를 몰라도 '두 자리 수 − 두 자리 수 10문제'로
//    "예시 문제를 카드형으로 항목별로 잘 나눠서 쉽게 골라서 타닥" — 기능 = 카드 하나(이름 · 예시 둘 · 학기) · 누르면 고름 · 다시 누르면 뺌 · 문제 수 칩
//  아이 자세히 → [이 아이 연습지](kidSheet) = 고칠 판자 · 막힌 칸 · 흔들리는 칸을 기능으로 찾아 미리 고름 · 그 아이 칸 위주로 나눔(더 어려운 갈래는 뺌)
//    보인 틀린 방법이 있으면 그 칸 문제의 절반을 함정 꼴로(engine/mis.js WANT) — 종이엔 표시 X · 이 화면에만 '이 생각을 겨눈 문항 n개'
//    찍기 · 자신 있었는데 틀림 · 실수로만 틀림이 잦으면 확인 동그라미를 켜 둠
//  이름은 이 기기에만 — 지금 설정 sessionStorage(tt.sheet.cur) · 저장한 설정 localStorage(tt.sheets) · 종이 주소의 # 뒤(서버로 가지 않음)
import { SKILLS, SKILL, GROUPS, COUNTS, secOf, partsText, skillsOf, gText, focusShares } from '../../engine/skills.js';
import { byId } from '../../engine/lessons/index.js';
import { mindsOf, wantFor, misById } from '../../engine/mis.js';
import { buildSheet, examplesOf } from '../../paper/js/pick.js';
import { itemOf } from '../../paper/js/gen.js';
import { toText, toHTML } from '../../engine/tokens.js';
import { mascot } from '../../paper/js/mascot.js';
import { lsGet, lsSet, esc } from './local.js';
import { go } from './kid.js';
import { icon } from './icons.js';

const CUR = 'tt.sheet.cur', PRE = 'tt.sheet.pre', SAVED = 'tt.sheets';
const ssGet = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const ssSet = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 사생활 창 등 — 이 화면 안에서만 */ } };
const ssDel = (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* */ } };
const WHY = { start: '배울 것', stuck: '막힌 칸', shaky: '흔들리는 칸', mind: '틀린 방법이 되풀이됨' };
const GL = (g) => g.replace(/^(\d)-(\d)$/, '$1학년 $2학기');
const gLong = (s) => (s.g === s.g2 ? GL(s.g) : `${GL(s.g)} ~ ${GL(s.g2)}`);
const newSeed = () => 1 + Math.floor(Math.random() * 99998);
const countsOf = (s) => COUNTS.filter((n) => n <= (s.max || 20));
const blank = () => ({ sel: [], who: '', chk: false, ex: true, key: true, seed: newSeed(), kid: null });
const MAXK = 6;   /* 이 아이 연습지 — 기능 여섯까지(한 번에 종이 일곱 쪽 안팎) */

// 저장해 둔 설정은 믿지 않고 모양을 맞춰 읽음(옛 설정 · 없어진 기능이 화면을 멈추지 않게)
function normSel(x) {
  const s = SKILL[x.id], cs = s.parts.map((p) => p.c), n = countsOf(s).includes(Number(x.n)) ? Number(x.n) : Math.min(10, s.max || 20);
  const want = Object.fromEntries(Object.entries(x.want && typeof x.want === 'object' ? x.want : {}).filter(([c, id]) => cs.includes(c) && wantFor(id, c)));
  const focus = (Array.isArray(x.focus) ? x.focus : []).filter((c) => cs.includes(c));
  return { id: x.id, n, want, focus, why: (Array.isArray(x.why) ? x.why : []).filter((w) => WHY[w]), tw: x.tw !== false, fw: x.fw !== false };
}
const okSel = (xs) => { const seen = new Set(); return (Array.isArray(xs) ? xs : []).filter((x) => x && SKILL[x.id] && !seen.has(x.id) && seen.add(x.id)).map(normSel); };
function norm(cfg) {
  if (!cfg || typeof cfg !== 'object') return blank();
  const sel = okSel(cfg.sel);
  const k = cfg.kid && typeof cfg.kid === 'object' ? cfg.kid : null;
  /* kid.pre = 이 아이에게 찾은 기능 모두(고른 것 + 더 있는 칸) — 카드를 뺐다 다시 눌러도 그 아이 칸 위주 · 함정 꼴 · 꼬리표가 돌아오게 */
  return { sel, who: String(cfg.who || '').slice(0, 24), chk: !!cfg.chk, ex: cfg.ex !== false, key: cfg.key !== false, seed: Number(cfg.seed) > 0 ? Math.floor(Number(cfg.seed)) : newSeed(),
    kid: k ? { label: String(k.label || '').slice(0, 30), chkWhy: String(k.chkWhy || '').slice(0, 120), more: (Array.isArray(k.more) ? k.more : []).filter((id) => SKILL[id]), none: !!k.none, pre: okSel(k.pre) } : null };
}
// 종이 설정(paper/practice.html # 뒤) — v2 뽑기(고르기 문제는 글 + 보기로 견줌)
export function specOf(cfg) {
  return { v: 2, who: cfg.who || '', seed: cfg.seed, ...(cfg.chk ? { chk: true } : {}), ...(cfg.ex === false ? { ex: false } : {}), ...(cfg.key === false ? { key: false } : {}),
    s: cfg.sel.map((x) => { const s = SKILL[x.id]; return secOf(s, x.n, { want: x.tw ? x.want : {}, shares: x.fw ? focusShares(s, x.focus) : null }); }) };
}
export const paperURL = (cfg) => `${new URL('../paper/practice.html', location.href).href.split('#')[0]}#${encodeURIComponent(JSON.stringify(specOf(cfg)))}`;

// ── 이 아이 연습지 — 아이 판정(kidReport) → 고를 기능 · 함정 꼴 · 확인 동그라미 ──
//  한 칸에 기능이 여럿이면: 그 칸에서 틀린 문제 글이 그 갈래 거르기(re)에 맞는 것 → 갈래가 적은 것(그 칸만 겨눔) · 섞기 기능은 고르지 않음
function bestSkill(c, recs) {
  const cand = skillsOf(c).filter((s) => !s.mix);
  if (!cand.length) return null;
  const txt = (recs || []).filter((r) => !r.ok && r.p).map((r) => { try { return toText(itemOf(c, r.p).prompt); } catch (e) { return ''; } });
  const score = (s) => { const p = s.parts.find((q) => q.c === c); if (!p.re) return 0.5; const re = new RegExp(p.re); return txt.filter((t) => re.test(t)).length; };
  return cand.map((s, i) => ({ s, k: score(s), i })).sort((a, b) => b.k - a.k || a.i - b.i)[0].s;
}
export function kidPreset({ rep, st = null, cal = null, who = '' }) {
  const L = (rep && rep.L) || {}, minds = rep ? mindsOf(rep) : {};
  const mis = [...new Set([...Object.keys(minds), ...Object.entries((st && st.mis) || {}).filter(([, v]) => v === 's' || v === 'm').map(([k]) => k)])].filter((id) => misById[id]);
  const pri = [];
  (rep && rep.start || []).forEach((x) => pri.push([x.c, 'start']));
  Object.values(L).forEach((x) => { if (x.st === 'stuck') pri.push([x.c, 'stuck']); });
  Object.values(L).forEach((x) => { if (x.st === 'shaky') pri.push([x.c, 'shaky']); });
  for (const [id, e] of Object.entries(minds)) if (e.s) for (const c of e.c) if (wantFor(id, c)) pri.push([c, 'mind']);
  /* 찾은 기능 모두(먼저 볼 것부터) — 앞의 여섯은 미리 고르고 나머지는 '더 있는 칸'(카드에 꼬리표 · 누르면 그 아이 칸 위주로 더해짐) */
  const pick = new Map();
  for (const [c, why] of pri) {
    if (!byId[c]) continue;
    const s = bestSkill(c, L[c] && L[c].recs); if (!s) continue;
    if (!pick.has(s.id)) pick.set(s.id, { id: s.id, n: 10, why: new Set(), focus: new Set(), want: {} });
    const x = pick.get(s.id); x.why.add(why); x.focus.add(c);
  }
  const order = (id) => SKILLS.indexOf(SKILL[id]), found = [...pick.values()], more = found.slice(MAXK).map((x) => x.id);
  const all = found.sort((a, b) => order(a.id) - order(b.id)).map((x) => {
    const s = SKILL[x.id];
    for (const p of s.parts) for (const id of mis) if (!x.want[p.c] && wantFor(id, p.c)) x.want[p.c] = id;
    const n = Math.min(10, s.max || 20), sh = focusShares(s, [...x.focus]);
    /* 그 칸 문제가 적어(곱셈구구 한 단 · 몇십 ÷ 몇) 칸 위주로 n문제를 다 못 채우면 기본 나누기로 */
    const fits = !sh || buildSheet({ v: 2, seed: 5, s: [secOf(s, n, { shares: sh })] })[0].items.length >= n;
    return { id: x.id, n, why: [...x.why], focus: [...x.focus], want: x.want, tw: true, fw: fits };
  });
  // 확인 동그라미 — 반 화면 '먼저 봐 줄 아이'와 같은 문턱(찍기 2번 · 자신 있었는데 틀림 3문제) + 실수로만 틀린 칸
  const sw = Object.values((st && (st.sw14 || st.sw)) || (cal && cal.sureWrong) || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const rush = st ? Number(st.rush14 != null ? st.rush14 : st.rush) || 0 : 0, slip = Object.values(L).filter((x) => x.slipOnly).length;
  const why = [rush >= 2 ? `2초 안에 찍기 ${rush}번` : '', sw >= 3 ? `자신 있었는데 틀림 ${sw}문제` : '', slip ? `실수로만 틀린 칸 ${slip}개` : ''].filter(Boolean);
  const sel = all.filter((x) => !more.includes(x.id));
  return norm({ sel, who, chk: why.length > 0, ex: true, key: true, seed: newSeed(), kid: { label: who, chkWhy: why.join(' · '), more, none: !sel.length, pre: all } });
}
export function kidSheet({ C = '', ...args }) { ssSet(PRE, kidPreset(args)); go(`#/t/sheet${C ? `?c=${C}` : ''}`); }


// ── 기능 카드 — 이름(크게) · 예시 둘(종이 모양 그대로 · pick.js examplesOf · 씨앗 고정이라 늘 같음) · 학기(선생님 화면만) ──
//  '타닥' — 카드 아무 곳이나 누르면 고름 · 다시 누르면 뺌 · 고른 카드 = 청록 테두리 + 옅은 바탕 + ✓ · 아래 문제 수 칩(5 · 10 · 15 · 20 · 기능 max까지)
//  칩은 고르기 전에도 흐리게 늘 그 자리(누르면 그 수로 바로 고름) — 고를 때 카드 높이가 바뀌어 아래 카드가 밀리지 않게
//  예시는 처음 만들 때 한 번만(EXH) · 지금 탭의 카드만 그림 · 화면 위쪽 카드(LAZY개)만 바로 · 나머지는 화면 가까이 올 때(IntersectionObserver)
//  고르고 뺄 때는 그 카드의 꼬리표만 바꿈(목록을 다시 그리지 않음) — 크롬북 흉내(CPU 4배 느리게)에서 탭 바꾸기 · 첫 화면 0.3초 안
const EXH = new Map();
const NUM = ['①', '②', '③', '④', '⑤'];
const inline = (h) => h.replace(/<div class="pic">/g, '<span class="pic">').replace(/<\/div>/g, '</span>');   /* 카드 = 단추 하나라 안에 div X(그림 칸만 div) */
function exHTML(s) {
  if (EXH.has(s.id)) return EXH.get(s.id);
  let xs = []; try { xs = examplesOf(s); } catch (e) { xs = []; }
  const h = inline(xs.map(({ it, label }) => `<span class="sc-q">${label ? `<span class="sc-l">${esc(label)}</span>` : ''}<span class="math">${toHTML(it.prompt, { static: true })}</span>${it.choices ? `<span class="sc-ch">${it.choices.map((c, k) => `<span>${NUM[k]} ${toHTML(c, { static: true })}</span>`).join('')}</span>` : ''}</span>`).join(''));
  EXH.set(s.id, h);
  return h;
}
const KTAB = '이 아이 칸', LAZY = 9;

// ── 화면 ──
export function sheetView(root) {
  const C = (location.hash.match(/[?&]c=([A-Z0-9]{6})\b/) || [])[1] || '';
  const pre = ssGet(PRE); if (pre) ssDel(PRE);
  let cfg = norm(pre || ssGet(CUR)), q = '';
  let grp = cfg.kid && cfg.kid.pre.length ? KTAB : '전체';
  const keep = () => ssSet(CUR, cfg);
  keep();
  const hay = Object.fromEntries(SKILLS.map((s) => [s.id, [s.name, s.group, ...s.parts.flatMap((p) => [p.label, byId[p.c] ? byId[p.c].kid : '', byId[p.c] ? byId[p.c].name : ''])].join(' ').toLowerCase()]));
  const tabsOf = () => [...(cfg.kid && cfg.kid.pre.length ? [KTAB] : []), '전체', ...GROUPS];
  const selOf = (id) => cfg.sel.find((x) => x.id === id);
  const preOf = (id) => (cfg.kid ? cfg.kid.pre.find((x) => x.id === id) : null);
  const whyOf = (id) => { const x = selOf(id), p = preOf(id); return x && x.why.length ? x.why : p ? p.why : []; };
  let drawn = 0;
  const cardHTML = (s) => {
    const x = selOf(s.id), on = !!x, why = whyOf(s.id), now = EXH.has(s.id) || drawn++ < LAZY;
    return `<div class="sc${on ? ' on' : ''}" data-id="${s.id}"><button type="button" class="sc-main" aria-pressed="${on}"><span class="sc-h"><b>${esc(s.name)}</b><span class="sc-g" title="${esc(gLong(s))}">${esc(gText(s))}</span></span>${why.length ? `<span class="sc-why">${why.map((w) => `<span class="pill wy-${w}">${esc(WHY[w])}</span>`).join('')}</span>` : ''}${now ? `<span class="sc-ex">${exHTML(s)}</span>` : `<span class="sc-ex wait" data-ex="${s.id}"></span>`}</button>`
      + `<span class="sc-ok" aria-hidden="true">${icon('check', 18)}</span><div class="sc-n" role="group" aria-label="${esc(s.name)} 문제 수">${countsOf(s).map((n) => `<button type="button" data-cn="${n}" aria-pressed="${on && x.n === n}"${on ? '' : ' tabindex="-1"'}>${n}</button>`).join('')}<span>문제</span></div></div>`;
  };
  function listHTML() {
    drawn = 0;
    const w = q.trim().toLowerCase().split(/\s+/).filter(Boolean), hit = (s) => w.every((t) => hay[s.id].includes(t)), K = cfg.kid;
    const sec = (title, xs, note = '') => (xs.length ? `<h3>${title} <small>${xs.length}</small></h3>${note}<div class="sc-grid">${xs.map(cardHTML).join('')}</div>` : '');
    let out = '';
    const kidIds = K && (grp === KTAB || grp === '전체') ? K.pre.map((x) => x.id) : [];
    if (kidIds.length) {
      const first = K.pre.filter((x) => !K.more.includes(x.id)).map((x) => SKILL[x.id]).filter(hit), more = K.more.map((id) => SKILL[id]).filter(hit);
      out += sec(`${esc(K.label || '이 아이')}에게 찾은 기능`, first) + sec('더 있는 칸', more, '<p class="small muted sc-note">한 번에 여섯 기능까지 미리 골랐어요. 누르면 이 아이 칸 위주로 더해져요.</p>');
      if (grp === KTAB) return out || '<p class="muted">맞는 기능이 없어요. 다른 낱말로 찾아 보세요.</p>';
    }
    const xs = SKILLS.filter((s) => (grp === '전체' || s.group === grp) && hit(s) && !kidIds.includes(s.id));
    out += GROUPS.map((g) => sec(esc(g), xs.filter((s) => s.group === g))).join('');
    return out || '<p class="muted">맞는 기능이 없어요. 다른 낱말로 찾아 보세요.</p>';
  }
  const optHTML = (id, on, t) => `<label class="sh-opt${on ? ' on' : ''}"><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${t}</label>`;
  const sums = () => ({ total: cfg.sel.reduce((a, x) => a + x.n, 0), pages: cfg.sel.reduce((a, x) => a + Math.ceil(x.n / 10), 0) });
  function cartHTML() {
    let built = []; try { built = cfg.sel.length ? buildSheet(specOf(cfg)) : []; } catch (e) { built = []; }
    const { total, pages } = sums(), K = cfg.kid;
    const row = (x, i) => {
      const s = SKILL[x.id], sh = x.fw ? focusShares(s, x.focus) : null, sec = built[i], got = sec ? sec.items.length : x.n, traps = sec ? sec.items.filter((it) => it.trap).length : 0;
      const pt = partsText(s, x.n, sh), mis = [...new Set(Object.values(x.want))].map((id) => misById[id]).filter(Boolean), canF = !!focusShares(s, x.focus);
      const extra = [whyOf(x.id).map((w) => `<span class="pill wy-${w}">${esc(WHY[w])}</span>`).join(''),
        canF ? `<label class="sh-opt sm${x.fw ? ' on' : ''}"><input type="checkbox" data-fw="${i}"${x.fw ? ' checked' : ''}> 이 아이 칸 위주</label>` : '',
        mis.length ? `<label class="sh-opt sm${x.tw ? ' on' : ''}"><input type="checkbox" data-tw="${i}"${x.tw ? ' checked' : ''}> 틀린 방법을 겨눈 문항 섞기</label>${x.tw ? `<span class="ss-trap">이 생각을 겨눈 문항 ${traps}개</span>` : ''}<span class="small muted">${mis.map((m) => esc(m.title)).join(' · ')}</span>` : '',
        got < x.n ? `<span class="ss-warn">겹치지 않는 문제가 ${got}개만 나와요</span>` : ''].filter(Boolean).join('');
      return `<li><span class="no">${i + 1}</span><div class="ss-b"><b>${esc(s.name)}</b>${pt ? `<span class="small muted">${esc(pt)}</span>` : ''}</div>
        <div class="ss-c"><select class="sel" data-n="${i}" aria-label="${esc(s.name)} 문제 수">${countsOf(s).map((n) => `<option value="${n}"${n === x.n ? ' selected' : ''}>${n}문제</option>`).join('')}</select><button type="button" data-up="${i}" aria-label="위로"${i ? '' : ' disabled'}>↑</button><button type="button" data-dn="${i}" aria-label="아래로"${i < cfg.sel.length - 1 ? '' : ' disabled'}>↓</button><button type="button" data-rm="${i}">빼기</button></div>
        ${extra ? `<div class="ss-x">${extra}</div>` : ''}</li>`;
    };
    const saved = lsGet(SAVED, []) || [];
    return `<h2>고른 기능</h2>
      <p class="sh-sum" aria-live="polite">${cfg.sel.length ? `모두 <b>${total}</b>문제 · <b>${pages}</b>쪽${cfg.key ? '<span> + 정답</span>' : ''}` : '<span>아직 고른 기능이 없어요</span>'}</p>
      ${K ? `<div class="panel sh-kid"><b>${esc(K.label || '이 아이')}</b> — ${K.none ? '아직 배울 것 · 막힌 칸 · 흔들리는 칸이 없어요. 카드를 눌러 골라 주세요.' : '아이 자세히에서 배울 것 · 막힌 칸 · 흔들리는 칸을 기능으로 찾아 미리 골라 두었어요. 기능마다 그 아이 칸 위주로 10문제예요.'}${K.chkWhy ? `<br><span class="small">${esc(K.chkWhy)} — 확인 동그라미를 켜 두었어요.</span>` : ''}${K.more.length ? `<br><span class="small muted">더 있는 칸 ${K.more.length}개(${K.more.map((id) => esc(SKILL[id].name)).join(', ')})는 '${KTAB}' 탭 아래쪽에 있어요 — 한 번에 여섯 기능까지 골랐어요.</span>` : ''}</div>` : ''}
      <div class="field sh-who"><label for="swho">종이에 쓸 이름</label><input id="swho" maxlength="24" value="${esc(cfg.who)}" placeholder="아이 번호나 별명 (예: 3번)" autocomplete="off"><span class="small muted">이 기기에만 두고 서버로 보내지 않아요.</span></div>
      ${cfg.sel.length ? `<ol class="sh-sel">${cfg.sel.map(row).join('')}</ol>` : '<p class="muted sh-empty">카드를 눌러 기능을 골라 주세요. 고른 차례대로 종이가 한 쪽씩 나와요.</p>'}
      <div class="sh-opts">${optHTML('o-chk', cfg.chk, '확인 동그라미')}${optHTML('o-ex', cfg.ex, '보기')}${optHTML('o-key', cfg.key, '정답 쪽')}</div>
      <p class="small muted sh-tip">확인 동그라미는 문제마다 ○를 두고, 다 풀면 거꾸로 계산해서 확인해 ✓ 하게 해요(실수 · 찍기가 잦은 아이).</p>
      <div class="acts"><button type="button" class="pri big" id="go"${cfg.sel.length ? '' : ' disabled'}>미리 보기 · 인쇄</button><button type="button" class="teal" id="again"${cfg.sel.length ? '' : ' disabled'}>같은 설정으로 다른 문제</button></div>
      <p class="small muted">문제 묶음 번호 <b>${cfg.seed}</b> — 같은 번호면 같은 문제가 나와요. 새 탭에서 Ctrl+P로 인쇄해요(여백 '없음' · 배경 그래픽 켜기).</p>
      <div class="acts sub"><button type="button" id="clear"${cfg.sel.length || cfg.kid ? '' : ' disabled'}>처음부터</button></div>
      <h3>자주 쓰는 설정 <small>이 기기에만</small></h3>
      <div class="sh-save"><input id="sname" maxlength="30" placeholder="설정 이름 (예: 3번 받아내림)" autocomplete="off"><button type="button" id="save"${cfg.sel.length ? '' : ' disabled'}>지금 설정 저장</button></div>
      <p class="qmsg tight" id="smsg" role="status"></p>
      ${saved.length ? `<ul class="sh-saved">${saved.map((x, i) => `<li><div><b>${esc(x.name)}</b><span class="small muted">${esc((x.cfg && x.cfg.sel || []).filter((y) => SKILL[y.id]).map((y) => SKILL[y.id].name).slice(0, 3).join(' · '))}${(x.cfg && x.cfg.sel || []).length > 3 ? ' …' : ''} · ${new Date(x.t).toLocaleDateString('ko-KR')}</span></div><button type="button" data-load="${i}">불러오기</button><button type="button" class="mini" data-del="${i}">지우기</button></li>`).join('')}</ul>` : '<p class="small muted">저장한 설정이 없어요.</p>'}`;
  }
  const tabsHTML = () => tabsOf().map((g) => `<button type="button" data-g="${esc(g)}" aria-pressed="${g === grp}">${esc(g)}</button>`).join('');
  function render() {
    root.innerHTML = `<div class="sh"><div class="sh-grid">
      <section class="card sh-pick" aria-label="기능 고르기"><div class="sh-h">${mascot('point', 52)}<div><h2>맞춤 연습지</h2><p class="intro">카드를 누르면 골라지고, 다시 누르면 빠져요. 카드의 예시 둘은 그 기능의 쉬운 문제와 어려운 문제예요. 고른 차례대로 한 쪽씩 나오고 끝에 정답 쪽이 붙어요. 학기는 이 화면에만 보이고 종이엔 나오지 않아요.</p></div></div>
        <div class="acts sub">${C ? `<a class="btn" href="#/t/c/${C}">반 보기로</a>` : ''}<a class="btn" href="#/t">선생님 처음 화면</a></div>
        <div class="sh-tools"><input id="q" type="search" value="${esc(q)}" placeholder="찾기 (예: 받아내림, 곱셈구구, 분수)" aria-label="기능 찾기" autocomplete="off"></div>
        <div class="sh-tabs" role="group" aria-label="갈래">${tabsHTML()}</div>
        <div id="shl" class="sh-list">${listHTML()}</div>
        <div class="sh-dock" id="dock" hidden></div></section>
      <section class="card sh-cart" id="cart" aria-label="고른 기능">${cartHTML()}</section></div></div>`;
  }
  /* 좁은 화면(카드 아래에 판이 옴) — 고른 것이 있으면 아래에 붙는 띠: 모두 n문제 · n쪽 + 판으로 */
  const paintDock = () => { const d = root.querySelector('#dock'); if (!d) return; const { total, pages } = sums(); d.hidden = !cfg.sel.length;
    d.innerHTML = cfg.sel.length ? `<span class="sd-t">${icon('check', 18)}<span><span class="sd-k">기능 <b>${cfg.sel.length}</b>개 · </span>모두 <b>${total}</b>문제 · <b>${pages}</b>쪽</span></span><button type="button" class="teal" id="tocart">고른 기능 보기</button>` : ''; };
  const redrawCart = () => { const el = root.querySelector('#cart'); if (!el) return; const y = el.scrollTop; el.innerHTML = cartHTML(); el.scrollTop = y; paintDock(); };
  /* 아직 안 그린 예시 — 화면 가까이(아래로 900px 안) 오면 채움 · IntersectionObserver가 없으면 바로 다 채움 */
  let io = null;
  const fill = (el) => { const s = SKILL[el.dataset.ex]; if (!s) return; el.innerHTML = exHTML(s); el.classList.remove('wait'); el.removeAttribute('data-ex'); };
  const watch = () => {
    if (io) io.disconnect();
    const xs = root.querySelectorAll('[data-ex]'); if (!xs.length) return;
    if (typeof IntersectionObserver !== 'function') { xs.forEach(fill); return; }
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } }), { rootMargin: '300px 0px 900px 0px' });
    xs.forEach((el) => io.observe(el));
  };
  const redrawList = () => { root.querySelector('#shl').innerHTML = listHTML(); root.querySelector('.sh-tabs').innerHTML = tabsHTML(); watch(); };
  /* 카드 하나만 다시 칠함(고름 · 문제 수) — 키보드 초점이 그대로 남게 */
  const paintCard = (id) => root.querySelectorAll(`.sc[data-id="${id}"]`).forEach((el) => {
    const x = selOf(id), on = !!x;
    el.classList.toggle('on', on); el.querySelector('.sc-main').setAttribute('aria-pressed', String(on));
    el.querySelectorAll('[data-cn]').forEach((b) => { b.setAttribute('aria-pressed', String(on && x.n === Number(b.dataset.cn))); if (on) b.removeAttribute('tabindex'); else b.setAttribute('tabindex', '-1'); });
  });
  const changed = () => { keep(); redrawCart(); };
  const add = (id, n) => { const p = preOf(id), x = normSel({ ...(p ? JSON.parse(JSON.stringify(p)) : { id }), n }); cfg.sel.push(x); };
  const toggle = (id) => { const i = cfg.sel.findIndex((x) => x.id === id); if (i >= 0) cfg.sel.splice(i, 1); else add(id, 10); paintCard(id); changed(); };
  const setN = (id, n) => { const x = selOf(id); if (x) x.n = n; else add(id, n); paintCard(id); changed(); };
  const open = () => { window.open(paperURL(cfg), '_blank'); };
  render(); paintDock(); watch();
  const W = root.querySelector('.sh');
  W.addEventListener('click', (e) => {
    const card = e.target.closest('.sc');
    if (card) { const cn = e.target.closest('[data-cn]'); if (cn) setN(card.dataset.id, Number(cn.dataset.cn)); else toggle(card.dataset.id); return; }
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.g) { if (d.g === grp) return; grp = d.g; redrawList(); return; }
    if (b.id === 'tocart') { root.querySelector('#cart').scrollIntoView({ block: 'start' }); return; }
    if (d.up != null || d.dn != null) { const i = Number(d.up ?? d.dn), j = d.up != null ? i - 1 : i + 1; if (j < 0 || j >= cfg.sel.length) return; [cfg.sel[i], cfg.sel[j]] = [cfg.sel[j], cfg.sel[i]]; changed(); return; }
    if (d.rm != null) { const [x] = cfg.sel.splice(Number(d.rm), 1); changed(); if (x) paintCard(x.id); return; }
    if (d.load != null) { const x = (lsGet(SAVED, []) || [])[Number(d.load)]; if (!x) return; cfg = norm({ ...x.cfg, kid: null }); if (grp === KTAB) grp = '전체'; keep(); redrawCart(); redrawList(); root.querySelector('#smsg').textContent = `'${x.name}' 설정을 불러왔어요.`; return; }
    if (d.del != null) { const xs = lsGet(SAVED, []) || [], x = xs[Number(d.del)]; if (!x || !confirm(`'${x.name}' 설정을 지울까요?`)) return; xs.splice(Number(d.del), 1); lsSet(SAVED, xs); redrawCart(); root.querySelector('#smsg').textContent = `'${x.name}' 설정을 지웠어요.`; return; }
    if (b.id === 'go') { open(); return; }
    if (b.id === 'again') { cfg.seed = newSeed(); changed(); open(); return; }
    if (b.id === 'clear') { cfg = blank(); if (grp === KTAB) grp = '전체'; keep(); redrawCart(); redrawList(); return; }
    if (b.id === 'save') {
      const inp = root.querySelector('#sname'), name = inp.value.trim().slice(0, 30), msg = root.querySelector('#smsg');
      if (!name) { msg.textContent = '설정 이름을 써 주세요.'; inp.focus(); return; }
      const xs = (lsGet(SAVED, []) || []).filter((x) => x && x.name !== name), { kid, ...rest } = cfg;
      xs.unshift({ name, t: Date.now(), cfg: JSON.parse(JSON.stringify(rest)) }); lsSet(SAVED, xs.slice(0, 30));
      redrawCart(); root.querySelector('#smsg').textContent = `'${name}' 설정을 이 기기에 저장했어요.`;
    }
  });
  W.addEventListener('change', (e) => {
    const t = e.target, d = t.dataset;
    if (d.n != null) { const x = cfg.sel[Number(d.n)]; x.n = Number(t.value); changed(); paintCard(x.id); return; }
    if (d.fw != null) { cfg.sel[Number(d.fw)].fw = t.checked; changed(); return; }
    if (d.tw != null) { cfg.sel[Number(d.tw)].tw = t.checked; changed(); return; }
    const opt = { 'o-chk': 'chk', 'o-ex': 'ex', 'o-key': 'key' }[t.id];
    if (opt) { cfg[opt] = t.checked; changed(); }
  });
  W.addEventListener('input', (e) => {
    if (e.target.id === 'q') { q = e.target.value; if (q.trim() && grp !== '전체' && grp !== KTAB) grp = '전체'; redrawList(); return; }
    if (e.target.id === 'swho') { cfg.who = e.target.value.slice(0, 24); keep(); }
  });
  /* 누름 손맛 — 카드는 칩을 뺀 곳을 누를 때 카드째 3px 내려감(마우스 · 터치 · 펜 모두 · 칩은 단추 규칙 그대로) · 고르는 칸(label)은 터치 · 펜일 때 .press */
  let held = null, heldAt = 0;
  const unhold = () => { const el = held; if (!el) return; held = null; setTimeout(() => el.classList.remove('press'), Math.max(0, 120 - (Date.now() - heldAt))); };
  W.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.sc');
    if (card && !e.target.closest('[data-cn]')) { held = card; heldAt = Date.now(); card.classList.add('press'); return; }
    if (e.pointerType === 'mouse') return; const el = e.target.closest('.sh-opt'); if (!el) return; el.classList.add('press'); setTimeout(() => el.classList.remove('press'), 140);
  }, { passive: true });
  const UP = ['pointerup', 'pointercancel'];
  UP.forEach((t) => addEventListener(t, unhold, { passive: true }));
  return () => { UP.forEach((t) => removeEventListener(t, unhold)); if (io) io.disconnect(); };
}
