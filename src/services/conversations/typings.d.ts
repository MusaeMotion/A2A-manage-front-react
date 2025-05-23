/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！

declare namespace API {
  interface ConversationInfo {
    id: string;
    name?: string;
    isActive?: boolean;
  }

  type PartialConversationInfo = Partial<ConversationInfo>;

  interface Result_Lits_ConversationInfo extends Result<ConversationInfo[]> {
    data?: ConversationInfo[];
  }

  interface Result_ConversationInfo extends Result<ConversationInfo> {
    data: ConversationInfo;
  }

  interface Result_Lits_ConversationMessageInfo
    extends Result<ConversationMessageInfo[]> {
    data: ConversationMessageInfo[];
  }
}
