/* eslint-disable @typescript-eslint/no-unused-vars */
import TaskTableModal from '@/components/TaskTableModal';
import chat from '@/services/chat';
import conversations from '@/services/conversations';
import {
  AppstoreOutlined,
  BulbOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DiscordOutlined,
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
  Radio,
  Space,
  Typography,
  UploadProps,
} from 'antd';
import markdownit from 'markdown-it';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
const { Panel } = Collapse;
// messageId 的 map key
const MESSAGE_ID = 'message_id';
const CONVERSATION_ID = 'conversation_id';
const {
  queryConversationList,
  deleteConversation,
  createConversation,
  queryMessageList,
} = conversations.ConversationController;
const { sendMessageCall, sendMessageStream } = chat.ChatController;
// @ts-ignore
const md = markdownit({ html: true, breaks: true });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renderMarkdown: BubbleProps['messageRender'] = (content: string) => (
  <Typography>
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
    <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  </Typography>
);

function getThinkContent(str: string) {
  const regex = /<think>([\s\S]*?)<\/think>/g;
  let result = [];
  let match;
  while ((match = regex.exec(str)) !== null) {
    result.push(match[1]);
  }
  return result[0];
}
function getAfterThinkContent(str: string) {
  const regex = /<\/think>([\s\S]*)/g;
  const match = regex.exec(str);
  return match ? match[1] : '';
}

// @antv/gpt-vis 的markdown 渲染
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

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// TODO 可以使用 15912135-2401-4caf-a530-dc2cb7f3f63b 查看任务
export default () => {
  const [curTasks, setCurTasks] = React.useState<API.TaskInfo[]>([]);
  const [conversations, setConversations] = React.useState<
    API.ConversationInfo[]
  >([]);
  const [conversationId, setConversationId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [inputText, setInputText] = React.useState<string>('');
  const [attachment, setAttachment] = React.useState<API.FileContent>();
  const [sendType, setSendType] = React.useState<'call' | 'stream'>('call');
  const sendTypeRef = React.useRef(sendType);
  const taskTableModalRef = React.useRef<{ showModal: () => void }>(null);
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
        label: conversation.name || `对话ID - ${conversation.id}`,
      }));
    }
  };
  const showTaskModal = () => {
    taskTableModalRef.current?.showModal();
  };
  /**
   * 构建消息footer
   * @param task
   */
  const buidlMessageFooter = (task: API.TaskInfo[] | undefined) => {
    if (!task) {
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

  // useXAgent 请求发送消息
  // 发送请求时候的消息格式
  const [agent] = useXAgent<
    ConversationMessage,
    { message: ConversationMessage },
    Record<string, any>
  >({
    request: async (requestMessage, { onSuccess, onError, onUpdate }) => {
      try {
        console.log('requestMessage', sendTypeRef.current);
        // onUpdate 更新当前消息使用，用于流式消息
        if (sendTypeRef.current === 'stream') {
          // 流请求
          const responseStream = await sendMessageStream({
            params: requestMessage.message,
          });
          for await (const chunk of XStream({
            readableStream:
              responseStream.body === null
                ? new ReadableStream()
                : responseStream.body,
          })) {
            const response = JSON.parse(chunk.data);
            onSuccess([{ ...response.result, typing: true }]);
          }
        }
        if (sendTypeRef.current === 'call') {
          // call请求
          const response = await sendMessageCall({
            params: requestMessage.message,
          });
          if (response.code === 0) {
            const { data: newMessage } = response;
            onSuccess([{ ...newMessage.result, typing: true }]);
            return;
          }
          message.error(response.msg);
        }
      } catch (error) {
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
    requestPlaceholder: {
      role: 'agent',
      parts: [{ type: 'text', text: '等待AI处理中？' }],
    },
    // 兜底回调，出现错误时调用
    requestFallback: {
      role: 'agent',
      parts: [{ type: 'text', text: '请求失败，请重试...' }],
    },
    // 转换 ChatMessage 消息 BubbleMessage
    parser: (chatMessage) => {
      if (chatMessage.parts && chatMessage.parts?.length > 0) {
        const list = chatMessage.parts;
        const placement: BubbleProps['placement'] =
          chatMessage.role === 'agent' ? 'start' : 'end';
        return (list || []).map((part) => ({
          // 角色是具体角色和消息类型，控制不同消息不同的渲染做预留，如果没有消息元数据，则没有消息id, 随机生成一个
          id: chatMessage.metadata
            ? chatMessage.metadata[MESSAGE_ID]
            : uuidv4(),
          role: part.type,
          avatar:
            chatMessage.role === 'agent'
              ? { icon: <DiscordOutlined />, style: { background: '#fde3cf' } }
              : { icon: <UserOutlined />, style: { background: '#87d068' } },
          placement,
          style:
            chatMessage.role === 'agent'
              ? {
                  maxWidth: 1200,
                }
              : {},
          typing: chatMessage.typing ? { step: 5, interval: 20 } : undefined,
          content: partToContent(part),
          footer: buidlMessageFooter(chatMessage.task),
        }));
      }
      console.log('出现不符合规范的消息格式.');
      return [];
    },
  });

  const handelClear = () => {
    setInputText('');
    setAttachment(undefined);
  };
  // Sender 控件发送数据处理
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
    handelClear();
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
        label: '删除',
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    onClick: async (menuInfo) => {
      if (menuInfo.key === 'delete') {
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
            }
            return;
          }
          message.error(response.msg);
        } catch (error) {
          message.error('创建对话失败');
        } finally {
          setLoading(false);
        }
      }
      if (menuInfo.key === 'showTask') {
        const search = { conversationId: conversation.key };
        history.push('/task', search);
      }
    },
  });

  // 输入控件头
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
                  style={{ width: 380 }}
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
                  items={parsedMessages.map(({ id, message, status }) => ({
                    key: id,
                    loading: status === 'loading',
                    ...message,
                  }))}
                />
                <Prompts
                  items={[
                    {
                      key: '1',
                      icon: <BulbOutlined style={{ color: '#FFD700' }} />,
                      label:
                        '请先分析一下这张图片的内容，然后生成一张新的图片。',
                    },
                  ]}
                />
                <Sender
                  value={inputText}
                  onChange={setInputText}
                  onSubmit={handleSendMessage}
                  loading={agent.isRequesting()}
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
                          <ClearButton onClick={handelClear} />
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
                          {loading ? (
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

      <TaskTableModal ref={taskTableModalRef} tasks={curTasks}></TaskTableModal>
    </>
  );
};
