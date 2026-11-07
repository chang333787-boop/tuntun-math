// 튼튼 수 다리 — 화면 나누기(#/주소)
import { mascot } from '../../paper/js/mascot.js';
import { joinView, homeView, prepView, fixView, reviewView, meOf, whoView, whoOk, WHO } from './kid.js';
import { stagesView, drillView } from './stageview.js';
import { backView, retryView } from './back.js';
import { runView } from './run.js';
import { weekView } from './week.js';
import { storyView } from './story.js';
import { stopSpeak } from './speak.js';
import { tryView, tryInfo } from './try.js';
import { sheetView } from './sheet.js';
import { giveView } from './give.js';
import { checkRunView } from './check.js';
import { checkView, checkPrintView } from './tcheck.js';
import { tableView, giveTView } from './ttable.js';
import { teacherHome, newClassView, openClassView, cardsView, namesView, classView, kidDetailView, groupCardView, guideView, mindCardView, paperImportView, storyCardView, homeLetterView } from './teacher.js';
import { lsGet, esc } from './local.js';
import { flush, pending } from './db.js';
import { icon, tile } from './icons.js';

const root = document.getElementById('view');
addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });   /* 손가락으로 누른 기기 → hover 끔(app.css) */
document.getElementById('logo-m').innerHTML = mascot('hi', 34);
// 누름 손맛 — 터치 · 펜은 :active가 늦거나 안 보여서, 누른 동안 .press를 붙임(짧게 톡 쳐도 120ms는 보이게 · app.css 단추 규칙과 같은 모양)
const PRESS = 'button, .btn, .tile, .todo .item, .big-pick, .tabs a';
let pressed = null, pressAt = 0;
const unpress = () => { const el = pressed; if (!el) return; pressed = null; setTimeout(() => el.classList.remove('press'), Math.max(0, 120 - (Date.now() - pressAt))); };
addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; const el = e.target.closest && e.target.closest(PRESS); if (!el || el.disabled) return; pressed = el; pressAt = Date.now(); el.classList.add('press'); }, { passive: true });
['pointerup', 'pointercancel'].forEach((t) => addEventListener(t, unpress, { passive: true }));
// 아이 머리띠 — 탭 없이 [처음 화면] 하나(처음 화면의 카드 셋이 길잡이 · 교사 11-07 '로그인하면 카드 셋으로')
const tabs = document.getElementById('tabs');
tabs.innerHTML = `<a href="#/me">${icon('home', 20)}<span>처음 화면</span></a>`;
const setTabs = (h) => { tabs.hidden = !h || /^#\/me$/.test(h); };
let cleanup = null;
// 같은 크롬북을 여럿이 쓸 때 — 아이 화면은 앱을 열 때 · 날짜가 바뀌었을 때 · 20분 넘게 손대지 않다가 누를 때 'n번 맞아요?'(혹평 17)
//  idle = 바로 앞 입력과 이번 입력 사이(누른 그 입력이 주소를 바꾸므로 그 앞 공백을 봄)
let lastIn = Date.now(), idle = 0;
const touched = () => { const n = Date.now(); idle = n - lastIn; lastIn = n; };
addEventListener('pointerdown', touched, { capture: true, passive: true });
addEventListener('keydown', touched, { capture: true, passive: true });

function startView(r) {
  const me = meOf();
  if (me) { location.hash = '#/me'; return; }
  r.innerHTML = `<div class="card msg"><div class="say">${mascot('hi', 104)}<div class="bub">안녕하세요! 저는 비버 <b>튼튼이</b>예요.<br>내가 어디까지 아는지 점검하고, 모르는 건 배우고, 날마다 조금씩 연습해요.</div></div>
    <div class="grid2"><a class="big-pick" href="#/join">${tile('prep', 28)}<b>학생이에요</b><span>선생님이 나눠 준 카드를 보고 들어가요</span></a>
    <a class="big-pick" href="#/t">${tile('week', 28)}<b>선생님이에요</b><span>반 만들기 · 점검 내기 · 반 표 · 보충 주기</span></a></div></div>`;
}
const ROUTES = [
  [/^#\/try(?:\/(.+))?$/, (m) => tryView(root, m[1])],
  [/^#?\/?$/, () => startView(root)],
  [/^#\/join/, () => joinView(root)],
  [/^#\/me$/, () => homeView(root)],
  [/^#\/prep\/([\d-]+)$/, (m) => prepView(root, m[1])],
  [/^#\/fix\/([\w:.%-]+)$/, (m) => fixView(root, decodeURIComponent(m[1]))],   /* %3A(encodeURIComponent한 :)도 — 보충 끝 · 이번 주 점검 '배우기' 단추가 처음 화면으로 가던 것(11-07 사용감 점검) */
  [/^#\/review$/, () => reviewView(root)],
  [/^#\/stages$/, () => stagesView(root)],
  [/^#\/back$/, () => backView(root)],
  [/^#\/run$/, () => runView(root)],
  [/^#\/week$/, () => weekView(root)],
  [/^#\/story(?:\/([^?]+))?(\?.*)?$/, (m) => storyView(root, m[1] ? decodeURIComponent(m[1]) : '')],
  [/^#\/retry$/, () => retryView(root)],
  [/^#\/drill\/([\w:.%-]+?)(\?.*)?$/, (m) => drillView(root, decodeURIComponent(m[1]))],
  [/^#\/give\/([\w-]+)$/, (m) => giveView(root, m[1])],
  [/^#\/t$/, () => teacherHome(root)],
  [/^#\/t\/new/, () => newClassView(root)],
  [/^#\/t\/open$/, () => openClassView(root)],
  [/^#\/t\/guide$/, () => guideView(root)],
  [/^#\/t\/letter$/, () => homeLetterView(root)],
  [/^#\/t\/sheet(\?.*)?$/, () => sheetView(root)],
  [/^#\/t\/c\/(\w+)$/, (m) => classView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/cards$/, (m) => cardsView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/table(\?.*)?$/, (m) => tableView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/give(\?.*)?$/, (m) => giveTView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/names$/, (m) => namesView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/paper$/, (m) => paperImportView(root, m[1])],
  [/^#\/check\/([A-Za-z0-9-]{1,24})$/, (m) => checkRunView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/check$/, (m) => checkView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/check\/([A-Za-z0-9-]{1,24})\/print$/, (m) => checkPrintView(root, m[1], m[2])],
  [/^#\/t\/c\/(\w+)\/s\/(\w+)$/, (m) => storyCardView(root, m[1], m[2])],
  [/^#\/t\/c\/(\w+)\/k\/(\d+)$/, (m) => kidDetailView(root, m[1], m[2])],
  [/^#\/t\/c\/(\w+)\/g\/(.+)$/, (m) => groupCardView(root, m[1], decodeURIComponent(m[2]))],
  [/^#\/t\/c\/(\w+)\/m\/([\w.]+)$/, (m) => mindCardView(root, m[1], m[2])],
];
function route() {
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { /* */ } }
  stopSpeak();
  cleanup = null;
  const h = location.hash || '#/';
  const kid = /^#\/(me|prep|fix|review|join|stages|drill|back|retry|run|story|week|give|check)/.test(h);
  document.body.classList.toggle('kid', kid);
  document.body.classList.toggle('wide', /^#\/t\/c\/\w+(\/table|\/give)?(\?.*)?$/.test(h));   /* 반 화면 · 반 표 · 보충 주기는 넓게(1440) */
  const me = meOf();
  setTabs(kid && me && !/^#\/join/.test(h) ? h : null);
  document.getElementById('who').textContent = kid && me ? `${me.C} · ${me.no}번` : /^#\/t/.test(h) ? '선생님' : '';
  { const tl = document.getElementById('trylink'); if (tl) tl.hidden = !tryInfo() || /^#\/try/.test(h); }   /* 시험 반이 있는 기기만 */
  if (kid && me && !/^#\/join/.test(h)) {
    if (idle > 20 * 60000) WHO.ok = false;
    idle = 0;
    if (!whoOk(me)) { setTabs(null); window.scrollTo(0, 0); return whoView(root, me, () => { idle = 0; route(); }); }   /* '네'를 누른 그 입력의 쉰 시간으로 다시 묻지 않게(회귀 10-31) */
  }
  for (const [re, f] of ROUTES) { const m = h.match(re); if (m) { cleanup = f(m); window.scrollTo(0, 0); return; } }
  startView(root);
}
window.addEventListener('hashchange', route);
route();
flush();
setInterval(() => { if (pending()) flush(); }, 20000);
