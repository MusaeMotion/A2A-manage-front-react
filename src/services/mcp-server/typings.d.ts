/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！

declare namespace API {
  interface Result_PageInfo_McpServer
    extends Result<PageInfo<PartialMcpServerInfo>> {
    data?: PageInfo<PartialMcpServerInfo>;
  }

  type MediaType = 'text' | 'text/plain' | 'image/png';

  interface McpServerInfo {
    id: string;
    name?: string;
    description: string;
    displayName: string;
    mcpConfig: any;
  }

  type PartialMcpServerInfo = Partial<McpServerInfo>;
}
