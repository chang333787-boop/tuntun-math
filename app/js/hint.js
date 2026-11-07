// 틀렸을 때 도움 사다리 — 넘어가지 않고 ① 떠올리기 → ② 한 단계씩 → ③ 처음 문제 다시(교사 11-07 '개념을 떠올리게 · 다 말고 단계별로 · 7 + 8이면 7 + 3 + 5 · 7 + 3은 10 · 그다음 15')
//  ① 떠올리기: 이 문제 숫자로 쓸 생각을 묻는 한두 문장(engine/hints cueOf — 없으면 차시 hint) · 같은 문제를 다시 풀어 봄 · [한 단계씩 같이]로 바로 ②도
//  ② 한 단계씩: 단계 문제(fix.js stepsOf — 차시 정의 steps 또는 engine/hints steps)를 하나씩 아이가 채움 · 한 번 틀리면 다시 · 두 번 틀리면 그 단계 답을 보여 주고 다음
//  ③ 처음 문제 다시: 채운 단계를 보며 처음 문제의 답 · 맞으면 '단계를 따라 풀었어요' · 또 틀리면 답을 보여 주고 끝(내일 매일 연습에 또)
//  기록(판정)은 부르는 쪽이 첫 답으로 이미 적음 — 여기서 고친 것은 판정에 넣지 않고 스스로 고친 횟수로만(K.tools.recall · steps) · 점검(진단)에서는 쓰지 않음
import { byId, makeItem } from '../../engine/lessons/index.js';
import { cueOf } from '../../engine/hints/index.js';
import { toText } from '../../engine/tokens.js';
import { draw, staticHTML, ansSay, fbSlot } from './item.js';
import { stepsOf } from './fix.js';
import { colOf, colView } from './model.js';
import { esc } from './local.js';
import { mascot } from '../../paper/js/mascot.js';

const sameAns = (it, a) => { try { return !!it.check(a.vals, a.raws).ok; } catch (e) { return false; } };
const mine = (it, raws) => (!raws ? '넘어감' : it.choices ? toText(it.choices[Number(raws[0])] || []) : raws.join(', '));
// 떠올리기 말 — 엔진 hints가 먼저 · 없으면 차시의 아이용 한 줄(hint · 다른 숫자 예라 답이 새지 않음)
export function cueFor(c, p) { const x = cueOf(c, p); if (x) return x; const L = byId[c]; return L && L.hint ? String(L.hint) : ''; }

// 단계 풀 때 왼쪽 위 — 처음 문제(작게) · 세로셈(덧셈 · 뺄셈 두 자리 넘으면) · 채운 단계(맞음 ✓ · 답을 본 단계는 옅게) · 배우기 '같이 풀기'도 같은 모양(kid.js)
export function stepCtx(it, steps, upto, { shown = new Set(), C = null, label = '처음 문제', head = true } = {}) {
  const list = upto ? `<ol class="hl-steps">${steps.slice(0, upto).map((s, i) => `<li class="${shown.has(i) ? 'shown' : 'ok'}"><span class="hl-n">${i + 1}</span><span class="why">${esc(s.why)}</span>${staticHTML(s.prompt, s.sol)}</li>`).join('')}</ol>` : '';
  return `<div class="hl-ctx${C ? ' with-col' : ''}">${head ? `<span class="hl-k">${esc(label)}</span>${staticHTML(it.prompt, null)}` : ''}${C ? `<div class="hl-col">${colView(C, upto).html}</div>` : ''}${list}</div>`;
}
export const colFor = (it, steps) => { try { return colOf(it, steps); } catch (e) { return null; } };

/* root = 문제 카드 자리 · it = 엔진 문항(makeItem · itemOf) · raws = 아이가 쓴 답(넘어감이면 null) · onEnd({ how: 'recall' | 'steps' | 'shown' }) */
export function ladder(root, { it, c = it.c, raws = null, tag = '', act = '', dots = null, onEnd }) {
  const steps = (() => { try { return stepsOf({ c, p: it.p }) || []; } catch (e) { return []; } })();
  const cue = cueFor(c, it.p);
  const C = colFor(it, steps);   /* 두 자리 넘는 덧셈 · 뺄셈 = 세로셈에 채운 자리까지 표시(model.js — 배우기 시범과 같은 그림) */
  const base = { tag, act, dots, conf: false, idk: false };
  const head = (k, html, pose = 'think', after = '') => `<div class="hl hl-${k}"><div class="say">${mascot(pose, 60)}<div class="bub">${html}</div></div>${after}</div>`;
  const ctx = (upto, shown) => stepCtx(it, steps, upto, { shown, C });
  const finish = (ok, how, msg) => {
    const box = document.createElement('div'); box.className = `fb ${ok ? 'ok' : 'no'}`;
    root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button').forEach((x) => (x.disabled = true));
    box.innerHTML = msg;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pri'; b.textContent = '다음'; box.appendChild(b);
    fbSlot(root).appendChild(box); b.focus();
    b.addEventListener('click', () => onEnd && onEnd({ how }));
  };
  // ① 떠올리기 — 같은 문제를 다시(답 칸은 비워 둠)
  function recall() {
    draw(root, { ...base, prompt: it.prompt, choices: it.choices || null,
      lead: head('cue', `<span class="hl-was">${raws ? `내 답 <b>${esc(mine(it, raws))}</b> — 아직 아니에요. ` : ''}생각을 떠올려 다시 풀어 봐요.</span>${cue ? `<span class="hl-cue-t">${esc(cue)}</span>` : ''}`, 'think', steps.length ? '<button type="button" class="hl-go" id="hs">한 단계씩 같이 풀기</button>' : ''),
      onAnswer: (a) => {
        if (sameAns(it, a)) return finish(true, 'recall', '맞았어요! 생각을 떠올려서 스스로 고쳤어요.');
        if (steps.length) return step(0, 0, new Set());
        return finish(false, 'shown', `${ansSay(it)}${cue ? '' : ' 다음에 같은 꼴이 또 나와요.'}`);
      } });
    const hs = root.querySelector('#hs'); if (hs) hs.addEventListener('click', () => step(0, 0, new Set()));
  }
  // ② 한 단계씩 — tries = 이 단계에서 틀린 수 · shown = 답을 보여 준 단계
  function step(i, tries, shown) {
    if (i >= steps.length) return again(shown);
    const s = steps[i];
    let sit = null; try { sit = makeItem(s.c, s.p); } catch (e) { sit = null; }
    draw(root, { ...base, prompt: s.prompt, choices: sit && sit.choices ? sit.choices : null, extra: ctx(i, shown),
      lead: head('step', `<span class="hl-k">${i + 1} / ${steps.length}단계</span><span class="hl-why">${esc(s.why)}</span>${tries ? '<span class="hl-re">아직 아니에요. 한 번 더 해 봐요.</span>' : ''}`, tries ? 'think' : 'point'),
      onAnswer: (a) => {
        const ok = sit ? sameAns(sit, a) : s.sol.every((v, k) => Number(a.vals[k]) === Number(v));
        if (ok) return step(i + 1, 0, shown);
        if (!tries) return step(i, 1, shown);
        shown.add(i);
        const box = document.createElement('div'); box.className = 'fb no';
        root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button').forEach((x) => (x.disabled = true));
        box.innerHTML = `${ansSay({ sol: s.sol, choices: sit && sit.choices }, '이 단계의 답은')}`;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pri'; b.textContent = i + 1 < steps.length ? '다음 단계' : '처음 문제로'; box.appendChild(b);
        fbSlot(root).appendChild(box); b.focus();
        b.addEventListener('click', () => step(i + 1, 0, shown));
      } });
  }
  // ③ 처음 문제 다시 — 채운 단계를 옆에 두고
  function again(shown) {
    draw(root, { ...base, prompt: it.prompt, choices: it.choices || null, extra: stepCtx(it, steps, steps.length, { shown, C, head: false }),
      lead: head('again', '<span class="hl-k">마지막</span><span class="hl-why">단계를 다 했어요. 이제 처음 문제의 답을 써요.</span>', 'point'),
      onAnswer: (a) => (sameAns(it, a) ? finish(true, 'steps', '맞았어요! 단계를 따라 풀었어요.') : finish(false, 'shown', `${ansSay(it)} 이 꼴은 다음에 또 나와요.`)) });
  }
  recall();
}
