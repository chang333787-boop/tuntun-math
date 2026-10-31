// 막힌 문제 거꾸로 찾기 — 아이가 못 푸는 문제에서 시작해 '왜'를 거꾸로 따라감(교사 10-31 '애들이 계열성을 알 필요 없음 · 리버스 엔지니어링')
//  흐름: 문제 그대로 쓰기(또는 예시 카드) → 처음 문제 → (틀리면) 같은 숫자로 쪼갠 단계 → 틀린 단계의 칸을 새 숫자로 확인 → 막히면 한 층 아래로
//  → '끊긴 곳' → 판자 고치기 → 처음 문제 다시 풀기. 아이 화면엔 학년 · 단원 이름이 없다(칸 이름은 '할 수 있는 것' 말로만)
//  엔진 = engine/engine.js(쪼갠 단계 · 한 겹씩 거꾸로 · 실수 규칙) · 기록은 종이와 같은 판정 묶음으로도 남겨 선생님 화면에 보임
import { byId, makeItem, gradeIdx } from '../../engine/lessons/index.js';
import { readProblem } from '../../engine/lessons/read.js';
import { newSession, currentItem, answer as engAnswer } from '../../engine/engine.js';
import { toHTML } from '../../engine/tokens.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw, ansSay } from './item.js';
import { P } from '../../engine/concepts/kit.js';
import { lsGet, lsSet, lsDel, esc, rand } from './local.js';
import { go, meOf } from './kid.js';
import { exampleOf } from './fix.js';

const say = (pose, html, size = 64) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const kid = (c) => (byId[c] ? byId[c].kid : c);
const plank = (c) => { const x = exampleOf(c); return x ? `${x} 같은 문제` : kid(c); };   /* 찾은 곳은 이름 대신 예시 문제로(낮은 학년 이름이 크게 보이지 않게) */
const EX = ['7 + 8', '47 + 38', '52 − 27', '245 + 378', '306 − 158', '8 × 7', '34 × 6', '23 × 45', '96 ÷ 4', '17 ÷ 5', '3/5 + 1/5', '2 1/3 + 1 2/3'];

// 거꾸로 길 — 지금까지 따라간 칸(처음 문제 → 단계 → 더 아래) · 상태: 확인 중 · 됨 · 막힘
function trailHTML(S, now) {
  const seen = [], depth = {};
  for (const l of S.log) if (!seen.includes(l.c)) { seen.push(l.c); depth[l.c] = l.role === 'problem' ? 0 : l.role === 'step' ? 1 : (l.depth || 0) + 1; }
  if (now && !seen.includes(now.c)) { seen.push(now.c); depth[now.c] = now.role === 'problem' ? 0 : now.role === 'step' ? 1 : (now.depth || 0) + 1; }
  const st = (c) => { const r = S.res[c]; if (now && now.c === c) return 'now'; if (!r) return 'wait'; return r.st === 'pass' ? 'ok' : r.st === 'fail' ? 'bad' : r.st === 'unstable' ? 'shaky' : 'wait'; };
  const icon = { now: '🔍', ok: '✓', bad: '✕', shaky: '△', wait: '·' };
  return `<div class="trail" aria-label="거꾸로 따라간 길">${seen.map((c, i) => `${i ? '<span class="arr">←</span>' : ''}<span class="tnode t-${st(c)}" style="--d:${depth[c]}"><i>${icon[st(c)]}</i>${esc(i === 0 ? '처음 문제' : kid(c))}</span>`).join('')}</div>`;
}

export function backView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me);
  const SK = `tt.back.${me.C}.${me.no}`;
  let S = lsGet(SK);
  if (S && !S.done && Date.now() - S.t0 < 3 * 3600e3) return run(root, me, K, S, SK);
  root.innerHTML = `<div class="card">${say('think', '풀기 어려운 문제가 있어요? <b>그대로 써 봐요.</b><br>튼튼이가 <b>거꾸로</b> 따라가며 어디서 끊겼는지 찾아 줄게요.', 72)}
    <div class="field"><label for="pq">어려운 문제</label><input id="pq" placeholder="예: 47 + 38" style="max-width:420px" autocomplete="off"></div>
    <div id="pv" class="muted small" style="min-height:48px"></div>
    <p class="small muted" style="margin:10px 0 4px">이런 문제를 눌러도 돼요</p>
    <div class="plank-list">${EX.map((x) => `<button type="button" class="pk exq" data-x="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <div class="acts"><button class="pri big" id="go" disabled>거꾸로 찾기 시작</button><a class="btn" href="#/me">내 수 다리로</a></div></div>`;
  const pq = root.querySelector('#pq'), pv = root.querySelector('#pv'), btn = root.querySelector('#go');
  let picked = null;
  const read = () => {
    const t = pq.value.trim(); picked = null; btn.disabled = true;
    if (!t) { pv.textContent = ''; return; }
    let r; try { r = readProblem(t); } catch (e) { r = { error: '이 문제는 아직 못 읽어요.' }; }
    if (r.error || !byId[r.c]) { pv.innerHTML = `<span style="color:#8a2d12">${esc(r.error || '이 문제는 아직 못 읽어요. 숫자와 + − × ÷ 로 써 볼래요?')}</span>`; return; }
    let it; try { it = makeItem(r.c, r.p); } catch (e) { pv.textContent = '이 문제는 아직 못 읽어요.'; return; }
    picked = { c: r.c, p: r.p, text: t };
    pv.innerHTML = `튼튼이가 읽은 문제: <span class="math" style="font-size:24px">${toHTML(it.prompt, { static: true })}</span>`;
    btn.disabled = false;
  };
  pq.addEventListener('input', read);
  pq.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
  root.querySelectorAll('.exq').forEach((b) => b.addEventListener('click', () => { pq.value = b.dataset.x; read(); }));
  btn.addEventListener('click', () => {
    if (!picked) return;
    const rep = KS.reportOf(K), prior = {};
    for (const x of Object.values(rep.L)) if (x.st === 'ok' && byId[x.c]) prior[x.c] = { s: 'known', t: Date.now() };   // 이미 튼튼한 칸은 다시 묻지 않음
    delete prior[picked.c];
    const S2 = newSession({ id: rand(6), sid: me.no, problem: picked, prior, opts: { maxItems: 30, confirmN: 3 } });
    lsSet(SK, S2);
    run(root, me, K, S2, SK);
  });
  pq.focus();
}

function run(root, me, K, S, SK) {
  KS.setNow(me, { mode: 'back', c: S.problem.c });
  const step = () => {
    const q = currentItem(S);
    if (!q || S.done) return done();
    const top = q.role === 'problem' ? (S.log.length ? '처음 문제와 닮은 문제를 새 숫자로 한 번 더 풀어요. 한 번만으로는 정말 아는지 알 수 없어요.' : '먼저 처음 문제를 풀어 봐요. 모르면 넘어가도 괜찮아요.')
      : q.role === 'step' ? `같은 숫자로 <b>쪼개</b> 볼게요 (${q.n}/${q.of}) — ${esc(q.why || '')}`
      : S.verifying ? '맞혔어요! 새 숫자로 몇 개 더 풀어서 정말 아는지 봐요.'
      : `여기서 끊겼는지 <b>새 숫자</b>로 알아봐요.<br><b>${esc(kid(q.c))}</b>`;
    root.innerHTML = `<div class="card">${trailHTML(S, q)}${say(q.role === 'step' ? 'point' : 'think', top, 56)}<div id="slot"></div></div>`;
    draw(root.querySelector('#slot'), { prompt: q.item.prompt, choices: q.item.choices || null, tag: q.role === 'problem' ? '처음 문제' : q.role === 'step' ? '쪼개기' : '확인', conf: false, onAnswer: (a, cf, ms) => { engAnswer(S, { ...a, ms, t: Date.now() }); lsSet(SK, S); step(); } });
  };
  const done = () => {
    lsDel(SK);
    // 종이와 같은 판정 묶음으로도 남김(선생님 화면 · 오늘 할 일)
    const items = S.log.map((l, i) => ({ k: i + 1, c: l.c, p: l.p, gate: false, covers: null, ch: 'B', form: 'h', cls: '', snap: null }));
    const sh = { v: 1, id: `${S.id}-b`, kind: 'back', made: Date.now(), unit: null, items, chapters: [{ key: 'B', ks: items.map((x) => x.k) }] };
    const R = { done: { B: true }, it: Object.fromEntries(S.log.map((l, i) => [i + 1, l.ok ? { s: 'ok' } : l.idk ? { s: 'q' } : { s: 'x', a: l.raws }])) };
    const ms = Object.fromEntries(S.log.map((l, i) => [i + 1, l.ms || 0]));
    if (items.length) KS.addSheet(me, K, sh, R, {}, ms);
    const res = S.result || { roots: [], bridges: [], shaky: [], known: [], states: {} };
    const C0 = S.problem.c, st0 = res.states[C0];
    const root0 = res.roots.slice().sort((a, b) => gradeIdx(byId[a].g) - gradeIdx(byId[b].g))[0];
    K.back = { c: C0, p: S.problem.p, text: S.problem.text, root: root0 || (res.bridges.includes(C0) ? C0 : null), t: Date.now() };
    KS.save(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const chain = (() => { if (!root0) return []; const out = [root0]; let cur = root0; for (let g = 0; g < 6; g++) { const up = Object.entries(res.states).find(([c, v]) => v.s === 'shaky' && (v.because || []).includes(cur) && !out.includes(c)); if (!up) break; out.push(up[0]); cur = up[0]; } if (!out.includes(C0)) out.push(C0); return out; })();
    const chainHTML = chain.length ? `<div class="trail big">${chain.map((c, i) => `${i ? '<span class="arr">→</span>' : ''}<span class="tnode ${i === 0 ? 't-bad' : 't-wait'}"><i>${i === 0 ? '✕' : '·'}</i>${esc(c === C0 ? `처음 문제(${S.problem.text})` : kid(c))}</span>`).join('')}</div><p class="small muted">왼쪽이 끊긴 곳이에요. 여기를 고치면 오른쪽으로 차례로 이어져요.</p>` : '';
    let head, acts;
    if (root0) { head = say('fix', `찾았어요! <b>${esc(S.problem.text)}</b>${P(S.problem.text, '이', '가')} 어려웠던 까닭은 <b>${esc(plank(root0))}</b>에서 끊겨서예요.<br>여기부터 고치면 처음 문제도 풀려요.`, 72); acts = `<a class="btn pri big" href="#/fix/${root0}">여기부터 고치기</a>`; }
    else if (st0 && st0.s === 'bridge') { head = say('think', `쪼갠 단계는 다 알아요! <b>합쳐서 한 번에 풀기</b>가 빈칸이에요. ${esc(st0.note || '')}`, 72); acts = `<a class="btn pri big" href="#/fix/${C0}">합쳐 풀기 연습</a>`; }
    else if (st0 && ['known', 'auto', 'slow'].includes(st0.s)) { head = say('cheer', `이 문제는 이미 튼튼해요! 새 숫자로도 다 맞혔어요.${st0.s === 'slow' ? ' 조금 느려요 — 다듬기로 빠르게 해 볼까요?' : ''}`, 72); acts = `<a class="btn pri big" href="#/drill/${C0}">다듬기</a>`; }
    else { head = say('think', '오늘은 여기까지 찾았어요. 조금 흔들리는 곳이 있어요 — 선생님과 함께 보거나 다음에 이어서 찾아요.', 72); acts = res.shaky.length ? `<a class="btn pri big" href="#/fix/${res.shaky[0]}">${esc(kid(res.shaky[0]))} 다지기</a>` : ''; }
    root.innerHTML = `<div class="card">${head}${chainHTML}<div class="acts">${acts}<a class="btn big" href="#/back">다른 문제 찾기</a><a class="btn" href="#/me">내 수 다리로</a></div></div>`;
  };
  step();
}

// 고친 뒤 처음 문제 다시 — 같은 숫자로(아이가 막혔던 그 문제가 풀리는 걸 보게)
export function retryView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me), B = K.back;
  if (!B || !byId[B.c]) return go('#/me');
  const it = makeItem(B.c, B.p);
  root.innerHTML = `<div class="card">${say('point', `처음에 막혔던 문제예요. 이제 풀어 볼까요?`, 64)}<div id="slot"></div></div>`;
  draw(root.querySelector('#slot'), { prompt: it.prompt, choices: it.choices || null, tag: '처음 문제 다시', conf: false, onAnswer: (a) => {
    let ok = false; if (!a.idk) { try { ok = !!it.check(a.vals, a.raws).ok; } catch (e) { ok = false; } }
    if (ok) { K.back = { ...B, solved: Date.now() }; KS.save(me, K); }
    root.innerHTML = `<div class="card">${ok ? say('cheer', `풀었어요! <b>${esc(B.text)}</b> — 처음엔 막혔던 문제예요. 끊긴 곳을 고치니 이어졌어요.`, 84) : say('think', `${ansSay(it)}<br>아직 한 군데가 더 끊겼을 수 있어요. 거꾸로 한 번 더 찾아봐요.`, 72)}
      <div class="acts">${ok ? `<a class="btn pri big" href="#/drill/${B.c}">이 문제 다듬기</a>` : `<a class="btn pri big" href="#/back">다시 거꾸로 찾기</a>`}<a class="btn big" href="#/me">내 수 다리로</a></div></div>`;
  } });
}
