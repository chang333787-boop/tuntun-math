// 이 기기 저장(localStorage) — 막혀 있어도(사생활 창 등) 앱이 돌게 모두 try/catch
const mem = {};
export function lsGet(k, d = null) {
  try { const s = localStorage.getItem(k); return s == null ? (k in mem ? mem[k] : d) : JSON.parse(s); } catch (e) { return k in mem ? mem[k] : d; }
}
export function lsSet(k, v) {
  mem[k] = v;
  try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
}
export function lsDel(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* */ } }
// 헷갈리는 글자(I · O · 0 · 1)를 뺀 글자로
export const CODE_AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function rand(n, al = CODE_AL) {
  const a = new Uint32Array(n);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (x) => al[x % al.length]).join('');
}
export const KEY_AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
