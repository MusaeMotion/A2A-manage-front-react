import {
  CloseOutlined,
  EditOutlined,
  LinkOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, message, Select, Space } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import styles from './ConfigForm.module.css';

// 定义连接类型
type McpConnType = 'STDIO' | 'SSE';

// 定义配置标记接口
interface ConfigMarker {
  clientType: 'SYNC' | 'ASYNC';
}

// 定义 STDIO 配置
interface StdioConfig extends ConfigMarker {
  command: string;
  args: string[];
  env: { [key: string]: string };
}

// 定义 SSE 配置
interface SseConfig extends ConfigMarker {
  url: string;
  sseEndpoint: string;
}

// 定义 MCP 配置
interface McpConfig {
  connType: McpConnType;
  config: StdioConfig | SseConfig;
}

// 定义表单属性
interface ConfigFormProps {
  initialData?: McpConfig;
  readOnly?: boolean;
  editState?: boolean;
  onSave: (data: McpConfig) => void;
  onTest: (data: McpConfig) => void;
}

const ConfigForm = forwardRef<unknown, ConfigFormProps>(
  (
    { initialData, readOnly = false, editState = true, onSave, onTest },
    ref,
  ) => {
    const [form] = Form.useForm();
    const [args, setArgs] = useState<string[]>([]);
    const [env, setEnv] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(!readOnly);
    const [connType, setConnType] = useState<McpConnType>('SSE');

    useEffect(() => {
      if (initialData) {
        form.setFieldsValue({
          connType: initialData.connType,
          command: (initialData.config as StdioConfig).command,
          env: (initialData.config as StdioConfig).env,
          url: (initialData.config as SseConfig).url,
          sseEndpoint: (initialData.config as SseConfig).sseEndpoint,
        });
        setArgs((initialData.config as StdioConfig).args || []);
        setEnv((initialData.config as StdioConfig).env || {});
        setConnType(initialData.connType);
      } else {
        // 默认初始化为 SSE 配置
        // 默认初始化为 SSE 配置
        form.setFieldsValue({
          connType: 'SSE',
          url: '',
          sseEndpoint: '/sse',
        });
        setConnType('SSE'); //
      }
    }, [initialData, form]);

    // 新增方法，用于获取表单数据
    const getFormData = async () => {
      // 1. 先校验，有错就抛
      await form.validateFields();
      // 2. 校验通过再取值
      const values = form.getFieldsValue();
      const stdioConfig = {
        command: values.command,
        args,
        env,
      };
      const sseConfig = {
        url: values.url,
        sseEndpoint: values.sseEndpoint,
      };
      const tempConfig =
        connType === 'SSE' ? { ...sseConfig } : { ...stdioConfig };
      return {
        connType,
        config: { clientType: 'SYNC', ...tempConfig },
      } as McpConfig;
    };

    /**
     * 模态框确认按钮
     */
    const handleSubmit = () => {
      form
        .validateFields()
        .then(async () => {
          const data = await getFormData();
          onSave(data);
          setIsEditing(false); // 切换回只读模式
        })
        .catch((error: any) => {
          message.error('保存失败，请检查输入：' + error);
        });
    };

    const handleAddArg = () => {
      setArgs([...args, '']);
    };

    const handleRemoveArg = (index: number) => {
      setArgs(args.filter((_, i) => i !== index));
    };

    const handleArgChange = (index: number, value: string) => {
      setArgs(args.map((arg, i) => (i === index ? value : arg)));
    };

    const handleAddEnv = () => {
      setEnv({ ...env, [`newKey${Object.keys(env).length}`]: '' });
    };

    const handleRemoveEnv = (key: string) => {
      const newEnv = { ...env };
      delete newEnv[key];
      setEnv(newEnv);
    };

    const handleEnvChange = (key: string, value: string) => {
      setEnv({ ...env, [key]: value });
    };

    const handleEditToggle = () => {
      setIsEditing(!isEditing);
    };

    const handleCancel = () => {
      setIsEditing(!isEditing);
    };

    const handleTest = () => {
      form
        .validateFields()
        .then(async () => {
          const data = await getFormData();
          onTest(data);
          setIsEditing(false); // 切换回只读模式
        })
        .catch((error: any) => {
          message.error('保存失败，请检查输入：' + error);
        });
    };

    // 把 getFormData 暴露出去
    useImperativeHandle(ref, () => ({ getFormData }));

    return (
      <Form form={form} layout="vertical">
        {editState && (
          <Form.Item
            name="connType"
            label="连接类型"
            rules={[{ required: true, message: '请选择连接类型' }]}
          >
            <Select
              disabled={!isEditing && editState}
              value={connType}
              options={[
                { label: 'STDIO', value: 'STDIO' },
                { label: 'SSE', value: 'SSE' },
              ]}
              onChange={(value) => {
                setConnType(value); // 更新 connType 状态
                form.setFieldsValue({ connType: value }); // 更新表单字段
              }}
            />
          </Form.Item>
        )}

        {form.getFieldValue('connType') === 'STDIO' && (
          <>
            <Form.Item
              name="command"
              label="命令"
              rules={[{ required: true, message: '请输入命令' }]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
            <Form.Item label="参数">
              {args.map((arg, index) => (
                <Space.Compact block key={index} className={styles.argItem}>
                  <Input
                    placeholder="参数"
                    value={arg}
                    disabled={!isEditing}
                    onChange={(e) => handleArgChange(index, e.target.value)}
                    style={{ width: '95%' }}
                  />
                  {isEditing && (
                    <MinusCircleOutlined
                      onClick={() => handleRemoveArg(index)}
                      style={{ margin: '0 8px', color: '#ff4d4f' }}
                    />
                  )}
                </Space.Compact>
              ))}
              {isEditing && (
                <Button
                  type="dashed"
                  onClick={handleAddArg}
                  block
                  icon={<PlusOutlined />}
                  className={styles.argItem}
                >
                  添加参数
                </Button>
              )}
            </Form.Item>
            <Form.Item label="环境变量">
              {Object.keys(env).map((key, index) => (
                <Space.Compact block key={index} className={styles.argItem}>
                  <Input
                    placeholder="键"
                    value={key}
                    disabled={!isEditing}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      if (newKey !== key) {
                        const newEnv = { ...env };
                        newEnv[newKey] = newEnv[key];
                        delete newEnv[key];
                        setEnv(newEnv);
                      }
                    }}
                    style={{ width: '45%' }}
                  />
                  <Input
                    placeholder="值"
                    value={env[key]}
                    disabled={!isEditing}
                    onChange={(e) => handleEnvChange(key, e.target.value)}
                    style={{ width: '45%' }}
                  />
                  {isEditing && (
                    <MinusCircleOutlined
                      onClick={() => handleRemoveEnv(key)}
                      style={{ margin: '0 8px', color: '#ff4d4f' }}
                    />
                  )}
                </Space.Compact>
              ))}
              {isEditing && (
                <Button
                  type="dashed"
                  onClick={handleAddEnv}
                  block
                  icon={<PlusOutlined />}
                  className={styles.argItem}
                >
                  添加环境变量
                </Button>
              )}
            </Form.Item>
          </>
        )}
        {form.getFieldValue('connType') === 'SSE' && (
          <>
            <Form.Item
              name="url"
              label="URL"
              rules={[{ required: true, message: '请输入URL' }]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
            <Form.Item
              name="sseEndpoint"
              label="SSE 终结点"
              rules={[{ required: true, message: '请输入SSE终结点' }]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
          </>
        )}
        <Space>
          <Button icon={<LinkOutlined />} onClick={handleTest}>
            测试
          </Button>
          {!editState && (
            <>
              {isEditing ? (
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSubmit}
                  >
                    保存
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancel}>
                    取消
                  </Button>
                </Space>
              ) : (
                <Button
                  type="primary"
                  onClick={handleEditToggle}
                  icon={<EditOutlined />}
                >
                  编辑
                </Button>
              )}
            </>
          )}
        </Space>
      </Form>
    );
  },
);

export default ConfigForm;
