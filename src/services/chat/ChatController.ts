import { request } from '@umijs/max';

const BASE_URL = '/api/chat';

/**
 * 发送消息
 */
export async function sendMessageCall(
  body: API.SendMessageRequest,
  options?: { [key: string]: any },
) {
  return request<API.Result_SendMessageResponse>(`${BASE_URL}/call`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
/**
 * 流请求
 * @returns
 */
export function sendMessageStream(body: API.SendMessageRequest) {
  const postDataString = JSON.stringify(body);
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return fetch(`${BASE_URL}/stream`, {
    method: 'POST',
    headers: headers,
    body: postDataString,
  });
}
