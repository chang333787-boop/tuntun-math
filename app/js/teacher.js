// 선생님 화면 — 반 만들기 · 카드 · 반 한눈 보기(오늘 단원 · 묶음 제안 · 먼저 볼 아이) · 아이 자세히 · 10분 소집단 카드
//  근거: 중심은 교사 화면 [A-R27][B-R19][B-R20] · 묶음은 제안만, 교사가 확인 [D-34] · 원인은 '한 번 보임'과 '되풀이됨'을 가름 [A-R11][A-R12]
//  이름은 이 기기에만(서버엔 번호만) · 선생님 열쇠를 잃으면 반 기록을 열 수 없음(카드로 보관)
import { byId, UNITS, unitById, gradeIdx, GRADES } from '../../engine/lessons/index.js';
import { LES, lessonName, pickItems } from '../../paper/js/gen.js';
import { kidReport, bugName, ST } from '../../paper/js/judge.js';
import { mascot } from '../../paper/js/mascot.js';
import { rng } from '../../engine/math.js';
import * as db from './db.js';
import * as KS from './kidstore.js';
import { prepPlan } from './prep.js';
import { stepsOf, hintOf } from './fix.js';
import { lsGet, lsSet, esc, rand, KEY_AL } from './local.js';
import { stepHTML, staticHTML } from './item.js';
import { modelHTML } from './model.js';
import { go, unitLabel } from './kid.js';

const TK = 'tt.t';
const tget = () => lsGet(TK, { classes: {} });
const tset = (x) => lsSet(TK, x);
const cls = (C) => tget().classes[C];
const say = (pose, html) => `<div class="say">${mascot(pose, 60)}<div class="bub">${html}</div></div>`;
const gl = (g) => g.replace(/^(\d)-(\d)$/, '$1학년 $2학기');
const appURL = () => location.origin + location.pathname;
const nm = (K, no) => (K.names && K.names[no] ? `${no} ${K.names[no]}` : `${no}번`);
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);

export function teacherHome(root) {
  const T = tget(), list = Object.entries(T.classes);
  root.innerHTML = `<div class="card">${say('hi', '선생님, 반을 만들면 아이마다 <b>번호 카드</b>(반 코드 · 번호 · 핀)가 나와요. 아이 이름은 서버에 보내지 않아요.')}
    ${list.length ? `<table class="list"><tr><th>반 코드</th><th>학기</th><th>아이</th><th></th></tr>${list.map(([C, x]) => `<tr><td><b>${esc(C)}</b></td><td>${esc(gl(x.g))}</td><td>${x.n}명</td><td><a class="btn teal" href="#/t/c/${C}">열기</a></td></tr>`).join('')}</table>` : '<p class="muted">이 기기에 연 반이 없어요.</p>'}
    <div class="acts"><a class="btn pri" href="#/t/new">새 반 만들기</a><a class="btn" href="#/t/open">다른 기기에서 만든 반 열기</a></div></div>
    <div class="card"><h2>이 앱이 하는 일 <small>근거: docs/evidence.md</small></h2>
    <ol><li>선생님이 <b>오늘 단원</b>을 열면, 아이마다 그 단원에 꼭 필요한 아래 칸만 5~10분 점검해요(바로 아래 칸부터 · 막히면 반씩 갈라 좁힘).</li>
    <li>고칠 판자가 나온 아이는 바로 <b>판자 고치기</b>(시범 → 함께 → 혼자 → 새 숫자로 확인) 한 바퀴 하고 오늘 수업으로 돌아가요. 아래를 다 메울 때까지 붙잡지 않아요.</li>
    <li>선생님 화면엔 칸 × 아이 표, 같은 칸에 몰린 아이 묶음 제안, '자신 있었는데 틀린' 아이, 먼저 봐 줄 아이가 떠요.</li>
    <li>고친 판자는 1 · 3 · 7일 뒤 섞어서 다시 봐요.</li></ol></div>`;
}

export function newClassView(root) {
  const zz = /zz=1/.test(location.hash);
  root.innerHTML = `<div class="card"><h2>새 반 만들기</h2>
    <div class="field"><label for="g">우리 반 학기</label><select id="g">${GRADES.map((g) => `<option value="${g}" ${g === '4-2' ? 'selected' : ''}>${gl(g)}</option>`).join('')}</select></div>
    <div class="field"><label for="n">아이 수(번호 1번부터)</label><input id="n" inputmode="numeric" value="25" maxlength="3"></div>
    ${zz ? '<p class="warn small">시험 반(ZZ) — 시험이 끝나면 지워요.</p>' : ''}
    <p class="qmsg" id="msg"></p><button class="pri big" id="mk">만들기</button></div>`;
  root.querySelector('#mk').addEventListener('click', async () => {
    const g = root.querySelector('#g').value, n = Math.max(1, Math.min(200, Number(root.querySelector('#n').value) || 0));
    const msg = root.querySelector('#msg'); msg.textContent = '만드는 중…';
    for (let tries = 0; tries < 5; tries++) {
      const C = (zz ? 'ZZ' + rand(4) : rand(6)), T = rand(24, KEY_AL);
      if (!zz && C.startsWith('ZZ')) continue;
      const pins = {}; for (let i = 1; i <= n; i++) pins[i] = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const up = { [`cown/${C}`]: T, [`tc/${C}/${T}/info`]: db.enc({ g, n, made: Date.now() }) };
      for (const [no, p] of Object.entries(pins)) up[`tc/${C}/${T}/pins/${no}`] = p;
      try { await db.patch('', up); } catch (e) { if (e.status === 401) continue; msg.textContent = `만들지 못했어요: ${e.message}`; return; }
      const X = tget(); X.classes[C] = { T, g, n, pins, names: {}, made: Date.now() }; tset(X);
      return go(`#/t/c/${C}/cards`);
    }
    msg.textContent = '반 코드가 자꾸 겹쳐요. 다시 눌러 주세요.';
  });
}

export function openClassView(root) {
  root.innerHTML = `<div class="card"><h2>다른 기기에서 만든 반 열기</h2><p class="muted small">반을 만들 때 나온 <b>선생님 열쇠 카드</b>를 보고 써요.</p>
    <div class="field"><label for="c">반 코드</label><input id="c" maxlength="6" autocapitalize="characters"></div>
    <div class="field"><label for="k">선생님 열쇠(24자)</label><input id="k" maxlength="24" style="max-width:420px;font-size:18px"></div>
    <p class="qmsg" id="msg"></p><button class="pri" id="o">열기</button></div>`;
  root.querySelector('#o').addEventListener('click', async () => {
    const C = root.querySelector('#c').value.trim().toUpperCase(), T = root.querySelector('#k').value.trim(), msg = root.querySelector('#msg');
    try {
      const x = await db.get(`tc/${C}/${T}`);
      if (!x) throw new Error('없는 반이에요');
      const info = db.dec(x.info) || {};
      const X = tget(); X.classes[C] = { T, g: info.g, n: info.n, pins: x.pins || {}, names: (X.classes[C] || {}).names || {}, made: info.made }; tset(X);
      go(`#/t/c/${C}`);
    } catch (e) { msg.textContent = e.status === 401 ? '반 코드나 열쇠가 맞지 않아요' : e.message; }
  });
}

export function cardsView(root, C) {
  const K = cls(C); if (!K) return go('#/t');
  const url = appURL();
  root.innerHTML = `<div class="card no-print"><h2>카드 인쇄 <small>${esc(C)} · ${esc(gl(K.g))} · ${K.n}명</small></h2>
    <p>아이 카드를 잘라 나눠 주세요(이름은 카드에 손으로). <b>선생님 열쇠 카드</b>는 따로 보관해요 — 잃어버리면 이 반 기록을 다른 기기에서 열 수 없어요.</p>
    <div class="acts"><button class="pri" onclick="print()">인쇄</button><a class="btn" href="#/t/c/${C}">반 보기로</a></div></div>
    <div class="card" style="border:2px solid var(--ink)"><h2>선생님 열쇠 카드 <small>남에게 보이지 마세요</small></h2>
      <p>반 코드 <b style="font-size:22px;letter-spacing:.08em">${esc(C)}</b> · 선생님 열쇠 <code style="font-size:18px">${esc(K.T)}</code></p>
      <p class="small muted">${esc(url)}#/t/open 에서 이 둘을 쓰면 다른 기기에서도 반을 열 수 있어요.</p></div>
    <div class="cards">${Array.from({ length: K.n }, (_, i) => i + 1).map((no) => `<div class="kcard"><div style="display:flex;gap:8px;align-items:center">${mascot('hi', 40)}<b>튼튼 수 다리</b></div>
      <p style="margin:6px 0 0">반 코드 <span class="code">${esc(C)}</span></p><p style="margin:0">번호 <span class="no">${no}</span> · 핀 <span class="code">${esc(K.pins[no] || '')}</span></p>
      <p class="small muted" style="margin:4px 0 0;word-break:break-all">${esc(url)}</p><p class="small" style="margin:6px 0 0">이름: ____________</p></div>`).join('')}</div>`;
}

export function namesView(root, C) {
  const K = cls(C); if (!K) return go('#/t');
  root.innerHTML = `<div class="card"><h2>이름 적기 <small>이 기기에만 저장 · 서버로 가지 않아요</small></h2>
    <div class="grid2">${Array.from({ length: K.n }, (_, i) => i + 1).map((no) => `<label class="field" style="flex-direction:row;align-items:center;gap:8px;margin:2px 0"><b style="min-width:36px">${no}</b><input data-no="${no}" value="${esc(K.names[no] || '')}" style="font-size:16px;letter-spacing:0"></label>`).join('')}</div>
    <div class="acts"><button class="pri" id="sv">저장</button><a class="btn" href="#/t/c/${C}">반 보기로</a></div></div>`;
  root.querySelector('#sv').addEventListener('click', () => { const X = tget(); root.querySelectorAll('[data-no]').forEach((i) => { const v = i.value.trim(); if (v) X.classes[C].names[i.dataset.no] = v; else delete X.classes[C].names[i.dataset.no]; }); tset(X); go(`#/t/c/${C}`); });
}

// 아이가 쓴 요약은 믿지 않고 모양을 맞춰 읽는다(한 아이의 이상한 값이 반 화면 전체를 멈추지 않게)
const arr = (x) => (Array.isArray(x) ? x.filter((c) => typeof c === 'string' && LES(c)) : []);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
function normSt(st) {
  if (!st || typeof st !== 'object') return null;
  const L = {}; for (const [c, v] of Object.entries(obj(st.L))) if (LES(c) && typeof v === 'string' && ST[v]) L[c] = v;
  const num = (o) => Object.fromEntries(Object.entries(obj(o)).filter(([c, v]) => LES(c) && Number.isFinite(Number(v))).map(([c, v]) => [c, Number(v)]));
  return { L, start: arr(st.start), below: arr(st.below), under: arr(st.under), sw: num(st.sw), fixed: num(st.fixed), help: num(st.help), due: arr(st.due), t: Number(st.t) || 0, last: Number(st.last) || 0, cal: obj(st.cal), rush: Number(st.rush) || 0 };
}
const normNow = (n) => (n && typeof n === 'object' ? { mode: String(n.mode || ''), c: typeof n.c === 'string' ? n.c : '', n: Number(n.n) || 0, t: Number(n.t) || 0 } : null);
// 아이 요약 모으기(8개씩 동시에) — 열린 연결 없이 짧은 요청만
async function pullAll(C, K) {
  const nos = Array.from({ length: K.n }, (_, i) => String(i + 1)), out = {};
  for (let i = 0; i < nos.length; i += 8) {
    await Promise.all(nos.slice(i, i + 8).map(async (no) => {
      const base = `k/${C}/${no}/${K.pins[no]}`;
      try { const [st, now] = await Promise.all([db.get(`${base}/st`), db.get(`${base}/now`)]); out[no] = { st: normSt(db.dec(st)), now: normNow(db.dec(now)) }; } catch (e) { out[no] = { err: true }; }
    }));
  }
  return out;
}
const CELL = { ok: ['c-ok', '✓'], pass: ['c-pass', '✓'], near: ['c-near', '○'], shaky: ['c-shaky', '△'], stuck: ['c-stuck', '✕'], need: ['c-need', '?'], none: ['c-none', '·'] };

export function classView(root, C) {
  const K = cls(C); if (!K) return go('#/t');
  let unit = (K.today && K.today.unit) || UNITS.find((u) => u.g === K.g && prepPlan(u.id).fringe.length)?.id || '4-2-1';
  let data = null, timer = null, alive = true;
  const units = UNITS.filter((u) => prepPlan(u.id).fringe.length && gradeIdx(u.g) <= gradeIdx(K.g) + 1);
  function render() {
    const P = prepPlan(unit);
    const rows = Array.from({ length: K.n }, (_, i) => String(i + 1));
    const S = data || {};
    // 열 = 준비 칸 + 아이들이 막혔거나 고친 아래 칸(이 단원 아래에 있는 것만)
    const extra = new Set();
    rows.forEach((no) => { const st = S[no] && S[no].st; if (!st) return; [...st.start, ...st.below, ...st.under, ...Object.keys(st.fixed || {}), ...Object.entries(st.L).filter(([, v]) => v === 'stuck' || v === 'shaky').map(([c]) => c)].forEach((c) => { if (P.below.includes(c)) extra.add(c); }); });
    const cols = [...new Set([...P.pre, ...extra])].filter((c) => LES(c)).sort(byGrade);
    // 묶음 제안 — 같은 '고칠 판자'끼리(둘 이상)
    const groups = {};
    rows.forEach((no) => { const st = S[no] && S[no].st; if (st) st.start.forEach((c) => (groups[c] = groups[c] || []).push(no)); });
    const glist = Object.entries(groups).filter(([, v]) => v.length >= 2).sort((a, b) => b[1].length - a[1].length);
    // 먼저 볼 아이 — 고치기를 해도 흔들림 · 막힌 칸이 많음(깊은 결손 — 자동 처방보다 선생님 먼저 [A-R27]) · 자신 있었는데 틀림 [D-1]
    const first = rows.map((no) => { const st = S[no] && S[no].st; if (!st) return null; const why = []; const help = Object.keys(st.help || {}); if (help.length) why.push(`고치기 뒤에도 흔들림: ${help.map(lessonName).join(', ')}`); const deep = st.start.length + st.under.length; if (deep >= 4) why.push(`막힌 칸 ${deep}개`); const sw = Object.values(st.sw || {}).reduce((a, b) => a + b, 0); if (sw >= 3) why.push(`자신 있었는데 틀림 ${sw}문제`); if (st.rush >= 2) why.push(`빨리 넘김(2초 안 찍기) ${st.rush}번 — 결과를 그대로 믿기 어려워요`); return why.length ? { no, why } : null; }).filter(Boolean);
    const seen = rows.filter((no) => S[no] && S[no].st).length;
    root.innerHTML = `<div class="card no-print"><h2>${esc(C)} <small>${esc(gl(K.g))} · ${K.n}명 · 기록 있는 아이 ${seen}명</small></h2>
      <div class="acts"><select id="u" style="font:inherit;padding:8px;border-radius:10px">${units.map((u) => `<option value="${u.id}" ${u.id === unit ? 'selected' : ''}>${esc(gl(u.g))} · ${esc(u.nm)}</option>`).join('')}</select>
      <button class="pri" id="open">이 단원을 오늘 단원으로 열기</button><button id="re">새로 보기</button>
      <a class="btn" href="#/t/c/${C}/cards">카드</a><a class="btn" href="#/t/c/${C}/names">이름 적기</a></div>
      ${K.today ? `<p class="small">오늘 단원: <b>${esc(unitLabel(K.today.unit))}</b> (${new Date(K.today.t).toLocaleString('ko-KR')}에 열었어요) — 아이 화면 맨 위에 '오늘 단원 준비하기'가 떠요.</p>` : '<p class="small muted">단원을 열면 아이 화면 맨 위에 \'오늘 단원 준비하기\'가 떠요. 아이 주소: ' + esc(appURL()) + '</p>'}
      <p class="qmsg" id="msg"></p></div>
    ${first.length ? `<div class="card"><h2>먼저 봐 줄 아이 <small>앱보다 선생님이 먼저</small></h2><ul>${first.map((x) => `<li><a href="#/t/c/${C}/k/${x.no}">${esc(nm(K, x.no))}</a> — ${x.why.map(esc).join(' · ')}</li>`).join('')}</ul></div>` : ''}
    <div class="card"><h2>묶어 가르치기 제안 <small>같은 판자를 고칠 아이 · 넣고 뺄지는 선생님이</small></h2>
      ${glist.length ? `<div class="groups">${glist.map(([c, nos]) => `<div class="grp"><b>${esc(lessonName(c))}</b><span class="muted small">${nos.map((no) => esc(nm(K, no))).join(', ')}</span><div class="acts"><a class="btn teal" href="#/t/c/${C}/g/${encodeURIComponent(c)}">10분 소집단 카드</a></div></div>`).join('')}</div>` : '<p class="muted">아직 같은 판자에 둘 이상 몰린 곳이 없어요.</p>'}</div>
    <div class="card"><h2>${esc(unitLabel(unit))}로 가는 칸 × 아이</h2>
      <p class="small muted">✓ 확인 · 관문 통과 · ○ 거의 · △ 흔들림 · ✕ 막힘 · ★ 고칠 판자(여기서부터) · ? 자세히 볼 것 · · 안 봄 — 회색 이름 칸은 준비 칸보다 더 아래(아이가 막혔거나 고친 곳)</p>
      <div class="ctab"><table><tr><th class="l">아이</th>${cols.map((c) => `<th class="v${P.pre.includes(c) ? '' : ' lo'}" title="${esc(lessonName(c))}"><span>${esc((byId[c] && byId[c].name) || lessonName(c))}</span></th>`).join('')}<th>고칠 판자</th><th>자신 있었는데 틀림</th><th>지금</th></tr>
      ${rows.map((no) => { const x = S[no] || {}, st = x.st; const sw = st ? Object.values(st.sw || {}).reduce((a, b) => a + b, 0) : 0;
        return `<tr><td class="l"><a href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a></td>${cols.map((c) => { if (!st) return '<td class="c-none">·</td>'; const s = st.start.includes(c) ? ['c-start', '★'] : CELL[st.L[c] || 'none']; return `<td class="${s[0]}" title="${esc(lessonName(c))} — ${esc(ST[st.L[c] || 'none'])}">${s[1]}</td>`; }).join('')}
        <td style="text-align:left">${st ? st.start.slice(0, 3).map((c) => esc(lessonName(c))).join(', ') : ''}</td><td>${sw || ''}</td><td class="small">${nowText(x.now)}</td></tr>`; }).join('')}</table></div>
      <p class="small muted">${data ? '15초마다 새로 봐요(이 화면이 열려 있을 때만).' : '불러오는 중…'}</p></div>`;
    root.querySelector('#u').addEventListener('change', (e) => { unit = e.target.value; render(); });
    root.querySelector('#re').addEventListener('click', refresh);
    root.querySelector('#open').addEventListener('click', openToday);
  }
  async function openToday() {
    const msg = root.querySelector('#msg'); msg.textContent = '여는 중…';
    const t = Date.now(), id = `prep${new Date(t).toISOString().slice(0, 10).replace(/-/g, '')}`, up = {};
    for (let no = 1; no <= K.n; no++) up[`k/${C}/${no}/${K.pins[no]}/in/${id}`] = db.enc({ kind: 'prep', unit, t });
    up[`tc/${C}/${K.T}/live`] = db.enc({ unit, t });
    try { await db.patch('', up); const X = tget(); X.classes[C].today = { unit, t }; tset(X); Object.assign(K, X.classes[C]); render(); root.querySelector('#msg').textContent = '열었어요! 아이들이 새로고침하면 맨 위에 떠요.'; }
    catch (e) { msg.textContent = `열지 못했어요: ${e.message}`; }
  }
  async function refresh() { if (!alive) return; data = await pullAll(C, K); if (alive) render(); }
  render(); refresh();
  timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
  return () => { alive = false; clearInterval(timer); };
}
function nowText(n) {
  if (!n || !n.t) return '';
  const m = Math.round((Date.now() - n.t) / 60000);
  if (m > 20) return '';
  return n.mode === 'prep' ? `준비 다리 ${n.n || 0}문제` : n.mode === 'fix' ? `고치는 중: ${esc(lessonName(n.c))}` : '';
}

// 아이 자세히 — 종이와 같은 판정 · 원인은 '한 번 보임'(가설) / '되풀이됨'(서로 다른 문항 둘 이상) [A-R11][A-R12]
export async function kidDetailView(root, C, no) {
  const K = cls(C); if (!K) return go('#/t');
  root.innerHTML = '<div class="card">불러오는 중…</div>';
  let raw = null; try { raw = await db.get(`k/${C}/${no}/${K.pins[no]}`); } catch (e) { root.innerHTML = `<div class="card warn">불러오지 못했어요: ${esc(e.message)}</div>`; return; }
  const KK = { recs: {}, rv: {}, fixed: {} };
  if (raw && raw.r) for (const [id, s] of Object.entries(raw.r)) { const o = db.dec(s); if (o) KK.recs[id] = o; }
  const st = raw && raw.st ? normSt(db.dec(raw.st)) : null;
  const rv = obj(raw && raw.rv ? db.dec(raw.rv) : null);
  const rep = KS.reportOf(KK), cal = KS.calOf(KK);
  const why = (c) => { const x = rep.L[c]; if (!x || !x.why) return ''; const a = x.why.sure.map((h) => `<span class="pill" style="border-color:#b4482b">되풀이됨: ${esc(bugName(h.id))} (${h.ev.length}문항)</span>`), b = x.why.maybe.map((h) => `<span class="pill">한 번 보임: ${esc(bugName(h.id))}</span>`); return [...a, ...b].join(' '); };
  const line = (c, extra = '') => `<li><b>${esc(lessonName(c))}</b> <span class="muted small">${esc(gl(LES(c).g))}</span> ${rep.L[c] ? `<span class="small">${rep.L[c].ok}/${rep.L[c].tot}</span>` : ''} ${why(c)} ${extra}</li>`;
  const recs = Object.values(KK.recs).sort((a, b) => b.s.made - a.s.made);
  root.innerHTML = `<div class="card"><h2>${esc(nm(K, no))} <small>${recs.length}묶음 · ${recs.reduce((n, x) => n + x.s.it.length, 0)}문항</small></h2>
    <div class="acts no-print"><a class="btn" href="#/t/c/${C}">반 보기로</a><button onclick="print()">인쇄</button></div>
    <h3>고칠 판자(여기서부터)</h3>${rep.start.length ? `<ul>${rep.start.map((s) => line(s.c)).join('')}</ul>` : '<p class="muted">없음</p>'}
    ${rep.below.length ? `<h3>아래 먼저 확인</h3><ul>${rep.below.map((b) => line(b.c, `<span class="small muted">— 아직 안 본 아래 칸: ${b.check.map((x) => esc(lessonName(x))).join(', ')}</span>`)).join('')}</ul>` : ''}
    ${rep.under.length ? `<h3>아래 칸 때문일 수도</h3><ul>${rep.under.map((u) => line(u.c, `<span class="small muted">← ${u.because.map((x) => esc(lessonName(x))).join(', ')}</span>`)).join('')}</ul>` : ''}
    <h3>자신감 견주기</h3><p>${cal.n ? `짐작이 결과와 맞은 정도 <b>${Math.round(cal.match * 100)}%</b>(${cal.n}문항) · 자신 있었는데 틀림: ${Object.entries(cal.sureWrong).map(([c, n]) => `${esc(lessonName(c))} ${n}`).join(', ') || '없음'}` : '아직 없음'}</p>
    <h3>고친 판자 · 다시 보기</h3><p>${Object.keys(st && st.fixed || {}).map((c) => `${esc(lessonName(c))}${rv[c] ? ` <span class="small muted">(다시 보기 ${rv[c].n}/3)</span>` : ''}`).join(', ') || '아직 없음'}</p>
    <p class="small muted">원인은 '가능한 원인'이에요. '한 번 보임'은 한 문항에서만 맞아떨어진 것, '되풀이됨'은 서로 다른 문항 둘 이상에서 같은 틀린 방법이 맞아떨어진 것이에요. 아이 화면엔 원인 이름을 보이지 않아요.</p></div>`;
}

// 10분 소집단 카드 — 명시적 지도 차례(시범 · 생각 말하기 → 함께 → 혼자 · 바로 고치기) [B-R11][B-R12][B-R13]
export function groupCardView(root, C, c) {
  const K = cls(C); if (!K || !byId[c]) return go('#/t');
  const r = rng(Date.now() % 1e9), used = new Set();
  const [ex] = pickItems(c, 1, r, used), together = pickItems(c, 2, r, used), solo = pickItems(c, 3, r, used);
  const steps = ex ? stepsOf(ex) : [];
  const ans = (it) => esc(it.sol.join(', '));
  root.innerHTML = `<div class="card tcard"><h2>10분 소집단 카드 <small>${esc(lessonName(c))}</small></h2>
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><a class="btn" href="#/t/c/${C}">반 보기로</a></div>
    <p><b>목표</b> — ${esc(LES(c).kid)} · <span class="muted">${esc(hintOf(c))}</span></p>
    <h3>① 시범(2분) — 생각을 소리 내어</h3>${ex ? `<div>${staticHTML(ex.prompt, null)}</div>${modelHTML(ex)}<ol class="steps">${steps.map((s) => stepHTML(s)).join('')}</ol><p>답: <b>${ans(ex)}</b></p>` : ''}
    <p class="small muted">모형이 있으면 먼저 모형으로(낱개 10개 → 십 막대 1개로 바꾸기), 그다음 그림, 그다음 식으로.</p>
    <h3>② 함께(3분) — 아이가 단계를 말하고 선생님이 받아 적기</h3><ol>${together.map((it) => `<li>${staticHTML(it.prompt, null)} <span class="small muted">답 ${ans(it)}</span></li>`).join('')}</ol>
    <h3>③ 혼자(3분) — 틀리면 바로 그 단계에서 고치기</h3><ol>${solo.map((it) => `<li>${staticHTML(it.prompt, null)} <span class="small muted">답 ${ans(it)}</span></li>`).join('')}</ol>
    <h3>④ 마무리(2분)</h3><p>"어느 단계가 어려웠어?" 한 가지씩 말하기 → 앱에서 '판자 고치기'의 확인 3문제로 기록.</p>
    <p class="small muted">이 카드는 묶음 제안일 뿐이에요. 기준선 근처 아이는 선생님이 보고 넣거나 빼 주세요.</p></div>`;
}
