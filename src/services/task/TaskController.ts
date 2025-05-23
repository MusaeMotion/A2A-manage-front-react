import { request } from '@umijs/max';

const BASE_URL = '/api/task';

/**
 * 智能体分页
 * @param params
 * @param options
 * @returns
 */
export async function queryTaskList(
  params: {
    conversationId?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.Result<any>>(BASE_URL, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/**
 * 删除智能体
 * @param params
 * @param options
 * @returns
 */
export async function deleteTask(
  params: {
    id?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.Result_Common>(BASE_URL, {
    method: 'DELETE',
    params,
    ...(options || {}),
  });
}
