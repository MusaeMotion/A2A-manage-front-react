import services from '@/services/remote-agent';
import {
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProDescriptions,
  ProDescriptionsItemProps,
  ProTable,
} from '@ant-design/pro-components';
import {
  Button,
  Input,
  List,
  message,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import DescriptionsModel from './components/DescriptionsModal';
const { TextArea } = Input;
const { Text } = Typography;
const {
  registerRemoteAgent,
  queryRemoteAgentList,
  deleteRemoteAgent,
  changeRemoteAgentEnable,
  reRegisterRemoteAgent,
  updateRemoteAgent,
} = services.RemoteAgentController;

/**
 * 添加节点
 * @param fields
 */
const handleAdd = async (fields: any) => {
  const hide = message.loading('正在添加');
  try {
    await registerRemoteAgent({ ...fields });
    hide();
    message.success('添加成功');
    return true;
  } catch (error) {
    hide();
    message.error('添加失败请重试！');
    return false;
  }
};

/**
 *  删除节点
 * @param selectedRows
 */
const handleRemove = async (selectedRows: API.RemoteAgentInfo[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    const ids = selectedRows.map((row) => row.id).join(',');
    await deleteRemoteAgent({
      id: ids,
    });
    hide();
    message.success('删除成功，即将刷新');
    return true;
  } catch (error) {
    hide();
    message.error('删除失败，请重试');
    return false;
  }
};
/**
 * 切换智能体状态
 * @param record
 * @param enable
 * @returns
 */
const changeEnable = async (id: string) => {
  await changeRemoteAgentEnable(id);
};

/**
 * 切换智能体状态
 * @param record
 * @param enable
 * @returns
 */
const handleReload = async (id: string) => {
  await reRegisterRemoteAgent(id);
};

const TableList: React.FC<unknown> = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [skillsModalVisible, handleSkillsModalVisible] =
    useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<any[]>([]);
  const [editingKey, setEditingKey] = useState<React.Key | null>(null);

  const [dataSource, setDataSource] = React.useState<
    API.PartialRemoteAgentInfo[]
  >([]);
  const handleSkillsClick = (record: any, visible: boolean) => {
    setSelectedRow(record);
    handleSkillsModalVisible(visible);
  };

  /**
   * 构建 action
   * @param record
   * @param action
   * @returns
   */
  const buildActionBtn = (record: any, action: any) => {
    const btns = [];
    if (editingKey) {
      btns.push(
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => {
            setEditingKey(null);
            updateRemoteAgent(record.id, record).then(() => {
              action?.reload();
              message.success('保存成功');
            });
          }}
        >
          保存编辑
        </Button>,
      );
    } else {
      btns.push(
        <Button
          key="edit"
          danger
          icon={<EditOutlined />}
          onClick={() => {
            setEditingKey(record.id as string);
          }}
        >
          编辑
        </Button>,
      );
    }
    btns.push(
      <Button
        key="reload"
        color="primary"
        variant="outlined"
        icon={<ReloadOutlined />}
        onClick={() =>
          handleReload(record.id as string).then(() => {
            action?.reload();
          })
        }
      >
        重载
      </Button>,
    );
    return btns;
  };

  const columns: ProColumns<API.PartialRemoteAgentInfo>[] = [
    {
      title: '智能体名称',
      dataIndex: 'name',
      // tip: '唯一性',
      hideInForm: true,
      render: (text, record) => (
        <>
          <a
            onClick={() => {
              handleSkillsClick(record, true);
            }}
          >
            {text}
          </a>
        </>
      ),
    },
    {
      title: '智能体描述',
      dataIndex: 'description',
      valueType: 'text',
      hideInForm: true,
      render: (text, record) => {
        const editable = editingKey === record.id;
        return editable ? (
          <TextArea
            rows={4}
            placeholder="AgentCard的描述"
            value={record.description}
            onChange={(e) => {
              const newData = [...dataSource];
              const index = newData.findIndex((item) => item.id === record.id);
              if (index > -1) {
                newData[index].description = e.target.value;
                setDataSource(newData);
              }
            }}
          />
        ) : (
          text
        );
      },
    },
    {
      title: '访问地址',
      dataIndex: 'url',
      valueType: 'text',
      formItemProps: {
        rules: [
          {
            required: true,
            message: '地址必填',
          },
        ],
      },
      fieldProps: {
        placeholder: '请输入地址, 例如: http://127.0.0.1:9999', // 在 fieldProps 中设置 placeholder
        addonBefore: 'http://',
      },
      search: false,
    },
    {
      title: '启用',
      dataIndex: 'enable',
      valueType: 'text',
      search: false,
      render: (text, record, _, action) => {
        return (
          <Switch
            checked={record.enable}
            onChange={(checked) => {
              changeEnable(record.id as string).then(() => {
                const newData = [...dataSource];
                const index = newData.findIndex(
                  (item) => item.id === record.id,
                );
                if (index > -1) {
                  newData[index].enable = checked;
                  setDataSource(newData);
                }
                action?.reload();
              });
            }}
          />
        );
      },
      hideInForm: true,
    },
    {
      title: '版本号',
      dataIndex: 'version',
      search: false,
      hideInForm: true,
    },
    {
      title: '支持输入',
      dataIndex: 'defaultInputModes',
      search: false,
      render: (_, record) => record.defaultInputModes?.join(','),
      hideInForm: true,
    },
    {
      title: '支持输出',
      dataIndex: 'defaultOutputModes',
      search: false,
      render: (_, record) => record.defaultOutputModes?.join(','),
      hideInForm: true,
    },
    {
      title: '服务提供者',
      key: 'provider.organization',
      dataIndex: ['provider', 'organization'],
      search: false,
      hideInForm: true,
    },
    {
      title: '支持流式',
      dataIndex: ['capabilities', 'streaming'],
      valueType: 'select',
      fieldProps: {
        options: [
          {
            label: '支持',
            value: true,
          },
          {
            label: '不支持',
            value: false,
          },
        ],
      },
      search: false,
      initialValue: false, // 设置默认值为 false
      hideInForm: true,
    },
    {
      title: '支持通知',
      dataIndex: ['capabilities', 'pushNotifications'],
      valueType: 'select',
      fieldProps: {
        options: [
          {
            label: '支持',
            value: true,
          },
          {
            label: '不支持',
            value: false,
          },
        ],
      },
      search: false,
      hideInForm: true,
      initialValue: false, // 设置默认值为 false
    },
    {
      title: '授权方式',
      dataIndex: ['authentication', 'schemes'],
      search: false,
      hideInForm: true,
    },
    {
      title: '智能体能力',
      dataIndex: 'skills',
      search: false,
      hideInForm: true,
      hideInTable: true,
      render: (skills) => {
        // 渲染所有 skills 的 description 为列表
        return (
          <List
            itemLayout="horizontal"
            dataSource={skills as any[]}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical">
                  <Text strong>描述:</Text>
                  <Tooltip placement="topLeft" title={item.description}>
                    <Text ellipsis={true}>{item.description}</Text>
                  </Tooltip>
                  <Text strong>示例:</Text>
                  <List
                    itemLayout="horizontal"
                    dataSource={item.examples}
                    renderItem={(example: string) => (
                      <List.Item>
                        <Tooltip placement="topLeft" title={example}>
                          <Text ellipsis={true}>{example}</Text>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                </Space>
              </List.Item>
            )}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      width: 220,
      hideInForm: false,
      render: (text, record, _, action) => [buildActionBtn(record, action)],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '智能体注册中心',
      }}
    >
      <ProTable<API.PartialRemoteAgentInfo>
        headerTitle="智能体列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="1"
            type="primary"
            onClick={() => handleModalVisible(true)}
          >
            注册智能体
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          const { data, code } = await queryRemoteAgentList({
            ...params,
            // FIXME: remove @ts-ignore
            // @ts-ignore
            sorter,
            filter,
          });
          setDataSource(data?.list || []);
          return {
            data: data?.list || [],
            code: code === 0,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              项&nbsp;&nbsp;
            </div>
          }
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            批量删除
          </Button>
        </FooterToolbar>
      )}
      <CreateForm
        onCancel={() => handleModalVisible(false)}
        modalVisible={createModalVisible}
      >
        <ProTable<any, any>
          onSubmit={async (value) => {
            const success = await handleAdd(value);
            if (success) {
              handleModalVisible(false);
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          rowKey="id"
          type="form"
          columns={columns}
        />
      </CreateForm>
      {selectedRow && (
        <DescriptionsModel
          modalVisible={skillsModalVisible}
          onCancel={() => handleSkillsClick(null, false)}
        >
          <ProDescriptions
            column={2}
            layout="vertical"
            title="详细信息"
            size="small"
            dataSource={selectedRow}
            bordered={true}
            columns={columns as ProDescriptionsItemProps[]}
          />
        </DescriptionsModel>
      )}
    </PageContainer>
  );
};

export default TableList;
