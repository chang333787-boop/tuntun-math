// 내 수 다리 그림 — 판자 = 오늘 단원으로 가는 준비 칸(낮은 학년 → 높은 학년) · 밋밋한 선화 · 흑백에서도 구별(모양으로)
//  튼튼(확인 · 관문 통과) = 꽉 찬 판자 · 흔들(흔들림 · 거의) = 기운 판자 · 빈(막힘 · 고칠 판자) = 빈자리 점선 · 아직 = 연한 테두리
import { mascot } from '../../paper/js/mascot.js';
import { esc } from './local.js';
const INK = '#3b2a1e', WOOD = '#c99a68', WOOD2 = '#a8774a', WATER = '#cfe6e3';
export const KIND = (st) => (st === 'ok' || st === 'pass' ? 'ok' : st === 'shaky' || st === 'near' ? 'shaky' : st === 'stuck' ? 'gap' : 'none');
const STONE = '#c9c4bb', WOODD = '#b07f50';
// 표에 따라 판자가 바뀜: 정확 = 나무 · 빠르게 = 못 박은 진한 나무 · 오래 = 돌 판자(현실 다리 재료 — 판타지 X)
function plankShape(x, y, w, h, tier) {
  if (tier >= 3) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${STONE}" stroke="${INK}" stroke-width="1.6"/><path d="M${x + w * 0.38} ${y} v${h} M${x + w * 0.7} ${y} v${h}" stroke="${INK}" stroke-width=".8" opacity=".6"/>`;
  if (tier === 2) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${WOODD}" stroke="${INK}" stroke-width="1.6"/><circle cx="${x + Math.min(5, w * 0.18)}" cy="${y + h / 2}" r="1.7" fill="${INK}"/><circle cx="${x + w - Math.min(5, w * 0.18)}" cy="${y + h / 2}" r="1.7" fill="${INK}"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${WOOD}" stroke="${INK}" stroke-width="1.6"/>`;
}
// 스테이지 칸용 작은 판자 하나 — k: 'gap' | 0 아직 | 1 | 2 | 3
export function plankSVG(k, w = 64) {
  const h = Math.round(w * 0.3);
  const body = k === 'gap' ? `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="2" fill="none" stroke="#b4482b" stroke-width="2" stroke-dasharray="5 4"/>`
    : k ? plankShape(2, 2, w - 4, h - 4, k) : `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="2" fill="#fff" stroke="${WOOD2}" stroke-width="1.4"/>`;
  return `<svg class="pk-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${body}</svg>`;
}

export function bridgeSVG(planks, { goal = '오늘 단원' } = {}) {
  const n = Math.max(planks.length, 1), W = 640, H = 210, x0 = 90, x1 = W - 90, pw = (x1 - x0) / n, y = 110;   /* 홈 오른쪽 칸(약 440px)에서 글이 13px 넘게 보이게 폭을 줄임(docs/ui.md 2차) */
  const firstGap = planks.findIndex((p) => KIND(p.st) !== 'ok');
  const bx = x0 + pw * (firstGap < 0 ? n : firstGap) - 4;
  const pk = planks.map((p, i) => {
    const x = x0 + i * pw + 2, w = pw - 4, k = KIND(p.st);
    const title = `<title>${esc(p.label)}</title>`;
    if (k === 'ok') return `<g>${title}${plankShape(x, y, w, 16, Math.max(1, p.tier || 0))}</g>`;
    if (k === 'shaky') return `<rect x="${x}" y="${y}" width="${w}" height="16" rx="2" fill="#efd6a8" stroke="${INK}" stroke-width="1.6" transform="rotate(-7 ${x + w / 2} ${y + 8})">${title}</rect>`;
    if (k === 'gap') return `<rect x="${x}" y="${y}" width="${w}" height="16" rx="2" fill="none" stroke="#b4482b" stroke-width="2" stroke-dasharray="5 4">${title}</rect>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="16" rx="2" fill="#fff" stroke="${WOOD2}" stroke-width="1.2" opacity=".7">${title}</rect>`;
  }).join('');
  return `<svg class="bridge" viewBox="0 0 ${W} ${H}" role="img" aria-label="수 다리 — 튼튼한 판자 ${planks.filter((p) => KIND(p.st) === 'ok').length}개 · 고칠 판자 ${planks.filter((p) => KIND(p.st) === 'gap').length}개">
    <path d="M0 150 Q${W / 4} 140 ${W / 2} 150 T${W} 150 V${H} H0z" fill="${WATER}"/>
    <path d="M0 126 H${x0} V${H} H0z" fill="#e8d6b4" stroke="${INK}" stroke-width="1.6"/><path d="M${x1} 126 H${W} V${H} H${x1}z" fill="#e8d6b4" stroke="${INK}" stroke-width="1.6"/>
    <path d="M${x0} 108 H${x1}" stroke="${INK}" stroke-width="1.4"/><path d="M${x0} 128 H${x1}" stroke="${INK}" stroke-width="1.4" opacity=".5"/>
    ${pk}
    <text x="${x0 / 2}" y="152" text-anchor="middle" font-size="19" fill="${INK}">처음</text>
    <text x="${x1 + (W - x1) / 2}" y="152" text-anchor="middle" font-size="18" fill="${INK}" font-weight="700">${esc(goal)}</text>
    <g transform="translate(${Math.min(Math.max(bx - 36, 0), W - 80)} ${y - 74}) scale(.62)">${mascot(firstGap < 0 ? 'cheer' : 'fix', 120).replace('<svg ', '<svg x="0" y="0" ')}</g>
  </svg>`;
}
