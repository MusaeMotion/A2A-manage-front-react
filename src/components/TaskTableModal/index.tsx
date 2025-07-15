import type { TableProps } from 'antd';
import { Modal, Table } from 'antd';
import React from 'react';
import {
  renderArtifacts,
  renderCalculateAmount,
  renderMessage,
} from './TaskUtitl';
const AGENT_NAME: string = 'agentName';

interface Props {
  tasks: API.TaskInfo[];
}

const columns: TableProps<API.TaskInfo>['columns'] = [
  {
    title: '智能体名称',
    dataIndex: 'agentName',
    key: 'agentName',
    width: 200,
    render: (_, record) => record.metadata[AGENT_NAME],
  },
  {
    title: '状态',
    key: 'status.state',
    width: 60,
    dataIndex: ['status', 'state'],
  },
  {
    title: '请求',
    key: 'status.message',
    render: (_, record) => renderMessage(record),
  },
  {
    title: '响应内容',
    dataIndex: 'artifacts',
    render: (_, record) => renderArtifacts(record.artifacts),
  },
  {
    title: '耗用',
    dataIndex: 'tokens',
    width: 100,
    render: (_, record) => renderCalculateAmount(record.metadata),
  },
];

const TaskTableModal = React.forwardRef(
  (props: Props, ref: React.Ref<{ showModal: () => void }>) => {
    const { tasks } = props;
    const [open, setOpen] = React.useState(false);
    const showModal = () => {
      setOpen(true);
    };

    // 将 showModal 方法暴露给父组件
    React.useImperativeHandle(ref, () => ({
      showModal,
    }));

    return (
      <Modal
        title={<p>任务明细</p>}
        open={open}
        width={'100%'}
        onCancel={() => setOpen(false)}
        footer={false}
      >
        <Table<API.TaskInfo>
          rowKey="id"
          bordered
          pagination={false}
          columns={columns}
          dataSource={tasks}
        />
      </Modal>
    );
  },
);

export default TaskTableModal;
