import services from '@/services/prompt';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Form, Input, message } from 'antd';
import React, { useState } from 'react';
const { TextArea } = Input;
const { getHostAgentSystemPrompt, saveHostAgentSystemPrompt } =
  services.PromptController;

const TableList: React.FC<unknown> = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Change:', e.target.value);
    setSystemPrompt(e.target.value);
  };
  // 初始化对话列表
  React.useEffect(() => {
    const initData = async () => {
      try {
        const response = await getHostAgentSystemPrompt();
        setSystemPrompt(response as string);
      } catch (error) {
        console.error('Failed to load conversations:', error);
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
        title: '智能体注册中心',
      }}
    >
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
      >
        <Form.Item label="系统提示词">
          <TextArea rows={50} value={systemPrompt} onChange={onChange} />
        </Form.Item>
        <Form.Item label="操作">
          <Button loading={loading} type="primary" onClick={onClick}>
            保存
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
};

export default TableList;
