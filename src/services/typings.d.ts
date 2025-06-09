/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！

declare namespace API {
  // 分页返回
  interface PageInfo<T> {
    current?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
    list?: Array<T>;
  }

  // 返回
  interface Result<D> {
    code?: number;
    msg?: string;
    data?: D;
  }

  // 通用返回
  interface Result_Common extends Result<string> {
    data?: string;
  }

  // 交谈消息角色类型
  type ConversationMessageRole = 'agent' | 'user';

  // 交谈消息部分类型
  type PartType = 'text' | 'image' | 'audio' | 'video' | 'data' | 'file';

  // 交谈消息部分
  interface Part {
    type: PartType;
    text?: string;
    file?: FileContent;
    data?: Record<string, any>;
    metadata?: Record<string, any>;
  }
  // 交谈消息部分
  interface FileContent extends ContentType {
    name?: string;
    uri?: string;
    bytes?: string;
    mimeType?: string;
  }
  // 交谈消息窄体格式
  interface ConversationMessageInfo {
    role: ConversationMessageRole;
    parts: Part[];
    metadata?: Record<string, any>;
    typing?: boolean;
    task?: TaskInfo[];
    // 状态
    status?: string;
  }
  /**
   * 生成的工件
   */
  interface Artifact {
    name?: string;
    description?: string;
    parts: Part[];
    metadata?: Record<string, any>;
    index?: number;
    append?: boolean;
    lastChunk?: boolean;
  }
}
