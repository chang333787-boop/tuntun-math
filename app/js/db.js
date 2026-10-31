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
//  보내는 동안 같은 경로가 다시 들어와도 다른 쓰기를 지우지 않게 — 보낸 그 항목(id)만 뺀다(코덱스 10-31)
export function queuePut(path, v) {
  const q = lsGet(Q, []).filter((x) => x.path !== path);
  q.push({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, path, v });
  lsSet(Q, q);
  return flush();
}
//  ⚠️ 줄이 비어 있으면 async 함수가 첫 await 없이 끝난다 — 그 안에서 flushing = null을 하면 바깥 대입보다 먼저 돌아
//  flushing이 끝난 약속으로 영영 남아 그 뒤로 아무것도 안 보냈다(10-31 배포 주소 시험에서 찾음) → 대입 뒤 finally로 비움
let flushing = null;
export function flush() {
  if (flushing) return flushing;
  flushing = sendAll().finally(() => { flushing = null; });
  return flushing;
}
async function sendAll() {
    for (let guard = 0; guard < 500; guard++) {
      const x = lsGet(Q, [])[0];
      if (!x) break;
      let drop = true;
      try { await put(x.path, x.v); } catch (e) { if (!(e.status === 401 || e.status === 400)) drop = false; else lsSet('tt.drop', [...lsGet('tt.drop', []), { p: String(x.path).replace(/\/\d{4}\//, '/****/'), s: e.status, n: String(x.v || '').length, t: Date.now() }].slice(-20)); }   // 401 · 400 = 규칙이 막은 것(다시 보내도 안 됨 · 버린 것은 tt.drop에 20개까지 — 핀은 가림) · 그 밖은 끊김 → 다음에
      if (!drop) break;
      lsSet(Q, lsGet(Q, []).filter((y) => y.id !== x.id && !(y.path === x.path && y.v === x.v && !y.id)));
    }
    return lsGet(Q, []).length;
}
export const pending = () => lsGet(Q, []).length;
if (typeof window !== 'undefined') { window.addEventListener('online', () => flush()); }
