import ConfigForm from '@/components/ConfigForm';
import services from '@/services/mcp-server';
import { DeleteOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProDescriptions,
  ProDescriptionsItemProps,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import DescriptionsModel from './components/DescriptionsModal';

const {
  addMcpServer,
  queryMcpServerList,
  deleteMcpServer,
  changeMcpServerEnable,
  updateMcpServer,
  testMcpServer,
} = services.McpServerController;

/**
 *  删除节点
 * @param selectedRows
 */
const handleRemove = async (selectedRows: API.McpServerInfo[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    const ids = selectedRows.map((row) => row.id).join(',');
    await deleteMcpServer({
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
 * 切换状态
 * @param id
 */
const changeEnable = async (id: string) => {
  await changeMcpServerEnable(id);
};
/**
 * 表格列表
 */
const TableList: React.FC<unknown> = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [skillsModalVisible, handleSkillsModalVisible] =
    useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<any[]>([]);
  const [dataSource, setDataSource] = React.useState<
    API.PartialMcpServerInfo[]
  >([]);
  const handleSkillsClick = (record: any, visible: boolean) => {
    setSelectedRow(record);
    handleSkillsModalVisible(visible);
  };
  /**
   * 保存修改
   * @param data
   * @param record
   */
  const handleSave = async (data: any, record: any) => {
    try {
      const { config, connType } = data;
      record.mcpConfig.config = config;
      record.mcpConfig.connType = connType;
      await updateMcpServer(record);
      actionRef.current?.reload();
      message.success('保存成功');
    } catch (error) {
      message.error('删除失败');
    }
  };
  /**
   * 测试配置
   * @param data
   */
  const handleTest = async (data: any) => {
    try {
      const response = await testMcpServer(data);
      console.log('handleTest', response);
      message.success('测试成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  /**
   * 添加节点
   * @param fields
   */
  const handleAdd = async (fields: any) => {
    const hide = message.loading('正在添加');
    try {
      await addMcpServer({ ...fields });
      hide();
      message.success('添加成功');
      handleModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('添加失败请重试！');
      return false;
    }
  };
  /**
   * 列字段
   */
  const columns: ProColumns<API.PartialMcpServerInfo>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      // tip: '唯一性',
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
      title: '标题',
      dataIndex: 'displayName',
    },
    {
      title: '描述',
      dataIndex: 'description',
      valueType: 'text',
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
      title: 'MCP配置',
      dataIndex: 'mcpConfig',
      valueType: 'text',
      search: false,
      render: (text, record) => {
        return (
          <ConfigForm
            initialData={record.mcpConfig}
            readOnly={true}
            editState={false}
            onSave={(data) => handleSave(data, record)}
            onTest={(data) => handleTest(data)}
          />
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'MCP 服务管理',
      }}
    >
      <ProTable<API.PartialRemoteAgentInfo>
        headerTitle="MCP列表"
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
            添加MCP
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          const { data, code } = await queryMcpServerList({
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
        visible={createModalVisible}
        onCancel={() => handleModalVisible(false)}
        onSave={handleAdd}
        onTest={handleTest}
      />
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
