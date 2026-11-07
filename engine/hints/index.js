// 틀렸을 때 도움 — 떠올리기 말(cue) · 단계가 없던 차시에 더한 단계(steps) · 교사 11-07 '넘어가지 말고 개념을 떠올리게 · 다 말고 단계별로(7 + 8 = 7 + 3 + 5)'
//  차시마다 { cue: (p) => 글, steps?: (p) => [{ c, p, why }], plan?: (p) => ['숫자 없는 단계 이름', …] }
//    cue  = 이 문제 숫자로 '무슨 생각을 쓰면 되는지'를 떠올리게 하는 한두 문장(아이 말 · 답 X · 그 단계의 답 X · 학년 · 오개념 이름 X)
//           예) 7 + 8 → '10을 먼저 만들어 봐요. 7에 얼마를 더하면 10이 될까요?'
//    steps = 차시 정의(g1~g6)에 steps가 없을 때만 씀 — 한 단계 = 빈칸 하나 짜리 쉬운 문제(다른 차시 · 사칙 가족 문항) · why = 그 단계에서 할 일 한 문장(답 X)
//    plan  = '풀이 순서' 목록(교사 11-07 '알고리즘적 사고 — 단계적으로 하나씩') · 아직 안 한 단계를 숫자 없이(앞 단계 답이 새지 않게) · 개수 = 그 p의 단계 수 · 같은 갈래는 같은 이름
//  수 · 덧셈 · 뺄셈 = na.js · 곱셈 · 나눗셈 · 분수 · 소수 · 규칙 = mdf.js(파일을 나눠 둔 것은 두 팀이 겹치지 않게)
//  정본 설계: docs/hint_ladder.md · 화면: app/js/hint.js(떠올리기 → 한 단계씩 → 처음 문제 다시)
import NA from './na.js';
import MDF from './mdf.js';

export const HINTS = { ...NA, ...MDF };
export function cueOf(c, p) {
  const h = HINTS[c];
  if (!h || !h.cue) return '';
  try { return String(typeof h.cue === 'function' ? h.cue(p) : h.cue).trim(); } catch (e) { return ''; }
}
export const extraSteps = (c) => (HINTS[c] && typeof HINTS[c].steps === 'function' ? HINTS[c].steps : null);
// 풀이 순서 이름 — 개수가 단계 수와 다르면 null(화면이 숫자를 가린 단계 글로 대신)
export function planOf(c, p, n) {
  const h = HINTS[c];
  if (!h || typeof h.plan !== 'function') return null;
  let xs = null; try { xs = h.plan(p); } catch (e) { return null; }
  return Array.isArray(xs) && xs.length === n && xs.every((x) => typeof x === 'string' && x.trim()) ? xs.map((x) => x.trim()) : null;
}
