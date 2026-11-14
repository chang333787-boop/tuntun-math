// 틀렸을 때 도움 사다리 — 넘어가지 않고 ① 떠올리기 → ② 한 단계씩 → ③ 처음 문제 다시(교사 11-07 '개념을 떠올리게 · 다 말고 단계별로 · 7 + 8이면 7 + 3 + 5 · 7 + 3은 10 · 그다음 15')
//  근거 · 판정 정본 docs/hint_ladder.md(조사 팀 R 11-07) · 움직임 docs/motion.md
//  ① 떠올리기: 이 문제 숫자로 쓸 생각을 묻는 한두 문장(engine/hints cueOf · 없으면 차시 hint에서 숫자 없는 문장만)만 · 같은 문제를 다시 · [한 단계씩 같이]로 바로 ②도
//     보기가 둘인 문항은 다시 고르기 없이 ②로(찍어도 맞음) · 셋 넘으면 고른 보기를 지우고 한 번만(맞혀도 '스스로 고침'으로 세지 않음 — how 'pick')
//  ② 한 단계씩: 단계 문제(fix.js stepsOf)를 하나씩 아이가 채움 · 한 단계 안은 글 → (한 번 틀리면) 그림 → (두 번 틀리면) 그 단계 답
//     10칸 틀은 마지막 단계에서 옮기는 모습을 한 번(앞 단계를 아이가 풀거나 답을 본 뒤 — 답을 대신 보여 주지 않게) · 세로셈은 채운 자리까지
//  ③ 처음 문제 다시: 채운 단계를 보며 처음 문제의 답 · 또 틀리면 답을 보여 주고 끝(내일 매일 연습에 또)
//  2초 안에 낸 오답은 시도로 세지 않음(찍기 거르기 — item.js rushGuard와 같은 기준) · 한 판에 '한 단계씩'을 여는 수는 부르는 쪽이 정함(budget — 매일 연습 2 · 선생님이 준 문제 3)
//  기록(판정)은 부르는 쪽이 첫 답으로 이미 적음 — 여기서 고친 것은 판정에 넣지 않고 스스로 고친 횟수로만(recall · steps) · 점검(진단)에서는 쓰지 않음
import { bridgeOf } from '../../engine/bridges.js';
import { byId, makeItem } from '../../engine/lessons/index.js';
import { cueOf, planOf, picOf, picSpec } from '../../engine/hints/index.js';
import { picSVG } from '../../engine/pics.js';
import { FIGK } from '../../engine/figs.js';
import { toText } from '../../engine/tokens.js';
import { readExpr } from '../../engine/errors.js';
import { draw, staticHTML, ansSay, fbSlot, nbsp } from './item.js';
import { stepsOf } from './fix.js';
import { colOf, colView, tenFrameHTML, regroupHTML, rgLag } from './model.js';
import { esc } from './local.js';
import { P } from '../../engine/concepts/kit.js';
import { mascot } from '../../paper/js/mascot.js';
import { speakButton } from './speak.js';

const RUSH = 2000;
const sameAns = (it, a) => { try { return !!it.check(a.vals, a.raws).ok; } catch (e) { return false; } };
const mine = (it, raws) => (!raws ? '넘어감' : it.choices ? toText(it.choices[Number(raws[0])] || []) : raws.join(', '));
// 떠올리기 말 — 엔진 hints가 먼저 · 없으면 차시 hint에서 숫자 없는 문장만('먼저 10을 만들어요.' — 다른 숫자로 든 예는 빼야 헷갈리지 않음 · 조사 R)
export function cueFor(c, p) {
  const x = cueOf(c, p); if (x) return x;
  const L = byId[c]; if (!L || !L.hint) return '';
  return String(L.hint).split(/(?<=[.?!])\s+/).filter((t) => !/\d\s*[+−×÷=]|[+−×÷=]\s*\d|→/.test(t)).join(' ').trim();   /* 식이 든 문장(다른 숫자 예)만 뺌 — '먼저 10을 만들어요.'는 남김 */
}
// 풀이 순서(교사 11-07 '알고리즘적 사고 — 아이한테 알고리즘이란 말은 안 하지만 단계적으로 하나씩') — 아이 말로는 '풀이 순서'
//  names = 숫자 없는 단계 이름(engine/hints plan) · 없으면 단계 글에서 숫자를 ○로 가림(아직 안 한 단계의 숫자 = 앞 단계 답이 샘)
export const planNames = (c, p, steps) => planOf(c, p, steps.length);
export function planHTML(steps, names, cur, shown = new Set(), lastLabel = '이 문제의 답 쓰기') {
  const nm = (i) => (names ? names[i] : i <= cur ? steps[i].why : String(steps[i].why).replace(/\d+(?:\.\d+)?/g, '○'));   /* 이름이 있으면 늘 짧은 이름(지금 단계 글은 말풍선에 — 같은 글 두 번 X · 11-07) */
  const li = (cls, mark, t) => `<li class="${cls}"><i>${mark}</i><span>${esc(t)}</span></li>`;
  return `<div class="plan"><p class="plan-h">풀이 순서</p><ol>${steps.map((s, i) => li(i < cur ? (shown.has(i) ? 'done shown' : 'done') : i === cur ? 'now' : 'yet', i < cur ? '✓' : String(i + 1), nm(i))).join('')}${li(cur >= steps.length ? 'now' : 'yet', String(steps.length + 1), lastLabel)}</ol></div>`;
}

// 단계 풀 때 왼쪽 위 — 처음 문제(작게) · 세로셈(덧셈 · 뺄셈 두 자리 넘으면) · 그림 · 채운 단계(맞음 ✓ · 답을 본 단계는 옅게 · 방금 채운 줄만 살짝 나타남 fresh)
//  배우기 '같이 풀기'도 같은 모양(kid.js)
//  세로셈이 있으면(11-13 묶음 3) 세로셈이 지금 풀 자리와 받아내림을 보여 주므로 — 채운 단계는 글 없이 식만 한 줄로(같은 말이 그림 · 줄 · 말풍선에 세 번 나오던 것)
//  q = 문제 속 도형 그림을 이 단계 그림으로 바꾼 문제 조각(figSwap — 없으면 문제 그대로)
export function stepCtx(it, steps, upto, { shown = new Set(), C = null, label = '이 문제', head = true, pic = '', fresh = -1, lag = null, q = null } = {}) {
  const eq = !!C || steps.length >= 5 || (steps.length >= 4 && steps.some((s) => (s.prompt || []).some((t) => t && typeof t === 'object' && ('f' in t || 'm' in t))));   /* 다섯 단계가 넘는 문제(겉넓이 여섯 단계) · 분수 단계가 넷인 문제(대분수 받아내림)는 마친 단계를 식만 한 줄로 — 크롬북 768에서 답 칸이 화면 밖으로 밀리지 않게(단계 이름은 옆 풀이 순서에 그대로) */
  const list = upto ? `<ol class="hl-steps${eq ? ' eq' : ''}">${steps.slice(0, upto).map((s, i) => `<li class="${shown.has(i) ? 'shown' : 'ok'}${i === fresh ? ' nw' : ''}"><span class="hl-n">${i + 1}</span>${eq ? '' : `<span class="why">${esc(s.why)}</span>`}${staticHTML(s.prompt, s.sol)}</li>`).join('')}</ol>` : '';
  const col = C ? `<div class="hl-col">${colView(C, upto, lag, { peek: true }).html}</div>` : '';
  return `<div class="hl-ctx${C ? ' with-col' : ''}">${head ? `<span class="hl-k">${esc(label)}</span>${staticHTML(q || it.prompt, null)}` : ''}${C && pic ? `<div class="hl-cp">${col}${pic}</div>` : C ? col : pic}${list}</div>`;
}
export const colFor = (it, steps) => { try { return colOf(it, steps); } catch (e) { return null; } };
// 그림 틀(engine/hints/pics.js · 11-13 방향 차례 1) — 문제의 수로 그린 그림 · i = −1 떠올리기 · 0…n−1 그 단계(지금 할 칸이 노랑) · n 처음 문제로 돌아옴 · 없으면 ''
//  배우기 시범 · 같이 풀기도 같은 그림(kid.js)
export function picHTML(c, p, i = -1, steps = []) {
  let svg = ''; try { svg = picOf(c, p, { i, steps }); } catch (e) { svg = ''; }
  return svg ? `<div class="hl-pic"><div class="pic hpic">${svg}</div></div>` : '';
}
// 문제 속 도형 그림(측정 — engine/figs.js · 문제 조각의 fig) — 도움 그림을 따로 그리지 않고 문제의 그림 자리에서 바꿔 그림(같은 도형이 두 번 보이지 않게 · 그림에 적힌 길이 · 각도는 그대로)
//  돌려주는 것: 도형 그림이 든 문제가 아니면 null · 맞으면 그 단계에 보일 문제 조각(그 단계에 도움 그림이 없으면 문제 그대로)
export const hasFig = (prompt) => (prompt || []).some((t) => t && typeof t === 'object' && t.fig);
export function figSwap(prompt, c, p, i, steps) {
  const k = (prompt || []).findIndex((t) => t && typeof t === 'object' && t.fig);
  if (k < 0) return null;
  let svg = ''; try { svg = picSVG(picSpec(c, p, { i, steps }), FIGK) || ''; } catch (e) { svg = ''; }
  return svg ? prompt.map((t, j) => (j === k ? { ...t, svg } : t)) : prompt;
}
/* 단계 화면(stepCtx)에 넘길 그림 — 문제에 도형 그림이 있으면 그 자리에서 바꿔 그리고(q) 따로 그리지 않음(pic '') */
export function ctxPic(it, c, i, steps) { const q = figSwap(it.prompt, c, it.p, i, steps); return q ? { q, pic: '' } : { q: null, pic: picHTML(c, it.p, i, steps) }; }

/* root = 문제 카드 자리 · it = 엔진 문항(makeItem · itemOf) · raws = 아이가 쓴 답(넘어감이면 null)
   budget = { left } 한 판에 '한 단계씩'을 열 수 있는 수(없으면 끝없이) · again = 답을 보여 줄 때 덧붙일 사실 한 줄(매일 연습 '내일 다시 나와요' — 지킬 수 있는 말만)
   onEnd({ how: 'recall' | 'pick' | 'steps' | 'shown' }) */
export function ladder(root, { it, c = it.c, raws = null, tag = '', act = '', dots = null, budget = null, again: againLine = '', onEnd }) {
  const steps = (() => { try { return stepsOf({ c, p: it.p, prompt: it.prompt }) || []; } catch (e) { return []; } })();
  const cue = cueFor(c, it.p);
  /* 옛 개념 다리(engine/bridges.js — 교사 10-11 '옛날에 이런 거 배웠지? 이게 그냥 숫자만 바뀐 거야') — 떠올리기 말풍선에 '예전에 배운 생각 · 같은 것 · 새로 생기는 것' 한 덩이(비판 토론 D1 · 심판 차례 3 · 앱이 한 번도 부르지 않던 것) */
  const br = (() => { try { return bridgeOf(c, it.p); } catch (e) { return null; } })();
  const ansN = (() => { const own = new Set((toText(it.prompt).match(/\d+(?:\.\d+)?/g) || [])); return new Set((it.sol || []).map(String).filter((v) => !own.has(v))); })();
  const safe = (t) => t && !(String(t).match(/\d+(?:\.\d+)?/g) || []).some((n) => ansN.has(n));   /* 이 문제의 답 숫자가 든 문장은 빼기(떠올리기에서 답을 흘리지 않게 — 24 ÷ 7 = 3 … 3) */
  /* ⚠️ 말풍선 글로 붙이면 안 됨(교사 11-08 '애들에게 어렵지 않을까 · 뭔 말이야 · 그림 없어도 됨?' — 떠올리기 생각과 다른 그림 두 개가 한 말풍선에 섞이고 이름표 말투) → '예전 문제 하나 + 그림'으로 다시 지을 때까지 화면에 안 씀 */
  // eslint-disable-next-line no-unused-vars
  const brLine = br && br.idea ? `<span class="hl-br"><b>예전에 배운 생각</b> — ${esc(br.idea)}${safe(br.same) ? `<br>${esc(br.same)}` : ''}${safe(br.leap) ? `<br><b>새로 생기는 것</b> — ${esc(br.leap)}` : ''}</span>` : '';
  const C = colFor(it, steps);   /* 두 자리 넘는 덧셈 · 뺄셈 = 세로셈에 채운 자리까지 표시(model.js — 배우기 시범과 같은 그림) */
  const base = { tag, act, dots, conf: false, idk: false };
  const head = (k, html, pose = 'think', after = '') => `<div class="hl hl-${k}"><div class="say">${mascot(pose, 60)}<div class="bub">${html}</div></div>${after}</div>`;
  const last = steps.length - 1;
  const pt = toText(it.prompt).replace(/\s*=\s*□.*$/, '').replace(/\s+/g, ' ').trim(), qName = pt && pt.length <= 16 && !/□/.test(pt) && /[+−×÷]/.test(pt) && !/\//.test(pt) ? `${pt}의 답` : '이 문제의 답';   /* 식일 때만(빗금 분수 · '40000 cm²의 답'은 X — 처음 보는 눈 3차) */   /* '처음 문제'를 '1번 문제'로 읽던 것 — 짧은 식이면 식 그대로(11-07 처음 쓰는 아이) */
  const names = steps.length ? planNames(c, it.p, steps) : null;
  /* 그림 — 10칸 틀(한 자리 10 만들기 · 10에서 빼기): 마지막 단계는 옮긴 모습(방금 앞 단계를 마쳤으면 옮기는 모습 한 번) · 그 앞은 한 번 틀렸을 때만 처음 모습
     묶음 바꾸기(받아올림 · 받아내림 — model.js regroupHTML · docs/motion.md ① ②): 움직임은 이 사다리에서 한 번만(seen) · 다시 보기 단추는 늘
       뺄셈 첫 단계에서 한 번 틀리면 = 십 막대 하나가 낱개 10개로(이 단계 식 '12 − 7'의 12가 어디서 왔나 — 단계 답은 보이지 않음)
       덧셈 첫 단계에서 한 번 틀리면 = 바꾸기 전 모습만(낱개를 세면 되는 단계라 모은 뒤 모습은 답이 됨)
       첫 단계를 마치고 둘째 단계로 오면 = 아직 안 봤으면 방금 한 것의 뜻으로 한 번(세로셈 빗금 · 올린 1이 같은 때에 — lag) · 그 뒤는 틀렸을 때만 끝 모습
     그림 틀(곱셈 · 나눗셈 · 분수 · 소수 · 시간 · 넓이 — picHTML): 떠올리기부터 늘 보임 · 단계마다 지금 할 칸만 바뀜(같은 그림이 같은 자리에)
       이 차시에 그림이 없으면 = 한 번 틀린 단계에서 그 단계 차시의 그림(곱셈구구 배열 · 분수 띠 …) */
  let seen = false, rushN = 0;   /* 떠올리기에서 빨리 낸 오답 — 두 번째면 '조금 빨라요'를 되풀이하지 않고 단계로(11-08 처음 보는 눈) */
  const isSub = (() => { try { return readExpr(it).op === '−'; } catch (e) { return false; } })();
  const hp = (i) => picHTML(c, it.p, i, steps);
  const fq = (i) => figSwap(it.prompt, c, it.p, i, steps);   /* 문제에 도형 그림이 있는 차시 — 그 자리에서 바꿔 그린 문제(없으면 null) */
  const pic = (i, tries, fresh) => {
    const own = hp(i); if (own) return { html: own };
    if (tenFrameHTML(it)) { const tf = tenFrameHTML(it, { moved: i >= last, anim: i >= last && fresh }); return { html: i >= last || tries ? tf : '' }; }
    const rg = (o) => { const h = regroupHTML(it, o); if (h && o.anim) seen = true; return { html: h ? `<div class="hl-pic">${h}</div>` : '', anim: !!(h && o.anim) }; };
    if (i === 0) { const r = tries ? (isSub ? rg({ anim: !seen }) : rg({ pre: true })) : { html: '' }; return !r.html && tries && steps[i] ? { html: picHTML(steps[i].c, steps[i].p) } : r; }
    if (i === 1 && fresh && !seen) return rg({ anim: true });
    const r = tries ? rg({}) : { html: '' };
    return !r.html && tries && steps[i] ? { html: picHTML(steps[i].c, steps[i].p) } : r;
  };
  const lock = () => root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button, .qcard .hl-go').forEach((x) => (x.disabled = true));   /* 맞힌 뒤에도 '모르겠어요 — 한 단계씩'이 살아 있던 것(처음 보는 눈 11-08) */
  const finish = (ok, how, msg, calm = false) => {
    const box = document.createElement('div'); box.className = `fb ${ok ? 'ok' : calm ? 'see' : 'no'}`;   /* calm = 도움을 다 쓴 뒤 '같이 봐요'(빨간 ✕ X) */
    lock(); box.innerHTML = msg;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pri big'; b.textContent = '다음'; box.appendChild(b);   /* 내는 단추와 같은 크기(작은 단추가 왼쪽 가운데에 있어 찾던 것) */
    fbSlot(root).appendChild(box); b.focus();
    const born = performance.now();
    b.addEventListener('click', (e) => { if (e.detail > 0 && performance.now() - born < 400) return; if (onEnd) onEnd({ how }); });   /* '다 풀었어요'를 두 번 누른 손가락이 '다음'으로 칭찬을 건너뛰지 않게 */
  };
  /* 같이 봐요 — 답 + 풀이 순서(이름이 있으면)를 평서문으로 · 물음 X · 지킬 수 있는 말만(again) */
  const seeIt = () => finish(false, 'shown', `<b>같이 봐요.</b> ${ansSay(it)}${names ? `<br><span class="small">풀이 순서: ${names.map(esc).join(' → ')}</span>` : ''}${againLine ? `<br><span class="small">${esc(againLine)}</span>` : ''}`, true);
  const toSteps = () => {
    if (!steps.length || (budget && budget.left <= 0)) return seeIt();   /* 단계가 없거나 한 판에 여는 수를 넘음(조사 R — 단계 풀이는 푸는 문제 수를 줄임) */
    if (budget) budget.left--;
    step(0, 0, new Set(), false);
  };
  // ① 떠올리기 — 글만 · 같은 문제를 다시(답 칸은 비워 둠)
  function recall(nudge = '') {
    const ch = it.choices || null, picked = ch && raws ? [Number(raws[0])] : [];
    if (ch && ch.length <= 2) return toSteps();
    if (!raws) return toSteps();   /* '못 풀겠어요 · 넘어가기' = 떠올리기 없이 바로 단계로(모른다는 아이에게 '떠올려 봐요' X · 11-07 사용감 점검) */
    const canStep = steps.length && !(budget && budget.left <= 0);
    const q0 = fq(-1), rp = q0 ? '' : hp(-1) || (C ? `<div class="hl-col">${colView(C, 0).html}</div>` : '');   /* 그림 틀이 없으면 세로로 쓴 모습(떠올리기 말이 '어느 자리 위에'를 물음 · 11-13 묶음 3) */
    draw(root, { ...base, prompt: q0 || it.prompt, sol: it.sol, choices: ch, hide: picked, extra: rp ? `<div class="hl-ctx hl-ctx-pic">${rp}</div>` : '',
      lead: head('cue', `<span class="hl-was">내 답 <b>${esc(mine(it, raws))}</b> — 아직 아니에요.${nudge ? ` ${nudge}` : ''}</span>${cue ? `<span class="hl-cue-t">${nbsp(esc(cue))}</span>` : ''}<span class="hl-ans">이 생각으로 <b>${esc(qName)}</b>${P(qName.slice(-1), '을', '를')} 써요.</span>`, 'think', `<button type="button" class="hl-go" id="hs"><span>모르겠어요 — <span class="nobr">${canStep ? '한 단계씩 같이 풀기' : '같이 보기'}</span></span></button>`),   /* 늘 나가는 길 하나(아무 수나 써야 빠져나가던 것 · 11-07) */
      onAnswer: (a, cf, t) => {
        if (sameAns(it, a)) return finish(true, ch ? 'pick' : 'recall', ch ? '맞았어요!' : '맞았어요! 생각을 떠올려서 스스로 고쳤어요.');
        if (t < RUSH && !ch && ++rushN < 2) return recall('조금 빨라요. 끝까지 읽고 다시 풀어 봐요.');
        toSteps();
      } });
    const hs = root.querySelector('#hs'); if (hs) hs.addEventListener('click', toSteps);
    { const qc = root.querySelector('.qcard'); if (qc) qc.classList.add('cue-below'); }   /* 휴대폰: 도움 말풍선을 문제 아래 빈자리로(문제가 320px 밀려 내려가던 것 · 처음 보는 눈 3차) */
    talk();
  }
  // ② 한 단계씩 — tries = 이 단계에서 틀린 수 · shown = 답을 보여 준 단계 · fresh = 방금 앞 단계를 마치고 들어옴
  function step(i, tries, shown, fresh = true) {
    if (i >= steps.length) return again(shown);
    const s = steps[i];
    let sit = null; try { sit = makeItem(s.c, s.p); } catch (e) { sit = null; }
    const qi = fq(i), pv = qi ? { html: '' } : pic(i, tries, fresh && !tries);
    draw(root, { ...base, prompt: s.prompt, sol: s.sol, choices: sit && sit.choices ? sit.choices : null,
      extra: stepCtx(it, steps, i, { shown, C, q: qi, pic: pv.html, fresh: fresh && !tries ? i - 1 : -1, lag: pv.anim && i === 1 ? rgLag(it) : null }),
      okLabel: '이 단계 다 했어요',
      lead: head('step', `<span class="hl-k">${i + 1}단계</span><span class="hl-why">${nbsp(esc(s.why))}</span>${tries === 1 ? `<span class="hl-re">아직 아니에요. ${pv.html || qi ? '그림을 보고 ' : ''}한 번 더 해 봐요.</span>` : tries === -1 ? '<span class="hl-re">조금 빨라요. 천천히 다시 풀어 봐요.</span>' : ''}`, tries ? 'think' : 'point', planHTML(steps, names, i, shown, `${qName} 쓰기`)),
      onAnswer: (a, cf, t) => {
        const ok = sit ? sameAns(sit, a) : s.sol.every((v, k) => Number(a.vals[k]) === Number(v));
        if (ok) return step(i + 1, 0, shown, true);
        if (t < RUSH) return step(i, tries === 1 ? 1 : -1, shown, false);   /* 찍은 오답은 시도로 세지 않음 */
        if (tries !== 1) return step(i, 1, shown, false);
        shown.add(i);
        const box = document.createElement('div'); box.className = 'fb no';
        lock(); box.innerHTML = ansSay({ sol: s.sol, choices: sit && sit.choices, prompt: s.prompt }, '이 단계의 답은');
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pri'; b.textContent = i + 1 < steps.length ? '다음 단계' : '문제로 돌아가기'; box.appendChild(b);
        fbSlot(root).appendChild(box); b.focus();
        b.addEventListener('click', () => step(i + 1, 0, shown, true));
      } });
    talk();
  }
  // ③ 처음 문제 다시 — 채운 단계(방금 채운 줄만 나타남) · 옮긴 그림을 옆에 두고
  function again(shown, nudge = '') {
    const qn = fq(steps.length);
    draw(root, { ...base, prompt: qn || it.prompt, sol: it.sol, choices: it.choices || null,
      extra: stepCtx(it, steps, steps.length, { shown, C, head: false, pic: qn ? '' : hp(steps.length) || (C ? '' : tenFrameHTML(it, { moved: true })), fresh: nudge ? -1 : last }),
      lead: head('again', `<span class="hl-k">마지막</span><span class="hl-why">단계를 다 했어요. 이제 <b>${esc(qName)}</b>${P(qName.slice(-1), '을', '를')} 써요.</span>${nudge ? `<span class="hl-re">${nudge}</span>` : ''}`, 'point', planHTML(steps, names, steps.length, shown, `${qName} 쓰기`)),
      onAnswer: (a, cf, t) => {
        if (sameAns(it, a)) return finish(true, shown.size ? 'shown' : 'steps', `맞았어요! 풀이 순서대로 하나씩 풀었어요.${names ? `<br><span class="small">${names.map(esc).join(' → ')}</span>` : ''}`);   /* 순서를 한 번 더 짚음 · 단계 답을 본 적이 있으면 맞혀도 '스스로 고침'으로 세지 않음(how 'shown' — 한 단계뿐이면 그 답이 곧 처음 문제의 답 · 코덱스 11-07) */
        if (t < RUSH && !it.choices) return again(shown, '조금 빨라요. 단계를 보고 천천히 써 봐요.');
        finish(false, 'shown', `${ansSay(it)}${againLine ? ` ${esc(againLine)}` : ''}`);
      } });
    talk();
  }
  /* 튼튼이 말 읽어 주기(글 읽기가 느린 아이 · speak.js — 한국어 목소리가 있을 때만 단추가 생김) */
  function talk() { const bub = root.querySelector('.hl .bub'); if (bub && !bub.querySelector('.sb-say')) speakButton(bub); }
  recall();
}
