// 선생님 화면 — 반 만들기 · 카드 · 반 한눈 보기(오늘 단원 · 묶음 제안 · 먼저 볼 아이) · 아이 자세히 · 10분 소집단 카드
//  근거: 중심은 교사 화면 [A-R27][B-R19][B-R20] · 묶음은 제안만, 교사가 확인 [D-34] · 원인은 '한 번 보임'과 '되풀이됨'을 가름 [A-R11][A-R12]
//  이름은 이 기기에만(서버엔 번호만) · 선생님 열쇠를 잃으면 반 기록을 열 수 없음(카드로 보관)
import { byId, UNITS, unitById, gradeIdx, GRADES } from '../../engine/lessons/index.js';
import { LES, lessonName, pickItems } from '../../paper/js/gen.js';
import { kidReport, bugName, ST } from '../../paper/js/judge.js';
import { mascot } from '../../paper/js/mascot.js';
import { rng } from '../../engine/math.js';
import { toText, toHTML } from '../../engine/tokens.js';
import { RO, P } from '../../engine/concepts/kit.js';
import * as db from './db.js';
import * as KS from './kidstore.js';
import { prepPlan } from './prep.js';
import { stepsOf, hintOf } from './fix.js';
import { lsGet, lsSet, esc, rand, KEY_AL } from './local.js';
import { stepHTML, staticHTML, ansHTML } from './item.js';
import { modelHTML } from './model.js';
import { MIS, misFor, misById, WHY, wantFor, WANT } from '../../engine/mis.js';
import { TOOLS, CARD_TOOL } from './tools.js';
import { KIDSAY } from './fix.js';
import { weeksOf, weekChart, weekTrend, weekKey, lastLine } from './weekcore.js';
import { packetOf, promptOf, wrongList, wrongOf, photoPromptOf } from './copilot.js';
import { aiKey, setAiKey, keyTail, askClaude, shrinkPhoto } from './ai.js';
import { qrSVG } from './qr.js';
import { TYPES } from '../../engine/schema.js';
import { planOf, probOf, EASY as STORY_EASY } from './storylog.js';
import { frameSVG } from './story.js';
import { testable, __predict } from '../../engine/errors.js';
import { go, unitLabel } from './kid.js';
import { icon } from './icons.js';
import { kidSheet } from './sheet.js';
import { checkCard, syncChecks } from './tcheck.js';
import { SKILL, skillsOf, gText } from '../../engine/skills.js';
import { tableCard, skillState, skillCmp } from './ttable.js';

const TK = 'tt.t';
const tget = () => lsGet(TK, { classes: {} });
const tset = (x) => lsSet(TK, x);
const cls = (C) => tget().classes[C];
const say = (pose, html) => `<div class="say">${mascot(pose, 60)}<div class="bub">${html}</div></div>`;
const gl = (g) => g.replace(/^(\d)-(\d)$/, '$1학년 $2학기');
const appURL = () => location.origin + location.pathname;
export const nm = (K, no) => (K.names && K.names[no] ? `${no} ${K.names[no]}` : `${no}번`);
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);
const ro = (s) => RO(s).slice(String(s).length);   // 받침 따라 '으로' · '로'

// 화면 조각 — 맨 위 '이 화면은 무엇 · 언제' · 선생님 말(발문) · 번호 단계 상자(시간 칩) · 문제 칸(답은 옆에 연하게)
const intro = (html, cls = '') => `<p class="intro${cls ? ` ${cls}` : ''}">${html}</p>`;
const askP = (t) => `<p class="ask"><span class="who">선생님</span><span>“${esc(t)}”</span></p>`;
const stepBox = (n, title, min, body) => `<li class="stp"><div class="stp-h"><span class="no">${n}</span><b>${title}</b>${min ? `<span class="min">${min}분</span>` : ''}</div>${body}</li>`;
const chips = (choices) => `<span class="chips">${choices.map((ch) => `<span class="chip">${toHTML(ch, { static: true })}</span>`).join('')}</span>`;
const qCell = (it, i) => `<div class="qc"><span class="qn">${i + 1}</span><div class="qb">${staticHTML(it.prompt, null)}${it.choices ? chips(it.choices) : ''}</div><span class="ans">답 ${ansHTML(it)}</span></div>`;
const qGrid = (its) => `<div class="qg">${its.map(qCell).join('')}</div>`;
const pairBox = (a, b, la = '맞는 풀이', lb = '친구 풀이') => `<div class="pair"><div class="pc ok"><span class="lbl">${la}</span>${a}</div><div class="pc no"><span class="lbl">${lb}</span>${b}</div></div>`;
// 카드 글에 남은 연구 낱말을 선생님 일상말로(뜻 · 숫자는 그대로) — 카드에 plain이 있으면 그것을 먼저 씀
const EASY = [[/\s*\(repair\)/g, ''], [/비표준 꼴/g, '답이 앞에 오는 식'], [/포함제/g, "'몇 번 들어가나' 나눗셈"], [/등분제/g, "'똑같이 나눠 주기' 나눗셈"], [/부분-부분-전체/g, '부분과 전체'], [/부분-전체/g, '부분과 전체'], [/과잉 일반화/g, '지나치게 넓혀 씀'], [/자연수 편향/g, '자연수 생각에 끌림'], [/하위 기능/g, '앞 단계'], [/반례/g, '이 생각대로 풀면 틀리는 예'], [/\(재귀\)/g, '(앞 칸에서 다음 칸만)'], [/표상/g, '그림 · 모형']];
const easy = (s) => EASY.reduce((t, [a, b]) => t.replace(a, b), String(s || ''));
const whyOf = (m) => m.plain || `${WHY[m.why[0]] || ''} — ${easy(m.why[1])}`;

/* 10분 카드 '답 보기' — 화면을 아이와 같이 볼 때 답이 보이지 않게(인쇄엔 나옴 · 처음 보는 눈 11-08) */
if (typeof document !== 'undefined') document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.ans-t'); if (!b) return; const c = b.closest('.tcard'); if (!c) return; const on = c.classList.toggle('hide-ans'); b.textContent = on ? '답 보기' : '답 가리기'; });
// 반 정보 백업 내려받기(반 코드 · 열쇠 · 핀 · 이 기기의 이름 · 메모) — 선생님 처음 화면 · 반을 만든 직후 카드 화면
function backupDownload() {
  const local = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^tt\.(note|paper)\.[A-Z0-9]{6}(\.\d{1,3})?$/.test(k)) local[k] = lsGet(k, null); } } catch (e) { /* */ }   /* 이 기기에만 둔 것(지도 메모 글 · 종이 번호 맞춤)도 같이 */
  const blob = new Blob([JSON.stringify({ kind: 'tuntun-teacher', v: 1, at: Date.now(), classes: tget().classes, local }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `튼튼수다리_반정보_${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function teacherHome(root) {
  const T = tget(), list = Object.entries(T.classes);
  root.innerHTML = `<div class="card"><h2>선생님 처음 화면</h2>
    ${say('hi', '반을 만들면 아이마다 <b>아이 카드</b>(반 코드 · 번호 · 핀)가 나와요.<br>아이 이름은 이 기기에만 두고 서버에 보내지 않아요.')}
    ${list.length ? `<table class="list"><tr><th>반 코드</th><th>학기</th><th>아이</th><th></th></tr>${list.map(([C, x]) => `<tr><td><b class="code">${esc(C)}</b></td><td>${esc(gl(x.g))}</td><td>${x.n}명</td><td style="text-align:right"><a class="btn teal" href="#/t/c/${C}">반 열기</a></td></tr>`).join('')}</table>` : '<p class="muted">이 기기에서 연 반이 아직 없어요. 처음이면 <b>새 반 만들기</b>부터 하세요.</p>'}
    <div class="acts"><a class="btn pri" href="#/t/new">새 반 만들기</a><a class="btn" href="#/t/open">다른 기기에서 만든 반 열기</a></div><div class="acts sub"><span class="small muted">인쇄할 것</span><a class="btn" href="#/t/guide">한 장 안내</a><a class="btn" href="#/t/letter">가정 안내문</a><a class="btn" href="../paper/" target="_blank" rel="noopener" title="인쇄해서 푸는 진단 · 점검 — 채점 결과는 반 화면의 '종이 결과 가져오기'로">종이 점검지</a><a class="btn" href="#/t/sheet" title="기능 이름으로 골라 한 아이에게 그 칸만 연습시키는 종이">맞춤 연습지</a></div></div>
    <div class="tgrid2"><div class="card"><h2>반 정보 백업</h2>
    ${intro(`반 코드 · 선생님 열쇠 · 핀 · 아이 이름은 <b>이 기기에만</b> 있어요. 브라우저 기록을 지우거나 기기를 바꾸기 전에 <b>[백업 내려받기]</b>로 받아 두세요(반을 만들면 단추가 생겨요). 받아 둔 파일은 [백업 불러오기]로 넣어요. 이름이 들어 있으니 학교 기기에만 두세요.`)}
    <div class="acts">${list.length ? '<button id="bk">백업 내려받기</button>' : ''}<label class="btn">백업 불러오기<input type="file" id="rs" accept="application/json" hidden></label></div><p class="qmsg tight" id="bmsg"></p></div>
    <div class="card"><h2>이 앱이 하는 일</h2>
    <p>아이마다 빠진 앞 학년 셈을 <b>찾고</b>, 그 아이에게 <b>그것만 주고</b>, 아이는 <b>매일 조금씩</b> 풀어 메워요.</p>
    <ol class="easy"><li><b>점검</b> — 오늘 단원 점검(그 단원에 꼭 필요한 앞 학년 셈만 · 12~24문제) · 종이와 같은 점검지(화면에서 12문제씩 이어 풀기) · 이번 주 점검(10문제). 결과는 바로 반 표에 들어가요.</li>
    <li><b>반 표</b> — 가로줄 = 셈 기능(맞춤 연습지와 같은 이름) · 세로줄 = 아이 번호. 표시는 ✕ 부족 · △ 가끔 틀림 · ○ 됨 셋이에요.</li>
    <li><b>보충 주기</b> — 부족한 아이에게 그 기능 문제를 보내요. 아이 화면 '배울 것'에 뜨고, 같은 문제를 종이로도 뽑을 수 있어요.</li>
    <li>아이 화면도 카드 셋이에요 — <b>점검 · 배울 것 · 매일 연습</b>. 틀리면 그 자리에서 튼튼이가 풀이를 보여 줘요</li></ol></div></div>`;
  const bk = root.querySelector('#bk');
  if (bk) bk.addEventListener('click', backupDownload);
  root.querySelector('#rs').addEventListener('change', async (e) => {
    const f = e.target.files[0], msg = root.querySelector('#bmsg'); if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (!o || o.kind !== 'tuntun-teacher' || typeof o.classes !== 'object') throw new Error('튼튼 수 다리 반 정보 파일이 아니에요');
      const X = tget(); let n = 0;
      for (const [C, x] of Object.entries(o.classes)) { if (!/^[A-HJ-NP-Z2-9]{6}$/.test(C) || !x || typeof x.T !== 'string') continue; X.classes[C] = { ...(X.classes[C] || {}), ...x, names: { ...((X.classes[C] || {}).names || {}), ...(x.names || {}) } }; n++; }
      for (const [k, v] of Object.entries(o.local && typeof o.local === 'object' ? o.local : {})) if (/^tt\.(note|paper)\.[A-Z0-9]{6}(\.\d{1,3})?$/.test(k) && v && typeof v === 'object') lsSet(k, { ...(lsGet(k, {}) || {}), ...v });
      tset(X); msg.textContent = `반 ${n}개를 불러왔어요.`; setTimeout(() => teacherHome(root), 800);
    } catch (err) { msg.textContent = `불러오지 못했어요: ${err.message}`; }
  });
}

// 한 장 안내(인쇄용) — 근거는 docs/evidence.md
export function guideView(root) {
  root.innerHTML = `<div class="card tcard"><h2>튼튼 수 다리 — 선생님 한 장 안내</h2>
    ${intro('처음 쓰기 전에 한 번 읽어 보세요. 인쇄해서 교탁에 두어도 좋아요.', 'no-print')}
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><a class="btn" href="#/t">처음으로</a></div>
    <h3>처음 한 번</h3><ol class="easy"><li><b>새 반 만들기</b> — 학기와 아이 수를 넣으면 반 코드와 번호마다 핀이 생겨요.</li><li><b>카드 인쇄</b> — 아이 카드는 잘라 나눠 주고, <b>선생님 열쇠 카드</b>는 따로 보관해요(다른 기기에서 반을 열 때 필요해요).</li><li><b>이름 적기</b>(골라서) — 이름은 이 기기에만 저장되고 서버엔 번호만 가요. 처음 화면에서 <b>백업</b>을 내려받아 두세요.</li></ol>
    <h3>반 화면 = 카드 셋</h3><ol class="easy"><li><b>점검 내기</b> — <b>오늘 단원 점검</b>: 오늘 배울 단원과 길이(12 · 18 · 24문제)를 골라 열면 아이들 처음 화면 1번 카드에 떠요(30초 안 · 새로고침 X). 막히면 반씩 좁혀 어디서부터인지 찾고, 못 찾은 아이는 다음 시간에 이어서 해요. <b>점검지</b>: 종이와 같은 문제를 아이 화면에서 12문제씩 풀어요. 같은 문제를 인쇄해 종이로 풀어도 돼요(결과는 '종이 결과 가져오기'). <b>이번 주 점검</b>: 주 1회 10문제가 저절로 떠요.</li>
    <li><b>반 표</b> — 가로줄 = 셈 기능 · 세로줄 = 아이 번호예요. 줄 끝에 부족한 아이 번호와 <b>[보충 주기]</b>가 있어요. 칸을 누르면 그 아이 자세히.</li>
    <li><b>보충 주기</b> — 기능 · 아이 · 문제 수(5~20)를 골라 보내요. 아이 처음 화면 2번 '배울 것'에 '선생님이 준 문제'로 떠요. 다 풀면 결과(맞힌 수)가 보낸 목록에 나와요. 같은 문제를 종이로도 뽑을 수 있어요.</li></ol>
    <h3>무엇을 할지 모를 때</h3><ul class="easy"><li><b>다음 할 것</b> — 아이 자세히 맨 위와 반 화면 '아이마다 다음 할 것'에 그 아이에게 지금 할 일 하나와 단추가 있어요(보충 주기 · 10분 카드 · 점검 내기). 보낸 보충을 푸는 중이면 기다리면 돼요.</li><li><b>선생님을 기다려요</b> — 아이 화면이 '손을 들고 선생님께'라고 한 아이(점검 · 배우기에서 막힘)와 도움을 다 쓰고 답을 본 아이가 반 화면 맨 위 분홍 띠에 15분 동안 떠요. 탭 제목에도 '(1) 선생님을 기다려요'로 보여요. 들른 뒤 <b>다녀왔어요</b>를 누르면 띠가 정리돼요(새로 손 들면 다시 떠요).</li><li><b>이어서</b> — 아이가 하다가 나가도 처음 화면에 '— 이어서 · ○번째 문제부터'로 떠서 그 자리부터 이어 풀어요.</li><li><b>AI에게 물어보기</b>(골라서 · 없어도 돼요) — 아래 '알아 두기'에 적은 한 곳이에요.</li></ul>
    <h3>반 표 읽기</h3><div class="legend2"><span><i class="c-root">✕</i>부족 — 여기서부터</span><span><i class="c-stuck">✕</i>부족</span><span><i class="c-shaky">△</i>가끔 틀림</span><span><i class="c-ok">○</i>됨</span><span><i class="c-none"></i>아직 안 풂</span></div>
    <ul class="easy"><li><b>먼저 봐 줄 아이</b> — 막힌 칸이 많거나, 배우고도 가끔 틀리거나, 이번 주 점검 맞힌 수가 줄거나, '자신 있었는데 틀린' 문제가 많거나, 2초 안에 찍은 아이예요. 앱보다 선생님이 먼저 봐 주세요.</li>
    <li><b>더 보기</b>(반 화면 아래) — 같은 생각으로 틀린 아이끼리 · 같은 차시를 배울 아이끼리 묶음과 <b>10분 카드</b>(인쇄용 소집단 안내) · 이야기 문제가 어디서 끊기나 · 기록 내려받기.</li>
    <li><b>아이 자세히</b> — 틀린 생각은 짐작이에요. <b>한 번 보인 답</b>은 한 문제에서만, <b>여러 번 보인 답</b>은 서로 다른 두 문제 이상에서 같은 틀린 방법이 나온 거예요. 아래 카드는 그 까닭과 도와주는 법이에요. 아이 화면엔 원인 이름이 나오지 않아요.</li></ul>
    <h3>첫 시범 15분 — 아이 2~3명으로 먼저(진짜 크롬북)</h3><ol class="easy"><li><b>5분 전</b> — 카드 2~3장 · 크롬북 2~3대 · <b>점검 내기</b>에서 점검지(사전) 또는 오늘 단원 점검을 열어 둬요.</li>
    <li><b>아이에게 할 말은 한마디만</b> — "카드 보고 들어가서 주황 단추만 따라가 봐. 막히면 손 들어." 미리 설명하지 않아야 처음 쓰는 모습 그대로 보여요.</li>
    <li><b>볼 것(체크)</b> — □ 혼자 들어갔나 □ 첫 문제까지 혼자 갔나 □ 답을 쓰고 자신감 단추를 바로 눌렀나(답만 쓰고 멈춰 있지 않았나) □ 틀렸을 때 '모르겠어요 — 한 단계씩'을 썼나 □ 받아올림 · 받아내림 문제에서 막대 · 낱개가 움직이는 그림이 끊기지 않았나 □ 받아내림 도움 첫 단계(12 − 5 같은 식)에서 막혔나 □ 지루해하거나 어려워한 곳 □ 손 든 곳(화면 맨 위 이름)</li>
    <li><b>끝나고 물을 것</b> — "어디가 헷갈렸어?" "제일 좋았던 것 · 싫었던 것 하나씩?"</li>
    <li>막힌 화면은 사진(아이 얼굴 X)으로 남겨 두면 바로 고칠 수 있어요.</li></ol>
    <h3>알아 두기</h3><ul class="easy"><li>순위 · 친구 비교는 없어요. 아이가 보는 숫자는 이번 주 점검의 내 맞힌 수(지난번과 비교) · 배우기로 고친 것 · 다시 풀어 맞힌 문제 · '자신 있어요' 하고 맞힌 문제 넷뿐이에요.</li><li>배워서 고친 칸은 1 · 3 · 7일 뒤 매일 연습에 섞여 다시 나와요.</li><li><b>AI에게 물어보기</b>(골라서 · 없어도 돼요 · 아이 자세히 맨 아래) — 번호만 들어간 근거 글로 막힌 까닭 후보 · 발문 · 확인 문항을 받아요. 글을 복사해 Claude에 붙여 넣으면 되고, 선생님 Claude API 키가 있으면 그 자리에서 바로 받거나 풀이 사진도 볼 수 있어요(키 · 사진은 이 기기 밖으로 저장되지 않아요). AI 답은 짐작이라 선생님이 확인한 뒤에만 써요.</li><li>효과는 앱 안 기록보다 다음 단원 형성평가로 보세요. 큰 변화는 한두 주가 아니라 한 학기에 걸쳐 나타나요.</li></ul></div>`;
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
      const pins = {}; for (let i = 1; i <= n; i++) pins[i] = rand(4, '0123456789');   /* 핀도 암호용 난수로(rand · local.js) */
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
  /* 열쇠 카드 QR · 링크로 오면(#/t/open?c=…&k=…) 채워서 바로 열고 주소창에서 열쇠를 지움 */
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  if (q.get('c') && q.get('k')) { root.querySelector('#c').value = q.get('c'); root.querySelector('#k').value = q.get('k'); history.replaceState(null, '', '#/t/open'); setTimeout(() => root.querySelector('#o').click(), 0); }
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
    <div class="acts"><button class="pri" onclick="print()">인쇄</button><button type="button" id="bk2">이 기기 백업 받기</button><a class="btn" href="#/t/c/${C}/check">다음: 점검 내기</a><a class="btn" href="#/t/c/${C}">반 화면으로</a></div>
    <p class="small muted">학교 컴퓨터는 껐다 켜면 기록이 지워지기도 해요 — 반을 만든 날 <b>백업</b>을 받아 USB나 내 드라이브에 두세요.</p></div>
    <div class="card keycard" style="border:2px solid var(--ink)"><h2>선생님 열쇠 카드 <small>남에게 보이지 마세요 · 화면을 TV에 띄울 땐 가려 두세요</small></h2>
      <p>반 코드 <b style="font-size:22px;letter-spacing:.08em">${esc(C)}</b> · 선생님 열쇠 <code class="tkey" style="font-size:18px">${'●'.repeat(8)}</code> <button type="button" class="mini no-print" id="kshow">열쇠 보기</button></p>
      <div class="kq kq-key hid">${qrSVG(`${url}#/t/open?c=${C}&k=${K.T}`, { px: 96 })}<p class="small">다른 기기(집 · 다른 교실)에서는 이 QR을 비추거나 아래 링크를 열면 바로 이 반이 열려요. 손으로 칠 땐 ${esc(url)}#/t/open 에 반 코드와 열쇠(24자)를 써요.</p></div>
      <div class="acts no-print"><button type="button" class="mini" id="kcopy">다른 기기에서 열 링크 복사</button><span class="small muted" id="kmsg"></span></div></div>
    <div class="cards">${Array.from({ length: K.n }, (_, i) => i + 1).map((no) => `<div class="kcard"><div style="display:flex;gap:8px;align-items:center">${mascot('hi', 40)}<b>튼튼 수 다리</b></div>
      <p style="margin:6px 0 0">반 코드 <span class="code">${esc(C)}</span></p><p style="margin:0">번호 <span class="no">${no}</span> · 핀 <span class="code">${esc(K.pins[no] || '')}</span></p>
      <div class="kq">${qrSVG(`${url}#/join?c=${C}&n=${no}`, { px: 96 })}<p class="small muted">크롬북 카메라로 QR을 찍으면 반 코드 · 번호가 써져요. 핀 네 자리만 쓰세요.</p></div>
      <p class="small muted" style="margin:4px 0 0;word-break:break-all">${esc(url)}</p><p class="small" style="margin:6px 0 0">이름: ____________</p></div>`).join('')}</div>`;
  root.querySelector('#bk2').addEventListener('click', backupDownload);
  const kt = root.querySelector('.tkey'), ks = root.querySelector('#kshow');
  ks.addEventListener('click', () => { const on = ks.textContent === '열쇠 보기'; kt.textContent = on ? K.T : '●'.repeat(8); ks.textContent = on ? '가리기' : '열쇠 보기'; root.querySelector('.kq-key').classList.toggle('hid', !on); });   /* 열쇠 QR도 같이(열쇠를 가려도 QR이 보이면 소용없던 것) */
  window.addEventListener('beforeprint', () => { kt.textContent = K.T; }, { once: true });   /* 인쇄한 열쇠 카드엔 열쇠가 보여야 함 */
  root.querySelector('#kcopy').addEventListener('click', async () => { const link = `${url}#/t/open?c=${C}&k=${K.T}`; let ok = false; try { await navigator.clipboard.writeText(link); ok = true; } catch (e) { ok = false; } root.querySelector('#kmsg').textContent = ok ? '복사했어요. 다른 기기의 주소창에 붙여 넣어요(남에게 보내지 마세요).' : link; });
}

export function namesView(root, C) {
  const K = cls(C); if (!K) return go('#/t');
  root.innerHTML = `<div class="card"><h2>이름 적기 <small>이 기기에만 저장 · 서버로 가지 않아요</small></h2>
    <div class="grid2">${Array.from({ length: K.n }, (_, i) => i + 1).map((no) => `<label class="field" style="flex-direction:row;align-items:center;gap:8px;margin:2px 0"><b style="min-width:36px">${no}</b><input data-no="${no}" value="${esc(K.names[no] || '')}" style="font-size:16px;letter-spacing:0"></label>`).join('')}</div>
    <div class="acts"><button class="pri" id="sv">저장</button><a class="btn" href="#/t/c/${C}">반 화면으로</a></div></div>`;
  root.querySelector('#sv').addEventListener('click', () => { const X = tget(); root.querySelectorAll('[data-no]').forEach((i) => { const v = i.value.trim(); if (v) X.classes[C].names[i.dataset.no] = v; else delete X.classes[C].names[i.dataset.no]; }); tset(X); go(`#/t/c/${C}`); });
}

// 아이가 쓴 요약은 믿지 않고 모양을 맞춰 읽는다(한 아이의 이상한 값이 반 화면 전체를 멈추지 않게)
const arr = (x) => (Array.isArray(x) ? x.filter((c) => typeof c === 'string' && LES(c)) : []);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
function normSt(st) {
  if (!st || typeof st !== 'object') return null;
  const L = {}; for (const [c, v] of Object.entries(obj(st.L))) if (LES(c) && typeof v === 'string' && ST[v]) L[c] = v;
  const num = (o) => Object.fromEntries(Object.entries(obj(o)).filter(([c, v]) => LES(c) && Number.isFinite(Number(v))).map(([c, v]) => [c, Number(v)]));
  return { bk: st.bk && typeof st.bk === 'object' && typeof st.bk.x === 'string' ? { x: st.bk.x.slice(0, 24), c: LES(st.bk.c) ? st.bk.c : '', r: LES(st.bk.r) ? st.bk.r : '', t: Number(st.bk.t) || 0, s: Number(st.bk.s) || 0 } : null, sw14: st.sw14 ? num(st.sw14) : null, rush14: Number.isFinite(Number(st.rush14)) && st.rush14 != null ? Number(st.rush14) : null, prep: st.prep && typeof st.prep === 'object' && typeof st.prep.u === 'string' ? { u: st.prep.u, why: String(st.prep.why || ''), t: Number(st.prep.t) || 0 } : null, L, start: arr(st.start), below: arr(st.below), under: arr(st.under), sw: num(st.sw), fixed: num(st.fixed), help: num(st.help), due: arr(st.due), t: Number(st.t) || 0, last: Number(st.last) || 0, cal: obj(st.cal), rush: Number(st.rush) || 0, mx: num(st.mx), mis: Object.fromEntries(Object.entries(obj(st.mis)).filter(([k, v]) => misById[k] && (v === 's' || v === 'm' || v === 'r'))), story: Object.fromEntries(Object.entries(obj(st.story)).filter(([k, v]) => /^[\w가-힣 ·]{1,24}$/.test(k) && v && typeof v === 'object').map(([k, v]) => [k, { n: Number(v.n) || 0, type: Number(v.type) || 0, frame: Number(v.frame) || 0, eq: Number(v.eq) || 0, ans: Number(v.ans) || 0 }])), tools: Object.fromEntries(Object.entries(obj(st.tools)).filter(([k, v]) => /^[a-z]+$/.test(k) && v && typeof v === 'object').map(([k, v]) => [k, { self: Number(v.self) || 0 }])), cko: Object.fromEntries(Object.entries(obj(st.cko)).filter(([k, v]) => /^[A-Za-z0-9-]{1,30}$/.test(k) && Number.isFinite(Number(v))).map(([k, v]) => [k, Number(v)])), lad: Array.isArray(st.lad) ? st.lad.filter((a) => Array.isArray(a) && /^\d{4}-\d\d-\d\d$/.test(a[0])).map((a) => [a[0], Number(a[1]) || 0, Number(a[2]) || 0, Number(a[3]) || 0, Number(a[4]) || 0]).slice(-8) : [], ck: Object.fromEntries(Object.entries(obj(st.ck)).filter(([k, v]) => /^[A-Za-z0-9-]{1,30}$/.test(k) && Number.isFinite(Number(v))).map(([k, v]) => [k, Number(v)])), gv: Object.fromEntries(Object.entries(obj(st.gv)).filter(([k, v]) => /^[A-Za-z0-9_-]{1,24}$/.test(k) && Array.isArray(v)).map(([k, v]) => [k, [Number(v[0]) || 0, Number(v[1]) || 0, Number(v[2]) || 0]])), jog: Array.isArray(st.jog) ? st.jog.filter((d) => typeof d === 'string' && /^\d{4}-\d\d-\d\d$/.test(d)) : [], wk: Array.isArray(st.wk) ? st.wk.filter((a) => Array.isArray(a) && /^\d{4}-\d\d-\d\d$/.test(a[0]) && Number.isFinite(Number(a[1])) && Number(a[2]) > 0).map((a) => ({ wk: a[0], ok: Number(a[1]), n: Number(a[2]), term: typeof a[3] === 'string' ? a[3] : null })).slice(-12) : [] };
}
const helpLeft = (st) => { const cs = [...(st.start || []), ...Object.keys(st.L || {}).filter((c) => st.L[c] === 'stuck')]; return cs.some((c) => !((st.fixed || {})[c] > ((st.prep && st.prep.t) || 0))); };   /* 여기서부터 + 막힌 칸(일찍 멈춘 점검은 여기서부터가 비기 쉬움) · 막힌 칸이 더 없으면 내림 */   /* '선생님과 같이'로 멈춘 점검에서 아직 안 고친 칸이 있나(다 고쳤으면 그 표시를 내림) */
const askWhy = (mode) => (mode === 'prep' ? '오늘 단원 점검에서 막힘' : mode === 'fix' ? '배우기에서 막힘' : mode === 'back' ? '거꾸로 찾기에서 막힘' : '선생님과 같이 볼 것이 있음');   /* 아이가 손을 든 자리(now.ask) */
const sameDay = (t) => new Date(t).toDateString() === new Date().toDateString();
const normNow = (n) => (n && typeof n === 'object' ? { mode: String(n.mode || ''), c: typeof n.c === 'string' ? n.c : '', n: Number(n.n) || 0, t: Number(n.t) || 0, sos: Number(n.sos) || 0, ask: Number(n.ask) || 0 } : null);
// 아이 요약 모으기(8개씩 동시에) — 열린 연결 없이 짧은 요청만
export async function pullAll(C, K) {
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
const STR = { 상: '근거 강함', 중: '근거 보통', 하: '근거 약함(교사 자료 · 앱 관찰)' };
//  summary 대신 label을 주면 그 말로 접어 둠(묶음 칸 안에서 '자세히')
export function misCard(m, tag = '', label = '') {
  return `<details class="mis"><summary>${label ? esc(label) : `<b>${esc(m.title)}</b>`}${tag ? ` <span class="pill">${esc(tag)}</span>` : ''}${label ? '' : `<span class="sum-p">${esc(m.plain || m.think)}</span>`}</summary>
    <dl><dt>아이 생각</dt><dd>${esc(m.think)}</dd><dt>이렇게 틀려요</dt><dd>${esc(m.shows)}</dd>${m.plain ? '' : `<dt>왜 그럴까요</dt><dd>${esc(whyOf(m))}</dd>`}
    ${m.ask ? `<dt>이렇게 물어요</dt><dd>“${esc(m.ask)}”</dd>` : ''}<dt>도와주는 법</dt><dd>${esc(easy(m.fix))}</dd><dt>알아보는 문제</dt><dd>${esc(easy(m.probe))}</dd>${m.has === 'no' ? '<dt>앱</dt><dd>아직 앱 문제로 잡지 못해요. 수업에서 직접 물어봐 주세요.</dd>' : ''}<dt>근거</dt><dd class="small muted">${esc(STR[m.str] || '')} · <a href="https://github.com/chang333787-boop/tuntun-math/tree/main/docs/research" target="_blank" rel="noopener">연구 자료</a> ${esc(m.refs)}</dd></dl></details>`;
}
const CELL = { ok: ['c-ok', '✓'], pass: ['c-pass', '✓'], near: ['c-near', '○'], shaky: ['c-shaky', '△'], stuck: ['c-stuck', '✕'], need: ['c-need', '?'], none: ['c-none', '·'] };
// 표 읽는 법(반 화면 · 한 장 안내) — 칸 색 그대로
const LEGEND = [['c-ok', '✓', '됨'], ['c-near', '○', '거의'], ['c-shaky', '△', '흔들림'], ['c-stuck', '✕', '막힘'], ['c-start', '★', '여기서부터 배울 것'], ['c-need', '?', '더 볼 것'], ['c-none', '·', '아직 안 봄']];   /* '빠르게도 됨 · 며칠 뒤에도 됨'은 지금 칸이 나오지 않아 범례에서 뺌(숙련 축을 되살릴 때 다시 · 2라운드 재반박 11-08) */

// 틀린 뒤 고친 힘(도움 사다리 · 교사 11-07 '단계적으로 하나씩 해내는 힘') — 주 [주, 떠올려 고침, 풀이 순서로 고침, 답 봄, 보기 다시 고름]
//  스스로 = (떠올려 + 풀이 순서로) ÷ (떠올려 + 풀이 순서로 + 답 봄) · 보기 다시 고르기는 빼고 셈(찍어도 맞을 수 있음 · docs/hint_ladder.md)
const ladPct = (a) => { const n = a[1] + a[2] + a[3]; return n ? Math.round(((a[1] + a[2]) / n) * 100) : null; };
const wkShort = (w) => String(w).slice(5).replace('-', '/');
function ladCard(C, K, S) {
  const nos = Array.from({ length: K.n }, (_, i) => String(i + 1)), rows = nos.map((no) => ({ no, lad: (S[no] && S[no].st && S[no].st.lad) || [] })).filter((x) => x.lad.length);
  if (!rows.length) return `<div class="card"><h2>틀린 뒤 스스로 고친 비율 <small>주마다</small></h2><p class="muted">아직 기록이 없어요. 아이가 선생님이 준 문제 · 매일 연습 · 배우기에서 틀리면 도움 사다리 기록이 쌓여요.</p></div>`;
  const wks = [...new Set(rows.flatMap((x) => x.lad.map((a) => a[0])))].sort().slice(-4);
  const sum = (w) => rows.reduce((t, x) => { const a = x.lad.find((v) => v[0] === w); if (a) { t[1] += a[1]; t[2] += a[2]; t[3] += a[3]; } return t; }, [w, 0, 0, 0, 0]);
  const cls = wks.map((w) => { const t = sum(w), p = ladPct(t); return `${wkShort(w)} ${p == null ? '—' : `${p}%`}`; }).join(' → ');
  return `<div class="card"><h2>틀린 뒤 스스로 고친 비율 <small>주마다</small></h2>${intro(`틀린 뒤 <b>스스로 고친 비율</b>이에요(떠올리기로 고침 + 풀이 순서로 고침 ÷ 도움을 받은 문제). 반 전체: <b>${cls}</b>. 반 표 판정은 첫 답만 써요.`)}
    <div class="ctab"><table><tr><th class="l">아이</th>${wks.map((w) => `<th>${wkShort(w)} 주</th>`).join('')}</tr>${rows.map((x) => `<tr><td class="l"><a href="#/t/c/${C}/k/${x.no}">${esc(nm(K, x.no))}</a></td>${wks.map((w) => { const a = x.lad.find((v) => v[0] === w), p = a ? ladPct(a) : null; return `<td>${p == null ? '' : `${p}% <span class="small muted">(${a[1] + a[2]}/${a[1] + a[2] + a[3]})</span>`}</td>`; }).join('')}</tr>`).join('')}</table></div></div>`;
}

export function classView(root, C) {
  const K = cls(C); if (!K) return go('#/t');
  let unit = (K.today && K.today.unit) || UNITS.find((u) => u.g === K.g && prepPlan(u.id).fringe.length)?.id || '4-2-1';
  let data = null, timer = null, alive = true, tasks = {};   /* tasks = 보낸 보충(tc/<반>/<열쇠>/tasks) — '아이마다 다음 할 것'이 보낸 보충을 알게 */
  function render() {
    const P = prepPlan(unit);
    const rows = Array.from({ length: K.n }, (_, i) => String(i + 1));
    const S = data || {};
    // 묶음 제안 — 같은 '고칠 판자'끼리(둘 이상)
    const groups = {};
    rows.forEach((no) => { const st = S[no] && S[no].st; if (st) st.start.forEach((c) => (groups[c] = groups[c] || []).push(no)); });
    const glist = Object.entries(groups).filter(([, v]) => v.length >= 2).sort((a, b) => b[1].length - a[1].length);
    // 먼저 볼 아이 — 고치기를 해도 흔들림 · 막힌 칸이 많음(깊은 결손 — 자동 처방보다 선생님 먼저 [A-R27]) · 자신 있었는데 틀림 [D-1]
    const first = rows.map((no) => { const st = S[no] && S[no].st; if (!st) return null; const why = []; if (st.prep && st.prep.why === 'teacher' && K.today && st.prep.u === K.today.unit && st.prep.t >= K.today.t && helpLeft(st)) why.unshift('오늘 단원 점검에서 막힌 칸이 많아 일찍 멈춤 — 같이 봐 주세요'); const help = Object.keys(st.help || {}); if (help.length) why.push(`배우고도 흔들림: ${[...new Set(help.map((c) => (skillsOf(c)[0] || {}).name || lessonName(c)))].join(', ')}`); const deep = st.start.length + st.under.length; if (deep >= 4) why.push(`막힌 칸 ${deep}개`); const sw = Object.values((st.sw14 || st.sw) || {}).reduce((a, b) => a + b, 0), rush = st.rush14 != null ? st.rush14 : st.rush; if (sw >= 3) why.push(`자신 있었는데 틀림 ${sw}문제(최근 2주)`); if (rush >= 2) why.push(`2초 안에 찍기 ${rush}번(최근 2주 · 결과를 그대로 믿기 어려워요)`); const stuckN = Object.entries(st.L).filter(([c, v]) => v === 'stuck' && P.below.includes(c)).length; if (!st.start.some((c) => P.below.includes(c)) && stuckN >= 3) why.push(`막힌 칸 ${stuckN}개인데 어디서부터인지 아직 못 찾음 — 같이 봐 주세요`); const wl = lastLine(st.wk || []); if (weekTrend(wl) === 'down') why.push(`이번 주 점검 맞힌 수가 줄어듦(${wl.slice(-3).map((v) => v.ok).join('→')}개)`); return why.length ? { no, why } : null; }).filter(Boolean);
    const seen = rows.filter((no) => S[no] && S[no].st).length;
    const uName = unitLabel(unit);
    /* 다시 그려도 선생님이 보던 것은 그대로 — 열어 둔 접힘 · 표 가로 스크롤 · 화면 높이(15초마다 새로 볼 때 닫히고 처음으로 돌아가던 것 · 혹평 10-31) */
    const keep = { open: [...root.querySelectorAll('details')].map((d) => d.open), sx: (root.querySelector('.ctab') || {}).scrollLeft || 0, y: window.scrollY };
    const card3 = (k, no, t, what, body, href, btn, ic) => `<section class="c3 t3 act-${k}"><div class="c3-h"><span class="c3-no">${no}</span><span class="ico act-${k}">${icon(ic, 30)}</span><h2>${t}</h2></div><p class="c3-what">${what}</p><div class="c3-body">${body}</div><a class="btn big c3-go" href="${href}">${btn}</a></section>`;
    const gvSent = rows.reduce((a, no) => a + Object.keys((S[no] && S[no].st && S[no].st.gv) || {}).length, 0);
    const wseen = lsGet(`tt.wseen.${C}`, {}) || {}, gone = (no, t) => Number(wseen[no]) >= t;   /* '다녀왔어요'를 누른 때(이 기기에만) — 그 뒤에 새로 손 들면 다시 뜸 */
    const waitOf = (no) => { const n = S[no] && S[no].now; return !n ? '' : n.ask && Date.now() - n.ask < 15 * 60e3 && !gone(no, n.ask) ? askWhy(n.mode) : n.sos && Date.now() - n.sos < 10 * 60e3 && !gone(no, n.sos) ? '도움을 다 쓰고 답을 봄' : ''; }, waitL = rows.filter(waitOf), first2 = first.filter((x) => !waitOf(x.no));   /* 선생님을 기다리는 아이(손 듦 15분 · 답을 봄 10분) — '먼저 봐 줄 아이'에는 겹쳐 쓰지 않음 */
    const waitSk = (no) => { const n = S[no] && S[no].now; return n && n.ask && n.c ? (skillsOf(n.c)[0] || {}).name || lessonName(n.c) : ''; }, waitGo = (no) => { const n = S[no] && S[no].now; return n && n.ask && n.c ? [`#/t/c/${C}/g/${encodeURIComponent(n.c)}?no=${no}`, '10분 카드 보기'] : [`#/t/c/${C}/k/${no}`, '자세히 보기']; };
    root.innerHTML = `<div class="card hub-h no-print"><h2>${esc(C)} <small>${esc(gl(K.g))} · ${K.n}명 · 기록 있는 아이 ${seen}명</small></h2>
      ${waitL.length ? `<div class="hub-wait">${waitL.map((no) => { const [h, a] = waitGo(no); return `<p><b class="sos">선생님을 기다려요</b> <a href="#/t/c/${C}/k/${no}"><b>${esc(nm(K, no))}</b></a> — ${esc(waitOf(no))}${waitSk(no) ? ` · <b>${esc(waitSk(no))}</b>` : ''} <a class="btn pri" href="${esc(h)}">${a}</a><button type="button" class="btn mini" data-seen="${no}">다녀왔어요</button></p>`; }).join('')}</div>` : ''}
      ${seen ? `<p class="hub-now"><button type="button" class="btn mini" id="gonx">아이마다 다음 할 것 보기 ↓</button></p>` : ''}
            ${!seen ? `<div class="first-day"><b>처음이세요? 이 차례로 시작해요</b><ol>
        <li><a href="#/t/c/${C}/cards">아이 카드 인쇄</a> — 잘라서 나눠 주고, 아이들은 카드의 QR을 크롬북 카메라로 비추거나 반 코드 · 번호 · 핀을 써서 들어와요.</li>
        <li><a href="#/t/c/${C}/check">점검 내기</a> — 처음엔 <b>점검지(사전 점검)</b>를 권해요. 우리 반이 어디까지 아는지 한 번에 보여요. 아이 처음 화면 '점검' 카드에 떠요.</li>
        <li>아이들이 풀면 <b>반 표</b>가 채워져요 — 부족한 아이에게 줄 끝 <b>보충 주기</b>를 눌러요.</li></ol></div>` : ''}
      <div class="acts sub"><button id="re" class="btn">새로고침</button><a class="btn" href="#/t/c/${C}/cards">아이 카드 인쇄</a><a class="btn" href="#/t/c/${C}/names">이름 적기</a><a class="btn" href="#/t/guide">한 장 안내</a></div>
      <p class="small muted local-note">아이 이름 · 선생님 열쇠는 <b>이 기기에만</b> 있어요(서버엔 번호만). 기기를 바꾸거나 기록을 지우기 전에 <a href="#/t">선생님 처음 화면</a>에서 <b>백업</b>을 내려받아요.</p>
      <p class="qmsg tight" id="msg"></p></div>
    <div class="cards3">
      ${card3('week', 1, '점검 내기', '아이들이 어디까지 아는지 알아봐요 — 오늘 단원 점검 · 종이와 같은 점검지 · 이번 주 점검', checkCard(C, K, data || {}) || (K.today ? `<p class="small">지금 열린 단원: <b>${esc(unitLabel(K.today.unit))}</b></p>` : '<p class="c3-none">아직 낸 점검이 없어요</p>'), `#/t/c/${C}/check`, '점검 내기', 'clip')}
      ${card3('drill', 2, '반 표', '누가 무엇이 부족한지 한눈에 봐요 — 가로줄 = 셈 기능 · 세로줄 = 아이 번호', tableCard(C, K, data), `#/t/c/${C}/table`, '반 표 보기', 'table')}
      ${card3('fix', 3, '보충 주기', '부족한 아이에게 그 기능 문제를 보내요 — 아이 화면 또는 종이(같은 문제)', gvSent ? `<p class="small">아이들이 푼 보충 <b>${gvSent}개</b></p>` : '<p class="c3-none">아직 보낸 보충이 없어요</p>', `#/t/c/${C}/give`, '보충 주기', 'send')}
    </div>
    <div class="trow">${first2.length ? `<div class="card first"><h2>먼저 봐 줄 아이 <small>${first2.length}명</small></h2>${intro('앱이 혼자 고치기 어려워 보이는 아이예요. 수업 중에 먼저 들러 주세요. 이름을 누르면 자세히 봐요.')}<ul class="who">${first2.map((x) => `<li><a href="#/t/c/${C}/k/${x.no}">${esc(nm(K, x.no))}</a><span class="whys">${x.why.map((w) => `<span class="pill">${esc(w)}</span>`).join('')}</span></li>`).join('')}</ul></div>` : ''}
    ${(() => { const today = K.today && K.today.unit === unit ? K.today : null, fresh = (n) => n && n.t && Date.now() - n.t < 3 * 60000;
      const MODE = { prep: '오늘 단원 점검', fix: '배우는 중', run: '매일 연습', back: '거꾸로 찾기', story: '이야기 문제', week: '이번 주 점검', review: '다시 보기', give: '선생님이 준 문제', check: '점검지' };
      const g = { out: [], in: [], doing: [], done: [], fix: [], help: [], more: [] }, fin = [];   /* fin = 오늘 단원 점검을 끝낸 아이 모두(지금 다른 걸 하는 중이어도 · 점검 카드의 '끝낸 아이'와 같은 수) */
      rows.forEach((no) => { const x = S[no] || {}, st = x.st, n = x.now;
        const done = st && st.prep && today && st.prep.u === unit && st.prep.t >= today.t;
        if (done) fin.push(no);
        if (!st && !fresh(n)) return g.out.push(no);
        if (fresh(n) && n.mode && n.mode !== 'home') return g.doing.push([no, MODE[n.mode] || n.mode]);   /* 기다리는 아이는 맨 위 '선생님을 기다려요' 줄에(waitL) */
        if (done && st.prep.why === 'teacher' && helpLeft(st)) return g.help.push(no);
        if (done && st.start.some((c) => P.below.includes(c))) return g.fix.push(no);
        if (done && (st.prep.why === 'budget' || P.below.some((c) => ['stuck', 'shaky', 'need'].includes(st.L[c])))) return g.more.push(no);   /* 문제 수에서 멈췄거나 흔들 · 막힌 칸이 남음 — '튼튼'이 아님(회귀 10-31) */
        if (done) return g.done.push(no);
        g.in.push(no); });
      const names = (xs) => xs.map((no) => `<a href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a>`).join(' ');
      return `<div class="card strip"><h2>지금 우리 반 <small>${today ? `${esc(uName)} — ${new Date(today.t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 열었어요` : '오늘 단원 점검을 열면 끝낸 아이가 보여요'}</small></h2>
        ${waitL.length ? `<div class="st-row help"><span class="st-k">선생님을 기다려요 <b>${waitL.length}</b></span><span class="st-v">${waitL.map((no) => `<a href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a><i>${esc(waitOf(no))}${waitSk(no) ? ` · ${esc(waitSk(no))}` : ''}</i>`).join(' ')} <span class="muted small">— 먼저 들러 주세요</span></span></div>` : ''}
        <div class="st-row${g.doing.length ? '' : ' zero'}"><span class="st-k">하는 중 <b>${g.doing.length}</b></span><span class="st-v">${g.doing.map(([no, m]) => `<a href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a><i>${esc(m)}</i>`).join(' ') || '<span class="muted">없음</span>'}</span></div>
        ${today && g.help.filter((no) => !waitOf(no)).length ? `<div class="st-row help"><span class="st-k">선생님과 같이 <b>${g.help.filter((no) => !waitOf(no)).length}</b></span><span class="st-v">${names(g.help.filter((no) => !waitOf(no)))} <span class="muted small">— 막힌 칸이 많아 앱이 일찍 멈췄어요. 먼저 들러 주세요.</span></span></div>` : ''}
        ${today ? (() => `<div class="st-row${fin.length ? '' : ' zero'}"><span class="st-k">점검 끝 <b>${fin.length}</b></span><span class="st-v">${names(fin) || '<span class="muted">없음</span>'}${fin.length ? ' <span class="muted small">— 누가 무엇이 부족한지는 반 표에서</span>' : ''}</span></div>`)() : ''}
        <div class="st-row${g.in.length ? '' : ' zero'}"><span class="st-k">${today ? '아직 점검 전' : '들어온 적 있음'} <b>${g.in.length}</b></span><span class="st-v">${names(g.in) || '<span class="muted">없음</span>'}</span></div>
        <div class="st-row${g.out.length ? '' : ' zero'}"><span class="st-k">안 들어옴 <b>${g.out.length}</b></span><span class="st-v">${names(g.out) || '<span class="muted">없음</span>'}</span></div></div>`; })()}</div>
    ${(() => { let items = rows.map((no) => { const x = S[no] || {}, st = x.st; if (!st) return null; const rep = { L: Object.fromEntries(Object.entries(st.L || {}).map(([c, v]) => [c, { c, st: v }])), start: (st.start || []).map((c) => ({ c })) }; const inbox = Object.fromEntries(Object.entries(tasks).filter(([, v]) => Array.isArray(v.who) && v.who.map(String).includes(no))), recs = Object.fromEntries(Object.keys((st && st.gv) || {}).map((id) => [id, 1])); return { no, nx: nextOf({ C, no, rep, st, inbox, now: x.now, recs, opened: !!(K.today && sameDay(K.today.t)), seen: wseen[no] }) }; }).filter(Boolean); const waiting = items.filter((y) => !y.nx.a && /푸는 중/.test(y.nx.t)).map((y) => y.no), notYet = items.filter((y) => !y.nx.a && /점검을 풀지 않았어요/.test(y.nx.t)).map((y) => y.no), busy = items.filter((y) => !y.nx.a && /^지금 <b>/.test(y.nx.t)).map((y) => [y.no, (/<b>(.*?)<\/b>/.exec(y.nx.t) || [])[1] || '']);   /* 하는 중이라 할 일이 비어 목록에서 빠지던 아이(처음 보는 눈 11-07) */ items = items.filter((y) => y.nx.a); if (!items.length && !waiting.length && !notYet.length && !busy.length) return ''; const rank = (t) => (/선생님을 기다려요/.test(t) ? -1 : /부족한 것|여기서부터|선생님과 같이/.test(t) ? 0 : /점검을 하지/.test(t) ? 1 : 2); items.sort((p, q) => rank(p.nx.t) - rank(q.nx.t));   /* 급한 아이부터 */
      const bySk = {}; items.forEach(({ no, nx }) => { const m = /give\?sk=([^&]+)&who=/.exec(nx.href || ''); if (m && SKILL[m[1]] && /부족한 것|여기서부터/.test(nx.t)) (bySk[m[1]] = bySk[m[1]] || []).push(no); });   /* 가끔 틀림(더 다지기)은 묶지 않음 — '필요'와 '줘도 돼요'가 섞이지 않게 */
      const grp = Object.entries(bySk).filter(([, ns]) => ns.length >= 2).map(([sk, ns]) => [sk, ns.slice().sort((p, q) => p - q)]).map(([sk, ns]) => `<p class="nx-grp">다음 할 것이 같은 아이 <b>${ns.length}명</b> — <b>${esc(SKILL[sk].name)}</b> 보충: ${ns.map((no) => `<a href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a>`).join(' · ')} <a class="btn mini teal" href="#/t/c/${C}/give?sk=${sk}&who=${ns.join(',')}">${ns.length}명에게 한꺼번에 보내기</a></p>`).join('');   /* 아이마다 따로 누르지 않게 */
      return `<details class="card nexts" open><summary><b>아이마다 다음 할 것</b> <span class="small muted">${items.length}명 · 번호를 누르면 자세히</span></summary>${waiting.length ? `<p class="small">보낸 보충 푸는 중: <b>${waiting.map((no) => esc(nm(K, no))).join(' · ')}</b> — 다 풀면 결과에 따라 이 목록에 다시 떠요.</p>` : ''}${busy.length ? `<p class="small">지금 하는 중: ${busy.map(([no, m]) => `<b>${esc(nm(K, no))}</b>${m ? `(${esc(m)})` : ''}`).join(' · ')} — 끝나면 할 일이 이 목록에 떠요.</p>` : ''}${notYet.length ? `<p class="small">오늘 단원 점검을 아직 안 푼 아이: <b>${notYet.map((no) => esc(nm(K, no))).join(' · ')}</b> — 아이 처음 화면 '점검' 카드에서 시작하라고 알려 주세요.</p>` : ''}${grp}${(() => { const inGrp = new Set(Object.values(bySk).filter((ns) => ns.length >= 2).flat()), li = ({ no, nx }) => `<li><a class="nx-no" href="#/t/c/${C}/k/${no}">${esc(nm(K, no))}</a><span class="nx-t">${nx.t}</span><a class="btn mini" href="${esc(nx.href)}">${esc(nx.a)}</a></li>`;
        const main = items.filter((y) => !inGrp.has(y.no) && !/^가끔 틀리는 것/.test(y.nx.t.replace(/^<span class="chip-now">[^<]*<\/span> /, ''))), soft = items.filter((y) => !inGrp.has(y.no) && /^가끔 틀리는 것/.test(y.nx.t.replace(/^<span class="chip-now">[^<]*<\/span> /, '')));   /* 묶음에 든 아이는 묶음 줄에만 · 가끔 틀림은 접어 둠(28명 반에서 27줄이 되던 것) */
        return `${main.length ? `<ul class="nx-list">${main.map(li).join('')}</ul>` : ''}${soft.length ? `<details class="nx-soft"><summary>가끔 틀리는 아이 <b>${soft.length}명</b> <span class="small muted">— 매일 연습에 저절로 섞여요 · 더 다지려면 보충</span></summary><ul class="nx-list">${soft.map(li).join('')}</ul></details>` : ''}`; })()}</details>`; })()}
    <details class="card more-all"><summary><b>더 보기</b> <span class="small muted">틀린 뒤 스스로 고친 비율 · 같은 생각끼리 · 이야기 문제 · 이번 주 점검 맞힌 수 · 같은 칸을 배울 아이끼리 · 기록 내려받기 · 종이 결과</span></summary>
      <div class="acts sub"><button id="csv" class="btn" title="효과를 재거나 기록해 둘 때 — 번호만 들어가요(이름 X)">기록 내려받기(CSV)</button><a class="btn" href="#/t/c/${C}/paper" title="종이로 푼 점검 결과를 아이 기록에 넣어요">종이 결과 가져오기</a><a class="btn" href="#/t/sheet?c=${C}" title="기능 이름으로 골라 한 아이에게 그 칸만 연습시키는 종이">맞춤 연습지</a></div>
      ${ladCard(C, K, S)}
    <div class="tmore">${(() => { const cnt = {}; rows.forEach((no) => { const st = S[no] && S[no].st; if (st) for (const [id, v] of Object.entries(st.mis || {})) { const e = (cnt[id] = cnt[id] || { s: [], m: [], r: [] }); e[v].push(no); } });
      const list = Object.entries(cnt).filter(([, e]) => e.s.length || e.r.length).sort((a, b) => b[1].s.length - a[1].s.length || b[1].m.length - a[1].m.length).slice(0, 8);
      return list.length ? `<div class="card"><h2>같은 생각끼리</h2>${intro('틀린 칸이 아니라 <b>틀린 까닭</b>이 같은 아이끼리 묶었어요. 2~3명을 모아 <b>이 생각 10분 카드</b>로 함께 짚어 주세요. 누구를 넣고 뺄지는 선생님이 정해요.')}<div class="groups">${list.map(([id, e]) => { const m = misById[id], t = TOOLS[CARD_TOOL[id]]; return `<div class="grp"><b class="g-t">${esc(m.title)}</b><p class="g-p">${esc(whyOf(m))}</p><p class="g-ex">예: ${esc(m.shows)}</p>
        <p class="g-who">${e.s.length ? `여러 번 보인 아이 <b>${e.s.map((no) => esc(nm(K, no))).join(', ')}</b>` : ''}${e.m.length ? `${e.s.length ? ' · ' : ''}한 번 보임 ${e.m.length}명` : ''}${e.r.length ? `${e.s.length || e.m.length ? ' · ' : ''}<span class="okc">고친 아이 ${e.r.length}명</span>` : ''}</p>
        ${t ? `<p class="g-tool">앱 도구 ${icon('search', 16)} ${esc(t.name)}</p>` : ''}${e.s.length ? `<div class="acts"><a class="btn teal" href="#/t/c/${C}/m/${id}">이 생각 10분 카드</a></div>` : ''}${misCard(m, '', '이 생각 자세히')}</div>`; }).join('')}</div></div>` : ''; })()}
    ${(() => { const L2 = rows.map((no) => { const st = S[no] && S[no].st; const x = st ? storyStep(st.story) : null; return x ? { no, ...x } : null; }).filter(Boolean); if (!L2.length) return '';
      const g = {}; L2.forEach((x) => { if (x.weak) (g[x.weak] = g[x.weak] || []).push(x.no); });
      return `<div class="card"><h2>이야기 문제 — 문장제가 어디서 끊기나</h2><p class="small muted">이야기 문제를 여덟 문제 넘게 푼 아이 ${L2.length}명을, 이해(무슨 이야기인지 · 막대 그림) → 바꾸기(식) → 계산(답) 가운데 처음 끊기는 것 같은 곳으로 묶었어요(짐작 — 수업에서 한 번 더 확인). 이해에서 끊기는 아이는 계산 연습보다 '나눠 읽기'부터예요.</p>${Object.keys(g).length ? `<ul>${Object.entries(g).map(([w, nos]) => `<li><b>${esc(w)}</b> — ${nos.map((no) => esc(nm(K, no))).join(', ')}</li>`).join('')}</ul>` : '<p>세 걸음 모두 잘하고 있어요.</p>'}${(() => { const byT = {}; L2.forEach((x) => x.types.forEach((sh) => { const ty = Object.keys(TYPES).find((k) => TYPES[k].short === sh); if (ty) (byT[ty] = byT[ty] || []).push(x.no); })); const ks = Object.keys(byT); return ks.length ? `<p class="small"><b>유형별 10분 카드</b> — 이해가 끊기는 유형</p><div class="acts">${ks.map((ty) => `<a class="btn teal" href="#/t/c/${C}/s/${ty}" title="${byT[ty].map((no) => esc(nm(K, no))).join(', ')}">${esc(TYPES[ty].kid)} · ${byT[ty].length}명</a>`).join('')}</div>` : ''; })()}</div>`; })()}
    ${(() => { const W = rows.map((no) => { const st = S[no] && S[no].st; const all = st ? st.wk : [], ws = lastLine(all); return { no, ws, last: all[all.length - 1], tr: weekTrend(ws) }; }); const any = W.filter((x) => x.ws.length); if (!any.length) return '';
      const sc = (v) => Math.round((v.ok / v.n) * 10), wk = weekKey(), list = (xs) => xs.map((x) => `${esc(nm(K, x.no))}(${x.ws.slice(-4).map((v) => v.ok).join('→')})`).join(', ');
      const down = any.filter((x) => x.tr === 'down'), low = any.filter((x) => x.tr !== 'down' && x.ws.length >= 3 && x.ws.slice(-3).reduce((a, v) => a + sc(v), 0) / 3 <= 5.5), up = any.filter((x) => x.tr === 'up'), not = W.filter((x) => !(x.last && x.last.wk === wk));
      return `<div class="card"><h2>이번 주 점검 — 맞힌 수</h2><p class="small muted">주 1회 섞은 열 문제 — 이번 학기 단원 칸 여섯(아직 안 배운 것도) + 앞 학기 기초 칸 넷. 학기 내내 같은 범위라, 학기 초엔 적게 맞히고 배울수록 많이 맞혀요. 다섯 주 넘게 쌓이고 두 주 이어서 같은 쪽일 때만 '늘어요 · 줄어요'를 말해요. 줄거나 적게 그대로면, 그 아이에게 하던 방법을 바꿔 볼 때예요. 괄호 안은 주마다 맞힌 수예요.</p><ul>${down.length ? `<li><b>줄어요</b> — ${list(down)}</li>` : ''}${low.length ? `<li><b>적게 그대로</b> — ${list(low)}</li>` : ''}${up.length ? `<li>늘어요 — ${list(up)}</li>` : ''}<li class="muted">이번 주 아직 — ${not.length ? not.map((x) => esc(nm(K, x.no))).join(', ') : '없음'}</li></ul></div>`; })()}
    <div class="card"><h2>같은 차시를 배울 아이끼리</h2>${intro('같은 차시를 배워야 하는 아이끼리예요. <b>10분 소집단 카드</b>로 시범 → 함께 → 혼자 차례로 가르칠 수 있어요.')}
      ${glist.length ? `<div class="groups">${glist.map(([c, nos]) => `<div class="grp"><b class="g-t">${esc(lessonName(c))}</b><p class="g-who">${nos.map((no) => esc(nm(K, no))).join(', ')} <span class="muted">(${nos.length}명)</span></p><div class="acts"><a class="btn teal" href="#/t/c/${C}/g/${encodeURIComponent(c)}">10분 소집단 카드</a></div></div>`).join('')}</div>` : '<p class="muted">아직 같은 칸에 둘 이상 몰린 곳이 없어요.</p>'}</div></div>
    </details>
    `;
    root.querySelectorAll('details').forEach((d, i) => { if (keep.open[i]) d.open = true; });
    if (data) window.scrollTo(0, keep.y);
    root.querySelector('#re').addEventListener('click', refresh);
    root.querySelectorAll('[data-seen]').forEach((b) => b.addEventListener('click', () => { const w = lsGet(`tt.wseen.${C}`, {}) || {}; w[b.dataset.seen] = Date.now(); lsSet(`tt.wseen.${C}`, w); render(); }));
    document.title = waitL.length ? `(${waitL.length}) 선생님을 기다려요 · 튼튼 수 다리` : '튼튼 수 다리';   /* 다른 탭을 보고 있어도 손 든 아이가 보이게 */
    { const gx = root.querySelector('#gonx'); if (gx) gx.addEventListener('click', () => { const n = root.querySelector('.nexts'); if (n) { n.open = true; n.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }); }
    root.querySelector('#csv').addEventListener('click', () => exportCSV(C, K, S, unit));
  }
  async function refresh() { if (!alive) return; const [d, , tk] = await Promise.all([pullAll(C, K), syncChecks(C).catch(() => null), db.get(`tc/${C}/${K.T}/tasks`).catch(() => null)]); data = d; tasks = Object.fromEntries(Object.entries(tk || {}).map(([id, v]) => [id, db.dec(v)]).filter(([, v]) => v && v.kind === 'give')); if (!alive) return; Object.assign(K, cls(C) || {});
    try { const lv = db.dec(await db.get(`tc/${C}/${K.T}/live`)); if (lv && typeof lv.unit === 'string' && Number(lv.t) > ((K.today && K.today.t) || 0)) { const X = tget(); X.classes[C].today = { unit: lv.unit, t: Number(lv.t), len: Number(lv.len) || 24 }; tset(X); Object.assign(K, X.classes[C]); if (!K.today || unit !== lv.unit) unit = lv.unit; } } catch (e) { /* */ }   /* 다른 기기에서 연 단원도(회귀 10-31) */ const a = document.activeElement; if (a && root.contains(a) && /SELECT|INPUT|TEXTAREA/.test(a.tagName)) return; render(); }   /* 고르는 중엔 다시 그리지 않음 */
  render(); refresh();
  timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
  return () => { alive = false; clearInterval(timer); };
}
function nowText(n) {
  if (!n || !n.t) return '';
  const m = Math.round((Date.now() - n.t) / 60000);
  if (m > 20) return '';
  return n.mode === 'prep' ? `오늘 단원 점검 ${n.n || 0}문제` : n.mode === 'fix' ? `배우는 중: ${esc(lessonName(n.c))}` : n.mode === 'run' ? '매일 연습 중' : n.mode === 'back' ? `거꾸로 찾는 중: ${esc(lessonName(n.c))}` : n.mode === 'story' ? '이야기 문제' : n.mode === 'week' ? '이번 주 점검 중' : n.mode === 'give' ? '선생님이 준 문제' : n.mode === 'check' ? '점검지 푸는 중' : '';
}

// 지도를 바꾼 때 — 서버엔 이 칩만(자유 글 X)
const NOTE_K = { group: '소집단', tool: '검산 도구 연습', model: '모형 · 그림', form: '다른 문제 꼴', time: '시간 더 줌', pair: '짝 활동', sheet: '보충지', home: '가정 연계' };
// 아이 자세히 — 종이와 같은 판정 · 원인은 '한 번 보임'(가설) / '되풀이됨'(서로 다른 문항 둘 이상) [A-R11][A-R12]
/* 다음 할 것 — 아이 하나의 기록 · 받은 과제 · 지금 하는 것으로 선생님이 바로 할 일 하나(아이 자세히 맨 위 · 반 화면과 같은 말) */
/* 아이가 지금 앱을 하고 있어도 '다음 할 것'은 그대로 보이고 앞에 '지금 ○○ 하는 중'만 붙임 — 수업 중 28명이 앱을 쓰는 동안 핵심 칸이 비던 것(비판 토론 C1 11-08) · 도움을 다 쓰고 답을 본 때만 그 말이 먼저 */
export function nextOf(o) {
  const n0 = nextCore(o), now = o.now;
  if (!(now && now.mode && now.mode !== 'home' && Date.now() - (Number(now.t) || 0) < 5 * 60e3) || n0.busy) return n0;
  const MODE = { prep: '오늘 단원 점검', fix: '배우기', run: '매일 연습', story: '이야기 문제', week: '이번 주 점검', give: '선생님이 준 문제', check: '점검지', back: '거꾸로 찾기' };
  return { ...n0, t: `<span class="chip-now">지금 ${esc(MODE[now.mode] || '앱')} 하는 중</span> ${n0.t}` };
}
function nextCore({ C, no, rep, st, inbox = {}, now = null, recs = {}, opened = false, seen = 0 }) {
  const MODE = { prep: '오늘 단원 점검', fix: '배우기', run: '매일 연습', story: '이야기 문제', week: '이번 주 점검', give: '선생님이 준 문제', check: '점검지', back: '거꾸로 찾기' };
  const L = rep && rep.L ? rep.L : {}, cs = Object.keys(L);
  if (now && now.ask && Date.now() - now.ask < 15 * 60e3 && now.c && !(Number(seen) >= now.ask)) return { t: `<b>선생님을 기다려요</b> — ${askWhy(now.mode)} · ${esc((skillsOf(now.c)[0] || {}).name || lessonName(now.c))}`, a: '10분 카드 보기', href: `#/t/c/${C}/g/${encodeURIComponent(now.c)}?no=${no}` };
  if (now && now.mode && now.mode !== 'home' && Date.now() - (Number(now.t) || 0) < 5 * 60e3 && now.sos && Date.now() - now.sos < 10 * 60e3) return { busy: true, t: `지금 <b>${esc(MODE[now.mode] || '앱')}</b> 하는 중 — 도움을 다 쓰고 <b>답을 본 문제</b>가 있어요. 지금 들러 보세요.` };;
  if (!cs.length) return opened ? { t: '아직 점검을 풀지 않았어요 — 오늘 단원 점검은 열려 있어요. 아이 처음 화면 <b>점검</b> 카드에서 시작하라고 알려 주세요.' } : { t: '아직 점검을 하지 않았어요.', a: '점검 내기', href: `#/t/c/${C}/check` };   /* opened = 오늘 연 단원 점검이 있음(또 내지 않게) */
  const gives = Object.entries(inbox).filter(([id, x]) => x && x.kind === 'give' && SKILL[x.sk]);
  const open = gives.filter(([id]) => !recs[id]), done = gives.filter(([id]) => recs[id]);
  if (st && st.prep && st.prep.why === 'teacher' && helpLeft(st)) return { t: '앱이 막힌 곳이 많아 점검을 일찍 멈췄어요. <b>선생님과 같이</b> 먼저 봐 주세요.', a: '같이 볼 곳 보기', href: `#/t/c/${C}/k/${no}` };   /* 반 화면 자기 자신으로 가던 단추 → 그 아이 자세히(막힌 칸 · 10분 카드가 거기에 · 비판 토론 C3) */
  const fixed = (st && st.fixed) || {};
  const byG = (a, b) => (a < b ? -1 : 1);   /* 차시 번호 차례 = 낮은 학년부터 */
  const again = (c) => !fixed[c] || (L[c] && L[c].st === 'stuck');   /* 고친 뒤 다시 막히면 다시 후보(아이 홈의 '다시 배우기'와 맞게 · 코덱스 11-08) */
  const start = (rep.start || []).map((x) => x.c).find(again) || cs.filter((c) => L[c].st === 'stuck' && again(c)).sort(byG)[0];   /* 여기서부터 → 없으면 부족(막힌) 차시 중 가장 아래 */
  if (start) {
    const sk = skillsOf(start)[0], lead = (rep.start || []).some((x) => x.c === start) ? '여기서부터 배울 것' : '부족한 것';
    if (sk && open.some(([, x]) => x.sk === sk.id)) return { t: `보낸 보충 <b>${esc(sk.name)}</b>${P(sk.name.replace(/\s*\([^)]*\)\s*$/, '') || sk.name, '을', '를')} 아직 푸는 중이에요 — 다 풀면 '보낸 보충'에 결과가 떠요.` };
    const g = sk && done.map(([id, x]) => ({ x, r: st && st.gv && st.gv[id] })).filter((y) => y.x.sk === sk.id && y.r).sort((p, q) => (Number(q.r[2]) || 0) - (Number(p.r[2]) || 0))[0];   /* 같은 기능 보충이 여럿이면 가장 최근 결과로(코덱스 11-07) */
    const hp = st && st.help ? Number(st.help[start]) || 0 : 0;
    if (hp && hp > (g ? Number(g.r[2]) || 0 : 0)) return { t: `<b>${esc(sk ? sk.name : lessonName(start))}</b> — 배우기를 해 봤지만 혼자서는 아직 어려워요. 선생님과 같이 10분 봐 주세요.`, a: '10분 카드 보기', href: `#/t/c/${C}/g/${encodeURIComponent(start)}?no=${no}` };   /* 배우기를 못 넘은 뒤로 보충을 안 풀었으면 또 혼자 하기보다 선생님과 */
    if (g && g.r[0] / g.r[1] < 0.5) return { t: `<b>${esc(sk.name)}</b> 보충에서 ${g.r[0]}/${g.r[1]} — 혼자 연습으로는 아직 어려워요. 선생님과 같이 10분 봐 주세요.`, a: '10분 카드 보기', href: `#/t/c/${C}/g/${encodeURIComponent(start)}?no=${no}` };   /* 보충 절반 못 맞힘 → 또 보충보다 선생님 먼저 [A-R27] */
    if (g && g.r[0] / g.r[1] >= 0.8) return { t: `<b>${esc(sk.name)}</b> 보충에서 ${g.r[0]}/${g.r[1]} 맞혔어요. 며칠 뒤 매일 연습에서 저절로 다시 확인해요 — 따로 할 것 없어요.` };
    if (sk) return { t: `${lead}: <b>${esc(sk.name)}</b>${g ? ` (지난 보충 ${g.r[0]}/${g.r[1]})` : ''}`, a: '이 아이에게 보충 주기', href: `#/t/c/${C}/give?sk=${sk.id}&who=${no}` };
  }
  const shaky = cs.filter((c) => L[c].st === 'shaky').sort(byG).map((c) => skillsOf(c)[0]).filter(Boolean);
  if (shaky.length && open.some(([, x]) => x.sk === shaky[0].id)) return { t: `보낸 보충 <b>${esc(shaky[0].name)}</b>${P(shaky[0].name.replace(/\s*\([^)]*\)\s*$/, '') || shaky[0].name, '을', '를')} 아직 푸는 중이에요 — 다 풀면 '보낸 보충'에 결과가 떠요.` };
  if (shaky.length) return { t: `가끔 틀리는 것: <b>${esc(shaky[0].name)}</b> — 매일 연습에 저절로 섞여요. 더 다지려면 보충을 줘도 돼요.`, a: '보충 주기', href: `#/t/c/${C}/give?sk=${shaky[0].id}&who=${no}` };
  return { t: '지금은 따로 할 것이 없어요 — 매일 연습만 이어 가면 돼요.' };
}
export async function kidDetailView(root, C, no) {
  const K = cls(C); if (!K) return go('#/t');
  root.innerHTML = '<div class="card">불러오는 중…</div>';
  let raw = null; try { raw = await db.get(`k/${C}/${no}/${K.pins[no]}`); } catch (e) { root.innerHTML = `<div class="card warn">불러오지 못했어요: ${esc(e.message)}</div>`; return; }
  const KK = { recs: {}, rv: {}, fixed: {} };
  if (raw && raw.r) for (const [id, s] of Object.entries(raw.r)) { const o = db.dec(s); if (o) KK.recs[id] = o; }
  const st = raw && raw.st ? normSt(db.dec(raw.st)) : null;
  const rv = obj(raw && raw.rv ? db.dec(raw.rv) : null);
  let notes = []; try { const v = db.dec(await db.get(`tc/${C}/${K.T}/notes/${no}`)); if (Array.isArray(v)) notes = v.filter((m) => m && Number.isFinite(m.t) && (NOTE_K[m.k] || typeof m.x === 'string')).slice(-20); } catch (e) { notes = []; }
  const myNote = lsGet(`tt.note.${C}.${no}`, {});   /* 덧붙인 글은 이 기기에만(서버엔 고른 칩만 — 이름 · 상담 내용이 서버로 가지 않게 · 혹평 10-31) */
  const rep = KS.reportOf(KK), cal = KS.calOf(KK);
  const why = (c) => { const x = rep.L[c]; if (!x || !x.why) return ''; const a = x.why.sure.map((h) => `<span class="pill strong">여러 번 보인 답: ${esc(bugName(h.id))} (${h.ev.length}문제)</span>`), b = x.why.maybe.map((h) => `<span class="pill">한 번 보인 답: ${esc(bugName(h.id))}</span>`); return [...a, ...b].join(' '); };
  // 시간 — 맞힌 문제의 한 문제 가운데값(모든 기록 · 준비 다리 · 확인 · 다시 보기 · 다듬기)
  const msOf = {}; for (const x of Object.values(KK.recs)) { if (!KS.okRec(x)) continue; for (const [k, c] of x.s.it) { const r = x.r.it[k], t = x.ms ? Number(x.ms[k]) : 0; if (r && r.s === 'ok' && t > 0) (msOf[c] = msOf[c] || []).push(t); } }
  const medOf = (c) => { const a = (msOf[c] || []).slice().sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : null; };
  const mxK = obj(raw && raw.mx ? db.dec(raw.mx) : null);
  const tm = (c) => { const m = medOf(c), t = mxK[c] ? Number(mxK[c].tier) || 0 : 0; return `${m ? ` <span class="small muted">한 문제 ${(m / 1000).toFixed(1)}초${byId[c] ? `(기준 ${byId[c].sec}초)` : ''}</span>` : ''}${t ? ` <span class="pill">${['', '정확하게 됨', '빠르게도 됨', '며칠 뒤에도 됨'][Math.min(t, 3)]}</span>` : ''}`; };
  const cards = (c) => { const x = rep.L[c]; if (!x) return ''; const seen = new Set(), out = []; const add = (m, tag) => { if (!seen.has(m.id)) { seen.add(m.id); out.push(misCard(m, tag)); } };
    if (x.why) { x.why.sure.forEach((h) => misFor({ bug: h.id, lesson: c }).forEach((m) => add(m, '위 답의 까닭'))); x.why.maybe.forEach((h) => misFor({ bug: h.id, lesson: c }).forEach((m) => add(m, '위 답의 까닭(짐작)'))); }   /* 알약 = 아이가 한 일 · 카드 = 그 까닭(같은 것을 두 이름으로 두 번 '보임'이라 하던 것 · 처음 보는 눈 11-07) */
    if (!out.length && (x.st === 'stuck' || x.st === 'shaky')) misFor({ lesson: c }).slice(0, 2).forEach((m) => add(m, '이 차시에서 자주 보임'));
    return out.length ? `<div class="misrow">${out.join('')}</div>` : ''; };
  const line = (c, extra = '') => `<li class="lrow"><div class="lr-h"><b>${esc(lessonName(c))}</b> <span class="muted small">${esc(gl(LES(c).g))}</span>${rep.L[c] ? ` <span class="pill">맞힘 ${rep.L[c].ok}/${rep.L[c].tot}</span>` : ''}${tm(c)} ${why(c)}</div>${extra ? `<p class="lr-x">${extra}</p>` : ''}${cards(c)}</li>`;
  const recs = Object.values(KK.recs).sort((a, b) => b.s.made - a.s.made);
  /* 부족한 기능 — 반 표와 같은 줄 고르기(차시마다 가장 좁은 기능) · 칩마다 [보충 주기](이 아이만 골라 둠) */
  const skIds = st ? [...new Set([...Object.keys(st.L), ...st.start].filter((c) => LES(c)).map((c) => (skillsOf(c)[0] || {}).id).filter(Boolean))] : [];
  const skRows = skIds.map((id) => ({ s: SKILL[id], v: skillState(st, SKILL[id]) })).filter((x) => x.v === 'root' || x.v === 'bad' || x.v === 'shaky').sort((a, b) => ['root', 'bad', 'shaky'].indexOf(a.v) - ['root', 'bad', 'shaky'].indexOf(b.v) || skillCmp(a.s, b.s));   /* 같은 표시끼리는 반 표와 같은 차례(낮은 학년 → 기능 차례) */
  const firstSk = skRows[0] && skRows[0].v !== 'shaky' ? skRows[0].s.id : null;   /* 맨 위 = 먼저 배울 곳(단추도 이 줄만 주황 · 처음 보는 눈 11-07) */
  const kmOf = (sk) => { const cs = new Set(sk.parts.map((x) => x.c)); return st && st.mis ? MIS.filter((m) => (st.mis[m.id] === 's' || st.mis[m.id] === 'm') && m.lessons.some((x) => cs.has(x))) : []; };   /* 이 기능에서 보인 틀린 생각 */
  const lackHTML = `<div class="klack no-print"><h3>부족 · 가끔 틀림 <small>${skRows.length ? `기능 ${skRows.length}개 · ✕ 부족 · △ 가끔 틀림` : ''}</small></h3>${skRows.length ? `<ul class="klist">${skRows.map((x) => `<li class="${x.v === 'shaky' ? 'sh' : 'bad'}"><i>${x.v === 'shaky' ? '△' : '✕'}</i><b>${esc(x.s.name)}</b><span class="small muted">${esc(gText(x.s).replace(/(\d)-(\d)/g, '$1학년 $2학기'))}${x.s.id === firstSk ? ' · <b>먼저 배울 곳</b>' : ''}</span>${kmOf(x.s).length ? `<span class="km">틀린 생각: ${kmOf(x.s).map((m) => esc(m.title)).join(', ')}</span>` : ''}<a class="btn ${x.s.id === firstSk ? 'pri' : 'teal'} mini" href="#/t/c/${C}/give?sk=${x.s.id}&who=${no}">${icon('send', 16)}${x.s.id === firstSk ? '여기부터 보충 주기' : '보충 주기'}</a></li>`).join('')}</ul>` : '<p class="muted">부족하거나 가끔 틀리는 기능이 없어요.</p>'}</div>`;
  const swList = Object.entries(cal.sureWrong);
  root.innerHTML = `<div class="card kd"><h2>${esc(nm(K, no))} <small>지금까지 푼 문제 ${recs.reduce((n, x) => n + x.s.it.length, 0)}개</small></h2>
    ${intro('이 아이가 푼 문제를 모아 본 화면이에요. 맨 위 <b>부족 · 가끔 틀림</b> 목록에서 바로 보충을 줄 수 있어요. 아래는 차시마다 자세히 — 카드를 누르면 어떤 생각으로 틀렸을지와 도와주는 법이 나와요.', 'no-print')}
    ${(() => { const nx = nextOf({ C, no, rep, st, inbox: Object.fromEntries(Object.entries((raw && raw.in) || {}).map(([id, v]) => [id, db.dec(v)])), now: raw && raw.now ? db.dec(raw.now) : null, recs: KK.recs, opened: !!(K.today && sameDay(K.today.t)), seen: (lsGet(`tt.wseen.${C}`, {}) || {})[no] }); return `<div class="next-box"><span class="nb-k">다음 할 것</span><span class="nb-v">${nx.t}</span>${nx.a ? `<a class="btn pri" href="${esc(nx.href)}">${esc(nx.a)}</a>` : ''}</div>`; })()}
    ${lackHTML}
    <div class="acts no-print"><a class="btn" href="#/t/c/${C}">반 화면으로</a><button onclick="print()">인쇄</button><button type="button" class="teal" id="ksheet" title="배울 것 · 막힌 칸 · 흔들리는 칸만 골라 둔 맞춤 연습지">이 아이 연습지</button></div>
    <div class="kd-grid"><div class="kd-a">
    ${rep.start.length ? `<h3>먼저 배울 차시 <small>더 아래 차시는 다 맞혔어요 — 여기부터 보충하면 돼요</small></h3><ul class="lines">${rep.start.map((s) => line(s.c)).join('')}</ul>` : ''}
    ${rep.below.length ? `<h3>더 아래 차시도 알아봐야 해요 <small>틀렸는데 그 아래 차시를 아직 안 풀었어요 — 이 아이에게만 그 아래 차시 보충을 보내면 확인돼요</small></h3><ul class="lines">${rep.below.map((b) => { const sk0 = b.check.map((x) => skillsOf(x)[0]).find(Boolean); return line(b.c, `아직 안 푼 아래 차시: ${b.check.map((x) => esc(lessonName(x))).join(', ')}${sk0 ? ` <a class="btn mini" href="#/t/c/${C}/give?sk=${sk0.id}&who=${no}">아래 차시 보충으로 확인</a>` : ''}`); }).join('')}</ul>` : ''}
    ${rep.under.length ? `<h3>아래 차시 때문일 수도 <small>아래 차시를 보충하면 같이 풀릴 수 있어요</small></h3><ul class="lines">${rep.under.map((u) => line(u.c, `← ${u.because.map((x) => esc(lessonName(x))).join(', ')}`)).join('')}</ul>` : ''}
    ${Object.keys(mxK).length ? `<h3>연습한 차시</h3><ul class="lines">${Object.keys(mxK).filter((c) => LES(c)).sort(byGrade).map((c) => line(c)).join('')}</ul>` : ''}
    </div><div class="kd-b">
    <h3>자신감과 결과</h3>${cal.n ? `<p>'자신 있어요 · 헷갈려요 · 모르겠어요'가 결과와 맞은 정도 <b>${Math.round(cal.match * 100)}%</b> <span class="muted small">(${cal.n}문제)</span></p><p>자신 있었는데 틀린 문제 ${swList.length ? `<span class="whys">${swList.map(([c, n]) => `<span class="pill">${esc(lessonName(c))} ${n}</span>`).join('')}</span>` : '없어요.'}</p>` : '<p class="muted">아직 없어요.</p>'}
    ${(() => { const ws = lastLine(weeksOf(KK.recs)); if (!ws.length) return ''; const tr = weekTrend(ws); return `<h3>이번 주 점검</h3><div id="wkc">${weekChart(ws, { marks: notes })}</div><p class="small muted">${ws.length}주 · ${tr === 'up' ? '늘어요' : tr === 'down' ? '줄어요 — 하던 방법을 바꿔 볼 때' : tr === 'flat' ? '그대로예요' : '다섯 주부터 늘고 주는지 봐요'}</p>
      <div class="no-print"><b class="small">지도를 바꾼 때</b> <span class="small muted">(선생님만 · 그래프에 점선으로 · 덧붙인 글은 이 기기에만)</span><ol class="small" id="nl">${notes.map((m) => `<li>${esc(new Date(m.t).toLocaleDateString('sv-SE').slice(5))} ${esc(NOTE_K[m.k] || m.x || '')}${myNote[m.t] ? ` — <span class="muted">${esc(myNote[m.t])}</span>` : ''}</li>`).join('')}</ol>
      <div class="row">${Object.entries(NOTE_K).map(([k, t]) => `<label class="chip"><input type="radio" name="nk" value="${k}"> ${esc(t)}</label>`).join('')}</div>
      <div class="row"><input id="nx" maxlength="60" placeholder="덧붙일 말(이 기기에만 · 이름 X)" style="flex:1;min-width:200px"><button id="nadd">적기</button></div></div>`; })()}
    ${(() => { const x = st ? storyStep(st.story) : null; if (!x) return ''; const pc = (v) => `${Math.round(v * 100)}%`; return `<h3>이야기 문제(문장제)</h3><p>${x.n}문제 · 이해 ${pc(x.und)} · 바꾸기(식) ${pc(x.conv)} · 계산(답) ${pc(x.calc)}${x.weak ? ` — 먼저 <b>${esc(x.weak)}</b>` : ''}${x.types.length ? `<br><span class="small muted">헷갈리는 이야기: ${x.types.map(esc).join(', ')}</span>` : ''}</p>`; })()}
    ${(() => { const L = st ? st.lad || [] : []; if (!L.length) return ''; return `<h3>틀린 뒤 스스로 고친 비율 <small>주마다</small></h3><table class="list lad"><tr><th>주</th><th>떠올려 고침</th><th>풀이 순서로 고침</th><th>답 봄</th><th>스스로</th></tr>${L.slice(-6).map((a) => { const p = ladPct(a); return `<tr><td>${esc(wkShort(a[0]))}</td><td>${a[1]}</td><td>${a[2]}</td><td>${a[3]}</td><td><b>${p == null ? '—' : `${p}%`}</b></td></tr>`; }).join('')}</table><p class="small muted">스스로 고친 비율 = (떠올려 고침 + 풀이 순서로 고침) ÷ 도움을 받은 문제 전체(답 봄까지) · 반 표 판정은 첫 답만 써요.</p>`; })()}
    ${st && st.bk && st.bk.t ? `<h3>거꾸로 찾기 <small>아이가 직접 넣은 막힌 문제 · ${esc(new Date(st.bk.t).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }))}</small></h3><p><b>${esc(st.bk.x)}</b> → ${st.bk.r ? `찾은 곳 <b>${esc(lessonName(st.bk.r))}</b>${st.bk.s ? ' · <span class="pill okc">고친 뒤 처음 문제를 풀었어요</span>' : (st.fixed || {})[st.bk.r] > st.bk.t ? ' · 배우기로 고쳤어요 — 처음 문제는 아직' : ' · 아직 배우는 중'}` : st.bk.c && st.L[st.bk.c] === 'ok' ? '이미 튼튼했어요' : '끊긴 곳을 다 찾지 못했어요 — 같이 봐 주세요'}</p>` : ''}
    <h3>배워서 고친 차시 · 다시 보기</h3><p>${Object.keys(st && st.fixed || {}).map((c) => `${esc(lessonName(c))}${rv[c] ? ` <span class="small muted">(다시 보기 ${rv[c].n}/3)</span>` : ''}`).join(', ') || '<span class="muted">아직 없어요.</span>'}</p>
    <details class="no-print ai"><summary><b>AI에게 물어보기</b> <span class="small muted">— 이 아이 근거로 막힌 까닭 후보 · 발문 · 확인 문항(번호만 · 이름 X)</span></summary>
      <p class="small">아래 글이 AI에게 가는 근거 전부예요(이름 없음). 맨 아래 <b>[AI 진단 받기]</b>로 바로 받거나, 복사해 Claude(claude.ai)에 붙여 넣어도 돼요. 막힌 까닭 후보 · 먼저 볼 차시 · 소집단 발문 · 가르는 확인 문항이 와요. AI 답은 짐작이라, 아이나 가정에 전하기 전에 선생님이 확인해요.</p>
      <textarea id="aiq" rows="10" readonly style="width:100%;font-size:13px">${esc(promptOf(no, packetOf(rep, st, { unit: K.today && K.today.unit ? unitLabel(K.today.unit) : '', weeks: lastLine(weeksOf(KK.recs)), trend: { up: '올라감', down: '내려감', flat: '그대로' }[weekTrend(lastLine(weeksOf(KK.recs)))], story: st ? storyStep(st.story) : null, fixed: st ? st.fixed : {} }), String(K.g || '')[0] || ''))}</textarea>
      <div class="acts"><button id="aicp">복사</button><span class="small muted" id="aimsg"></span></div>
      <div class="ai-go" id="aigo"></div></details>
    </div></div>
    <p class="small muted foot">틀린 생각은 짐작이에요. '한 번 보인 답'은 한 문제에서만, '여러 번 보인 답'은 서로 다른 두 문제 이상에서 같은 틀린 방법이 나온 거예요. 그 아래 카드는 그 답이 나오는 까닭과 도와주는 법이에요. 아이 화면엔 원인 이름이 나오지 않아요.</p></div>`;
  root.querySelector('#ksheet').addEventListener('click', () => kidSheet({ C, rep, st, cal, who: nm(K, no) }));
  /* 바로 묻기(선생님 키 · 이 기기에만 · ai.js) — 지난 답은 이 기기에 남겨 두고 다시 묻기 전까지 보여 줌 */
  const aigo = root.querySelector('#aigo'), RK = `tt.ai.res.${C}.${no}`, PK = `tt.ai.photo.${C}.${no}`, WL = wrongList(rep);
  /* 풀이 사진 읽기 — 틀린 문제 하나 + 종이 풀이 사진 → 처음 어긋난 단계 · 발문(사진은 저장 X · 답 글만 이 기기에) */
  const photoBox = (busy) => { if (!WL.length) return ''; const lp = lsGet(PK, null);
    return `<div class="ai-ph"><p class="small"><b>풀이 사진으로 묻기</b> — 틀린 문제를 고르고 그 문제의 종이 풀이를 찍어 올리면, 풀이를 단계마다 읽고 처음 어긋난 곳을 짚어 줘요. <b>풀이 부분만</b> 찍어요(얼굴 · 이름 X). 사진은 어디에도 저장하지 않아요.</p>
      <div class="acts"><select id="aiw" class="sel" style="flex:1 1 300px">${WL.map((w, i) => `<option value="${i}">${esc(w.q)} — 아이 답 ${esc(w.mine)}</option>`).join('')}</select><label class="btn">${busy ? '읽는 중…' : '사진 고르기 · 찍기'}<input type="file" id="aip" accept="image/*" capture="environment" hidden${busy ? ' disabled' : ''}></label></div>
      ${lp && lp.text ? `<div class="ai-res">${esc(lp.q ? `[${lp.q}]\n` : '')}${esc(lp.text)}</div><p class="small muted">${esc(new Date(lp.t).toLocaleString('ko-KR'))} · AI가 사진을 잘못 읽을 수 있어요. 선생님이 풀이와 대 보고 써요.</p>` : ''}</div>`; };
  const aiRender = (busy = false, err = '') => { if (!aigo) return; const k = aiKey(), last = lsGet(RK, null);
    aigo.innerHTML = !k ? `<p class="small"><b>바로 묻기</b>(골라서) — Claude API 키를 넣으면 복사하지 않고 이 화면에서 바로 진단을 받아요. 키는 <b>이 기기에만</b> 저장되고 아이 기기 · 서버로 가지 않아요. 한 번 묻는 데 몇십~백 원쯤(선생님 크레딧).</p><div class="acts"><input id="aik" type="password" autocomplete="off" placeholder="sk-ant-…" class="sel" style="flex:1 1 260px"><button id="aiks">키 저장</button></div>`
      : `<div class="acts"><button class="pri" id="aiask"${busy ? ' disabled' : ''}>${busy ? '묻는 중… (20초쯤)' : last ? 'AI 진단 다시 받기' : 'AI 진단 받기'}</button><span class="small muted">키 ${esc(keyTail(k))} 저장됨 · <button type="button" class="link" id="aikx">키 지우기</button></span></div>${err ? `<p class="qmsg">${esc(err)}</p>` : ''}${last && last.text ? `<div class="ai-res">${esc(last.text)}</div><p class="small muted">${esc(new Date(last.t).toLocaleString('ko-KR'))} · AI 답은 짐작이에요. 아이나 가정에 전하기 전에 선생님이 확인해요.</p>` : ''}${photoBox(busy)}`;
    const ks = aigo.querySelector('#aiks'); if (ks) ks.addEventListener('click', () => { setAiKey(aigo.querySelector('#aik').value); aiRender(); });
    const kx = aigo.querySelector('#aikx'); if (kx) kx.addEventListener('click', () => { setAiKey(''); aiRender(); });
    const ph = aigo.querySelector('#aip'); if (ph) ph.addEventListener('change', async () => { const f = ph.files && ph.files[0]; if (!f) return; const w = WL[Number(aigo.querySelector('#aiw').value) || 0]; aiRender(true);
      let img; try { img = await shrinkPhoto(f); } catch (e) { return aiRender(false, '사진을 읽지 못했어요. 다른 사진으로 해 보세요.'); }
      const r = await askClaude(photoPromptOf(no, w, String(K.g || '')[0] || ''), img); img = null;
      if (r.text) { lsSet(PK, { t: Date.now(), q: w.q, text: r.text }); aiRender(); } else aiRender(false, r.refusal ? 'AI가 이 사진에는 답하지 않았어요.' : r.error); });
    const go = aigo.querySelector('#aiask'); if (go) go.addEventListener('click', async () => { aiRender(true); const r = await askClaude(root.querySelector('#aiq').value);
      if (r.text) { lsSet(RK, { t: Date.now(), text: r.cut ? `${r.text}\n\n(답이 길어 여기서 끊겼어요.)` : r.text }); aiRender(); } else aiRender(false, r.refusal ? 'AI가 이 질문에는 답하지 않았어요. 위 글을 복사해 붙여 넣는 방식으로 해 보세요.' : r.error); }); };
  aiRender();
  const aicp = root.querySelector('#aicp');
  if (aicp) aicp.addEventListener('click', async () => { const ta = root.querySelector('#aiq'); let ok = false; try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (e) { ta.select(); try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } } root.querySelector('#aimsg').textContent = ok ? '복사했어요. Claude에 붙여 넣어요.' : '복사가 막혔어요. 글을 길게 눌러 직접 복사해요.'; });
  const nadd = root.querySelector('#nadd');
  if (nadd) nadd.addEventListener('click', () => {
    const pick = root.querySelector('input[name="nk"]:checked'), inp = root.querySelector('#nx'), x = inp.value.trim().slice(0, 60);
    if (!pick) { root.querySelector('#nl').insertAdjacentHTML('afterend', '<p class="small warn">바꾼 방법 칩을 하나 골라 주세요.</p>'); return; }
    const t = Date.now(); notes = [...notes, { t, k: pick.value }].slice(-20);
    db.queuePut(`tc/${C}/${K.T}/notes/${no}`, db.enc(notes)); db.flush();
    if (x) { myNote[t] = x; lsSet(`tt.note.${C}.${no}`, myNote); }
    root.querySelector('#nl').insertAdjacentHTML('beforeend', `<li>${esc(new Date(t).toLocaleDateString('sv-SE').slice(5))} ${esc(NOTE_K[pick.value])}${x ? ` — <span class="muted">${esc(x)}</span>` : ''}</li>`);
    root.querySelector('#wkc').innerHTML = weekChart(lastLine(weeksOf(KK.recs)), { marks: notes }); inp.value = ''; pick.checked = false;
  });
}

// 10분 소집단 카드 — 명시적 지도 차례(시범 · 생각 말하기 → 함께 → 혼자 · 바로 고치기) [B-R11][B-R12][B-R13]
export function groupCardView(root, C, c, no = null) {
  const K = cls(C); if (!K || !byId[c]) return go('#/t');
  if (no && !(K.pins || {})[no]) no = null;
  const r = rng(Date.now() % 1e9), used = new Set();
  const [ex] = pickItems(c, 1, r, used), together = pickItems(c, 2, r, used), solo = pickItems(c, 3, r, used);
  const steps = ex ? stepsOf(ex) : [];
  // 이 칸에서 자주 보이는 틀린 생각 · 시범 문제를 그 생각대로 푼 풀이(있으면)
  const ms = misFor({ lesson: c });
  let cmp = '';
  if (ex && ms.length) { const ids = (() => { try { return testable(ex); } catch (e) { return []; } })(); const id = ms.flatMap((m) => m.bugs || []).find((b) => ids.includes(b)); if (id) { let v = null; try { v = __predict(ex, id); } catch (e) { v = null; } if (v) cmp = `${askP('두 풀이 가운데 어느 쪽이 맞을까? 틀린 쪽은 어디서 어긋났을까?')}${pairBox(staticHTML(ex.prompt, ex.sol), staticHTML(ex.prompt, v))}${KIDSAY[id] ? `<p class="note"><b>틀린 친구는</b> ${esc(KIDSAY[id])}</p>` : ''}`; } }
  root.innerHTML = `<div class="card tcard hide-ans"><h2>10분 소집단 카드 <small>${esc(lessonName(c))}</small></h2>
    ${intro(no ? `${esc(nm(K, no))}${P(nm(K, no), '과', '와')} 10분 동안 할 활동이에요(같은 칸이 부족한 아이가 더 있으면 같이 해도 돼요). 차례대로 진행하고, 선생님 말은 그대로 읽어도 돼요. 문제는 열 때마다 새 숫자로 바뀌어요.` : '같은 칸을 배워야 하는 아이 2~4명과 10분 동안 할 활동이에요. 차례대로 진행하고, 선생님 말은 그대로 읽어도 돼요. 문제는 열 때마다 새 숫자로 바뀌어요.', 'no-print')}
    <div class="acts no-print"><a class="btn" href="#/t/c/${C}">반 화면으로</a><button onclick="print()">인쇄</button><button type="button" class="ans-t">답 보기</button><span class="small muted">화면 그대로 보며 진행해도 돼요(답은 가려 둠 · 인쇄엔 나와요)</span></div>
    <dl class="lead"><dt>오늘 목표</dt><dd>${esc(LES(c).kid)}</dd>${hintOf(c) ? `<dt>핵심</dt><dd>${esc(hintOf(c))}</dd>` : ''}</dl>
    ${no ? `<div class="kidw" id="kidw" data-k="${esc(`${c}|${no}`)}"><p class="small muted">${esc(nm(K, no))}의 답을 불러오는 중…</p></div>` : ''}
    <ol class="plan">
    ${stepBox(1, '선생님이 먼저 풀어 보이기', 2, `${askP('선생님이 먼저 풀어 볼게. 머릿속 생각을 말로 할 테니 잘 들어 봐.')}${ex ? `<div class="qline">${staticHTML(ex.prompt, null)}<span class="ans">답 ${ansHTML(ex)}</span></div>${modelHTML(ex)}${steps.length ? `<ol class="steps">${steps.map((s) => stepHTML(s)).join('')}</ol>` : ''}` : ''}<p class="note">모형이 있으면 모형으로 먼저${/받아(올림|내림)/.test(lessonName(c)) ? '(낱개 10개 ↔ 십 막대 1개 바꾸기)' : ''}, 그다음 그림, 그다음 식으로 보여 줘요.</p>`)}
    ${stepBox(2, '함께 풀기', 3, `${askP('첫 단계는 뭐부터 할까? 말해 주면 선생님이 받아 적을게.')}${qGrid(together)}`)}
    ${stepBox(3, '혼자 풀기', 3, `${askP('이번엔 혼자 풀어 봐. 막히면 어느 단계에서 막혔는지 짚어 줘.')}${qGrid(solo)}<p class="note">틀리면 바로 그 단계로 돌아가 같이 고쳐요.</p>`)}
    ${stepBox(4, '마무리', 2, `${askP('어느 단계가 가장 어려웠어? 한 가지씩 말해 볼까?')}<p class="fin-do">끝나면 아이 크롬북 처음 화면에서 <b>[선생님과 같이 본 뒤에 — 확인 3문제]</b>를 누르게 하세요. 그래야 기록이 남아요(그 단추가 없는 아이는 그 칸의 <b>배우기</b>).</p>`)}
    </ol>
    ${ms.length ? `<h3>알아 두기 — 이 칸에서 자주 보이는 틀린 생각</h3>${cmp}<div class="misrow">${ms.slice(0, 3).map((m) => misCard(m)).join('')}</div>` : ''}
    ${no ? '' : '<p class="small muted foot">이 묶음은 앱의 제안이에요. 경계에 있는 아이는 선생님이 보고 넣거나 빼 주세요.</p>'}</div>`;
  if (no) (async () => {   /* 아이 하나로 열었을 때(다음 할 것 · 선생님을 기다려요) — 그 아이가 이 칸에서 틀린 최근 답 셋 */
    let raw = null; try { raw = await db.get(`k/${C}/${no}/${K.pins[no]}/r`); } catch (e) { raw = null; }
    const box = root.querySelector('#kidw'); if (!box || box.dataset.k !== `${c}|${no}`) return;   /* 그새 다른 카드를 열었으면 쓰지 않음 */
    const KK = { recs: {}, rv: {}, fixed: {} }; for (const [id, v] of Object.entries(raw || {})) { const o = db.dec(v); if (o) KK.recs[id] = o; }
    const x = KS.reportOf(KK).L[c], ws = x ? wrongOf(x, 3) : [];
    box.innerHTML = ws.length ? `<h3>이 아이가 이 칸에서 쓴 답 <small>${esc(nm(K, no))} · 최근 ${ws.length}개</small></h3><ul class="kw">${ws.map((w) => `<li><span class="kw-q">${esc(w.q)}</span><span>아이 답 <b class="kw-a">${esc(w.mine)}</b></span><span class="muted ans">→ 바른 답 ${esc(w.right)}</span>${w.fit.length ? `<span class="pill">짐작: ${esc(w.fit[0])}</span>` : ''}</li>`).join('')}</ul>${askP('이 문제를 어떻게 풀었는지 말해 볼래? 처음 한 일부터.')}`
      : `<p class="small muted">${esc(nm(K, no))} — 이 칸에서 틀린 기록이 아직 없어요.</p>`;
  })();
}

// 이 생각 10분 카드 — 생각을 지우지 않고 '언제 맞고 언제 안 맞나'로 가르기 [E4-4][E4-1] · 도구 · 맞는 풀이 ↔ 틀린 풀이 · 함정 꼴 반례
export function mindCardView(root, C, id) {
  const K = cls(C), m = misById[id]; if (!K || !m) return go('#/t');
  // 함정 꼴이 있는 차시를 먼저(반례가 되는 문항) · 없으면 카드의 첫 차시
  const c = Object.keys(WANT[id] || {}).find((l) => m.lessons.includes(l) && byId[l]) || m.lessons.find((l) => byId[l]);
  const r = rng(Date.now() % 1e9), used = new Set(), want = c ? wantFor(id, c) : null;
  const traps = c ? pickItems(c, 3, r, used, want) : [];
  const t = TOOLS[CARD_TOOL[id]];
  let pair = '', pairAsk = '두 풀이 가운데 어느 쪽이 맞을까? 틀린 쪽 친구는 무엇을 했을까?';
  const bug = (m.bugs || [])[0];
  if (c && bug) { for (let k = 0; k < 20 && !pair; k++) { const [it] = pickItems(c, 1, r, used); if (!it) break; let v = null; try { v = testable(it).includes(bug) ? __predict(it, bug) : null; } catch (e) { v = null; } if (v) pair = `${pairBox(staticHTML(it.prompt, it.sol), staticHTML(it.prompt, v))}<p class="note"><b>틀린 친구는</b> ${esc(KIDSAY[bug] || m.think)}</p>`; } }
  // 숫자 모형이 없는 생각 — 함정 문항에서 그 오답 이름이 붙는 답을 찾아 틀린 풀이로(문제 속 수들의 합 · 차 · 곱을 넣어 봄)
  if (!pair && (m.names || []).length) for (const it of [...(c ? pickItems(c, 6, r, used, want) : []), ...traps]) {   /* 3번 문제와 겹치지 않게 새 문항 먼저 */
    if (it.choices) { const k = it.choices.findIndex((_, i) => { const res = it.check([i], [String(i)]); return res.bug && m.names.some((n) => res.bug.name.includes(n)); }); if (k >= 0) { pair = `<div class="qline">${staticHTML(it.prompt, null)}</div>${pairBox(`<span class="chip big">${toHTML(it.choices[it.sol[0]], { static: true })}</span>`, `<span class="chip big">${toHTML(it.choices[k], { static: true })}</span>`, '맞는 답', '친구가 고른 답')}`; pairAsk = '친구는 왜 이걸 골랐을까? 그 생각이 맞을 때도 있을까?'; break; } continue; }
    const ns = (toText(it.prompt).match(/\d+/g) || []).map(Number), cand = new Set();
    ns.forEach((a, i) => { cand.add(a); ns.forEach((b, j) => { if (i !== j) { cand.add(a + b); cand.add(Math.abs(a - b)); cand.add(a * b); } }); }); cand.add(ns.reduce((x, y) => x + y, 0));
    const v = [...cand].find((v) => { try { const res = it.check([v], [String(v)]); return res.bug && m.names.some((n) => res.bug.name.includes(n)); } catch (e) { return false; } });
    if (v != null && it.sol.length === 1) { pair = `${pairBox(staticHTML(it.prompt, it.sol), staticHTML(it.prompt, [v]))}<p class="note"><b>틀린 친구 생각</b> ${esc(m.think)}</p>`; break; }
  }
  root.innerHTML = `<div class="card tcard hide-ans"><h2>이 생각 10분 카드 <small>${esc(m.title)}</small></h2>
    ${intro('같은 생각으로 틀린 아이 2~3명을 모아 10분 동안 함께 할 활동이에요. 차례대로 진행하고, 선생님 말은 그대로 읽어도 돼요. 문제는 열 때마다 새 숫자로 바뀌어요.', 'no-print')}
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><button type="button" class="ans-t">답 보기</button><a class="btn" href="#/t/c/${C}">반 화면으로</a></div>
    <dl class="lead"><dt>아이 생각</dt><dd>${esc(m.think)}<span class="ex">예: ${esc(m.shows)}</span></dd>
      <dt>왜 그럴까요</dt><dd>${esc(whyOf(m))}</dd>
      <dt>오늘 목표</dt><dd>이 생각을 지우려 하기보다, 이 방법이 <b>언제 맞고 언제 안 맞는지</b> 아이 입으로 가르게 해요.</dd></dl>
    <ol class="plan">
    ${stepBox(1, '맞는 풀이와 틀린 풀이 비교하기', 3, `${askP(pairAsk)}${pair || `<p class="note">칠판에 맞는 풀이와 이 생각대로 한 풀이를 나란히 써 주세요. 예: ${esc(m.shows)}</p>`}`)}
    ${stepBox(2, '도구로 확인하기', 2, t ? `${askP(t.how)}<p>${icon('search', 18)} <b>${esc(t.name)}</b> — 아이마다 아까 틀린 답에 직접 써 보게 해요. 앱에서도 틀리면 같은 도구가 나와요.</p>` : '<p>이 생각은 아직 앱 도구가 없어요. 그림(수 모형 · 막대 · 수직선)으로 함께 확인해요.</p>')}
    ${stepBox(3, '이 생각대로 풀면 틀리는 문제', 3, `${askP(m.ask || '아까 그 방법으로 풀면 답이 어떻게 될까? 정말 맞는지 확인해 볼까?')}${traps.length ? qGrid(traps) : ''}<p class="note">답은 문제 옆 연한 글씨예요. 다 풀면 함께 맞춰 보고, 틀린 문제는 2번 도구로 확인해요.</p>`)}
    ${stepBox(4, '마무리', 2, `${askP('이 방법은 언제는 맞고, 언제는 안 맞을까? 한 줄로 말해 볼까?')}<p class="note"><b>더 도와줄 때</b> ${esc(easy(m.fix))}</p>`)}
    </ol>
    ${m.has === 'no' ? '<p class="warn small">이 생각은 아직 앱 문제로 잡지 못해요. 수업에서 직접 물어봐 주세요.</p>' : ''}
    <details class="refs"><summary>근거</summary><p><a href="https://github.com/chang333787-boop/tuntun-math/tree/main/docs/research" target="_blank" rel="noopener">연구 자료</a> ${esc(m.refs)} · ${esc(STR[m.str] || '')}</p></details></div>`;
}

// 기록 내려받기(CSV 둘) — 시범 운영 효과 재기용(docs/pilot.md) · 번호만(이름 X · 이름은 이 기기에만 있음)
//  ① 아이마다 한 줄(요약) ② 아이 × 칸(분석용 긴 꼴)
export const csvText = (rows) => '\ufeff' + rows.map((r) => r.map((v) => { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; }).join(',')).join('\n');
// 반 숫자 → CSV 줄 둘(아이별 · 칸별) — 화면과 상관없음(tools/pilot.mjs가 같은 칸 이름을 읽음)
export function csvRows(C, K, S, unit) {
  const loc = (t) => new Date(t).toLocaleString('sv-SE').slice(0, 16);   /* 이 기기 시각(한국 시간) · 2026-10-31 16:12 */
  const P = prepPlan(unit);
  const rows1 = [['반', '번호', '마지막 기록', '오늘 단원', '점검 칸 수', '점검 칸 확인', '점검 칸 막힘', '배울 것', '여러 번 보인 생각', '고친 생각', '짐작 맞은 정도', "'자신 있어요'인데 틀림", '정확하게 됨', '빠르게도 됨', '며칠 뒤에도 됨', '배워서 고친 것 수', '매일 연습(7일)', '도구로 스스로 고침', '빨리 넘김', '이번 주 점검(주 · 10점 · 최근 8주)']];
  const rows2 = [['반', '번호', '차시', '칸 이름', '학기', '상태', '빠르기 단계(0~3)', '오늘 단원 점검 칸']];
  for (let i = 1; i <= K.n; i++) {
    const no = String(i), st = S[no] && S[no].st; if (!st) { rows1.push([C, no]); continue; }
    const pre = P.pre.filter((c) => LES(c)), ok = pre.filter((c) => ['ok', 'pass'].includes(st.L[c])).length, bad = pre.filter((c) => st.L[c] === 'stuck').length;
    const mis = Object.entries(st.mis || {}), mx = Object.values(st.mx || {});
    rows1.push([C, no, st.last ? loc(st.last) : '', unitLabel(unit), pre.length, ok, bad, st.start.map(lessonName).join(' / '),
      mis.filter(([, v]) => v === 's').map(([id]) => misById[id].title).join(' / '), mis.filter(([, v]) => v === 'r').map(([id]) => misById[id].title).join(' / '),
      st.cal && st.cal.m != null ? Math.round(st.cal.m * 100) : '', Object.values(st.sw || {}).reduce((a, b) => a + b, 0),
      mx.filter((t) => t >= 1).length, mx.filter((t) => t >= 2).length, mx.filter((t) => t >= 3).length, Object.keys(st.fixed || {}).length,
      (st.jog || []).filter((d) => Date.now() - new Date(d).getTime() < 7 * 864e5).length, Object.values(st.tools || {}).reduce((a, x) => a + ((x && x.self) || 0), 0), st.rush || 0, lastLine(st.wk || []).map((w) => `${w.wk.slice(5)} ${Math.round((w.ok / w.n) * 10)}`).join(' / ')]);
    for (const [c, v] of Object.entries(st.L)) if (LES(c)) rows2.push([C, no, c, lessonName(c), LES(c).g, ST[v] || v, (st.mx || {})[c] || 0, pre.includes(c) ? 'O' : '']);
  }
  return [rows1, rows2];
}
function exportCSV(C, K, S, unit) {
  const day = new Date().toLocaleString('sv-SE').slice(0, 10), [rows1, rows2] = csvRows(C, K, S, unit), csv = csvText;
  const dl = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  dl(`튼튼수다리_${C}_아이별_${day}.csv`, csv(rows1));
  setTimeout(() => dl(`튼튼수다리_${C}_칸별_${day}.csv`, csv(rows2)), 400);
}

// 이야기 구조 프로필 — 문장제가 어디서 끊기나(뉴먼: 이해 · 바꾸기 · 계산 [C-28]) · st.story = { 유형: { n 푼 수, type 유형 맞힘, frame 틀 맞힘, eq 식 맞힘, ans 답 맞힘 } }
export function storyStep(sto) {
  const t = Object.values(sto || {}).reduce((a, v) => ({ n: a.n + v.n, type: a.type + v.type, frame: a.frame + v.frame, eq: a.eq + v.eq, ans: a.ans + v.ans }), { n: 0, type: 0, frame: 0, eq: 0, ans: 0 });
  if (t.n < 8) return null;   /* 여덟 문제부터 — 고르기 셋 중 둘의 최솟값이라 세 문제는 우연으로도 '이해에서 끊김'이 됨(혹평 10-31) */
  const r = (x) => x / t.n, und = Math.min(r(t.type), r(t.frame)), conv = r(t.eq), calc = r(t.ans);
  const weak = und < 0.7 ? '이해(무슨 이야기 · 막대 그림)' : conv < 0.7 ? '바꾸기(식 세우기)' : calc < 0.8 ? '계산' : null;
  return { n: t.n, und, conv, calc, weak, types: Object.entries(sto).filter(([, v]) => v.n >= 2 && (v.type + v.frame) / (2 * v.n) < 0.6).map(([k]) => k) };
}

// ── 종이 결과 가져오기 ──
//  같은 주소의 '끊긴 곳 찾기'(paper/)는 이 브라우저에만 저장(kkg.v1) → 같은 기기 · 같은 브라우저면 파일 없이 바로 읽음 · 다른 기기면 종이 앱에서 내보낸 파일
//  종이 아이(별명) ↔ 반 번호를 맞춰 아이 기록(r)에 넣음 → 아이가 다음에 앱을 열면 판정 · 다리 · 반 화면에 들어감(선생님 '자세히'에는 바로)
//  기록 이름 = P + 장 id + 아이 id 줄임 → 두 번 가져와도 겹치지 않음 · 문장제 칸은 종이 앱에서만(앱 기록 꼴에 없음)
const PKEY = 'kkg.v1';
export function paperData(text = null) {
  let x = null; try { x = JSON.parse(text != null ? text : localStorage.getItem(PKEY) || 'null'); } catch (e) { return null; }
  return x && x.v === 1 && Array.isArray(x.kids) && x.sheets && typeof x.sheets === 'object' && x.res && typeof x.res === 'object' ? x : null;
}
const pid = (sid, kid) => `P${String(sid).replace(/[^A-Za-z0-9]/g, '').slice(0, 18)}_${String(kid).replace(/[^A-Za-z0-9]/g, '').slice(0, 12)}`;
// 종이 장 하나 · 아이 하나 → 앱 기록 여러 개({ s: 묶음 꼴, r, cf, ms }) — 기록 하나는 8000자 규칙 안(종이 장은 4만 자까지 감)
//  나누는 단위 = 같은 칸 · 같은 장(chapter)의 문항 덩이(한 칸이 두 기록으로 갈리지 않게 → 판정이 종이와 같음) · 같은 made라 한 번 푼 것으로 읽힘
//  문장제 · 채점 안 한 장 · 모양이 이상한 장은 []
const REC_MAX = 7600;
export function paperRecs(sh, r, id = sh && sh.id) {
  if (!sh || !Array.isArray(sh.items) || !r || !r.done || !Object.keys(r.done).length) return [];
  const items = sh.items.filter((it) => it.form !== 'w' && it.ch !== 'W' && LES(it.c) && it.p && typeof it.p === 'object' && r.done[it.ch]);
  if (!items.length) return [];
  const made = Number(sh.made) || Date.now(), kind = sh.kind || 'paper';
  const recOf = (its, pid) => { const ks = new Set(its.map((it) => String(it.k))), chs = new Set(its.map((it) => it.ch)); const s = KS.pack({ id: pid, kind, made, unit: null, items: its }); s.src = 'paper'; return { s, r: { done: Object.fromEntries([...chs].map((k) => [k, true])), it: Object.fromEntries(Object.entries(r.it || {}).filter(([k]) => ks.has(String(k))).map(([k, v]) => [k, v && typeof v === 'object' ? { s: v.s, ...(v.a ? { a: v.a } : {}) } : v])) }, cf: {}, ms: {} }; };
  const lumps = []; for (const it of items) { const last = lumps[lumps.length - 1]; if (last && last[0].ch === it.ch && last[0].c === it.c) last.push(it); else lumps.push([it]); }
  const parts = []; let cur = [];
  for (const L of lumps) { const next = [...cur, ...L]; if (cur.length && JSON.stringify(recOf(next, id)).length > REC_MAX) { parts.push(cur); cur = [...L]; } else cur = next; }
  if (cur.length) parts.push(cur);
  return parts.map((its, i) => recOf(its, parts.length > 1 ? `${id}_${i + 1}` : id)).filter((x) => JSON.stringify(x).length <= 8000);
}
// 이름이 같으면 그 번호 · '3' · '3번' · '3 하늘' 같은 별명이면 그 번호
export function guessNo(label, K) {
  const t = String(label || '').trim(), m = t.match(/^(\d{1,3})\s*번?(\s|$)/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= K.n) return m[1];
  const hit = Object.entries(K.names || {}).find(([, v]) => v && (v === t || t.endsWith(v)));
  return hit ? hit[0] : '';
}
export function paperImportView(root, C) {
  const K = cls(C); if (!K) return go('#/t');
  const DONE = `tt.paper.${C}`;
  const show = (D, from) => {
    const sent = lsGet(DONE, {});
    const rows = D ? D.kids.map((k) => { const recs = Object.entries(D.res).filter(([sid, m]) => m && m[k.id] && D.sheets[sid]).map(([sid, m]) => ({ sid, recs: paperRecs(D.sheets[sid], m[k.id], pid(sid, k.id)) })).filter((x) => x.recs.length); return { k, recs, no: (sent[k.id] && sent[k.id].no) || guessNo(k.label, K), newN: recs.filter((x) => !(sent[k.id] && sent[k.id].ids && sent[k.id].ids.includes(x.sid))).length }; }).filter((x) => x.recs.length) : [];
    const opts = (v) => `<option value="">— 넣지 않음 —</option>${Array.from({ length: K.n }, (_, i) => String(i + 1)).map((no) => `<option value="${no}"${no === v ? ' selected' : ''}>${esc(nm(K, no))}</option>`).join('')}`;
    root.innerHTML = `<div class="card"><h2>종이 결과 가져오기 <small>${esc(K.title || C)}</small></h2>
      ${intro('종이 학습지(<b>끊긴 곳 찾기</b>)로 진단 · 점검을 하고 채점까지 했다면, 그 결과를 아이 기록에 넣을 수 있어요. 아이가 다음에 앱을 열면 그 결과로 <b>배울 것</b>이 정해지고, 반 화면에도 들어가요. 문장제 칸은 종이 앱에서만 봐요.')}
      ${!D ? `<p>이 브라우저에는 종이 앱 기록이 없어요. 다른 기기에서 채점했다면 종이 앱 <b>설정 → 내보내기</b> 파일을 골라 주세요.</p>` : `<p class="small muted">${from} · 종이 아이 ${D.kids.length}명 가운데 채점한 장이 있는 아이 ${rows.length}명</p>`}
      ${rows.length ? `<table class="list"><thead><tr><th>종이 별명</th><th>채점한 장</th><th>반 번호</th></tr></thead><tbody>${rows.map((x, i) => `<tr><td>${esc(x.k.label || '(별명 없음)')}</td><td>${x.recs.length}장${x.newN < x.recs.length ? ` <span class="muted small">(${x.recs.length - x.newN}장은 이미 넣음)</span>` : ''}</td><td><select data-i="${i}">${opts(x.no)}</select></td></tr>`).join('')}</tbody></table>
        <p class="small muted">이름이 같거나 별명이 번호로 시작하면 미리 골라 두었어요. 한 번호에 두 아이를 고르면 넣지 않아요.</p>
        <div class="acts"><button class="pri big" id="go">아이 기록에 넣기</button></div>` : ''}
      <p class="small">다른 기기의 내보내기 파일: <input type="file" id="f" accept=".json,application/json"></p>
      <p class="small">종이 점검을 아직 안 만들었다면: <a href="../paper/" target="_blank" rel="noopener">종이 점검 열기(새 탭)</a> — 같은 기기 · 같은 브라우저에서 채점하면 여기서 바로 읽어요.</p>
      <div id="msg" role="status"></div>
      <div class="acts"><a class="btn" href="#/t/c/${C}">반 화면으로</a></div></div>`;
    root.querySelector('#f').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; const D2 = paperData(await f.text()); if (!D2) { root.querySelector('#msg').innerHTML = '<p class="warn">끊긴 곳 찾기에서 내보낸 파일이 아니에요.</p>'; return; } show(D2, `파일 ${esc(f.name)}`); });
    const btn = root.querySelector('#go'); if (!btn) return;
    btn.addEventListener('click', () => {
      const all = [...root.querySelectorAll('select[data-i]')].map((el) => ({ x: rows[Number(el.dataset.i)], no: el.value }));
      const pick = all.filter((p) => p.no);
      const dup = pick.map((p) => p.no).filter((no, i, a) => a.indexOf(no) !== i);
      if (dup.length) { root.querySelector('#msg').innerHTML = `<p class="warn">${[...new Set(dup)].map((no) => esc(nm(K, no))).join(', ')}에 두 아이를 골랐어요. 하나만 골라 주세요.</p>`; return; }
      // 번호를 바꿨거나 '넣지 않음'으로 돌린 아이 → 예전 번호에 넣은 기록을 지움(아이 기기도 다음에 열 때 지움 · kidstore pull)
      const move = all.filter((p) => sent[p.x.k.id] && sent[p.x.k.id].no && sent[p.x.k.id].no !== p.no);
      const say1 = [pick.length ? `${pick.map((p) => `${esc(p.x.k.label || '?')} → ${esc(nm(K, p.no))}`).join(', ')}에 넣어요` : '', move.length ? `${move.map((p) => `${esc(nm(K, sent[p.x.k.id].no))}에 넣었던 ${esc(p.x.k.label || '?')} 기록을 빼요`).join(', ')}` : ''].filter(Boolean).join('.\n');
      if (!say1 || !confirm(`${say1.replace(/<[^>]+>/g, '')}.\n\n이대로 할까요?`)) return;
      let n = 0, out = 0;
      for (const p of move) { const o = sent[p.x.k.id]; for (const rid of o.rids || []) { db.queuePut(`k/${C}/${o.no}/${K.pins[o.no]}/r/${rid}`, null);   /* 진짜 null(지움) — 글자 'null'은 서버에 "null"로 남았음(회귀 10-31) */ out++; } delete sent[p.x.k.id]; }
      for (const { x, no } of pick) {
        const ids = [], rids = [];
        for (const { sid, recs } of x.recs) { for (const rec of recs) { db.queuePut(`k/${C}/${no}/${K.pins[no]}/r/${rec.s.id}`, db.enc(rec)); rids.push(rec.s.id); } ids.push(sid); n++; }
        const old = sent[x.k.id] && sent[x.k.id].no === no ? sent[x.k.id] : {};
        sent[x.k.id] = { no, ids: [...new Set([...(old.ids || []), ...ids])], rids: [...new Set([...(old.rids || []), ...rids])], t: Date.now() };
      }
      lsSet(DONE, sent); db.flush();
      root.querySelector('#msg').innerHTML = `<p>${pick.length ? `${pick.length}명 · ${n}장을 보냈어요.` : ''}${move.length ? ` 예전 번호에서 기록 ${out}개를 뺐어요.` : ''} 아이 <b>자세히</b>에는 바로 보이고, 반 화면 · 아이 기기는 아이가 앱을 한 번 열면 바뀌어요.</p>`;
    });
  };
  const D = paperData();
  show(D, '이 브라우저의 종이 앱 기록');
}

// ── 이야기 다리 10분 카드(유형 하나) ──
//  근거: 스키마 지도 — 유형 이름 · 구조 그림 · 시범 → 함께 → 혼자 [C-9][C-10] · 핵심어 X · 불일치 이야기 섞기 [C-21][C-23] · 계산이 가벼운 수로 구조에 집중
const STORY_ASK = {
  change: ['처음에 얼마였나요?', '무슨 일이 일어났나요 — 생겼나요, 없어졌나요?', '그래서 나중엔 얼마가 됐을까요? 모르는 수는 어느 칸일까요?'],
  combine: ['어느 것이 부분이고 어느 것이 전체인가요?', '부분을 다 모으면 무엇이 되나요?', '모르는 것은 전체인가요, 한 부분인가요?'],
  compare: ['어느 쪽이 더 많아요?', '얼마나 더 많은지 묻나요, 한쪽 수를 묻나요?', "'더'라는 말이 있으면 꼭 더하기일까요?"],
  groups: ['한 묶음에 몇 개씩 들었나요?', '묶음이 몇 개인가요?', '모두 몇 개인지 묻나요, 한 묶음을 묻나요?'],
  times: ['무엇이 기준인가요?', '어느 쪽이 기준의 몇 배인가요?', "'배'라는 말이 있으면 꼭 곱하기일까요?"],
  share: ['전체가 얼마인가요?', '몇 몫으로 똑같이 나누나요?', '한 몫이 얼마인지 묻나요?'],
  pack: ['전체가 얼마인가요?', '한 번에 몇씩 덜어 내나요?', '몇 번 덜어 낼 수 있는지 묻나요? 남는 것은 어떻게 할까요?'],
};
export function storyExamples(type, n = 3, seed0 = Date.now() % 1e6) {
  const T = TYPES[type]; if (!T) return [];
  const cs = [...new Set(STORY_EASY[T.fam].flat())], out = [], seen = new Set();
  for (let seed = seed0; out.length < n * 3 && seed < seed0 + 60; seed++) {
    for (const it of planOf(cs, { seed, n: 6 })) { const pr = probOf(it); if (!pr || pr.sc.type !== type) continue; const key = toText(pr.s.story); if (seen.has(key)) continue; seen.add(key); const vs = Object.entries(pr.sc.v || {}).filter(([k, v]) => k !== 'x' && v != null).map(([, v]) => String(typeof v === 'object' ? JSON.stringify(v) : v)); if (new Set(vs).size < vs.length) continue; out.push(pr); }   /* 같은 수가 두 번 나오면 어느 칸인지 가를 수 없어 뺌 */
  }
  // 모르는 자리가 다른 것 · 불일치 이야기 하나를 셋째로
  const pick = [], slots = new Set();
  for (const pr of out) if (pick.length < n - 1 && !pr.sc.inc && !slots.has(pr.sc.slot)) { pick.push(pr); slots.add(pr.sc.slot); }
  const inc = out.find((pr) => pr.sc.inc && !pick.includes(pr)) || out.find((pr) => !pick.includes(pr));
  if (inc) pick.push(inc);
  const head = (pr) => toText(pr.s.story).slice(0, 8);
  for (const pr of out) if (pick.length < n && !pick.includes(pr) && !pick.some((q) => q.sc.slot === pr.sc.slot || head(q) === head(pr))) pick.push(pr);
  for (const pr of out) if (pick.length < n && !pick.includes(pr) && !pick.some((q) => head(q) === head(pr))) pick.push(pr);
  for (const pr of out) if (pick.length < n && !pick.includes(pr)) pick.push(pr);
  return pick.slice(0, n);
}
export function storyCardView(root, C, type) {
  const K = cls(C), T = TYPES[type]; if (!K || !T) return go('#/t');
  const ex = storyExamples(type);
  const calc = (pr) => pr.s.steps[1].item, frame = (pr) => frameSVG(pr.sc, pr.fr.list[pr.fr.right]);
  const story = (pr) => `<p class="qline">${toHTML(pr.s.story, { static: true })}</p>`;
  const ask = STORY_ASK[type] || [];
  const exBox = (pr, show) => (pr ? `${story(pr)}${show ? `<div class="sbf">${frame(pr)}</div><p class="small">식: ${staticHTML(calc(pr).prompt, calc(pr).sol)}</p>` : '<p class="note">아이들이 막대 그림을 그리고 모르는 칸에 <b class="q">?</b>를 넣은 뒤 식을 써요.</p>'}` : '');
  root.innerHTML = `<div class="card tcard hide-ans"><h2>이야기 문제 10분 카드 <small>${esc(T.kid)}</small></h2>
    ${intro('이 유형에서 이해(무슨 이야기 · 막대 그림)가 끊기는 아이 2~3명을 모아 10분. 계산은 가볍게 두고 <b>이야기의 구조</b>만 봐요. 문제는 열 때마다 바뀌어요.', 'no-print')}
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><button type="button" class="ans-t">답 보기</button><a class="btn" href="#/t/c/${C}">반 화면으로</a></div>
    <dl class="lead"><dt>이 유형</dt><dd>${esc(T.say)}</dd><dt>오늘 목표</dt><dd>낱말 하나(모두 · 더 · 배 …)로 식을 고르지 않고, <b>막대 그림에 수와 <span class="q">?</span>를 놓아 보고</b> 식을 고르게 해요.</dd></dl>
    <ol class="plan">
    ${stepBox(1, '시범 — 선생님이 소리 내어 생각하기', 3, `${askP(ask[0] || '무슨 이야기일까?')}${exBox(ex[0], true)}<p class="note">수마다 '이 수는 틀의 어느 칸일까?'를 말하며 넣고, 모르는 수 칸에 <b class="q">?</b>를 그려요.</p>`)}
    ${stepBox(2, '함께 — 아이들이 칸을 말하기', 3, `${askP(ask[1] || '어느 칸에 들어갈까?')}${exBox(ex[1], true)}`)}
    ${stepBox(3, '혼자 — 낱말에 속지 않기', 3, `${askP(ask[2] || '이 낱말이 있으면 꼭 그 셈일까?')}${exBox(ex[2], false)}${ex[2] ? `<p class="note ans">답: ${staticHTML(calc(ex[2]).prompt, calc(ex[2]).sol)}${ex[2].sc.inc ? ' — 낱말과 셈이 반대인 이야기예요.' : ''}</p>` : ''}`)}
    ${stepBox(4, '마무리', 1, askP('이 이야기에서 무엇을 보고 틀을 골랐나요? 한 줄로 말해 볼까?'))}
    </ol>
    <p class="small muted foot">앱의 이야기 문제도 같은 걸음(무슨 이야기 → 막대 그림 → 식 → 답)이에요. 같은 유형을 두 번 이어 맞히면 앞 두 걸음을 건너뛰어요.</p></div>`;
}

// ── 가정 안내문(인쇄용 · 반 하나에 한 장 · 아이 기록 X) ──
//  근거: 집에서 도울 때 답을 알려 주기보다 아이가 스스로 확인하게(검산 도구 · 다시 쓰기) [D-13][D-15] · 짧고 자주 [D-6][D-8] · 시간 재촉 X [B-R14][B-R16]
export function homeLetterView(root) {
  const url = appURL();
  root.innerHTML = `<div class="card tcard letter"><h2>가정 안내 — 튼튼 수 다리</h2>
    ${intro('인쇄해서 나눠 주세요. 아이 이름 · 기록은 들어가지 않아요. 문장은 선생님 말투로 고쳐 써도 좋아요.', 'no-print')}
    <div class="acts no-print"><button class="pri" onclick="print()">인쇄</button><a class="btn" href="#/t">처음으로</a></div>
    <p>우리 반은 수학 시간에 <b>튼튼 수 다리</b>를 써요. 점검으로 아이에게 빠진 앞 학년 셈을 찾고, 그것만 배우고 연습해요. 화면은 카드 셋(점검 · 배울 것 · 매일 연습)이에요. 집에서도 같은 카드로 들어갈 수 있어요.</p>
    <h3>들어가는 법</h3><ol class="easy"><li>주소: <b>${esc(url)}</b></li><li>아이 카드에 적힌 <b>반 코드 · 번호 · 핀</b>을 넣어요. 아이 이름은 서버에 올리지 않아요(선생님 기기에만 남아요).</li><li>학교에서 푼 것과 집에서 푼 것이 이어져요. 하다가 나간 것은 같은 기기로 다시 들어오면 그 자리부터 이어서 풀어요.</li></ol>
    <h3>집에서 이렇게 도와주세요</h3><ul class="easy">
      <li><b>하루 5분이면 충분해요.</b> 처음 화면의 '매일 연습'이나 주황 단추 하나만 해도 돼요. 길게 한 번보다 짧게 자주가 오래 남아요.</li>
      <li><b>답을 알려 주지 말아 주세요.</b> 틀리면 튼튼이가 그 문제 숫자로 떠올릴 것을 말해 주고, 그래도 어려우면 한 단계씩 같이 풀어 줘요. "어디서 달라졌어?" 한마디면 돼요.</li>
      <li><b>시간을 재촉하지 말아 주세요.</b> 아이는 자기 지난 기록하고만 비교해요.</li>
      <li><b>'얼마나 자신 있는지'를 같이 봐 주세요.</b> 답을 쓰고 '자신 있어요 · 조금 헷갈려요 · 자신 없어요' 가운데 하나를 눌러 내요. 내 짐작이 맞아 가는 것도 실력이 느는 거예요.</li>
      <li>문장제는 <b>이야기 문제</b>에서 '무슨 이야기 → 막대 그림 → 식 → 답'으로 나눠 풀어요. 글이 길면 '읽어 주기' 단추를 눌러도 돼요.</li></ul>
    <h3>이런 건 하지 않아요</h3><ul class="easy"><li>순위 · 친구와 비교하기 · 점수 공개는 없어요.</li><li>틀린 까닭은 앱이 짐작한 것이고, 선생님이 학교에서 확인해요.</li></ul>
    <p class="small muted foot">궁금한 점은 담임 선생님께 물어봐 주세요.</p></div>`;
}
