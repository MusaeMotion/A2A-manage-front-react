import { request } from '@umijs/max';

const BASE_URL = `${process.env.UMI_APP_API_URL}/api/remote-agent`;

/**
 * 智能体分页
 * @param params
 * @param options
 * @returns
 */
export async function queryRemoteAgentList(
  params: {
    name?: string;
    description?: string;
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.Result_PageInfo_RemoteAgent>(
    BASE_URL + `/list/${params.current}/${params.pageSize}`,
    {
      method: 'POST',
      data: { name: params.name, description: params.description },
      ...(options || {}),
    },
  );
}

/**
 * 注册智能体
 * @param body
 * @param options
 * @returns
 */
export async function registerRemoteAgent(
  body?: any,
  options?: { [key: string]: any },
) {
  return request<API.Result_Common>(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/**
 * 删除智能体
 * @param params
 * @param options
 * @returns
 */
export async function deleteRemoteAgent(
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
/**
 * 切换智能体可用状态
 * @param params
 * @param options
 * @returns
 */
export async function changeRemoteAgentEnable(id: string) {
  return request<API.Result_Common>(BASE_URL + `/enable/${id}`, {
    method: 'PUT',
  });
}

/**
 * 重新刷新智能体，重新注册
 * @param id
 * @returns
 */
export async function reRegisterRemoteAgent(id: string) {
  return request<API.Result_Common>(BASE_URL + `/re-register/${id}`, {
    method: 'PUT',
  });
}

/**
 * 修改智能体
 * @param id
 * @returns
 */
export async function updateRemoteAgent(id: string, body: any) {
  return request<API.Result_Common>(BASE_URL + `/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}
