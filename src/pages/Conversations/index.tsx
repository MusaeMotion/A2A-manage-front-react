/* eslint-disable @typescript-eslint/no-unused-vars */
import TaskTableModal from '@/components/TaskTableModal';
import chat from '@/services/chat';
import conversations from '@/services/conversations';
import {
  AppstoreOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DiscordOutlined,
  EuroCircleFilled,
  LoadingOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  SmileOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  BubbleProps,
  Conversations,
  ConversationsProps,
  Prompts,
  Sender,
  useXAgent,
  useXChat,
  Welcome,
  XProvider,
  XStream,
} from '@ant-design/x';
import { MessageInfo } from '@ant-design/x/es/use-x-chat';
import { GPTVis } from '@antv/gpt-vis';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Collapse,
  Divider,
  Empty,
  Flex,
  GetProp,
  Image,
  message,
  Modal,
  Radio,
  Space,
  Typography,
  UploadProps,
} from 'antd';
import markdownit from 'markdown-it';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import RunningModal, { RunningModalRef } from './components/RunningModal';
const { Panel } = Collapse;

// 任务状态
const TaskState = {
  SUBMITTED: '已提交，运行中....',
  WORKING: '工作中',
  INPUT_REQUIRED: '请完善输入',
  COMPLETED: '完成，结果分析中',
  CANCELED: '取消',
  FAILED: '失败',
  UNKNOWN: '未知状态',
};

// messageId 的 map key
const MESSAGE_ID = 'message_id';
const CONVERSATION_ID = 'conversation_id';
const {
  queryConversationList,
  deleteConversation,
  createConversation,
  queryMessageList,
  deleteOtherByConversation,
} = conversations.ConversationController;
const { sendMessageCall, sendMessageStream, subscribeNotification } =
  chat.ChatController;
// @ts-ignore
const md = markdownit({ html: true, breaks: true });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renderMarkdown: BubbleProps['messageRender'] = (content: string) => (
  <Typography>
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
    <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  </Typography>
);
/**
 * 获取深度思考的内容
 * @param str
 * @returns
 */
function getThinkContent(str: string) {
  const regex = /<think>([\s\S]*?)<\/think>/g;
  let result = [];
  let match;
  while ((match = regex.exec(str)) !== null) {
    result.push(match[1]);
  }
  return result[0];
}
/**
 * 获取深度思考之后的内容
 * @param str
 * @returns
 */
function getAfterThinkContent(str: string) {
  const regex = /<\/think>([\s\S]*)/g;
  const match = regex.exec(str);
  return match ? match[1] : '';
}

// @antv/gpt-vis 的markdown 渲染
/**
 * markdown 内容组件渲染
 * @param content
 * @returns
 */
const RenderMarkdown: BubbleProps['messageRender'] = (content) => {
  if (content.indexOf('<think>') > -1)
    return (
      <Space direction="vertical">
        <Collapse size="small">
          <Panel header="推理过程" key="think">
            <GPTVis>{getThinkContent(content)}</GPTVis>
          </Panel>
        </Collapse>
        <GPTVis>{getAfterThinkContent(content)}</GPTVis>
      </Space>
    );
  return <GPTVis>{content}</GPTVis>;
};

/**
 * 文件渲染
 * @param content
 * @returns
 */
const RenderFile: BubbleProps['messageRender'] = (content: any) => {
  if (content.mimeType === null || content.mimeType.indexOf('image') > -1)
    return (
      <Image
        width={300}
        src={content.uri ? content.uri.replace(/"/g, '') : content.bytes}
      />
    );
  return <div>没有找到合适的处理消息的类型</div>;
};

// Bubble 消息定义，
const roles: GetProp<typeof Bubble.List, 'roles'> = {
  // 对应消息类型
  text: {
    avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
    // typing: { step: 5, interval: 20 },
    // 不同的消息不同消息渲染器
    messageRender: RenderMarkdown,
  },
  file: {
    avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
    // typing: { step: 5, interval: 20 },
    // 不同的消息不同消息渲染器
    messageRender: RenderFile,
  },
  // 对应下面的list里面的内容
  suggestion: {
    avatar: { icon: <UserOutlined />, style: { visibility: 'hidden' } },
    variant: 'borderless',
    messageRender: (content) => (
      <Prompts
        vertical
        items={(content as any as string[]).map((text) => ({
          key: text,
          icon: <SmileOutlined style={{ color: '#FAAD14' }} />,
          description: text,
        }))}
      />
    ),
  },
};

// 定义聊天消息类型
type ConversationMessage = API.ConversationMessageInfo;

/**
 * 消息转换content
 * @param message
 */
const partToContent = (part: API.Part) => {
  if (part.type === 'text') {
    return part.text === '"[]"'
      ? '请求已提交，等会回反馈结果给您。'
      : part.text;
  }
  if (part.type === 'file') {
    // uri不存在，则是本地存储的取name 然后根据本地地址获取
    return part.file;
  }
  if (part.type === 'data') {
    // data 类型一般有表单或者其他内容
    return part.data;
  }
  return '没有找到合适的处理类型';
};

/**
 * 上传文件相关
 */
type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
// 默认prompts内容
const defaultPrompts = [
  {
    key: 'message',
    icon: <MessageOutlined />,
    label: '时刻准备着为你服务',
  },
];
/**
 * 组件定义开始
 */
export default () => {
  const [curTasks, setCurTasks] = React.useState<API.TaskInfo[]>([]);
  const [conversations, setConversations] = React.useState<
    API.ConversationInfo[]
  >([]);
  const [conversationId, setConversationId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [inputText, setInputText] = React.useState<string>('');
  const [attachment, setAttachment] = React.useState<API.FileContent>();
  const [sendType, setSendType] = React.useState<'call' | 'stream'>('stream');
  const sendTypeRef = React.useRef(sendType);
  const taskTableModalRef = React.useRef<{ showModal: () => void }>(null);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [prompts, setPrompts] = React.useState(defaultPrompts);
  const [runningModalShow, setRunningModalShow] =
    React.useState<boolean>(false);
  const runningModalRef = React.useRef<RunningModalRef>(null);

  // 初始化对话列表
  React.useEffect(() => {
    const loadConversations = async () => {
      try {
        const { data: conversationsData } = await queryConversationList();
        if (conversationsData) {
          setConversations(conversationsData);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    loadConversations();
  }, []);
  // sendType 的 ref
  React.useEffect(() => {
    sendTypeRef.current = sendType;
  }, [sendType]);

  // 创建新的对话
  const handleCreateConversation = async () => {
    setLoading(true);
    try {
      const response = await createConversation();
      if (response.code === 0) {
        const { data: newConversation } = response;
        setConversations([...conversations, newConversation]);
        setConversationId(newConversation.id);
        return;
      }
      message.error(response.msg);
    } catch (error) {
      message.error('创建对话失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式话对话列表to控件格式
  const handleConversationItems = (conversations: API.ConversationInfo[]) => {
    if (conversations.length > 0) {
      return conversations.map((conversation) => ({
        key: conversation.id,
        label: conversation.name || `${conversation.id}`,
      }));
    }
  };
  /**
   * 显示任务运行结果
   */
  const showTaskModal = () => {
    taskTableModalRef.current?.showModal();
  };
  /**
   * 设置通知
   * @param icon
   * @param label
   */
  const setPromptContent = (
    promptName: string,
    icon: JSX.Element,
    label: string,
  ) => {
    const retPrompt = prompts.find((item) => item.key === promptName);
    if (retPrompt) {
      retPrompt.icon = icon;
      retPrompt.label = label;
      setPrompts([retPrompt]);
    }
  };

  /**
   * 设置通知
   * @param promptName
   * @param icon
   * @param label
   */
  const setNotification = (icon: JSX.Element, label: string) => {
    setPromptContent('message', icon, label);
  };

  /**
   * prompt 点击
   * @param info
   */
  const hanldePromptClick = (info: { data: any }) => {
    const { key } = info.data;
    if (key === 'message') {
      setRunningModalShow(true);
    }
  };
  /**
   * 构建消息footer
   * @param task
   */
  const buidlMessageFooter = (task: API.TaskInfo[] | undefined) => {
    if (task === undefined || task.length === 0) {
      return null;
    }
    return (
      <Space>
        <Button
          type="link"
          icon={<AppstoreOutlined />}
          onClick={() => {
            setCurTasks(task);
            showTaskModal();
          }}
        >
          任务详情
        </Button>
      </Space>
    );
  };

  /**
   * sse消息处理
   * @param message
   */
  const handleSseMessages = async (message: ConversationMessage) => {
    const { metadata } = message;
    if (metadata) {
      const messageId = metadata[MESSAGE_ID];
      const conversationId = metadata[CONVERSATION_ID];

      let curItem: any = null;

      try {
        const subStream = await subscribeNotification(
          conversationId,
          messageId,
        );

        let runningContent = '';
        for await (const chunk of XStream({
          readableStream: subStream,
        })) {
          if (chunk.data !== 'ping') {
            const eventArray = chunk.event.split('_');
            const eventName = eventArray[0];
            const agnetName = eventArray[1];

            if (eventName === 'NOTIFICATION') {
              const { status, metadata } = JSON.parse(chunk.data);
              const curState = status.state.toUpperCase() as string;
              const stateText = TaskState[curState as keyof typeof TaskState];

              if (curState === 'SUBMITTED') {
                curItem = {
                  key: `${agnetName}-${Date.now()}`,
                  title: agnetName,
                  description: agnetName,
                  content: <GPTVis>{runningContent}</GPTVis>,
                  status: 'pending',
                };
                runningModalRef.current?.addItem(curItem);
              }
              if (curState === 'COMPLETED') {
                runningModalRef.current?.updateItemStatus(
                  curItem.key as string,
                  'success',
                );
                curItem = null;
                runningContent = '';
              }
              setNotification(
                <LoadingOutlined />,
                `智能体：${metadata.agentName} 状态：${stateText}`,
              );
              continue;
            }
            if (eventName === 'RUNNING' && curItem) {
              runningContent += JSON.parse(chunk.data).text;
              runningModalRef.current?.updateItemContent(
                curItem.key as string,
                runningContent,
              );
              continue;
            }
          }
          // console.log(chunk);
        }
        // 处理 subStream，例如订阅通知
      } catch (error) {
        setNotification(<EuroCircleFilled />, `智能体出错了`);
        runningModalRef.current?.updateItemStatus(
          curItem.key as string,
          'error',
        );
      }
    }
  };
  // useXAgent 请求发送消息
  // 发送请求时候的消息格式
  // 流程： 请求响应之后-> 响应消息-> 转换到自己的消息格式(AgentMessage)-> ParsedMessage 消息格式（交给Bubble控件渲染），->Bubble控件根据 不同的角色可以定义不同渲染方式
  const [agent] = useXAgent<
    ConversationMessage,
    { message: ConversationMessage },
    Record<string, any>
  >({
    request: async (requestMessage, { onSuccess, onError, onUpdate }) => {
      setNotification(<LoadingOutlined />, `智能体工作中(点击查看)...`);
      runningModalRef.current?.setItemClear();
      handleSseMessages(requestMessage.message).catch((error) =>
        console.error('通知处理失败:', error),
      );
      try {
        setIsRequesting(true);
        if (sendTypeRef.current === 'stream') {
          // 流请求
          const responseStream = await sendMessageStream({
            params: requestMessage.message,
          });

          let text = '';
          for await (const chunk of XStream({
            readableStream: responseStream,
          })) {
            const responseData = JSON.parse(chunk.data);
            const { metadata, parts, task } = responseData.result;

            // eslint-disable-next-line @typescript-eslint/no-loop-func
            parts.forEach((part: any) => {
              const curMsg: ConversationMessage = {
                role: 'agent',
                parts: [],
                metadata: metadata,
                typing: false,
                task: task,
              };
              if (part.type === 'text') {
                text += part.text;
                const tempPart = {
                  type: 'text' as API.PartType,
                  metadata: {},
                  text: text,
                };
                curMsg.parts.push(tempPart);
              }
              onUpdate(curMsg);
            });
          }
          setIsRequesting(false); // 流结束时设置为 false
          setNotification(<CheckOutlined />, `智能体工作完成。(点击查看)`);
        }
        if (sendTypeRef.current === 'call') {
          // call请求
          const response = await sendMessageCall({
            params: requestMessage.message,
          });
          setIsRequesting(false); // 请求结束时设置为 false
          if (response.code === 0) {
            const { data: newMessage } = response;
            onSuccess([{ ...newMessage.result, typing: true }]);
            setNotification(<CheckOutlined />, `智能体工作完成。(点击查看)`);
            return;
          }
          message.error(response.msg);
        }
      } catch (error) {
        setIsRequesting(false);
        onError(new Error('请求发送失败'));
      }
    },
  });
  // useXChat 数据管理
  const { onRequest, parsedMessages, messages, setMessages } = useXChat({
    agent,
    defaultMessages: [
      {
        id: 'init',
        message: {
          role: 'agent',
          parts: [{ type: 'text', text: '你好，有什么可以帮助你的？' }],
        },
        status: 'success',
      },
    ],
    // 利用默认消息 status 触发消息加载效果
    requestPlaceholder: {
      role: 'agent',
      parts: [{ type: 'text', text: 'AI消息处理中' }],
      status: 'loading',
    },
    // 兜底回调，出现错误时调用
    requestFallback: {
      role: 'agent',
      parts: [{ type: 'text', text: '请求失败，请重试...' }],
      status: 'error',
    },
    // 转换 AgentMessage to ParsedMessage
    parser: (agentMessage) => {
      if (agentMessage.parts && agentMessage.parts?.length > 0) {
        const list = agentMessage.parts;
        const placement: BubbleProps['placement'] =
          agentMessage.role === 'agent' ? 'start' : 'end';
        return (list || []).map((part) => ({
          // 角色是具体角色和消息类型，控制不同消息不同的渲染做预留，如果没有消息元数据，则没有消息id, 随机生成一个
          id: agentMessage.metadata
            ? agentMessage.metadata[MESSAGE_ID]
            : uuidv4(),
          role: part.type,
          avatar:
            agentMessage.role === 'agent'
              ? { icon: <DiscordOutlined />, style: { background: '#fde3cf' } }
              : { icon: <UserOutlined />, style: { background: '#87d068' } },
          placement,
          style:
            agentMessage.role === 'agent'
              ? {
                  maxWidth: 1200,
                }
              : {},
          typing: agentMessage.typing ? { step: 5, interval: 20 } : undefined,
          content: partToContent(part),
          footer: buidlMessageFooter(agentMessage.task),
          status: agentMessage.status,
        }));
      }
      console.log('出现不符合规范的消息格式.');
      return [];
    },
  });

  /**
   * 清理输入消息
   */
  const handelInputClear = () => {
    setInputText('');
    setAttachment(undefined);
  };

  /**
   * 发送消息
   * @param content
   */
  const handleSendMessage = async (content: string) => {
    const parts: API.Part[] = [];
    const textPart = { type: 'text' as API.PartType, text: content };
    parts.push(textPart);
    if (attachment) {
      const filePart = { type: 'file' as API.PartType, file: attachment };
      parts.push(filePart);
    }
    const conversationMessage: ConversationMessage = {
      role: 'user',
      parts,
      metadata: {
        [MESSAGE_ID]: uuidv4(),
        [CONVERSATION_ID]: conversationId,
      },
    };
    onRequest(conversationMessage);
    handelInputClear();
  };

  /**
   * 切换对话时，加载对应对话的历史消息
   * @param _conversationId
   */
  const handleConversation = async (_conversationId: string) => {
    if (_conversationId) {
      setConversationId(_conversationId);
      try {
        const { data: historyMessages } = await queryMessageList(
          _conversationId,
        );
        if (historyMessages.length === 0) {
          setMessages([]);
        } else {
          const messages: MessageInfo<ConversationMessage>[] =
            historyMessages.map((msg) => {
              return {
                id: msg.metadata ? msg.metadata[MESSAGE_ID] : uuidv4(),
                message: msg,
                status: 'success',
              };
            });
          // 'local' | 'loading' | 'success' | 'error'
          setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  };

  // 对话列表控件菜单扩展
  const menuConfig: ConversationsProps['menu'] = (conversation: any) => ({
    items: [
      {
        label: '相关任务',
        key: 'showTask',
        icon: <SearchOutlined />,
      },
      {
        label: '删除记录',
        key: 'delete_other',
        icon: <DeleteOutlined />,
        danger: true,
      },
      {
        label: '删除交谈',
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    onClick: async (menuInfo) => {
      menuInfo.domEvent.stopPropagation(); // 阻止事件冒泡
      if (menuInfo.key === 'delete') {
        Modal.confirm({
          title: '确认删除',
          content: '确定要删除此交谈吗？',
          onOk: async () => {
            setLoading(true);
            menuInfo.domEvent.stopPropagation(); // 阻止事件冒泡
            try {
              const response = await deleteConversation(conversation.key);
              if (response.code === 0) {
                setConversations(
                  conversations.filter((item) => item.id !== conversation.key),
                );
                if (conversation.key === conversationId) {
                  setConversationId('');
                  setMessages([]);
                }
                return;
              }
              message.error(response.msg);
            } catch (error) {
              message.error('删除失败');
            } finally {
              setLoading(false);
            }
          },
        });
      }
      if (menuInfo.key === 'delete_other') {
        Modal.confirm({
          title: '确认删除',
          content: '确定要删除此记录吗？',
          onOk: async () => {
            setLoading(true);
            try {
              const response = await deleteOtherByConversation(
                conversation.key,
              );
              if (response.code === 0) {
                setMessages([]);
                message.success('删除成功');
              } else {
                message.error(response.msg);
              }
            } catch (error) {
              message.error('删除失败');
            } finally {
              setLoading(false);
            }
          },
        });
      }
      if (menuInfo.key === 'showTask') {
        const search = { conversationId: conversation.key };
        history.push('/task', search);
      }
    },
  });

  // 输入控件定义
  const headerNode = (
    <Sender.Header
      title={
        <Space>
          <SettingOutlined />
          <Typography.Text type="secondary">选择请求方式：</Typography.Text>
          <Radio.Group
            value={sendType}
            options={[
              { value: 'call', label: '同步' },
              { value: 'stream', label: '流式' },
            ]}
            onChange={(e) => setSendType(e.target.value)}
          />
        </Space>
      }
    ></Sender.Header>
  );

  return (
    <>
      <Card>
        <XProvider direction="ltr">
          <Flex style={{ height: '90vh' }} gap={12}>
            {conversations.length === 0 ? (
              <Empty
                description="还没有任何对话"
                style={{ width: 200 }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  loading={loading}
                  onClick={handleCreateConversation}
                >
                  创建一个新的会话
                </Button>
              </Empty>
            ) : (
              <>
                <Conversations
                  style={{
                    maxWidth: '250px', // 设置最大宽度
                    overflow: 'hidden', // 隐藏超出部分
                    textOverflow: 'ellipsis', // 显示省略号
                  }}
                  activeKey={conversationId}
                  items={handleConversationItems(conversations)}
                  menu={menuConfig}
                  onActiveChange={handleConversation}
                />
              </>
            )}
            <Divider type="vertical" style={{ height: '100%' }} />
            {conversationId ? (
              <Flex vertical style={{ flex: 1 }} gap={8}>
                <Bubble.List
                  roles={roles}
                  style={{ flex: 1 }}
                  items={parsedMessages.map(({ id, message }) => ({
                    key: id,
                    loading: message.status === 'loading',
                    ...message,
                  }))}
                />
                <Prompts items={prompts} onItemClick={hanldePromptClick} />
                <Sender
                  value={inputText}
                  onChange={setInputText}
                  onSubmit={handleSendMessage}
                  loading={isRequesting}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  placeholder="回车键发送消息"
                  header={headerNode}
                  allowSpeech
                  footer={({ components }) => {
                    const {
                      SendButton,
                      LoadingButton,
                      SpeechButton,
                      ClearButton,
                    } = components;
                    return (
                      <Flex justify="space-between" align="center">
                        <Flex gap="small" align="center">
                          <Button
                            icon={<PlusOutlined />}
                            type="link"
                            onClick={handleCreateConversation}
                          >
                            创建新的对话
                          </Button>
                        </Flex>
                        <Flex align="center">
                          <ClearButton onClick={handelInputClear} />
                          <Attachments
                            beforeUpload={() => false}
                            onChange={async ({
                              file,
                              fileList: newFileList,
                            }) => {
                              const baseStr = await getBase64(file as FileType);
                              setAttachment({
                                name: file.name,
                                mimeType: file.type,
                                bytes: baseStr,
                              });
                            }}
                            placeholder={{
                              icon: <CloudUploadOutlined />,
                              title: 'Drag & Drop files here',
                              description:
                                'Support file type: image, video, audio, document, etc.',
                            }}
                          >
                            <Button type="link" icon={<UploadOutlined />} />
                          </Attachments>
                          {attachment ? (
                            <Button
                              icon={<DeleteOutlined />}
                              danger
                              type="link"
                              onClick={() => setAttachment(undefined)}
                            >
                              删除附件
                            </Button>
                          ) : (
                            <></>
                          )}
                          <Divider type="vertical" />
                          <SpeechButton />
                          <Divider type="vertical" />
                          {isRequesting ? (
                            <LoadingButton type="default" />
                          ) : (
                            <SendButton type="primary" disabled={false} />
                          )}
                        </Flex>
                      </Flex>
                    );
                  }}
                  onCancel={() => {
                    setLoading(false);
                  }}
                  actions={false}
                />
              </Flex>
            ) : (
              <Flex vertical style={{ flex: 1 }} gap={8}>
                <Welcome
                  icon="https://oss.musaemotion.com/logo500.png"
                  title="位元灵感A2A-请选择左边的历史对话，或者创建一个新的对话"
                  description={
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={handleCreateConversation}
                    >
                      创建新的对话
                    </Button>
                  }
                />
              </Flex>
            )}
          </Flex>
        </XProvider>
      </Card>
      <RunningModal
        ref={runningModalRef}
        modalVisible={runningModalShow}
        onCancel={() => setRunningModalShow(false)}
      ></RunningModal>
      <TaskTableModal ref={taskTableModalRef} tasks={curTasks}></TaskTableModal>
    </>
  );
};
