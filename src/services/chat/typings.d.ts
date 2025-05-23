/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！

declare namespace API {
  interface SendMessageResponse {
    // 交谈id
    id?: string;
    // 返回消息
    result: ConversationMessageInfo;
    // 错误
    error?: string;
  }

  interface SendMessageRequest {
    params: ConversationMessageInfo;
  }

  interface Result_SendMessageResponse extends Result<SendMessageResponse> {
    data: SendMessageResponse;
  }
}
