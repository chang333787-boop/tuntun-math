// 서버(Firebase 실시간 DB)와 주고받기 — 로그인 없이 REST만(SDK X · 열린 연결 X → 동시 접속 한도에 안 걸림)
//  비밀은 경로에: 선생님 칸 tc/<반>/<선생님 열쇠>/ · 아이 칸 k/<반>/<번호>/<핀>/ — 규칙은 database.rules.json
//  잎 값은 모두 JSON 글(규칙이 글 길이로 크기를 막음) · 못 보낸 쓰기는 이 기기에 모아 두었다가 다시 보냄
import { firebaseConfig } from './firebase-config.js';
import { lsGet, lsSet } from './local.js';

const DB = firebaseConfig.databaseURL;
const Q = 'tt.queue';
export class DBError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function call(method, path, body) {
  const r = await fetch(`${DB}/${path}.json`, { method, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  if (!r.ok) throw new DBError(r.status, r.status === 401 ? '들어갈 수 없어요(코드 · 번호 · 핀을 다시 봐 주세요)' : `서버 오류 ${r.status}`);
  return r.json();
}
export const get = (path) => call('GET', path);
export const put = (path, v) => call('PUT', path, v);
export const patch = (path, obj) => call('PATCH', path, obj);
export const del = (path) => call('DELETE', path);
// 글로 싸서 쓰기 · 읽기
export const enc = (v) => JSON.stringify(v);
export const dec = (s) => { try { return typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return null; } };

// 끊겨도 잃지 않게 — 쓰기를 줄에 넣고 차례로 보냄(같은 경로는 마지막 것만)
export function queuePut(path, v) {
  const q = lsGet(Q, []);
  const i = q.findIndex((x) => x.path === path);
  if (i >= 0) q.splice(i, 1);
  q.push({ path, v });
  lsSet(Q, q);
  return flush();
}
let flushing = null;
export function flush() {
  if (flushing) return flushing;
  flushing = (async () => {
    let q = lsGet(Q, []);
    while (q.length) {
      const x = q[0];
      try { await put(x.path, x.v); } catch (e) { if (e.status === 401 || e.status === 400) { /* 규칙이 막은 것 — 다시 보내도 안 됨 */ } else break; }
      q = lsGet(Q, []); q.shift(); lsSet(Q, q);
    }
    flushing = null;
    return lsGet(Q, []).length;
  })();
  return flushing;
}
export const pending = () => lsGet(Q, []).length;
if (typeof window !== 'undefined') { window.addEventListener('online', () => flush()); }
