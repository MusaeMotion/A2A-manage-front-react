import { request } from '@umijs/max';

const BASE_URL = `${process.env.UMI_APP_API_URL}/api/prompt`;

/**
 *
 * @param body
 * @returns
 */
export async function saveHostAgentSystemPrompt(body?: any) {
  return request<API.Result_Common>(BASE_URL + '/host-agent/system-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}

/**
 *
 * @returns
 */
export async function getHostAgentSystemPrompt() {
  return request<API.Result_Common>(BASE_URL + '/host-agent/system-prompt', {
    method: 'GET',
  });
}
