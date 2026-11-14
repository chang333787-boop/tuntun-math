// 이 기기 저장(localStorage) — 막혀 있어도(사생활 창 등) 앱이 돌게 모두 try/catch
//  자리가 모자라면(한 학기 · 크롬북 한 대를 여럿이 씀) 다른 아이 기록부터 비움 — 그 아이 것은 서버에 있어 다시 들어오면 받아 옴(kidstore pull)
//  그래도 못 쓴 칸은 이 창이 열린 동안 방금 값으로 읽음(예전엔 이 기기에 남은 옛 값을 읽어 보낼 줄 · 기록이 사라졌음)
const mem = {}, stale = new Set();
export function lsGet(k, d = null) {
  if (stale.has(k)) return k in mem ? mem[k] : d;
  try { const s = localStorage.getItem(k); return s == null ? (k in mem ? mem[k] : d) : JSON.parse(s); } catch (e) { return k in mem ? mem[k] : d; }
}
export function lsSet(k, v) {
  mem[k] = v;
  let s; try { s = JSON.stringify(v); } catch (e) { stale.add(k); return false; }
  for (let n = 0; n < 40; n++) {
    try { localStorage.setItem(k, s); stale.delete(k); return true; } catch (e) { if (!freeOne(k)) break; }
  }
  stale.add(k);
  return false;
}
export function lsDel(k) { delete mem[k]; stale.delete(k); try { localStorage.removeItem(k); } catch (e) { /* */ } }
/* 다른 아이 기록(tt.k.<반>.<번호>) 가운데 가장 오래 안 푼 것 하나를 지움 · 지금 쓰는 칸 · 보낼 줄 · 선생님 칸은 건드리지 않음 */
const lastMade = (s) => { try { const o = JSON.parse(s); return Math.max(0, ...Object.values((o && o.recs) || {}).map((x) => Number(x && x.s && x.s.made) || 0)); } catch (e) { return 0; } };
function freeOne(keep) {
  try {
    let best = null, bt = Infinity;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === keep || !/^tt\.k\.[^.]+\.\d+$/.test(key)) continue;
      const t = lastMade(localStorage.getItem(key));
      if (t < bt) { bt = t; best = key; }
    }
    if (!best) return false;
    localStorage.removeItem(best);
    return true;
  } catch (e) { return false; }
}
// 헷갈리는 글자(I · O · 0 · 1)를 뺀 글자로
export const CODE_AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function rand(n, al = CODE_AL) {
  const a = new Uint32Array(n);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (x) => al[x % al.length]).join('');
}
export const KEY_AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
