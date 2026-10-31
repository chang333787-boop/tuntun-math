// 끊긴 곳 찾기 — 이 기기 브라우저에만 저장(서버 · 계정 없음) · 이름 대신 번호/별명 · 판 형식 버전 · 내보내기/가져오기
//  { v:1, kids:[{id, label, made}], sheets:{ id: 묶음 }, res:{ 묶음 id: { 아이 id: 결과 } }, at }
const KEY = 'kkg.v1';
let data = null, lastErr = null;
const blank = () => ({ v: 1, kids: [], sheets: {}, res: {}, at: Date.now() });
export function load() {
  if (data) return data;
  try {
    const raw = localStorage.getItem(KEY);
    data = raw ? JSON.parse(raw) : blank();
    if (!data || data.v !== 1 || !Array.isArray(data.kids)) throw new Error('형식이 다름');
  } catch (e) {
    lastErr = e; try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem(KEY + '.bad', raw); } catch (_) { /* */ }
    data = blank();
  }
  return data;
}
export const loadError = () => lastErr;
let timer = null, pending = false;
export function flush() { if (pending) save(true); }
if (typeof window !== 'undefined') { window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); }); }
export function save(now = false) {
  const go = () => { try { data.at = Date.now(); localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { lastErr = e; alert('이 기기에 저장하지 못했어요(저장 공간이 꽉 찼을 수 있어요). 설정 → 내보내기로 백업해 주세요.'); } };
  clearTimeout(timer); if (now) { pending = false; go(); } else { pending = true; timer = setTimeout(() => { pending = false; go(); }, 400); }
}
export const kids = () => load().kids;
const rid = () => Math.random().toString(36).slice(2, 10);
export function addKid(label) { const k = { id: rid(), label: String(label || '').slice(0, 20), made: Date.now() }; load().kids.push(k); save(true); return k; }
export function renameKid(id, label) { const k = load().kids.find((x) => x.id === id); if (k) { k.label = String(label).slice(0, 20); save(true); } }
export function removeKid(id) { const d = load(); d.kids = d.kids.filter((x) => x.id !== id); Object.values(d.res).forEach((m) => delete m[id]); Object.values(d.sheets).forEach((s) => { s.kids = (s.kids || []).filter((x) => x !== id); }); save(true); }
export const kid = (id) => load().kids.find((x) => x.id === id);
export const sheets = () => Object.values(load().sheets).sort((a, b) => b.made - a.made);
export const sheet = (id) => load().sheets[id];
export function putSheet(s) { load().sheets[s.id] = s; save(true); }
export function removeSheet(id) { const d = load(); delete d.sheets[id]; delete d.res[id]; save(true); }
export function result(sid, kidId) { const d = load(); d.res[sid] = d.res[sid] || {}; d.res[sid][kidId] = d.res[sid][kidId] || { done: {}, it: {}, w: {}, t: {}, at: Date.now() }; return d.res[sid][kidId]; }
export const results = () => load().res;
export function hasResult(sid, kidId) { const r = load().res[sid] && load().res[sid][kidId]; return !!(r && Object.keys(r.done || {}).length); }
// 내보내기 · 가져오기(같은 id는 덮지 않고 합침 — 결과는 문항마다 최근 것)
export function exportJSON() { return JSON.stringify({ ...load(), app: '끊긴 곳 찾기', exported: new Date().toISOString() }, null, 1); }
export function importJSON(text) {
  const x = JSON.parse(text);
  if (!x || x.v !== 1 || !Array.isArray(x.kids) || typeof x.sheets !== 'object') throw new Error('끊긴 곳 찾기에서 내보낸 파일이 아니에요.');
  const d = load(); let nk = 0, ns = 0;
  for (const k of x.kids) if (!d.kids.some((y) => y.id === k.id)) { d.kids.push(k); nk++; }
  for (const [id, s] of Object.entries(x.sheets)) if (!d.sheets[id]) { d.sheets[id] = s; ns++; }
  // 결과는 문항마다 합침(문항마다 고친 시각 t가 늦은 쪽) · 채점 끝 표시는 합집합 — 다른 기기에서 채점한 장이 지워지지 않게
  const mergeMap = (a = {}, b = {}) => { const out = { ...a }; for (const [k, v] of Object.entries(b)) if (!out[k] || (v.t || 0) >= (out[k].t || 0)) out[k] = v; return out; };
  for (const [sid, m] of Object.entries(x.res || {})) { d.res[sid] = d.res[sid] || {}; for (const [kidId, r] of Object.entries(m)) { const cur = d.res[sid][kidId]; if (!cur) { d.res[sid][kidId] = r; continue; } d.res[sid][kidId] = { done: { ...(cur.done || {}), ...(r.done || {}) }, it: mergeMap(cur.it, r.it), w: mergeMap(cur.w, r.w), t: { ...(r.t || {}), ...Object.fromEntries(Object.entries(cur.t || {}).filter(([, v]) => v !== '' && v != null)) }, at: Math.max(cur.at || 0, r.at || 0) }; } }
  save(true); return { nk, ns };
}
export function wipe() { data = blank(); save(true); }
