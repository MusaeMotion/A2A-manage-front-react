import { request } from '@umijs/max';

const BASE_URL = `${process.env.UMI_APP_MCP_URL}/api/mcp-server`;
console.log('BASE_URL', process.env);
/**
 * 智能体分页
 * @param params
 * @param options
 * @returns
 */
export async function queryMcpServerList(
  params: {
    name?: string;
    connType?: string;
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.Result_PageInfo_RemoteAgent>(
    BASE_URL + `/${params.current}/${params.pageSize}`,
    {
      method: 'POST',
      data: { name: params.name, connType: params.connType },
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
export async function addMcpServer(
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
export async function deleteMcpServer(
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
export async function changeMcpServerEnable(id: string) {
  return request<API.Result_Common>(BASE_URL + `/enable/${id}`, {
    method: 'PUT',
  });
}

/**
 * 修改智能体
 * @param id
 * @returns
 */
export async function updateMcpServer(body: any) {
  return request<API.Result_Common>(BASE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}

/**
 * 测试mcp server
 * @param body
 * @returns
 */
export async function testMcpServer(body: any) {
  return request<API.Result_Common>(BASE_URL + `/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}
