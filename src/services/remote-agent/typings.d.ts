/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！

declare namespace API {
  interface Result_PageInfo_RemoteAgent
    extends Result<PageInfo<PartialRemoteAgentInfo>> {
    data?: PageInfo<PartialRemoteAgentInfo>;
  }

  type MediaType = 'text' | 'text/plain' | 'image/png';

  interface RemoteAgentInfo {
    id: string;
    name?: string;
    description?: string;
    url?: string;
    version?: string;
    documentationUrl?: string;
    provider: ProviderInfo;
    capabilities: AgentCapabilitiesInfo;
    authentication: AgentAuthenticationInfo;
    defaultInputModes: MediaType[];
    defaultOutputModes: MediaType[];
    skills: AgentSkillInfo[];
  }

  type PartialRemoteAgentInfo = Partial<RemoteAgentInfo>;

  interface ProviderInfo {
    organization?: string;
    url?: string;
  }

  interface AgentCapabilitiesInfo {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  }

  interface AgentAuthenticationInfo {
    schemes?: string[];
    credentials?: string;
  }

  interface AgentSkillInfo {
    id?: string;
    name?: string;
    description?: string;
    tags?: string[];
    examples?: string[];
    inputModes: MediaType[];
    outputModes: MediaType[];
  }
}
