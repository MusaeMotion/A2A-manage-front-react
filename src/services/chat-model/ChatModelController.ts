import { request } from '@umijs/max';

const BASE_URL = `${process.env.UMI_APP_API_URL}/api/chat-model`;

/**
 * host-agent 基座模型的模式
 * @returns
 */
export async function getHostAgentChatModelMode() {
  return request<API.Result_Common>(BASE_URL + '/mode', {
    method: 'GET',
  });
}
/**
 * host-agent 基座模型的模式
 * @returns
 */
export async function setHostAgentChatModel(key: string) {
  return request<API.Result_Common>(BASE_URL + `/set-chat-model/${key}`, {
    method: 'PUT',
  });
}
