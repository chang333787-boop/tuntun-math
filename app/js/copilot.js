// 선생님을 돕는 AI 묻기 — 서버 없이: 아이 하나의 근거 꾸러미(번호만 · 이름 X) + Claude에게 물을 글 → 선생님이 복사해 붙여 넣음
//  근거: AI는 교사에게 먼저 [evidence §12 · Tutor CoPilot 꼴] · AI 혼자 오개념을 고르면 보기가 많을수록 틀림 → 엔진이 좁힌 후보와 근거 문항을 같이 줌
//    · 근거 없는 것은 '모름' · AI 답은 짐작 — 아이 · 가정에 가기 전에 선생님이 확인 [goal.md M4]
//  서버(키를 아이 기기에 두지 않는 길)가 정해지면 같은 꾸러미 · 같은 글을 서버 함수로 보내면 됨
import { byId } from '../../engine/lessons/index.js';
import { LES, lessonName, itemOf } from '../../paper/js/gen.js';
import { ST } from '../../paper/js/judge.js';
import { toText } from '../../engine/tokens.js';
import { mindsOf, misById } from '../../engine/mis.js';

const nameOf = (c) => (LES(c) ? lessonName(c) : c);
const textOf = (c, p) => { try { return toText(itemOf(c, p).prompt).replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } };
const solOf = (c, p) => { try { const it = itemOf(c, p); return it.choices ? toText(it.choices[Number(it.sol[0])] || []) : it.sol.join(', '); } catch (e) { return ''; } };

// 틀린 문항 몇 개(문제 글 · 아이 답 · 바른 답 · 엔진이 맞춰 본 원인)
function wrongOf(x, n = 3) {
  return (x.recs || []).filter((r) => !r.ok).slice(-n).map((r) => ({
    q: textOf(r.c, r.p), mine: r.s === 'q' ? '(몰라서 넘어감)' : (r.ans || []).join(', '), right: solOf(r.c, r.p),
    fit: r.d && r.d.hyps ? r.d.hyps.map((h) => h.name).slice(0, 3) : [],
  })).filter((w) => w.q);
}

// 풀이 사진으로 물을 틀린 문항(최근 것부터 · 차시마다 둘까지)
export function wrongList(rep, n = 8) {
  return Object.values(rep.L || {}).flatMap((x) => wrongOf(x, 2).map((w) => ({ ...w, 칸: nameOf(x.c) }))).slice(-n).reverse();
}
export function photoPromptOf(no, w, grade = '') {
  return `초등 수학 담임을 돕는 조수로 답해 주세요. 사진은 우리 반 ${no}번 아이(이름 X)가 종이에 쓴 풀이예요.

[문제] ${w.q}
[아이가 낸 답] ${w.mine}
[바른 답] ${w.right}
[엔진이 아이 답으로 짐작한 틀린 방법] ${w.fit && w.fit.length ? w.fit.join(' · ') : '없음'}

[부탁]
1. 사진에서 아이 풀이를 단계마다 그대로 옮겨 적어 주세요. 읽기 어려운 곳은 '읽기 어려움'이라고 써요.
2. 처음으로 어긋난 단계 하나와 그 까닭 — 엔진 짐작과 같으면 같다고, 다르면 왜인지.
3. 그 단계에서 선생님이 아이에게 할 발문 2개 — ${grade ? `${grade}학년` : '그 학년'} 눈높이 · 답을 바로 주지 않고 아이가 자기 방법을 말하게.
4. 확신(높음 · 중간 · 낮음)과, 사진으로 알 수 없는 것은 '모름'.

[쓰지 말 것] 이름 · 얼굴 · 글씨체로 아이 추측 · 진단명이나 낙인 · 긴 서론. 짧게, 번호 매겨서.`;
}

// 아이 하나 → 근거 꾸러미 · rep = kidReport · st = 요약(normSt) · extra = { unit, weeks, trend, story, fixed, rv }
export function packetOf(rep, st = null, extra = {}) {
  const L = rep.L;
  const lesson = (c) => { const x = L[c] || {}; return { 칸: nameOf(c), 학기: LES(c) ? LES(c).g : '', 상태: ST[x.st] || x.st || '', 맞힘: x.tot ? `${x.ok}/${x.tot}` : '', 엔진이_본_원인: x.why ? [...x.why.sure.map((h) => `${h.name}(두 번 이상 맞아떨어짐)`), ...x.why.maybe.map((h) => `${h.name}(한 번)`)].slice(0, 4) : [], 틀린_문항: wrongOf(x) }; };
  const minds = Object.entries(mindsOf(rep)).map(([id, e]) => { const m = misById[id]; return m ? { 생각: m.title, 아이_머릿속: m.think || '', 되풀이: e.s ? '서로 다른 문항 둘 이상' : '한 번', 칸: [...e.c].map(nameOf) } : null; }).filter(Boolean).slice(0, 4);
  const shaky = Object.values(L).filter((x) => x.st === 'shaky' && byId[x.c]).map((x) => x.c).slice(0, 4);
  return {
    오늘_단원: extra.unit || '',
    먼저_배울_차시: rep.start.map((s) => lesson(s.c)).slice(0, 3),
    위에서_막힘_까닭은_아래: rep.under.map((u) => ({ 칸: nameOf(u.c), 아래: u.because.map(nameOf) })).slice(0, 3),
    아래_먼저_확인: rep.below.map((b) => ({ 칸: nameOf(b.c), 확인할_칸: b.check.map(nameOf).slice(0, 4) })).slice(0, 3),
    흔들림: shaky.map(lesson),
    보인_생각: minds,
    자신감: st && st.cal && st.cal.n ? { 짐작이_맞은_정도: `${Math.round((st.cal.m || 0) * 100)}%`, 문항: st.cal.n, 자신_있었는데_틀림: Object.values(st.sw || {}).reduce((a, b) => a + b, 0) } : null,
    빨리_넘김: st ? st.rush || 0 : 0,
    이번_주_점검: extra.weeks && extra.weeks.length ? { 점수_10점: extra.weeks.map((w) => Math.round((w.ok / w.n) * 10)), 방향: extra.trend || '아직 모름(점 다섯 전 · 두 주 이어서 같은 쪽일 때만)' } : null,
    문장제: extra.story || null,
    배워서_고친_차시: Object.keys(extra.fixed || {}).map(nameOf),
  };
}
// 빈 칸 · 빈 배열은 뺌(붙여 넣는 글을 짧게)
const prune = (o) => (Array.isArray(o) ? o.map(prune).filter((v) => v != null && !(Array.isArray(v) && !v.length)) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, prune(v)]).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length))) : o);

export function promptOf(no, packet, grade = '') {
  return `초등 수학 담임을 돕는 조수로 답해 주세요. 아래는 우리 반 ${no}번 아이(이름 X)의 기록을 수학 진단 엔진이 정리한 근거예요. 엔진은 아이가 쓴 틀린 답을 알려진 틀린 방법들로 다시 계산해 맞아떨어지는지 봤어요.

[근거]
${JSON.stringify(prune(packet), null, 1)}

[부탁]
1. 이 아이가 막힌 까닭 후보 2~3개 — 각각 확신(높음 · 중간 · 낮음)과 근거로 삼은 문항(위 문제 글 그대로). 엔진이 본 원인과 다르게 본다면 왜인지.
2. 먼저 볼 차시 하나와 그 까닭(한두 줄).
3. 소집단 10분에서 선생님이 그대로 읽을 발문 3개 — ${grade ? `${grade}학년` : '그 학년'} 눈높이 · 답을 바로 주지 않고 아이가 자기 방법을 말하게.
4. 까닭을 가르는 확인 문항 2개 — 후보 까닭마다 아이 답이 달라지게(숫자까지).
5. 근거로 알 수 없는 것은 '모름'이라고 써 주세요.

[쓰지 말 것] 이름 추측 · 진단명이나 낙인 · 근거에 없는 일반론 · 긴 서론. 짧게, 번호 매겨서.`;
}
