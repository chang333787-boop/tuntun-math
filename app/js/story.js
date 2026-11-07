// 이야기 다리 — 문장제 한 문제를 걸음 넷으로(① 무슨 이야기? → ② 막대 틀 → ③ 식 → ④ 계산 · 답) · 정본 docs/next.md 설계 초안 · 근거 docs/research/C_word_problems.md
//  익숙해지면 줄임: 같은 유형 · 같은 모르는 자리를 두 번 이어서 ①②를 맞히면 그 자리는 ①②를 건너뜀(식에서 틀리면 다음엔 다시 보임) [C ②4]
//    처음 수 모름 · 낱말과 셈이 반대인 이야기는 늘 걸음 넷(schema noSkip — 가장 어려운 둘 [C ①2])
//  틀리면 — ① 이야기를 마디로 나눠 보이고(아는 것 · 모르는 수 · 묻는 것) 다시 · ② 맞는 틀 + ?가 왜 거기인지 한 줄
//    ③ 헷갈리게 할 만한 낱말이 이야기에 있으면 '헷갈린 낱말이 있었나요?'(눌러 보기 · '없어요' 단추 · 단정하지 않음 · 불일치 [C-21][C-23])
//    ④ 계산은 검산 도구(tools.js toolBox) · 계산은 맞고 답이 틀리면 '다시 읽기'
//  ④ 답 칸은 답이 계산과 다를 때만(나머지 · 올림 · 몇 배 거꾸로) — 같으면 계산 칸 아래 '답 35개'로 단위만 붙여 보임 · 걸음 돌아보기는 판 끝에 한 번
//  아이 화면엔 오개념 이름 · 연산 이름으로 부르는 유형 · 학년 · 단원이 없다 · 해요체 · 말풍선 두 줄 안팎
//  기록 = storylog.js(묶음 하나 · K.story.log)
import { byId } from '../../engine/lessons/index.js';
import { hasWords } from '../../engine/words.js';
import { toHTML, toText } from '../../engine/tokens.js';
import { mascot } from '../../paper/js/mascot.js';
import { P } from '../../engine/concepts/kit.js';
import { TYPES, FAMILY, ROLES, show, implied, whyOf, cueOf, isCue, cueWhy, rereadOf, splitStory, famOfLesson, familiar, familiarTypes } from '../../engine/schema.js';
import * as KS from './kidstore.js';
import { draw, staticHTML, ansSay, progHTML, tagHTML, fbSlot } from './item.js';
import { toolBox } from './tools.js';
import { lsGet, lsSet, lsDel, esc, rand } from './local.js';
import { planOf, probOf, pickLessons, sheetOf, resultOf, storyLog } from './storylog.js';
import { go, meOf } from './kid.js';
import { speakButton, stopSpeak } from './speak.js';
import { icon, tile } from './icons.js';

const say = (pose, html, size = 60) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const STEPS = ['무슨 이야기?', '막대 틀', '식', '계산 · 답'];
const LETTER = ['가', '나', '다', '라'];
const ye = (w) => P(w, '이에요', '예요');

// ── 그림(밋밋한 선화 · 흑백에서도 보이게: ?는 굵은 글자 + 점선 칸) ──
const INK = '#3b2a1e';
const T = (x, y, t, { size = 16, anchor = 'middle', bold = false, fill = INK } = {}) => `<text x="${x}" y="${(y + size * 0.36).toFixed(1)}" text-anchor="${anchor}" font-size="${size}"${bold ? ' font-weight="800"' : ''} fill="${fill}">${esc(t)}</text>`;
const fracG = (n, d, cx, cy, s) => { const w = Math.max(n.length, d.length) * s * 0.62 + 4; return `<text x="${cx}" y="${(cy - 3).toFixed(1)}" text-anchor="middle" font-size="${s}" fill="${INK}">${n}</text><path d="M${(cx - w / 2).toFixed(1)} ${cy + 1} H${(cx + w / 2).toFixed(1)}" stroke="${INK}" stroke-width="1.3"/><text x="${cx}" y="${(cy + s * 0.98).toFixed(1)}" text-anchor="middle" font-size="${s}" fill="${INK}">${d}</text>`; };
// 수 글자(?) · 12 · 3/5 · 2 3/5 · 0.25 + 뒤에 붙는 말(배 · 묶음)
function numG(t, cx, cy, { size = 17, tail = '' } = {}) {
  const s = String(t);
  if (s === '?') return T(cx, cy, `?${tail}`, { size: size + 3, bold: true });
  let m;
  const tw = tail ? tail.length * size * 0.95 : 0;
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) {
    const s2 = Math.round(size * 0.78), ww = m[1].length * size * 0.6, fw = Math.max(m[2].length, m[3].length) * s2 * 0.62 + 4, tot = ww + 3 + fw + tw, x0 = cx - tot / 2;
    return T(x0 + ww / 2, cy, m[1], { size }) + fracG(m[2], m[3], x0 + ww + 3 + fw / 2, cy, s2) + (tail ? T(x0 + ww + 3 + fw + tw / 2, cy, tail, { size: size - 2 }) : '');
  }
  if ((m = s.match(/^(\d+)\/(\d+)$/))) {
    const s2 = Math.round(size * 0.8), fw = Math.max(m[1].length, m[2].length) * s2 * 0.62 + 4, tot = fw + tw, x0 = cx - tot / 2;
    return fracG(m[1], m[2], x0 + fw / 2, cy, s2) + (tail ? T(x0 + fw + tw / 2, cy, tail, { size: size - 2 }) : '');
  }
  return T(cx, cy, s + tail, { size });
}
const fnum = (t) => String(t).split(' ').reduce((a, x) => a + (x.includes('/') ? Number(x.split('/')[0]) / Number(x.split('/')[1]) : Number(x)), 0);
const cell = (x, y, w, h, q, extra = '') => `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="4" fill="#fff" stroke="${INK}" stroke-width="${q ? 2.2 : 1.6}"${q ? ' stroke-dasharray="6 4"' : ''}${extra}/>`;
const lab = (x, y, t) => T(x, y, t, { size: 13.5, anchor: 'end', fill: '#6f6355' });
const over = (x0, x1, y) => `<path d="M${x0.toFixed(1)} ${y + 8} V${y} H${x1.toFixed(1)} V${y + 8} M${((x0 + x1) / 2).toFixed(1)} ${y} V${y - 6}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
const under = (x0, x1, y) => `<path d="M${x0.toFixed(1)} ${y - 8} V${y} H${x1.toFixed(1)} V${y - 8} M${((x0 + x1) / 2).toFixed(1)} ${y} V${y + 6}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
/* 칸 나눔 눈금 — 위아래로 짧게(가운데 수와 겹치지 않게) */
const tick = (x, y, h) => `<path d="M${x.toFixed(1)} ${y} v6 M${x.toFixed(1)} ${y + h} v-6" stroke="${INK}" stroke-width="1.2"/>`;
const svg = (h, body, label) => `<svg class="sb-svg" viewBox="0 0 340 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;

// 틀 하나 그림 — sc = 이야기 구조 · f = { R, dir, T? } (자리 → 수 이름 · T = 이웃 유형의 틀)
export function frameSVG(sc, f) {
  const ty = f.T || sc.type, own = ty === sc.type;
  const v = (role) => show(sc, f.R[role]), q = (role) => f.R[role] === 'x';
  const RL = ROLES[ty], X0 = 86, X1 = 330;
  const label = Object.keys(f.R).map((r) => `${RL[r]} ${v(r)}`).join(', ');
  if (ty === 'change') {
    /* 늘어남 = 결과 칸이 처음 칸보다 높고, 줄어듦 = 낮아요(글자를 안 읽어도 · 흑백에서도) */
    const up = f.dir === '+', rh = up ? 66 : 32, ry = 49 - rh / 2;
    const b = (x, y, h, role) => cell(x, y, 88, h, q(role)) + numG(v(role), x + 44, 49);
    const body = b(6, 25, 48, 'start') + b(246, ry, rh, 'res')
      + `<path d="M100 49 H236 M226 42 L238 49 L226 56" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<rect x="138" y="10" width="62" height="30" rx="4" fill="#fff" stroke="${INK}" stroke-width="${q('chg') ? 2.2 : 1.4}"${q('chg') ? ' stroke-dasharray="6 4"' : ''}/>` + numG(v('chg'), 169, 25, { size: 16 })
      + T(169, 68, up ? '늘어남' : '줄어듦', { size: 14, bold: true })
      + T(50, 96, RL.start, { size: 13.5, fill: '#6f6355' }) + T(169, 96, RL.chg, { size: 13.5, fill: '#6f6355' }) + T(290, 96, RL.res, { size: 13.5, fill: '#6f6355' });
    return svg(106, body, `${label}, ${up ? '늘어남' : '줄어듦'}`);
  }
  if (ty === 'combine') {
    const ps = ['p0', 'p1', 'p2'].filter((p) => p in f.R), w = (X1 - X0) / ps.length, cx = (X0 + X1) / 2;
    let body = lab(X0 - 8, 20, RL.whole) + cell(cx - 40, 5, 80, 30, q('whole')) + numG(v('whole'), cx, 20) + over(X0, X1, 46);
    ps.forEach((p, i) => { body += cell(X0 + i * w, 56, w, 40, q(p)) + numG(v(p), X0 + i * w + w / 2, 76); });
    body += lab(X0 - 8, 76, RL.p0);
    return svg(104, body, label);
  }
  if (ty === 'compare') {
    const big = 220, small = 130;
    let body = lab(X0 - 8, 24, RL.big) + cell(X0, 8, big, 32, q('big')) + numG(v('big'), X0 + big / 2, 24)
      + lab(X0 - 8, 70, RL.small) + cell(X0, 54, small, 32, q('small')) + numG(v('small'), X0 + small / 2, 70)
      + `<rect x="${X0 + small}" y="54" width="${big - small}" height="32" fill="none" stroke="${INK}" stroke-width="${q('diff') ? 2.2 : 1.2}" stroke-dasharray="${q('diff') ? '6 4' : '2 3'}"/>` + numG(v('diff'), X0 + small + (big - small) / 2, 70)
      + T(X0 + small + (big - small) / 2, 98, RL.diff, { size: 13.5, fill: '#6f6355' });
    return svg(108, body, label);
  }
  if (ty === 'times') {
    const of = own && sc.kind === 'of', L = of ? { base: '전체', big: '그만큼', tm: '몇 분의 몇' } : RL;
    let t = f.R.tm === 'x' ? implied(sc, f) : fnum(show(sc, f.R.tm));
    if (!Number.isFinite(t) || t <= 0) t = 2;
    let body = '';
    if (of && t < 1 && f.R.tm !== 'x') {   /* 몇의 몇 분의 몇 — 전체를 똑같이 나눈 칸 · 그만큼은 몇 칸 */
      const m = String(show(sc, f.R.tm)).match(/(\d+)\/(\d+)$/), d = m ? Math.min(+m[2], 12) : 4, n = m ? Math.min(+m[1], d) : 3, cw = 216 / d;
      body += lab(X0 - 8, 24, L.base) + cell(X0, 8, cw * d, 32, q('base')) + Array.from({ length: d - 1 }, (_, i) => tick(X0 + cw * (i + 1), 8, 32)).join('') + numG(v('base'), X0 + (cw * d) / 2, 24)
        + lab(X0 - 8, 70, L.big) + cell(X0, 54, cw * n, 32, q('big')) + numG(v('big'), X0 + (cw * n) / 2, 70);
    } else {
      /* 기준 한 칸 · 견주는 양 = 기준 몇 칸(1보다 작으면 기준 칸을 길게) · 다섯 배를 넘으면 가운데를 '…'로 */
      const small = t < 1, cw = small ? Math.min(44 / t, 216) : 44, many = t > 5, bw = small ? 44 : cw * Math.min(t, 5);
      body += lab(X0 - 8, 24, L.base) + cell(X0, 8, cw, 32, q('base')) + numG(v('base'), X0 + cw / 2, 24, { size: 15 })
        + lab(X0 - 8, 70, L.big) + cell(X0, 54, bw, 32, q('big'))
        + (small ? '' : Array.from({ length: Math.ceil(Math.min(t, 5)) - 1 }, (_, i) => tick(X0 + cw * (i + 1), 54, 32)).join(''))
        + (many ? T(X0 + cw * 3.5, 70, '…', { size: 16 }) : '') + numG(v('big'), X0 + (many ? cw * 1.5 : bw / 2), 70, { size: 16 });
    }
    body += lab(X0 - 8, 116, L.tm) + cell(X0, 100, 92, 32, q('tm')) + numG(v('tm'), X0 + 46, 116, { size: 16, tail: of ? '' : '배' });
    return svg(140, body, label);
  }
  // 같은 묶음 · 똑같이 나누기 · 몇씩 덜어 내기 — 칸 막대(전체 · 한 묶음 · 묶음 수)
  const cnt = f.R.count === 'x' ? NaN : Number(show(sc, f.R.count));
  const left = own && (sc.rem || sc.need), xr = left ? X1 - 44 : X1;
  const k = Number.isInteger(cnt) && cnt >= 1 && cnt <= 6 ? cnt : 6, gap = !(Number.isInteger(cnt) && cnt <= 6);
  const cw = (xr - X0) / k, cx = (X0 + xr) / 2;
  let body = lab(X0 - 8, 20, RL.total) + cell(cx - 40, 5, 80, 30, q('total')) + numG(v('total'), cx, 20) + over(X0, xr, 46);
  for (let i = 0; i < k; i++) {
    const x = X0 + i * cw;
    if (gap && i === k - 2) { body += T(x + cw / 2, 76, '…', { size: 18 }); continue; }
    body += cell(x, 56, cw, 40, q('size')) + numG(v('size'), x + cw / 2, 76, { size: cw < 46 ? 14 : 16 });
  }
  if (left) body += `<rect x="${xr + 6}" y="62" width="36" height="28" rx="3" fill="none" stroke="${INK}" stroke-width="1.3" stroke-dasharray="2 3"/>` + (sc.rem ? T(xr + 24, 76, '?', { size: 17, bold: true }) : '') + T(xr + 24, 104, '남는 것', { size: 12, fill: '#6f6355' });
  body += lab(X0 - 8, 76, RL.size) + under(X0, xr, 108) + lab(X0 - 8, 128, RL.count) + cell(cx - 40, 114, 80, 30, q('count')) + numG(v('count'), cx, 129);
  return svg(150, body, label);
}

// 유형 카드 그림(작은 기호)
const ICON = {
  change: '<rect x="3" y="15" width="11" height="11" rx="2"/><path d="M17 20.5 H27 M24 17 L28 20.5 L24 24"/><rect x="31" y="11" width="11" height="19" rx="2"/>',
  combine: '<path d="M4 12 V8 H42 V12 M23 8 V4"/><rect x="4" y="16" width="22" height="14" rx="2"/><rect x="26" y="16" width="16" height="14" rx="2"/>',
  compare: '<rect x="4" y="7" width="38" height="11" rx="2"/><rect x="4" y="24" width="24" height="11" rx="2"/><path d="M28 29.5 H42" stroke-dasharray="2 3"/>',
  groups: '<rect x="3" y="14" width="12" height="14" rx="2"/><rect x="17" y="14" width="12" height="14" rx="2"/><rect x="31" y="14" width="12" height="14" rx="2"/><path d="M3 9 V6 H43 V9"/>',
  times: '<rect x="4" y="6" width="12" height="11" rx="2"/><rect x="4" y="23" width="36" height="11" rx="2"/><path d="M16 23 v11 M28 23 v11" stroke-dasharray="2 2"/>',
  share: '<rect x="4" y="7" width="38" height="12" rx="2"/><path d="M16.7 7 v12 M29.3 7 v12"/><path d="M10 23 v7 M23 23 v7 M36 23 v7 M7 27 l3 3 3 -3 M20 27 l3 3 3 -3 M33 27 l3 3 3 -3"/>',
  pack: '<rect x="18" y="20" width="24" height="12" rx="2"/><path d="M30 20 v12"/><rect x="4" y="6" width="11" height="12" rx="2"/><path d="M15 12 H22 M19 9 L22 12 L19 15"/>',
};
const iconSVG = (t) => `<svg class="sb-ic" viewBox="0 0 46 38" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[t]}</g></svg>`;

// 이야기 글 — 보통 · 마디로 나눔 · 낱말 누르기
const numB = (s) => esc(s).replace(/(\d+(?:\.\d+)?)/g, '<b>$1</b>');
const tokHTML = (toks, { bold = false } = {}) => toks.map((t) => (typeof t === 'string' ? (bold ? numB(t) : esc(t)) : toHTML([t]))).join('');
const TAG = { ask: '묻는 것', know: '아는 것', unk: '모르는 수' };
function storyHTML(tokens, mode) {
  if (mode === 'split') return `<ol class="sb-split">${splitStory(tokens).map((x) => `<li class="${x.tag}">${x.tag ? `<span class="sb-tag">${TAG[x.tag]}</span>` : ''}<span>${tokHTML(x.toks, { bold: true })}</span></li>`).join('')}</ol>`;
  if (mode === 'tap') return `<p class="sb-p sb-tap">${tokens.map((t) => (typeof t === 'string' ? t.split(/(\s+)/).map((w) => (/^\s*$/.test(w) ? w : `<button type="button" class="wd" data-w="${esc(w)}">${esc(w)}</button>`)).join('') : toHTML([t]))).join('')}</p>`;
  return `<p class="sb-p">${tokHTML(tokens)}</p>`;
}
const askOf = (tokens) => splitStory(tokens).filter((x) => x.tag === 'ask').map((x) => tokHTML(x.toks)).join(' ');

// ── 이야기 다리 고르기(큰 갈래만 — 학년 · 단원 이름 없이) ──
const skey = (me) => `tt.story.${me.C}.${me.no}`;
const fresh = (S) => S && !S.done && Date.now() - S.made < 3 * 3600e3 && Array.isArray(S.items) && S.i < S.items.length;
// 푼 이야기를 묶음 하나로 남김(한 판을 다 했거나 · 중간에 멈춘 판을 새 판이 덮을 때) — 종이와 같은 판정이 읽음
function saveRun(me, K, S) {
  if (!S || S.done || !S.res || !Object.keys(S.res).length || !Array.isArray(S.items)) return;
  const sh = sheetOf({ id: S.id, items: S.items, made: S.made });
  sh.items = sh.items.filter((x) => S.res[x.k]); sh.chapters = [{ key: 'W', ks: sh.items.map((x) => x.k) }];
  if (sh.items.length) KS.addSheet(me, K, sh, resultOf(sh, S.res), {}, Object.fromEntries(Object.entries(S.res).map(([k, x]) => [k, x.ms])));
  S.done = true;
}
function chooser(root, me, K) {
  const old = lsGet(skey(me));
  if (old && !old.done && (!fresh(old))) { saveRun(me, K, old); lsDel(skey(me)); }
  const rep = KS.reportOf(K), seed = (Math.random() * 2 ** 31) >>> 0, S = lsGet(skey(me));
  const log = storyLog(K), fam = (f) => pickLessons(rep.L, f, seed + f.length);
  const known = familiarTypes(log).map((t) => TYPES[t].kid);
  root.innerHTML = `<div class="card msg act-story"><p class="eyebrow">${tile('story', 22)}이야기 문제</p>${say('point', '이야기 문제를 <b>네 단계</b>로 풀어요.<br>① 무슨 이야기인지 고르기 ② 막대 그림 채우기 ③ 식 쓰기 ④ 답 쓰기', 104)}
    ${fresh(S) ? `<div class="acts" style="margin-top:0;margin-bottom:18px"><a class="btn pri big" href="#/story/${encodeURIComponent(S.cs.join(','))}">이어서 하기 (${S.i + 1}번째 이야기부터)</a></div>` : ''}
    <div class="grid2">${['as', 'md'].map((f) => `<a class="big-pick sb-fam" href="#/story/${encodeURIComponent(fam(f).cs.join(','))}">${tile('story', 28)}<b>${esc(FAMILY[f].kid)}</b><span>예: ${esc(FAMILY[f].eg)}</span><span class="btn pri sb-go">시작</span></a>`).join('')}</div>
    ${known.length ? `<p class="small">익숙해진 이야기 — <b>${known.map(esc).join(', ')}</b>: 다음엔 바로 식부터 써요.</p>` : '<p class="small muted">한 번에 이야기 여섯 개예요. 잘 풀면 다음엔 단계가 줄어요.</p>'}
    <div class="acts"><a class="btn" href="#/me">처음 화면으로</a></div></div>`;
}

// ── 한 판 ──
export function storyView(root, arg) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me);
  K.story = K.story || { log: [] };
  if (!arg) return chooser(root, me, K);
  let cs = String(arg).split(',').filter((c) => byId[c] && hasWords(c));
  if (!cs.length) return go('#/story');
  const fam = famOfLesson(byId[cs[0]]);
  cs = cs.filter((c) => famOfLesson(byId[c]) === fam);
  const SK = skey(me);
  let S = lsGet(SK);
  if (!fresh(S) || S.cs.join(',') !== cs.join(',')) {
    saveRun(me, K, S);
    S = { v: 1, id: `s${rand(6)}`, cs, made: Date.now(), i: 0, res: {}, items: planOf(cs, { seed: (Math.random() * 2 ** 31) >>> 0, log: storyLog(K) }) };
    lsSet(SK, S);
  }
  if (!S.items.length) { root.innerHTML = `<div class="card msg">${say('think', '지금은 이야기를 만들지 못했어요. 다른 이야기를 골라 봐요.', 104)}<div class="acts"><a class="btn" href="#/story">이야기 문제로</a></div></div>`; return; }
  let rush = 0, pr = null, st = null;
  KS.setNow(me, { mode: 'story', n: S.i });

  // 화면 틀 — 위: 걸음 칩 · 진행 / 넓으면 왼쪽: 이야기 글(+ ref 참고 틀 · 묻는 것) · 오른쪽: 튼튼이 말 · 고르기 · 틀 · 식(docs/ui.md 2차)
  const shell = (step, pose, bub, body = '', mode = 'plain', ref = '') => {
    const chips = STEPS.map((t, i) => `<li class="${st.skip && i < 2 ? 'skip' : i < step ? 'done' : i === step ? 'now' : ''}"><i>${st.skip && i < 2 ? '–' : i < step ? '✓' : i + 1}</i>${t}</li>`).join('');
    root.innerHTML = `<div class="card sb"><div class="sb-head">${tagHTML('이야기 문제', 'story')}<ol class="sb-steps" aria-label="걸음">${chips}</ol>${progHTML([S.i, S.items.length])}</div>
      <div class="sb-grid"><div class="sb-left"><div class="sb-story">${storyHTML(pr.s.story, mode)}</div>${ref}</div>
      <div class="sb-right">${say(pose, bub)}<div id="b">${body}</div></div></div></div>`;
    stopSpeak(); speakButton(root.querySelector('.sb-story'), () => { const m = root.querySelector('.sb-say'); if (m) m.textContent = '이 기기엔 한국어 목소리가 없어요'; });
    return root.querySelector('#b');
  };
  // 찍기 — 1.5초 안에 틀린 고르기가 세 번 이어지면 잠깐 멈춤(prep과 같은 까닭 [A-R29])
  const quick = (ms, ok, then) => {
    rush = !ok && ms < 1500 ? rush + 1 : 0;
    if (rush < 3) return false;
    rush = 0; K.rush = (K.rush || 0) + 1; KS.save(me, K);
    root.innerHTML = `<div class="card msg">${say('think', '잠깐! 조금 빨라요. 이야기를 <b>끝까지 읽고</b> 골라요.', 104)}<div class="acts"><button class="pri big" id="r" disabled>다시 해 볼게요</button></div></div>`;
    const b = root.querySelector('#r'); setTimeout(() => { b.disabled = false; b.focus(); }, 3000);
    b.addEventListener('click', then);
    return true;
  };
  const next = (b, label, then) => { const x = document.createElement('div'); x.className = 'qact'; x.innerHTML = `<button class="pri big" type="button">${esc(label)}</button>`; b.appendChild(x); const btn = x.querySelector('button'); btn.focus(); btn.addEventListener('click', then); };

  function start() {
    if (S.i >= S.items.length) return fin();
    pr = probOf(S.items[S.i]);
    if (!pr) { S.i++; lsSet(SK, S); return start(); }
    st = { s: [null, null, 0, 0, 0], t0: Date.now(), skip: familiar(storyLog(K), pr.sc.type, pr.sc.slot) };
    if (st.skip) return stepEq('이 이야기는 익숙해졌어요. 바로 <b>식</b>부터 골라요.');
    stepType('');
  }
  // ① 무슨 이야기?
  function stepType(lead, again = false, wrong = null) {
    const types = FAMILY[famOfLesson(byId[pr.c])].types;
    const bub = again ? `문장을 나눠 읽어 봐요. 아는 것과 <b>묻는 것</b>은 무엇인가요?<br><span class="small">${esc(FAMILY[famOfLesson(byId[pr.c])].ask)}</span>` : `${lead}어떤 이야기일까요? 알맞은 카드를 골라요.`;
    const b = shell(0, again ? 'think' : 'point', bub, `<div class="sb-types">${types.map((t) => `<button type="button" class="sb-ty" data-t="${t}"${t === wrong ? ' disabled' : ''}>${iconSVG(t)}<span><b>${esc(TYPES[t].kid)}</b><small>${esc(TYPES[t].say)}</small></span></button>`).join('')}</div>`, again ? 'split' : 'plain');
    const t0 = performance.now();
    b.querySelectorAll('.sb-ty').forEach((btn) => btn.addEventListener('click', () => {
      const t = btn.dataset.t, ok = t === pr.sc.type, nm = TYPES[pr.sc.type].kid;
      if (quick(performance.now() - t0, ok, () => stepType(lead, again, wrong))) return;
      if (ok) { if (st.s[0] == null) st.s[0] = again ? 0 : 1; return stepFrame(`맞아요! <b>${esc(nm)}</b>${ye(nm)}. `); }
      st.s[0] = 0;
      if (!again) return stepType('', true, t);
      const b2 = shell(0, 'point', `이 이야기는 <b>${esc(nm)}</b>${ye(nm)}.<br>${esc(TYPES[pr.sc.type].say)}`, '', 'split');
      next(b2, '막대 틀 보기', () => stepFrame(''));
    }));
  }
  // ② 막대 틀
  const frames = (pick = null) => `<div class="sb-frames">${pr.fr.list.map((f, i) => `<button type="button" class="sb-fr${pick == null ? '' : i === pr.fr.right ? ' right' : i === pick ? ' no' : ' dim'}" data-i="${i}"${pick == null ? '' : ' disabled'}><span class="sb-l">${LETTER[i]}</span>${frameSVG(pr.sc, f)}</button>`).join('')}</div>`;
  const rightFrame = () => `<div class="sb-ref">${frameSVG(pr.sc, pr.fr.list[pr.fr.right])}</div>`;
  function stepFrame(lead) {
    const b = shell(1, 'point', `${lead}이야기에 맞는 <b>막대 틀</b>을 골라요.<br><span class="small"><b class="q">?</b>는 묻는 수예요.</span>`, frames());
    const t0 = performance.now();
    b.querySelectorAll('.sb-fr').forEach((btn) => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i), ok = i === pr.fr.right;
      if (quick(performance.now() - t0, ok, () => stepFrame(lead))) return;
      st.s[1] = ok ? 1 : 0;
      if (ok) return stepEq('맞아요! 틀이 이야기와 같아요. ');
      const L = LETTER[pr.fr.right], b2 = shell(1, 'think', `맞는 틀은 <b>‘${L}’ 틀</b>이에요.<br>${whyOf(pr.sc)}`, frames(i));
      next(b2, '식 고르기', () => stepEq(''));
    }));
  }
  // ③ 식
  function stepEq(lead, tries = 0, off = []) {
    const pk = pr.s.steps[0].item;
    const b = shell(2, 'point', `${lead}이제 이야기를 <b>식</b>으로 나타내 봐요.`, '<div id="slot"></div>', 'plain', st.skip ? '' : rightFrame());
    draw(b.querySelector('#slot'), { prompt: pk.prompt, choices: pk.choices, conf: false, idk: false, onAnswer: (a, cf, ms) => {
      const k = a.vals[0], res = pk.check([k]);
      if (quick(ms, res.ok, () => stepEq(lead, tries, off))) return;
      if (res.ok) { if (tries === 0) st.s[2] = 1; return stepCalc(); }
      if (tries === 0) {
        st.s[2] = 0;
        const cue = cueOf(pr.sc, res.bug && res.bug.name, toText(pr.s.story));
        if (cue) return wordPick(cue, [k]);
        const b2 = shell(2, 'think', `틀을 다시 봐요. ${whyOf(pr.sc)}`, '', 'plain', rightFrame());
        return next(b2, '식 다시 고르기', () => stepEq('', 1, [k]));
      }
      const rt = pk.choices[pk.sol[0]], b3 = shell(2, 'point', `맞는 식은 <b class="sb-eq">${toHTML(rt, { static: true })}</b>${ye(toText(rt))}.`, '', 'plain', rightFrame());
      next(b3, '계산하기', stepCalc);
    } });
    off.forEach((k) => { const x = b.querySelector(`[data-k="${k}"]`); if (x) x.disabled = true; });
  }
  // 헷갈린 낱말이 있었나요? — 이야기에서 눌러 보거나 '없어요' · 아이 생각을 단정하지 않음
  //  헷갈리기 쉬운 낱말을 누르면 그 낱말 이야기 · 다른 낱말이면 한 번 더 찾아보게 · 두 번째에도 아니거나 '없어요'면 이야기에 그 낱말이 있다고만 알려 줌
  function wordPick(cue, off, tries = 0) {
    const b = shell(2, 'think', tries ? '그 낱말 말고 헷갈릴 만한 낱말이 또 있을까요?<br>없으면 ‘없어요’를 눌러요.' : '식을 고를 때 헷갈린 낱말이 있었나요?<br>있으면 이야기에서 그 낱말을 눌러요.', '<div class="acts"><button type="button" class="btn" id="none">없어요</button></div>', 'tap');
    const tell = (hit) => {
      const w = esc(cue.word);
      const b2 = shell(2, hit ? 'cheer' : 'point', `${hit ? '그 낱말이 헷갈리기 쉬워요.' : `이 이야기에는 ‘${w}’${P(cue.word, '이', '가')} 있어요.`}<br>${cueWhy(pr.sc, w)}`, '', 'plain', rightFrame());
      next(b2, '식 다시 고르기', () => stepEq('', 1, off));
    };
    root.querySelectorAll('.sb-tap .wd').forEach((x) => x.addEventListener('click', () => {
      if (isCue(cue, x.dataset.w)) return tell(true);
      if (!tries) return wordPick(cue, off, 1);
      tell(false);
    }));
    b.querySelector('#none').addEventListener('click', () => tell(false));
  }
  // ④ 계산 → 답 — 답이 계산과 같으면(나머지 · 올림 · 몇 배 거꾸로가 아니면) 답 칸 없이 계산 아래에 '답 35개'
  const oneAns = () => {
    const it = pr.s.item, calc = pr.s.steps[1].item;
    if (pr.sc.rem || pr.sc.need || pr.sc.slot === 'timesB÷') return false;
    if (!Array.isArray(it.sol) || !Array.isArray(calc.sol) || it.sol.length !== calc.sol.length || !it.sol.every((x, i) => String(x) === String(calc.sol[i]))) return false;
    try { return !!it.check(calc.sol.map(Number), calc.sol.map(String)).ok; } catch (e) { return false; }
  };
  const ansLine = () => `<div class="sb-ansbox"><p class="sb-ask"><span class="sb-tag">묻는 것</span> ${askOf(pr.s.story)}</p><p class="sb-ans">${staticHTML(pr.s.item.prompt, pr.s.item.sol)}</p></div>`;
  function stepCalc() {
    const calc = pr.s.steps[1].item, one = oneAns();
    const b = shell(3, 'point', one ? '고른 식을 계산해요.<br>계산한 수에 단위를 붙이면 답이에요.' : '고른 식을 계산해요.', '<div id="slot"></div>');
    draw(b.querySelector('#slot'), { prompt: calc.prompt, conf: false, idk: false, onAnswer: (a) => {
      let ok = false; try { ok = !!calc.check(a.vals, a.raws).ok; } catch (e) { ok = false; }
      st.s[3] = ok ? 1 : 0;
      if (one) st.s[4] = st.s[3];
      if (ok && !one) return stepAns(true);
      const card = b.querySelector('.qcard'), box = document.createElement('div');
      card.querySelectorAll('.qact button, input.blank').forEach((x) => (x.disabled = true));
      fbSlot(b).appendChild(box);
      if (ok) { box.className = 'fb ok'; box.innerHTML = `<p class="sb-okmsg">맞아요.</p>${ansLine()}`; return finish(box); }
      box.className = 'fb no'; box.innerHTML = '계산이 달라요.';
      let T0 = null; try { T0 = toolBox(box, { it: calc, vals: a.vals, c: pr.c, onSelfFix: (t) => KS.selfFix(me, K, t) }); } catch (e) { T0 = null; }
      if (!T0) box.innerHTML += ` 바르게 계산하면 ${staticHTML(calc.prompt, calc.sol)}`;
      if (!one) return next(box, '답 쓰기', () => stepAns(false));
      if (!T0) { box.insertAdjacentHTML('beforeend', ansLine()); return finish(box); }
      /* 검산 도구로 먼저 확인해 보고 — 답은 단추를 눌러야 보임 */
      next(box, '답 보기', () => { box.querySelectorAll('.qact').forEach((x) => x.remove()); box.insertAdjacentHTML('beforeend', `<p class="sb-calc small">바르게 계산하면 ${staticHTML(calc.prompt, calc.sol)}</p>${ansLine()}`); finish(box); });
    } });
  }
  function stepAns(calcOk) {
    const it = pr.s.item, calc = pr.s.steps[1].item;
    const b = shell(3, 'point', '<b>묻는 것</b>을 다시 읽고, 답을 써요.', '<div id="slot"></div>', 'plain', `<div class="panel"><p class="sb-ask"><span class="sb-tag">묻는 것</span> ${askOf(pr.s.story)}</p><p class="sb-calc small">${calcOk ? '계산' : '바르게 계산하면'} ${staticHTML(calc.prompt, calc.sol)}</p></div>`);
    draw(b.querySelector('#slot'), { prompt: it.prompt, conf: false, idk: false, onAnswer: (a) => {
      let ok = false; try { ok = !!it.check(a.vals, a.raws).ok; } catch (e) { ok = false; }
      st.s[4] = ok ? 1 : 0;
      const card = b.querySelector('.qcard'), box = document.createElement('div');
      card.querySelectorAll('.qact button, input.blank').forEach((x) => (x.disabled = true));
      fbSlot(b).appendChild(box);
      if (ok) { box.className = 'fb ok'; box.innerHTML = '맞아요. 묻는 것에 맞게 답했어요.'; return finish(box); }
      box.className = 'fb no';
      if (calcOk) reread(box, it); else { box.innerHTML = ansSay(it); finish(box); }
    } });
  }
  // 다시 읽기 — 계산은 맞았는데 답이 다름(나머지 해석 · 기준 · 묻는 말)
  function reread(box, it) {
    box.innerHTML = `<div class="toolbox"><button type="button" class="tbtn">${icon('search', 20)} 다시 읽기로 확인해 볼까요?</button></div>`;
    box.querySelector('.tbtn').addEventListener('click', () => {
      KS.learnTool(me, K, 'reread');
      box.innerHTML = `<p class="tcheck">묻는 것: <u>${askOf(pr.s.story)}</u><br>${esc(rereadOf(pr.sc))}</p><div class="retry"><span class="math">${toHTML(it.prompt)}</span><button type="button" class="pri" id="rt">다시 써 보기</button></div>`;
      box.querySelector('#rt').addEventListener('click', () => {
        const raws = [...box.querySelectorAll('.blank')].sort((x, y) => x.dataset.i - y.dataset.i).map((x) => x.value.trim().replace(/,/g, ''));
        let ok = false; try { ok = !!it.check(raws.map(Number), raws).ok; } catch (e) { ok = false; }
        if (ok) KS.selfFix(me, K, 'reread');
        box.querySelector('.retry').innerHTML = ok ? '<b>스스로 고쳤어요!</b> 다시 읽기 도구가 도왔어요.' : `아직 아니에요. ${ansSay(it)}`;
      });
      finish(box);
      const f0 = box.querySelector('.blank'); if (f0) f0.focus();
    });
    finish(box);
  }
  // 한 문제 끝 — 기록(이 기기 · 한 번만) → 다음 이야기 단추 · 걸음 돌아보기는 판 끝에
  function record() {
    if (st.rec) return;
    st.rec = true;
    const k = S.i + 1, t = Date.now();
    S.res[k] = { s: st.s, t, ms: t - st.t0 };
    K.story.log = [...(K.story.log || []), { t, sh: S.id, k, c: pr.c, kind: pr.sc.kind, slot: pr.sc.slot, type: pr.sc.type, inc: pr.sc.inc, s: st.s }].slice(-300);
    KS.save(me, K);
    S.i++; lsSet(SK, S);
    KS.setNow(me, { mode: 'story', n: S.i });
  }
  function finish(box) {
    record();
    next(box, S.i < S.items.length ? '다음 이야기' : '한 판 마치기', start);
  }
  // 한 판 끝 — 묶음 하나로 기록(종이와 같은 판정) · 걸음 돌아보기(한 번) · 선생님 요약
  function fin() {
    saveRun(me, K, S);
    S.done = true; lsDel(SK);
    KS.setNow(me, { mode: 'home' });
    const rs = Object.values(S.res), n = rs.length;
    const log = storyLog(K), mine = S.items.map((x, i) => (S.res[i + 1] ? probOf(x) : null)).filter(Boolean);
    /* 이 판에서 그 유형의 마지막 문제가 ①②에서 막혔으면 '다음엔 틀 먼저' · 뒤에서 잘 읽었으면 빼고 */
    const lastOf = {}; mine.forEach((p, i) => { if (rs[i]) lastOf[p.sc.type] = rs[i]; });
    const hard = Object.entries(lastOf).filter(([, x]) => x.s[0] === 0 || x.s[1] === 0).map(([t]) => TYPES[t].kid);
    const word = mine.some((p, i) => rs[i] && p.sc.inc && rs[i].s[2] === 0);
    const here = new Set(mine.map((p) => p.sc.type)), known = familiarTypes(log).filter((t) => here.has(t)).map((t) => TYPES[t].kid);
    const tip = hard.length ? `다음엔 <b>${esc(hard[0])}</b>${P(hard[0], '을', '를')} 막대 틀로 먼저 그려 보고 식을 세워요.` : word ? '낱말 하나만 보지 말고, <b>묻는 것</b>을 끝까지 읽고 식을 세워요.' : '이야기를 나눠 읽고 틀을 먼저 세웠어요.';
    /* 걸음마다 — 바로(첫 번에) · 다시(다시 보고) · 건너뜀(익숙해서) */
    const rows = STEPS.map((nm, j) => { const xs = rs.map((x) => (j < 3 ? x.s[j] : x.s[3] === 1 && x.s[4] === 1 ? 1 : 0)); return { nm, j, a: xs.filter((x) => x === 1).length, b: xs.filter((x) => x === 0).length, c: xs.filter((x) => x == null).length }; });
    const cnt = (w, k) => (k ? `${w} ${k}개` : '');
    root.innerHTML = `<div class="card msg act-story"><p class="eyebrow">${tile('story', 22)}이야기 문제</p>${say(hard.length || word ? 'think' : 'cheer', `이야기 ${n}개를 걸음으로 나눠 풀었어요.<br>${tip}`, 104)}
      <p class="small">걸음마다 돌아봐요 <span class="muted">— 바로 = 첫 번에 · 다시 = 다시 보고 · 건너뜀 = 익숙해서</span></p>
      <ul class="sb-recap">${rows.map((x) => `<li class="${x.b ? 'again' : x.a ? 'ok' : 'skip'}"><span>${x.j + 1}. ${x.nm}</span><b>${[cnt('바로', x.a), cnt('다시', x.b), cnt('건너뜀', x.c)].filter(Boolean).join(' · ')}</b></li>`).join('')}</ul>
      ${known.length ? `<p class="small">익숙해진 이야기 — <b>${known.map(esc).join(', ')}</b>: 묻는 자리가 같으면 다음엔 바로 식부터 해요.</p>` : ''}
      <div class="acts"><a class="btn pri big" href="#/story/${encodeURIComponent(S.cs.join(','))}?${Date.now()}">한 판 더</a><a class="btn big" href="#/story">다른 이야기</a><a class="btn big" href="#/me">처음 화면으로</a></div></div>`;
  }
  if (S.i === 0 && !Object.keys(S.res).length) {
    root.innerHTML = `<div class="card msg act-story"><p class="eyebrow">${tile('story', 22)}이야기 문제</p>${say('point', `이야기 ${S.items.length}개를 풀어요. 문제마다 <b>걸음 넷</b>이에요.<br>① 무슨 이야기? ② 막대 틀 ③ 식 ④ 계산 · 답`, 104)}<div class="acts"><button class="pri big" id="s">시작</button><a class="btn" href="#/story">다른 이야기</a></div></div>`;
    root.querySelector('#s').addEventListener('click', start);
  } else start();
}
