// 시험 반 — 선생님이 혼자 끝없이 시험할 때: 즐겨찾기 주소 하나로 선생님 · 1번 · 2번 · 3번을 단추 하나로 오감
//  주소 꼴: #/try/<반 코드>/<선생님 열쇠>/<핀1.핀2.핀3> — 열쇠 · 핀은 주소의 # 뒤에만(서버로 가지 않음 · 공개 저장소에 적지 않음)
//  처음 열면 이 기기에 반 정보(tt.t)와 시험 주소(tt.try)를 적어 둠 → 그다음엔 #/try만 열어도 됨 · 머리띠에 '시험 반' 바로가기
import * as db from './db.js';
import { lsGet, lsSet, esc } from './local.js';
import { WHO } from './kid.js';
import { today } from './run.js';
import { mascot } from '../../paper/js/mascot.js';
import { icon } from './icons.js';

const say = (html) => `<div class="say">${mascot('hi', 64)}<div class="bub">${html}</div></div>`;
export const tryInfo = () => lsGet('tt.try', null);

export function tryView(root, arg) {
  // 주소에 열쇠가 있으면 이 기기에 적어 둠
  const m = (arg || '').match(/^([A-Z0-9]{6})\/([A-Za-z0-9]{24})\/([0-9]{4}(?:\.[0-9]{4})*)$/);
  if (m) {
    const [, C, T, ps] = m, pins = Object.fromEntries(ps.split('.').map((p, i) => [String(i + 1), p]));
    const X = lsGet('tt.t', { classes: {} }), old = X.classes[C] || {};
    X.classes[C] = { ...old, T, g: old.g || '4-2', n: Object.keys(pins).length, pins, names: { 1: '시험1', 2: '시험2', 3: '시험3', ...(old.names || {}) }, made: old.made || Date.now() };
    lsSet('tt.t', X); lsSet('tt.try', { C, n: Object.keys(pins).length });
    history.replaceState(null, '', '#/try');   /* 열쇠가 주소창 · 방문 기록에 남지 않게 */
  }
  const info = tryInfo(), X = lsGet('tt.t', { classes: {} }), K = info && X.classes[info.C];
  if (!info || !K) { root.innerHTML = `<div class="card">${say('시험 반 주소(즐겨찾기)로 열어 주세요.')}</div>`; return; }
  const me = lsGet('tt.me', null), now = me && me.C === info.C ? me.no : null;
  const kids = Array.from({ length: info.n }, (_, i) => String(i + 1));
  root.innerHTML = `<div class="card try"><h2>시험 반 <small>${esc(info.C)} · 선생님 1 · 학생 ${info.n}</small></h2>
    ${say('누구로 볼까요? 누르면 바로 그 사람 화면으로 가요. 기록은 진짜 반처럼 서버에 남아요.')}
    <div class="try-grid">
      <a class="try-b" href="#/t/c/${esc(info.C)}">${icon('chart', 28)}<b>선생님</b><span>반 화면</span></a>
      ${kids.map((no) => `<button type="button" class="try-b${now === no ? ' on' : ''}" data-no="${no}">${icon('star', 28)}<b>${no}번 학생</b><span>${now === no ? '지금 이 아이' : '아이 화면'}</span></button>`).join('')}
    </div>
    <h3>처음부터 다시</h3><p class="small muted">그 학생의 기록을 서버와 이 기기에서 모두 지워요(되돌릴 수 없어요 — 시험 반만).</p>
    <div class="acts">${kids.map((no) => `<button type="button" class="mini" data-reset="${no}">${no}번 기록 지우기</button>`).join('')}</div>
    <p class="small" id="tmsg" role="status"></p></div>`;
  root.querySelectorAll('[data-no]').forEach((b) => b.addEventListener('click', () => {
    const no = b.dataset.no;
    lsSet('tt.me', { C: info.C, no, pin: K.pins[no] });
    lsSet('tt.who', { d: today(), k: `${info.C}.${no}` }); WHO.ok = true;   /* 시험 반은 'n번 맞아요?'를 건너뜀 */
    location.hash = '#/me';
  }));
  root.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', async () => {
    const no = b.dataset.reset, msg = root.querySelector('#tmsg');
    if (!confirm(`${no}번 학생 기록을 모두 지울까요?`)) return;
    msg.textContent = '지우는 중…';
    try { await db.put(`k/${info.C}/${no}/${K.pins[no]}`, null); } catch (e) { msg.textContent = `지우지 못했어요: ${e.message}`; return; }
    try { for (const k of Object.keys(localStorage)) if (k.includes(`${info.C}.${no}`)) localStorage.removeItem(k); } catch (e) { /* */ }
    lsSet('tt.queue', (lsGet('tt.queue', []) || []).filter((x) => !String(x.path || '').startsWith(`k/${info.C}/${no}/`)));   /* 그 아이 것만 보내지 않게 */
    msg.textContent = `${no}번 학생 기록을 지웠어요. 처음 들어온 아이처럼 시작해요.`;
  }));
}
