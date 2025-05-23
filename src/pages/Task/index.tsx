import {
  renderArtifacts,
  renderMessage,
} from '@/components/TaskTableModal/TaskUtitl';
import services from '@/services/task';
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
import { useLocation } from '@umijs/max';
import { Button, message, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import DescriptionsModel from './components/DescriptionsModal';
const { queryTaskList, deleteTask } = services.TaskController;

const AGENT_NAME: string = 'agentName';
const INPUT_MESSAGE_ID: string = 'message_id';
/**
 *  删除节点
 * @param selectedRows
 */
const handleRemove = async (selectedRows: API.TaskInfo[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    const ids = selectedRows.map((row) => row.id).join(',');
    await deleteTask({
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

interface SearchState {
  conversationId?: string;
}
const TableList: React.FC<unknown> = () => {
  const [selectedRow, setSelectedRow] = useState(null);
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<any[]>([]);
  const [taskModalVisible, handleTaskModalVisible] = useState<boolean>(false);
  const handleTaskClick = (record: any, visible: boolean) => {
    setSelectedRow(record);
    handleTaskModalVisible(visible);
  };
  const location = useLocation();
  const state = (location.state as SearchState) || ({} as SearchState);
  console.log('search', state.conversationId);
  const columns: ProColumns<API.TaskInfo>[] = [
    {
      title: '任务id',
      dataIndex: 'id',
      // tip: '唯一性',
      width: 100,
      hideInForm: true,
      search: false,
      render: (text, record) => (
        <>
          <a
            onClick={() => {
              handleTaskClick(record, true);
            }}
          >
            {text}
          </a>
        </>
      ),
    },
    {
      title: '对话Id',
      dataIndex: 'sessionId',
      width: 80,
      valueType: 'text',
      hideInForm: false,
      render: (text) => {
        return (
          <Tooltip placement="top" title={text}>
            <div
              style={{
                width: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {text}
            </div>
          </Tooltip>
        );
      },
      initialValue: state.conversationId,
    },
    {
      title: 'Input消息Id',
      dataIndex: 'messageId',
      width: 100,
      valueType: 'text',
      hideInForm: false,
      search: false,
      render: (_, record) => {
        return (
          <Tooltip placement="top" title={record.metadata[INPUT_MESSAGE_ID]}>
            <div
              style={{
                width: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.metadata[INPUT_MESSAGE_ID]}
            </div>
          </Tooltip>
        );
      },
      // initialValue: state.conversationId,
    },
    {
      title: '智能体名称',
      key: 'agentName',
      width: 120,
      search: false,
      hideInForm: true,
      render: (_, record) => record.metadata[AGENT_NAME],
    },
    {
      title: '状态',
      key: 'status.state',
      width: 120,
      dataIndex: ['status', 'state'],
      search: false,
      hideInForm: true,
    },
    {
      title: '请求/历史',
      key: 'status.message',
      search: false,
      hideInForm: true,
      render: (_, record) => renderMessage(record),
    },
    {
      title: '响应内容',
      dataIndex: 'artifacts',
      search: false,
      render: (_, record) => renderArtifacts(record.artifacts),
      hideInForm: true,
    },
  ];

  return (
    <PageContainer
      header={{
        title: '任务列表',
      }}
    >
      <ProTable<API.TaskInfo>
        headerTitle="智能体任务列表"
        actionRef={actionRef}
        rowKey="id"
        pagination={false}
        search={{
          labelWidth: 120,
        }}
        request={async (params, sorter, filter) => {
          const { data, code } = await queryTaskList({
            ...params,
            // FIXME: remove @ts-ignore
            // @ts-ignore
            sorter,
            filter,
          });
          return {
            data,
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
      {selectedRow && (
        <DescriptionsModel
          modalVisible={taskModalVisible}
          onCancel={() => handleTaskClick(null, false)}
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
