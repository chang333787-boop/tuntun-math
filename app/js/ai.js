// 선생님 기기에서 바로 Claude에게 묻기(M4 · 서버 없이) — copilot.js가 만든 근거 글(번호만 · 이름 X)을 그대로 보냄
//  키 = 선생님이 넣은 Claude API 키 · 이 창(sessionStorage)에만 — 창을 닫으면 지워짐(아이 기기 · Firebase로 가지 않음 · 코드 · 저장소에 없음)
//  공식 SDK(@anthropic-ai/sdk 1.1.0 · jsdelivr ESM) · dangerouslyAllowBrowser = 선생님이 자기 키를 자기 브라우저에서 쓸 때만(아이 화면엔 이 모듈을 부르지 않음)
//  모델 claude-opus-5-5 · 생각 깊이 medium · 거절이면 같은 요청을 다른 모델로(fallbacks 'default') · AI 답은 짐작 — 아이 · 가정에 가기 전에 선생님이 확인 [goal.md M4]
import { lsGet, lsDel } from './local.js';

const SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.1.0/+esm';
const KEY = 'tt.ai.key';
export const MODEL = 'claude-opus-5-5';
/* 키는 이 창(sessionStorage)에만 — 창을 닫으면 지워짐(같은 주소를 쓰는 다른 앱이 localStorage로 읽을 수 있던 것 · 비판 토론 C4 · 심판 차례 0) · 예전에 localStorage에 둔 키는 한 번 옮기고 지움 */
const ss = { get: () => { try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; } }, set: (v) => { try { if (v) sessionStorage.setItem(KEY, v); else sessionStorage.removeItem(KEY); } catch (e) { /* */ } } };
export const aiKey = () => { const old = lsGet(KEY, ''); if (typeof old === 'string' && old) { if (!ss.get()) ss.set(old); lsDel(KEY); } return ss.get(); };
export const setAiKey = (k) => { ss.set(String(k || '').trim()); lsDel(KEY); };
export const keyTail = (k = aiKey()) => (k ? `…${k.slice(-4)}` : '');

let sdk = null;
// 사진 → 긴 변 1600px JPEG base64(보내는 크기 · 값 줄이기) · 이 함수 밖으로는 저장하지 않음
export function shrinkPhoto(file, max = 1600) {
  return new Promise((ok, no) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok({ type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1] }); };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('사진을 읽지 못했어요')); };
    img.src = url;
  });
}
// 묻기 → { text } · { refusal: true } · 실패는 { error: '선생님이 읽을 한 줄' }
export async function askClaude(prompt, image = null) {   /* image = { data: base64, type: 'image/jpeg' } — 풀이 사진(저장하지 않음) */
  const apiKey = aiKey();
  if (!apiKey) return { error: '키를 먼저 넣어 주세요.' };
  try { sdk = sdk || (await import(SDK)); } catch (e) { return { error: 'AI 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.' }; }
  const Anthropic = sdk.default;
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      messages: [{ role: 'user', content: image ? [{ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } }, { type: 'text', text: prompt }] : prompt }],
    });
    if (res.stop_reason === 'refusal') return { refusal: true };
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return text ? { text, cut: res.stop_reason === 'max_tokens' } : { error: '답이 비어 있어요. 한 번 더 눌러 주세요.' };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { error: '키가 맞지 않아요. 키를 다시 넣어 주세요.' };
    if (e instanceof Anthropic.PermissionDeniedError) return { error: '이 키로는 쓸 수 없어요(권한 · 크레딧을 확인해 주세요).' };
    if (e instanceof Anthropic.RateLimitError) return { error: '잠깐 너무 많이 물었어요. 1분 뒤 다시 눌러 주세요.' };
    if (e instanceof Anthropic.APIConnectionError) return { error: '인터넷 연결을 확인해 주세요.' };
    if (e instanceof Anthropic.APIError) return { error: `AI 쪽에서 답하지 못했어요(${e.status || '?'}). 잠시 뒤 다시 눌러 주세요.` };
    return { error: '묻지 못했어요. 잠시 뒤 다시 눌러 주세요.' };
  }
}
