// 선생님 화면 — 반 만들기 · 카드 · 반 한눈 보기(오늘 단원 · 묶음 제안 · 먼저 볼 아이) · 아이 자세히 · 10분 소집단 카드
//  근거: 중심은 교사 화면 [A-R27][B-R19][B-R20] · 묶음은 제안만, 교사가 확인 [D-34] · 원인은 '한 번 보임'과 '되풀이됨'을 가름 [A-R11][A-R12]
//  이름은 이 기기에만(서버엔 번호만) · 선생님 열쇠를 잃으면 반 기록을 열 수 없음(카드로 보관)
import { byId, UNITS, unitById, gradeIdx, GRADES } from '../../engine/lessons/index.js';
import { LES, lessonName, pickItems } from '../../paper/js/gen.js';
import { kidReport, bugName, ST } from '../../paper/js/judge.js';
import { mascot } from '../../paper/js/mascot.js';
import { rng } from '../../engine/math.js';
import { toText } from '../../engine/tokens.js';
import * as db from './db.js';
import * as KS from './kidstore.js';
import { prepPlan } from './prep.js';
import { stepsOf, hintOf } from './fix.js';
import { lsGet, lsSet, esc, rand, KEY_AL } from './local.js';
import { stepHTML, staticHTML } from './item.js';
import { modelHTML } from './model.js';
import { MIS, misFor, misById, WHY, wantFor, WANT } from '../../engine/mis.js';
import { TOOLS, CARD_TOOL } from './tools.js';
import { KIDSAY } from './fix.js';
import { testable, __predict } from '../../engine/errors.js';
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
    <div class="acts"><a class="btn pri" href="#/t/new">새 반 만들기</a><a class="btn" href="#/t/open">다른 기기에서 만든 반 열기</a><a class="btn" href="#/t/guide">한 장 안내</a></div>
    ${list.length ? `<p class="small muted" style="margin-top:12px">반 코드 · 선생님 열쇠 · 핀 · 아이 이름은 <b>이 기기에만</b> 있어요. 브라우저 기록을 지우거나 기기를 바꾸기 전에 백업해 두세요(이름이 들어 있으니 학교 기기에만 두세요).</p>
    <div class="acts"><button id="bk">이 기기 반 정보 백업 내려받기</button><label class="btn">백업 불러오기<input type="file" id="rs" accept="application/json" hidden></label></div><p class="qmsg" id="bmsg"></p>` : `<div class="acts"><label class="btn">백업 불러오기<input type="file" id="rs" accept="application/json" hidden></label></div><p class="qmsg" id="bmsg"></p>`}</div>
    <div class="card"><h2>이 앱이 하는 일 <small>근거: docs/evidence.md</small></h2>
    <ol><li>선생님이 <b>오늘 단원</b>을 열면, 아이마다 그 단원에 꼭 필요한 아래 칸만 5~10분 점검해요(바로 아래 칸부터 · 막히면 반씩 갈라 좁힘).</li>
    <li>고칠 판자가 나온 아이는 바로 <b>판자 고치기</b>(시범 → 함께 → 혼자 → 새 숫자로 확인) 한 바퀴 하고 오늘 수업으로 돌아가요. 아래를 다 메울 때까지 붙잡지 않아요.</li>
    <li>선생님 화면엔 칸 × 아이 표, 같은 칸에 몰린 아이 묶음 제안, '자신 있었는데 틀린' 아이, 먼저 봐 줄 아이가 떠요.</li>
    <li>고친 판자는 1 · 3 · 7일 뒤 섞어서 다시 봐요.</li></ol></div>`;
  const bk = root.querySelector('#bk');
  if (bk) bk.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ kind: 'tuntun-teacher', v: 1, at: Date.now(), classes: tget().classes }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `튼튼수다리_반정보_${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  root.querySelector('#rs').addEventListener('change', async (e) => {
    const f = e.target.files[0], msg = root.querySelector('#bmsg'); if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (!o || o.kind !== 'tuntun-teacher' || typeof o.classes !== 'object') throw new Error('튼튼 수 다리 반 정보 파일이 아니에요');
      const X = tget(); let n = 0;
      for (const [C, x] of Object.entries(o.classes)) { if (!/^[A-HJ-NP-Z2-9]{6}$/.test(C) || !x || typeof x.T !== 'string') continue; X.classes[C] = { ...(X.classes[C] || {}), ...x, names: { ...((X.classes[C] || {}).names || {}), ...(x.names || {}) } }; n++; }
      tset(X); msg.textContent = `반 ${n}개를 불러왔어요.`; setTimeout(() => teacherHome(root), 800);
    } catch (err) { msg.textContent = `불러오지 못했어요: ${err.message}`; }
  });
}

// 한 장 안내(인쇄용) — 근거는 docs/evidence.md
export function guideView(root) {
  root.innerHTML = `<div class="card tcard"><h2>튼튼 수 다리 — 선생님 한 장 안내</h2>
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><a class="btn" href="#/t">처음으로</a></div>
    <h3>처음 한 번</h3><ol><li><b>새 반 만들기</b> — 학기 · 아이 수를 넣으면 반 코드와 번호마다 핀이 생겨요.</li><li><b>카드 인쇄</b> — 아이 카드는 잘라 나눠 주고, <b>선생님 열쇠 카드</b>는 따로 보관해요(다른 기기에서 반을 열 때 필요).</li><li><b>이름 적기</b>(선택) — 이 기기에만 저장돼요. 서버엔 번호만 가요. 처음 화면에서 <b>백업</b>을 내려받아 두세요.</li></ol>
    <h3>수업 때(5~10분)</h3><ol><li>반 화면에서 오늘 배울 단원을 골라 <b>오늘 단원으로 열기</b>.</li><li>아이들은 주소에 들어가 카드로 들어가면 맨 위에 <b>오늘 단원 준비하기</b>가 떠요(이미 켜 둔 화면은 새로고침).</li><li>아이마다 그 단원에 꼭 필요한 아래 칸만 3문제씩 풀어요. 막히면 아래로 반씩 좁혀 <b>고칠 판자</b>를 찾고, 찾으면 바로 <b>판자 고치기</b>(시범 → 함께 → 혼자 → 확인 3문제) 한 바퀴. 아래를 다 메울 때까지 붙잡지 않아요 — 끝나면 오늘 수업으로.</li></ol>
    <h3>선생님 화면 읽기</h3><ul><li>✓ 됨 · ○ 거의 · △ 흔들림 · ✕ 막힘 · <b>★ 고칠 판자</b>(여기서부터) · ? 자세히 볼 것 · · 안 봄. 회색 이름 칸은 준비 칸보다 더 아래.</li>
    <li><b>먼저 봐 줄 아이</b> — 막힌 칸이 많거나, 고치기 뒤에도 흔들리거나, '자신 있었는데 틀린' 문제가 많거나, 2초 안에 찍은 아이. 앱보다 선생님이 먼저 봐 주세요.</li>
    <li><b>묶어 가르치기 제안</b> — 같은 판자를 고칠 아이가 둘 이상이면 묶음과 <b>10분 소집단 카드</b>(시범 · 함께 · 혼자 · 마무리)가 나와요. 넣고 뺄지는 선생님이 정해요.</li>
    <li>아이 이름을 누르면 자세히 — 원인은 '가능한 원인'이에요. <b>한 번 보임</b>은 한 문항에서만, <b>되풀이됨</b>은 서로 다른 두 문항 이상에서 같은 틀린 방법이 맞아떨어진 것. 아이 화면엔 원인 이름을 보이지 않아요.</li></ul>
    <h3>알아 두기</h3><ul><li>점수 · 순위 · 친구 비교는 없어요. 아이는 '내 짐작이 맞은 정도'와 '내가 고친 판자'만 봐요.</li><li>고친 판자는 1 · 3 · 7일 뒤 섞어서 다시 봐요(오늘 할 일에 떠요).</li><li>효과는 앱 안 점수가 아니라 다음 단원 형성평가로 보세요. 연구에 따르면 이런 지도의 효과는 0.2~0.4 표준편차 안팎이에요.</li></ul></div>`;
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
  return { L, start: arr(st.start), below: arr(st.below), under: arr(st.under), sw: num(st.sw), fixed: num(st.fixed), help: num(st.help), due: arr(st.due), t: Number(st.t) || 0, last: Number(st.last) || 0, cal: obj(st.cal), rush: Number(st.rush) || 0, mx: num(st.mx), mis: Object.fromEntries(Object.entries(obj(st.mis)).filter(([k, v]) => misById[k] && (v === 's' || v === 'm' || v === 'r'))), jog: Array.isArray(st.jog) ? st.jog.filter((d) => typeof d === 'string' && /^\d{4}-\d\d-\d\d$/.test(d)) : [] };
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
// 오개념 카드(선생님용) — 아이 생각 · 드러나는 답 · 왜 · 가려내는 문항 · 고치는 법 · 근거 강도
const STR = { 상: '근거 강함', 중: '근거 보통', 하: '근거 약함(교사 자료 · 엔진 관찰)' };
export function misCard(m, tag = '') {
  return `<details class="mis"><summary><b>${esc(m.title)}</b>${tag ? ` <span class="pill">${esc(tag)}</span>` : ''} <span class="small muted">${esc(STR[m.str] || '')}</span></summary>
    <dl><dt>아이 생각</dt><dd>${esc(m.think)}</dd><dt>드러나는 답</dt><dd>${esc(m.shows)}</dd><dt>왜 생기나</dt><dd>${esc(WHY[m.why[0]] || '')} — ${esc(m.why[1])}</dd>
    <dt>가려내는 문항</dt><dd>${esc(m.probe)}</dd><dt>고치는 법</dt><dd>${esc(m.fix)}</dd>${m.has === 'no' ? '<dt>엔진</dt><dd>아직 문항으로 잡지 못해요 — 수업에서 직접 물어봐 주세요</dd>' : ''}<dt>근거</dt><dd class="small muted">docs/research ${esc(m.refs)}</dd></dl></details>`;
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
    ${(() => { const cnt = {}; rows.forEach((no) => { const st = S[no] && S[no].st; if (st) for (const [id, v] of Object.entries(st.mis || {})) { const e = (cnt[id] = cnt[id] || { s: [], m: [], r: [] }); e[v].push(no); } });
      const list = Object.entries(cnt).filter(([, e]) => e.s.length || e.r.length).sort((a, b) => b[1].s.length - a[1].s.length || b[1].m.length - a[1].m.length).slice(0, 8);
      return list.length ? `<div class="card"><h2>같은 생각끼리 <small>칸이 아니라 '어떻게 생각해서 틀렸나'로 묶음 · 넣고 뺄지는 선생님이</small></h2><div class="groups">${list.map(([id, e]) => { const m = misById[id], t = TOOLS[CARD_TOOL[id]]; return `<div class="grp"><b>${esc(m.think)}</b><span class="small muted">예: ${esc(m.shows)}</span>
        <span class="small">${e.s.length ? `되풀이 <b>${e.s.map((no) => esc(nm(K, no))).join(', ')}</b>` : ''}${e.m.length ? ` · 한 번 보임 ${e.m.length}명` : ''}${e.r.length ? ` · <span style="color:var(--ok)">고친 생각 ${e.r.length}명</span>` : ''}</span>
        ${t ? `<span class="small">도구: 🔍 ${esc(t.name)}</span>` : ''}<div class="acts">${e.s.length ? `<a class="btn teal" href="#/t/c/${C}/m/${id}">이 생각 10분 카드</a>` : ''}</div>${misCard(m)}</div>`; }).join('')}</div></div>` : ''; })()}
    <div class="card"><h2>같은 판자끼리 <small>같은 판자를 고칠 아이 · 넣고 뺄지는 선생님이</small></h2>
      ${glist.length ? `<div class="groups">${glist.map(([c, nos]) => `<div class="grp"><b>${esc(lessonName(c))}</b><span class="muted small">${nos.map((no) => esc(nm(K, no))).join(', ')}</span><div class="acts"><a class="btn teal" href="#/t/c/${C}/g/${encodeURIComponent(c)}">10분 소집단 카드</a></div></div>`).join('')}</div>` : '<p class="muted">아직 같은 판자에 둘 이상 몰린 곳이 없어요.</p>'}</div>
    <div class="card"><h2>${esc(unitLabel(unit))}로 가는 칸 × 아이</h2>
      <p class="small muted">✓ 확인 · 관문 통과 · ○ 거의 · △ 흔들림 · ✕ 막힘 · ★ 고칠 판자(여기서부터) · ? 자세히 볼 것 · · 안 봄 · 진한 초록 = 다듬기 '빠르게' · 돌 색 = '오래'까지 — 회색 이름 칸은 준비 칸보다 더 아래(아이가 막혔거나 고친 곳)</p>
      <div class="ctab"><table><tr><th class="l">아이</th>${cols.map((c) => `<th class="v${P.pre.includes(c) ? '' : ' lo'}" title="${esc(lessonName(c))}"><span>${esc((byId[c] && byId[c].name) || lessonName(c))}</span></th>`).join('')}<th>고칠 판자</th><th>자신 있었는데 틀림</th><th>구보(7일)</th><th>지금</th></tr>
      ${rows.map((no) => { const x = S[no] || {}, st = x.st; const sw = st ? Object.values(st.sw || {}).reduce((a, b) => a + b, 0) : 0;
        return `<tr><td class="l"><a href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a></td>${cols.map((c) => { if (!st) return '<td class="c-none">·</td>'; const t = (st.mx || {})[c] || 0; const s = st.start.includes(c) ? ['c-start', '★'] : t >= 3 && st.L[c] === 'ok' ? ['c-t3', '✓'] : t >= 2 && st.L[c] === 'ok' ? ['c-t2', '✓'] : CELL[st.L[c] || 'none']; return `<td class="${s[0]}" title="${esc(lessonName(c))} — ${esc(ST[st.L[c] || 'none'])}${t ? ` · 다듬기 표 ${t}개(${['', '정확', '정확 · 빠르게', '정확 · 빠르게 · 오래'][t]})` : ''}">${s[1]}</td>`; }).join('')}
        <td style="text-align:left">${st ? st.start.slice(0, 3).map((c) => esc(lessonName(c))).join(', ') : ''}</td><td>${sw || ''}</td><td>${st ? st.jog.filter((d) => Date.now() - new Date(d).getTime() < 7 * 864e5).length || '' : ''}</td><td class="small">${nowText(x.now)}</td></tr>`; }).join('')}</table></div>
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
  return n.mode === 'prep' ? `준비 다리 ${n.n || 0}문제` : n.mode === 'fix' ? `고치는 중: ${esc(lessonName(n.c))}` : n.mode === 'drill' ? `다듬는 중: ${esc(lessonName(n.c))}` : n.mode === 'run' ? '구보 중' : n.mode === 'back' ? `거꾸로 찾는 중: ${esc(lessonName(n.c))}` : '';
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
  // 시간 — 맞힌 문제의 한 문제 가운데값(모든 기록 · 준비 다리 · 확인 · 다시 보기 · 다듬기)
  const msOf = {}; for (const x of Object.values(KK.recs)) { if (!KS.okRec(x)) continue; for (const [k, c] of x.s.it) { const r = x.r.it[k], t = x.ms ? Number(x.ms[k]) : 0; if (r && r.s === 'ok' && t > 0) (msOf[c] = msOf[c] || []).push(t); } }
  const medOf = (c) => { const a = (msOf[c] || []).slice().sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : null; };
  const mxK = obj(raw && raw.mx ? db.dec(raw.mx) : null);
  const tm = (c) => { const m = medOf(c), t = mxK[c] ? Number(mxK[c].tier) || 0 : 0; return `${m ? ` <span class="small">· 한 문제 ${(m / 1000).toFixed(1)}초${byId[c] ? `(기준 ${byId[c].sec}초)` : ''}</span>` : ''}${t ? ` <span class="pill">다듬기 ${['', '정확', '정확 · 빠르게', '정확 · 빠르게 · 오래'][Math.min(t, 3)]}</span>` : ''}`; };
  const cards = (c) => { const x = rep.L[c]; if (!x) return ''; const seen = new Set(), out = []; const add = (m, tag) => { if (!seen.has(m.id)) { seen.add(m.id); out.push(misCard(m, tag)); } };
    if (x.why) { x.why.sure.forEach((h) => misFor({ bug: h.id, lesson: c }).forEach((m) => add(m, '되풀이됨'))); x.why.maybe.forEach((h) => misFor({ bug: h.id, lesson: c }).forEach((m) => add(m, '한 번 보임'))); }
    if (!out.length && (x.st === 'stuck' || x.st === 'shaky')) misFor({ lesson: c }).slice(0, 2).forEach((m) => add(m, '이 칸에서 흔함'));
    return out.join(''); };
  const line = (c, extra = '') => `<li><b>${esc(lessonName(c))}</b> <span class="muted small">${esc(gl(LES(c).g))}</span> ${rep.L[c] ? `<span class="small">${rep.L[c].ok}/${rep.L[c].tot}</span>` : ''}${tm(c)} ${why(c)} ${extra}${cards(c)}</li>`;
  const recs = Object.values(KK.recs).sort((a, b) => b.s.made - a.s.made);
  root.innerHTML = `<div class="card"><h2>${esc(nm(K, no))} <small>${recs.length}묶음 · ${recs.reduce((n, x) => n + x.s.it.length, 0)}문항</small></h2>
    <div class="acts no-print"><a class="btn" href="#/t/c/${C}">반 보기로</a><button onclick="print()">인쇄</button></div>
    <h3>고칠 판자(여기서부터)</h3>${rep.start.length ? `<ul>${rep.start.map((s) => line(s.c)).join('')}</ul>` : '<p class="muted">없음</p>'}
    ${rep.below.length ? `<h3>아래 먼저 확인</h3><ul>${rep.below.map((b) => line(b.c, `<span class="small muted">— 아직 안 본 아래 칸: ${b.check.map((x) => esc(lessonName(x))).join(', ')}</span>`)).join('')}</ul>` : ''}
    ${rep.under.length ? `<h3>아래 칸 때문일 수도</h3><ul>${rep.under.map((u) => line(u.c, `<span class="small muted">← ${u.because.map((x) => esc(lessonName(x))).join(', ')}</span>`)).join('')}</ul>` : ''}
    <h3>자신감 견주기</h3><p>${cal.n ? `짐작이 결과와 맞은 정도 <b>${Math.round(cal.match * 100)}%</b>(${cal.n}문항) · 자신 있었는데 틀림: ${Object.entries(cal.sureWrong).map(([c, n]) => `${esc(lessonName(c))} ${n}`).join(', ') || '없음'}` : '아직 없음'}</p>
    ${Object.keys(mxK).length ? `<h3>다듬은 판자(스테이지)</h3><ul>${Object.keys(mxK).filter((c) => LES(c)).sort(byGrade).map((c) => line(c)).join('')}</ul>` : ''}
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
    ${(() => { const ms = misFor({ lesson: c }); if (!ms.length) return ''; let cmp = ''; if (ex) { const ids = (() => { try { return testable(ex); } catch (e) { return []; } })(); const id = ms.flatMap((m) => m.bugs || []).find((b) => ids.includes(b)); if (id) { let v = null; try { v = __predict(ex, id); } catch (e) { v = null; } if (v) cmp = `<p class="small"><b>비교 문항</b>(맞는 풀이와 아이 같은 틀린 풀이를 나란히 · '왜 틀렸을까'를 말하게): ${staticHTML(ex.prompt, ex.sol)} ↔ ${staticHTML(ex.prompt, v)}</p>`; } } return `<h3>이 칸에서 흔한 오개념</h3>${ms.slice(0, 3).map((m) => misCard(m)).join('')}${cmp}`; })()}
    <h3>① 시범(2분) — 생각을 소리 내어</h3>${ex ? `<div>${staticHTML(ex.prompt, null)}</div>${modelHTML(ex)}<ol class="steps">${steps.map((s) => stepHTML(s)).join('')}</ol><p>답: <b>${ans(ex)}</b></p>` : ''}
    <p class="small muted">모형이 있으면 먼저 모형으로(낱개 10개 → 십 막대 1개로 바꾸기), 그다음 그림, 그다음 식으로.</p>
    <h3>② 함께(3분) — 아이가 단계를 말하고 선생님이 받아 적기</h3><ol>${together.map((it) => `<li>${staticHTML(it.prompt, null)} <span class="small muted">답 ${ans(it)}</span></li>`).join('')}</ol>
    <h3>③ 혼자(3분) — 틀리면 바로 그 단계에서 고치기</h3><ol>${solo.map((it) => `<li>${staticHTML(it.prompt, null)} <span class="small muted">답 ${ans(it)}</span></li>`).join('')}</ol>
    <h3>④ 마무리(2분)</h3><p>"어느 단계가 어려웠어?" 한 가지씩 말하기 → 앱에서 '판자 고치기'의 확인 3문제로 기록.</p>
    <p class="small muted">이 카드는 묶음 제안일 뿐이에요. 기준선 근처 아이는 선생님이 보고 넣거나 빼 주세요.</p></div>`;
}

// 이 생각 10분 카드 — 생각을 지우지 않고 '언제 맞고 언제 안 맞나'로 가르기 [E4-4][E4-1] · 도구 · 맞는 풀이 ↔ 틀린 풀이 · 함정 꼴 반례
export function mindCardView(root, C, id) {
  const K = cls(C), m = misById[id]; if (!K || !m) return go('#/t');
  // 함정 꼴이 있는 차시를 먼저(반례가 되는 문항) · 없으면 카드의 첫 차시
  const c = Object.keys(WANT[id] || {}).find((l) => m.lessons.includes(l) && byId[l]) || m.lessons.find((l) => byId[l]);
  const r = rng(Date.now() % 1e9), used = new Set(), want = c ? wantFor(id, c) : null;
  const traps = c ? pickItems(c, 3, r, used, want) : [];
  const t = TOOLS[CARD_TOOL[id]];
  let pair = '';
  const bug = (m.bugs || [])[0];
  if (c && bug) { for (let k = 0; k < 20 && !pair; k++) { const [it] = pickItems(c, 1, r, used); if (!it) break; let v = null; try { v = testable(it).includes(bug) ? __predict(it, bug) : null; } catch (e) { v = null; } if (v) pair = `<p>${staticHTML(it.prompt, it.sol)} ↔ ${staticHTML(it.prompt, v)}</p><p class="small muted">"어느 쪽이 맞을까? 틀린 친구는 무엇을 했을까?" — ${esc(KIDSAY[bug] || m.think)}</p>`; } }
  // 숫자 모형이 없는 생각 — 함정 문항에서 그 오답 이름이 붙는 답을 찾아 틀린 풀이로(문제 속 수들의 합 · 차 · 곱을 넣어 봄)
  if (!pair && (m.names || []).length) for (const it of [...traps, ...(c ? pickItems(c, 6, r, used, want) : [])]) {
    if (it.choices) { const k = it.choices.findIndex((_, i) => { const res = it.check([i], [String(i)]); return res.bug && m.names.some((n) => res.bug.name.includes(n)); }); if (k >= 0) { pair = `<p>${staticHTML(it.prompt, null)} — 맞는 답 <b>${staticHTML(it.choices[it.sol[0]], null)}</b> ↔ 친구가 고른 답 <b>${staticHTML(it.choices[k], null)}</b></p><p class="small muted">"왜 그렇게 골랐을까? 언제는 그 생각이 맞을까?"</p>`; break; } continue; }
    const ns = (toText(it.prompt).match(/\d+/g) || []).map(Number), cand = new Set();
    ns.forEach((a, i) => { cand.add(a); ns.forEach((b, j) => { if (i !== j) { cand.add(a + b); cand.add(Math.abs(a - b)); cand.add(a * b); } }); }); cand.add(ns.reduce((x, y) => x + y, 0));
    const v = [...cand].find((v) => { try { const res = it.check([v], [String(v)]); return res.bug && m.names.some((n) => res.bug.name.includes(n)); } catch (e) { return false; } });
    if (v != null && it.sol.length === 1) { pair = `<p>${staticHTML(it.prompt, it.sol)} ↔ ${staticHTML(it.prompt, [v])}</p><p class="small muted">"어느 쪽이 맞을까? 틀린 친구는 무엇을 했을까?" — ${esc(m.think)}</p>`; break; }
  }
  const ans = (it) => esc(it.sol.join(', '));
  root.innerHTML = `<div class="card tcard"><h2>이 생각 10분 카드 <small>${esc(m.title)}</small></h2>
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><a class="btn" href="#/t/c/${C}">반 보기로</a></div>
    <p><b>아이 생각</b> — ${esc(m.think)} <span class="muted small">(예: ${esc(m.shows)})</span></p>
    <p><b>목표</b> — 이 생각을 지우는 게 아니라 <b>언제 맞고 언제 안 맞는지</b> 가르기. 왜 생기나: ${esc(WHY[m.why[0]] || '')} — ${esc(m.why[1])}</p>
    <h3>① 맞는 풀이 ↔ 틀린 풀이(3분)</h3>${pair || `<p class="small muted">${esc(m.fix)}</p>`}
    <h3>② 도구로 확인(2분)</h3>${t ? `<p>🔍 <b>${esc(t.name)}</b> — ${esc(t.how)} 아이마다 틀린 답에 직접 써 보게.</p>` : '<p class="small muted">이 생각은 아직 도구가 없어요 — 그림으로 확인.</p>'}
    <h3>③ 반례 문항(3분) — 이 생각으로 풀면 틀리게 나오는 문제</h3><ol>${traps.map((it) => `<li>${staticHTML(it.prompt, null)}${it.choices ? ` <span class="small">${it.choices.map((ch) => staticHTML(ch, null)).join(' · ')}</span>` : ''} <span class="small muted">답 ${ans(it)}</span></li>`).join('')}</ol>
    <h3>④ 마무리(2분)</h3><p>"이 방법은 <b>언제는 맞고 언제는 안 맞을까?</b>" 한 줄로 말하기 · 고치는 법: ${esc(m.fix)}</p>
    <p class="small muted">근거 docs/research ${esc(m.refs)} · 근거 강도 ${esc(m.str)}</p></div>`;
}
