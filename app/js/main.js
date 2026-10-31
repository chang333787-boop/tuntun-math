// 튼튼 수 다리 — 화면 나누기(#/주소)
import { mascot } from '../../paper/js/mascot.js';
import { joinView, homeView, prepView, fixView, reviewView, meOf } from './kid.js';
import { stagesView, drillView } from './stageview.js';
import { teacherHome, newClassView, openClassView, cardsView, namesView, classView, kidDetailView, groupCardView, guideView } from './teacher.js';
import { lsGet, esc } from './local.js';
import { flush, pending } from './db.js';

const root = document.getElementById('view');
document.getElementById('logo-m').innerHTML = mascot('hi', 36);
let cleanup = null;

function startView(r) {
  const me = meOf();
  if (me) { location.hash = '#/me'; return; }
  r.innerHTML = `<div class="card"><div class="say">${mascot('hi', 84)}<div class="bub">안녕하세요! 저는 다리를 놓는 비버 <b>튼튼이</b>예요.<br>오늘 배울 단원으로 가는 수 다리가 튼튼한지 같이 봐요.</div></div>
    <div class="grid2"><a class="big-pick" href="#/join"><b>학생이에요</b><span>선생님이 준 카드(반 코드 · 번호 · 핀)로 들어가요</span></a>
    <a class="big-pick" href="#/t"><b>선생님이에요</b><span>반 만들기 · 오늘 단원 열기 · 반 한눈 보기</span></a></div></div>`;
}
const ROUTES = [
  [/^#?\/?$/, () => startView(root)],
  [/^#\/join/, () => joinView(root)],
  [/^#\/me$/, () => homeView(root)],
  [/^#\/prep\/([\d-]+)$/, (m) => prepView(root, m[1])],
  [/^#\/fix\/([\w:.-]+)$/, (m) => fixView(root, decodeURIComponent(m[1]))],
  [/^#\/review$/, () => reviewView(root)],
  [/^#\/stages$/, () => stagesView(root)],
  [/^#\/drill\/([\w:.-]+?)(\?.*)?$/, (m) => drillView(root, decodeURIComponent(m[1]))],
  [/^#\/t$/, () => teacherHome(root)],
  [/^#\/t\/new/, () => newClassView(root)],
  [/^#\/t\/open$/, () => openClassView(root)],
  [/^#\/t\/guide$/, () => guideView(root)],
  [/^#\/t\/c\/(\w+)$/, (m) => classView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/cards$/, (m) => cardsView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/names$/, (m) => namesView(root, m[1])],
  [/^#\/t\/c\/(\w+)\/k\/(\d+)$/, (m) => kidDetailView(root, m[1], m[2])],
  [/^#\/t\/c\/(\w+)\/g\/(.+)$/, (m) => groupCardView(root, m[1], decodeURIComponent(m[2]))],
];
function route() {
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { /* */ } }
  cleanup = null;
  const h = location.hash || '#/';
  const kid = /^#\/(me|prep|fix|review|join|stages|drill)/.test(h);
  document.body.classList.toggle('kid', kid);
  const me = meOf();
  document.getElementById('who').textContent = kid && me ? `${me.C} · ${me.no}번` : /^#\/t/.test(h) ? '선생님' : '';
  for (const [re, f] of ROUTES) { const m = h.match(re); if (m) { cleanup = f(m); window.scrollTo(0, 0); return; } }
  startView(root);
}
window.addEventListener('hashchange', route);
route();
flush();
setInterval(() => { if (pending()) flush(); }, 20000);
