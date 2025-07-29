import ConfigForm from '@/components/ConfigForm';
import { Button, Form, Input, Modal } from 'antd';
import React, { useRef } from 'react';

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (data: any) => void;
  onTest: (data: any) => void;
}

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSave,
  onTest,
}) => {
  const [form] = Form.useForm();
  const formRef = useRef<any>(null);
  const handleSubmit = async () => {
    try {
      // 外层表单校验
      await form.validateFields();
      // 内层表单校验并取数据
      const mcpConfig = await formRef.current!.getFormData();
      const data = {
        name: form.getFieldValue('name'),
        displayName: form.getFieldValue('displayName'),
        description: form.getFieldValue('description'),
        mcpConfig,
      };
      onSave(data);
      form.resetFields();
    } catch (error) {
      console.error('保存失败，请检查输入：', error);
    }
  };
  const initialData = {
    connType: 'SSE',
    config: {
      clientType: 'SYNC', // 默认值
      url: '',
      sseEndpoint: '/sse',
    },
  };
  return (
    <Modal
      title="添加新记录"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          提交
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { required: true, message: '请输入名称' },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: '只能包含英文字母、数字、下划线或连字符',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="displayName"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入mcp能力' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
      <ConfigForm
        initialData={initialData}
        ref={formRef}
        readOnly={false}
        editState={true}
        onSave={(data) => {
          form.setFieldsValue({ mcpConfig: data });
        }}
        onTest={(data) => {
          onTest(data);
        }}
      />
    </Modal>
  );
};

export default CreateForm;
