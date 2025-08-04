import { request } from '@umijs/max';
const BASE_URL = `${process.env.UMI_APP_API_URL}/api/chat`;

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
 * 发送流请求
 * @param body
 * @returns
 */
export async function sendMessageStream(
  body: API.SendMessageRequest,
): Promise<ReadableStream> {
  const postDataString = JSON.stringify(body);
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  // 测试透传请求头
  headers.append('Authorization', 'test-token');
  const response = await fetch(`${BASE_URL}/stream`, {
    method: 'POST',
    headers: headers,
    body: postDataString,
  });
  if (!response.ok) {
    throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
  }

  if (response.body === null) {
    throw new Error('响应流为空');
  }
  return response.body; // 返回 ReadableStream
}

/**
 * 订阅通知
 * @param conversationId
 * @param inputMessageId
 * @returns
 */
export async function subscribeNotification(
  conversationId: string,
  inputMessageId: string,
): Promise<ReadableStream> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  // 测试透传请求头
  headers.append('Authorization', 'test-token');
  const response = await fetch(
    `${BASE_URL}/notification/${conversationId}/${inputMessageId}`,
    {
      method: 'GET',
      headers: headers,
    },
  );
  if (!response.ok) {
    throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
  }

  if (response.body === null) {
    throw new Error('响应流为空');
  }
  return response.body; // 返回 ReadableStream
}
