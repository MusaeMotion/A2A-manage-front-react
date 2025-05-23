/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！

declare namespace API {
  interface Result_PageInfo_TaskInfo extends Result<PageInfo<TaskInfo>> {
    data?: PageInfo<TaskInfo>;
  }

  type TaskState =
    | 'submitted'
    | 'working'
    | 'input-required'
    | 'completed'
    | 'canceled'
    | 'failed'
    | 'unknown';

  interface TaskStatus {
    state?: TaskState;
    message?: ConversationMessageInfo;
  }
  interface TaskInfo {
    id: string;
    sessionId?: string;
    status?: TaskStatus;
    artifacts?: Artifact[];
    history?: ConversationMessageInfo[];
    metadata: Record<string, any>;
  }
}
