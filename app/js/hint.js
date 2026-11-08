// 틀렸을 때 도움 사다리 — 넘어가지 않고 ① 떠올리기 → ② 한 단계씩 → ③ 처음 문제 다시(교사 11-07 '개념을 떠올리게 · 다 말고 단계별로 · 7 + 8이면 7 + 3 + 5 · 7 + 3은 10 · 그다음 15')
//  근거 · 판정 정본 docs/hint_ladder.md(조사 팀 R 11-07) · 움직임 docs/motion.md
//  ① 떠올리기: 이 문제 숫자로 쓸 생각을 묻는 한두 문장(engine/hints cueOf · 없으면 차시 hint에서 숫자 없는 문장만)만 · 같은 문제를 다시 · [한 단계씩 같이]로 바로 ②도
//     보기가 둘인 문항은 다시 고르기 없이 ②로(찍어도 맞음) · 셋 넘으면 고른 보기를 지우고 한 번만(맞혀도 '스스로 고침'으로 세지 않음 — how 'pick')
//  ② 한 단계씩: 단계 문제(fix.js stepsOf)를 하나씩 아이가 채움 · 한 단계 안은 글 → (한 번 틀리면) 그림 → (두 번 틀리면) 그 단계 답
//     10칸 틀은 마지막 단계에서 옮기는 모습을 한 번(앞 단계를 아이가 풀거나 답을 본 뒤 — 답을 대신 보여 주지 않게) · 세로셈은 채운 자리까지
//  ③ 처음 문제 다시: 채운 단계를 보며 처음 문제의 답 · 또 틀리면 답을 보여 주고 끝(내일 매일 연습에 또)
//  2초 안에 낸 오답은 시도로 세지 않음(찍기 거르기 — item.js rushGuard와 같은 기준) · 한 판에 '한 단계씩'을 여는 수는 부르는 쪽이 정함(budget — 매일 연습 2 · 선생님이 준 문제 3)
//  기록(판정)은 부르는 쪽이 첫 답으로 이미 적음 — 여기서 고친 것은 판정에 넣지 않고 스스로 고친 횟수로만(recall · steps) · 점검(진단)에서는 쓰지 않음
import { byId, makeItem } from '../../engine/lessons/index.js';
import { cueOf, planOf } from '../../engine/hints/index.js';
import { toText } from '../../engine/tokens.js';
import { readExpr } from '../../engine/errors.js';
import { draw, staticHTML, ansSay, fbSlot } from './item.js';
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
export function planHTML(steps, names, cur, shown = new Set(), lastLabel = '전체 문제의 답 쓰기') {
  const nm = (i) => (names ? names[i] : i <= cur ? steps[i].why : String(steps[i].why).replace(/\d+(?:\.\d+)?/g, '○'));   /* 이름이 있으면 늘 짧은 이름(지금 단계 글은 말풍선에 — 같은 글 두 번 X · 11-07) */
  const li = (cls, mark, t) => `<li class="${cls}"><i>${mark}</i><span>${esc(t)}</span></li>`;
  return `<div class="plan"><p class="plan-h">풀이 순서</p><ol>${steps.map((s, i) => li(i < cur ? (shown.has(i) ? 'done shown' : 'done') : i === cur ? 'now' : 'yet', i < cur ? '✓' : String(i + 1), nm(i))).join('')}${li(cur >= steps.length ? 'now' : 'yet', String(steps.length + 1), lastLabel)}</ol></div>`;
}

// 단계 풀 때 왼쪽 위 — 처음 문제(작게) · 세로셈(덧셈 · 뺄셈 두 자리 넘으면) · 그림 · 채운 단계(맞음 ✓ · 답을 본 단계는 옅게 · 방금 채운 줄만 살짝 나타남 fresh)
//  배우기 '같이 풀기'도 같은 모양(kid.js)
export function stepCtx(it, steps, upto, { shown = new Set(), C = null, label = '전체 문제', head = true, pic = '', fresh = -1, lag = null } = {}) {
  const list = upto ? `<ol class="hl-steps">${steps.slice(0, upto).map((s, i) => `<li class="${shown.has(i) ? 'shown' : 'ok'}${i === fresh ? ' nw' : ''}"><span class="hl-n">${i + 1}</span><span class="why">${esc(s.why)}</span>${staticHTML(s.prompt, s.sol)}</li>`).join('')}</ol>` : '';
  return `<div class="hl-ctx${C ? ' with-col' : ''}">${head ? `<span class="hl-k">${esc(label)}</span>${staticHTML(it.prompt, null)}` : ''}${C && pic ? `<div class="hl-cp"><div class="hl-col">${colView(C, upto, lag).html}</div>${pic}</div>` : C ? `<div class="hl-col">${colView(C, upto, lag).html}</div>` : pic}${list}</div>`;
}
export const colFor = (it, steps) => { try { return colOf(it, steps); } catch (e) { return null; } };

/* root = 문제 카드 자리 · it = 엔진 문항(makeItem · itemOf) · raws = 아이가 쓴 답(넘어감이면 null)
   budget = { left } 한 판에 '한 단계씩'을 열 수 있는 수(없으면 끝없이) · again = 답을 보여 줄 때 덧붙일 사실 한 줄(매일 연습 '내일 다시 나와요' — 지킬 수 있는 말만)
   onEnd({ how: 'recall' | 'pick' | 'steps' | 'shown' }) */
export function ladder(root, { it, c = it.c, raws = null, tag = '', act = '', dots = null, budget = null, again: againLine = '', onEnd }) {
  const steps = (() => { try { return stepsOf({ c, p: it.p }) || []; } catch (e) { return []; } })();
  const cue = cueFor(c, it.p);
  const C = colFor(it, steps);   /* 두 자리 넘는 덧셈 · 뺄셈 = 세로셈에 채운 자리까지 표시(model.js — 배우기 시범과 같은 그림) */
  const base = { tag, act, dots, conf: false, idk: false };
  const head = (k, html, pose = 'think', after = '') => `<div class="hl hl-${k}"><div class="say">${mascot(pose, 60)}<div class="bub">${html}</div></div>${after}</div>`;
  const last = steps.length - 1;
  const pt = toText(it.prompt).replace(/\s*=\s*□.*$/, '').replace(/\s+/g, ' ').trim(), qName = pt && pt.length <= 16 && !/□/.test(pt) ? `${pt}의 답` : '이 문제의 답';   /* '처음 문제'를 '1번 문제'로 읽던 것 — 짧은 식이면 식 그대로(11-07 처음 쓰는 아이) */
  const names = steps.length ? planNames(c, it.p, steps) : null;
  /* 그림 — 10칸 틀(한 자리 10 만들기 · 10에서 빼기): 마지막 단계는 옮긴 모습(방금 앞 단계를 마쳤으면 옮기는 모습 한 번) · 그 앞은 한 번 틀렸을 때만 처음 모습
     묶음 바꾸기(받아올림 · 받아내림 — model.js regroupHTML · docs/motion.md ① ②): 움직임은 이 사다리에서 한 번만(seen) · 다시 보기 단추는 늘
       뺄셈 첫 단계에서 한 번 틀리면 = 십 막대 하나가 낱개 10개로(이 단계 식 '12 − 7'의 12가 어디서 왔나 — 단계 답은 보이지 않음)
       덧셈 첫 단계에서 한 번 틀리면 = 바꾸기 전 모습만(낱개를 세면 되는 단계라 모은 뒤 모습은 답이 됨)
       첫 단계를 마치고 둘째 단계로 오면 = 아직 안 봤으면 방금 한 것의 뜻으로 한 번(세로셈 빗금 · 올린 1이 같은 때에 — lag) · 그 뒤는 틀렸을 때만 끝 모습 */
  let seen = false, rushN = 0;   /* 떠올리기에서 빨리 낸 오답 — 두 번째면 '조금 빨라요'를 되풀이하지 않고 단계로(11-08 처음 보는 눈) */
  const isSub = (() => { try { return readExpr(it).op === '−'; } catch (e) { return false; } })();
  const pic = (i, tries, fresh) => {
    if (tenFrameHTML(it)) { const tf = tenFrameHTML(it, { moved: i >= last, anim: i >= last && fresh }); return { html: i >= last || tries ? tf : '' }; }
    const rg = (o) => { const h = regroupHTML(it, o); if (h && o.anim) seen = true; return { html: h ? `<div class="hl-pic">${h}</div>` : '', anim: !!(h && o.anim) }; };
    if (i === 0) return tries ? (isSub ? rg({ anim: !seen }) : rg({ pre: true })) : { html: '' };
    if (i === 1 && fresh && !seen) return rg({ anim: true });
    return tries ? rg({}) : { html: '' };
  };
  const lock = () => root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button, .qcard .hl-go').forEach((x) => (x.disabled = true));   /* 맞힌 뒤에도 '모르겠어요 — 한 단계씩'이 살아 있던 것(처음 보는 눈 11-08) */
  const finish = (ok, how, msg, calm = false) => {
    const box = document.createElement('div'); box.className = `fb ${ok ? 'ok' : calm ? 'see' : 'no'}`;   /* calm = 도움을 다 쓴 뒤 '같이 봐요'(빨간 ✕ X) */
    lock(); box.innerHTML = msg;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pri big'; b.textContent = '다음'; box.appendChild(b);   /* 내는 단추와 같은 크기(작은 단추가 왼쪽 가운데에 있어 찾던 것) */
    fbSlot(root).appendChild(box); b.focus();
    b.addEventListener('click', () => onEnd && onEnd({ how }));
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
    draw(root, { ...base, prompt: it.prompt, sol: it.sol, choices: ch, hide: picked,
      lead: head('cue', `<span class="hl-was">내 답 <b>${esc(mine(it, raws))}</b> — 아직 아니에요. ${nudge || '튼튼이 말을 읽고 다시 풀어 봐요.'}</span>${cue ? `<span class="hl-cue-t">${esc(cue)}</span>` : ''}<span class="hl-ans">이 생각으로 <b>${esc(qName)}</b>${P(qName.slice(-1), '을', '를')} 써요.</span>`, 'think', `<button type="button" class="hl-go" id="hs"><span>모르겠어요 — <span class="nobr">${canStep ? '한 단계씩 같이 풀기' : '같이 보기'}</span></span></button>`),   /* 늘 나가는 길 하나(아무 수나 써야 빠져나가던 것 · 11-07) */
      onAnswer: (a, cf, t) => {
        if (sameAns(it, a)) return finish(true, ch ? 'pick' : 'recall', ch ? '맞았어요!' : '맞았어요! 생각을 떠올려서 스스로 고쳤어요.');
        if (t < RUSH && !ch && ++rushN < 2) return recall('조금 빨라요. 끝까지 읽고 다시 풀어 봐요.');
        toSteps();
      } });
    const hs = root.querySelector('#hs'); if (hs) hs.addEventListener('click', toSteps);
    talk();
  }
  // ② 한 단계씩 — tries = 이 단계에서 틀린 수 · shown = 답을 보여 준 단계 · fresh = 방금 앞 단계를 마치고 들어옴
  function step(i, tries, shown, fresh = true) {
    if (i >= steps.length) return again(shown);
    const s = steps[i];
    let sit = null; try { sit = makeItem(s.c, s.p); } catch (e) { sit = null; }
    draw(root, { ...base, prompt: s.prompt, sol: s.sol, choices: sit && sit.choices ? sit.choices : null,
      extra: (() => { const pv = pic(i, tries, fresh && !tries); return stepCtx(it, steps, i, { shown, C, pic: pv.html, fresh: fresh && !tries ? i - 1 : -1, lag: pv.anim && i === 1 ? rgLag(it) : null }); })(),
      okLabel: '이 단계 다 했어요',
      lead: head('step', `<span class="hl-k">${i + 1}단계</span><span class="hl-why">${esc(s.why).replace(/(\d) ([+−×÷=]) (?=\d)/g, '$1\u00a0$2\u00a0')}</span>${tries === 1 ? '<span class="hl-re">아직 아니에요. 그림을 보고 한 번 더 해 봐요.</span>' : tries === -1 ? '<span class="hl-re">조금 빨라요. 천천히 다시 풀어 봐요.</span>' : ''}`, tries ? 'think' : 'point', planHTML(steps, names, i, shown, `${qName} 쓰기`)),
      onAnswer: (a, cf, t) => {
        const ok = sit ? sameAns(sit, a) : s.sol.every((v, k) => Number(a.vals[k]) === Number(v));
        if (ok) return step(i + 1, 0, shown, true);
        if (t < RUSH) return step(i, tries === 1 ? 1 : -1, shown, false);   /* 찍은 오답은 시도로 세지 않음 */
        if (tries !== 1) return step(i, 1, shown, false);
        shown.add(i);
        const box = document.createElement('div'); box.className = 'fb no';
        lock(); box.innerHTML = ansSay({ sol: s.sol, choices: sit && sit.choices }, '이 단계의 답은');
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pri'; b.textContent = i + 1 < steps.length ? '다음 단계' : '문제로 돌아가기'; box.appendChild(b);
        fbSlot(root).appendChild(box); b.focus();
        b.addEventListener('click', () => step(i + 1, 0, shown, true));
      } });
    talk();
  }
  // ③ 처음 문제 다시 — 채운 단계(방금 채운 줄만 나타남) · 옮긴 그림을 옆에 두고
  function again(shown, nudge = '') {
    draw(root, { ...base, prompt: it.prompt, sol: it.sol, choices: it.choices || null,
      extra: stepCtx(it, steps, steps.length, { shown, C, head: false, pic: C ? '' : tenFrameHTML(it, { moved: true }), fresh: nudge ? -1 : last }),
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
