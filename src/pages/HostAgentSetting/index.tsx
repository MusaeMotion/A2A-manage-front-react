import chatModelservices from '@/services/chat-model';
import promptServices from '@/services/prompt';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Descriptions, Form, Input, message, Select, Tabs } from 'antd';
import React, { useState } from 'react';
const { TextArea } = Input;
const { getHostAgentSystemPrompt, saveHostAgentSystemPrompt } =
  promptServices.PromptController;
const { getHostAgentChatModelMode, setHostAgentChatModel } =
  chatModelservices.ChatModelController;

const TableList: React.FC<unknown> = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [chatModelMode, setChatModelMode] = useState<{
    providerMode: string;
    provider: boolean;
    chatModelConfigs: any[];
    defaultChatModelKey: string;
  }>();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSystemPrompt = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value);
  };

  /**
   * 修改基座模型
   * @param value
   */
  const handleChangeChatModel = async (value: string) => {
    try {
      await setHostAgentChatModel(value);
      if (chatModelMode) {
        setChatModelMode({ ...chatModelMode, defaultChatModelKey: value });
      }
      message.success('修改成功');
    } catch (error) {
      message.error('修改失败');
    } finally {
      setLoading(false);
    }
  };
  // 初始化对话列表
  React.useEffect(() => {
    const initData = async () => {
      try {
        const response = await getHostAgentSystemPrompt();
        setSystemPrompt(response as string);
      } catch (error) {
        message.error('getHostAgentSystemPrompt' + error);
      }
      try {
        const response = await getHostAgentChatModelMode();
        setChatModelMode(
          response as {
            providerMode: string;
            provider: boolean;
            chatModelConfigs: any[];
            defaultChatModelKey: string;
          },
        );
      } catch (error) {
        message.error('getHostAgentChatModelMode' + error);
      }
    };
    initData();
  }, []);
  /**
   * 保存
   * @returns
   */
  const onClick = async () => {
    setLoading(true);
    setSystemPrompt(systemPrompt);
    try {
      await saveHostAgentSystemPrompt(systemPrompt);
      message.success('保存成功');
    } catch {
      message.error('出现错误');
    }
    setLoading(false);
  };

  return (
    <PageContainer
      header={{
        title: 'HostAgent配置',
      }}
    >
      <Tabs
        defaultActiveKey="prompt"
        items={[
          {
            label: '提示词设置',
            key: 'prompt',
            children: (
              <Form labelCol={{ span: 2 }} layout="horizontal">
                <Form.Item label="系统提示词">
                  <TextArea
                    rows={50}
                    value={systemPrompt}
                    onChange={handleSystemPrompt}
                  />
                </Form.Item>
                <Form.Item label="操作">
                  <Button loading={loading} type="primary" onClick={onClick}>
                    保存
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            label: '基座模型设置',
            key: 'chatModel',
            children: (
              <Descriptions title="基座配置" bordered column={1}>
                <Descriptions.Item label="chatModelProvider模式">
                  {chatModelMode?.providerMode ? '是' : '否'}
                </Descriptions.Item>
                <Descriptions.Item label="chatModelProvider类">
                  {chatModelMode?.provider}
                </Descriptions.Item>
                {chatModelMode?.providerMode ? (
                  <Descriptions.Item label="基座模型更换">
                    <Select
                      style={{ width: 200 }}
                      onChange={handleChangeChatModel}
                      value={chatModelMode.defaultChatModelKey}
                      fieldNames={{ label: 'name', value: 'name' }}
                      placeholder="选择模型"
                      options={chatModelMode?.chatModelConfigs}
                    />
                  </Descriptions.Item>
                ) : (
                  <Descriptions.Item label="基座模型更换">
                    不支持
                  </Descriptions.Item>
                )}
              </Descriptions>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default TableList;
