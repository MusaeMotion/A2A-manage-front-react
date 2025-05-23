import { request } from '@umijs/max';

const BASE_URL = '/api/conversation';

/**
 * 交谈列表
 */
export async function queryConversationList(options?: { [key: string]: any }) {
  return request<API.Result_Lits_ConversationInfo>(BASE_URL, {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 交谈列表
 */
export async function queryMessageList(
  conversationId: string,
  options?: { [key: string]: any },
) {
  return request<API.Result_Lits_ConversationMessageInfo>(
    `${BASE_URL}/${conversationId}/messages`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/**
 * 创建交谈对话
 */
export async function createConversation(options?: { [key: string]: any }) {
  return request<API.Result_ConversationInfo>(BASE_URL, {
    method: 'POST',
    data: {},
    ...(options || {}),
  });
}

/**
 * 删除交谈
 */
export async function deleteConversation(
  id?: string,
  options?: { [key: string]: any },
) {
  return request<API.Result_Common>(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
