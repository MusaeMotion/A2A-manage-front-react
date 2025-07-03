import {
  BookOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Form, Image, Input, List, Table, Tag } from 'antd';
// import DOMPurify from 'dompurify';
// TODO import DOMPurify from 'dompurify'; 后面可以增加该组件过滤风险内容。

const renderTitle = (type: string) => {
  if (type === 'text') return <Tag icon={<BookOutlined />}>文本</Tag>;
  if (type === 'file') return <Tag icon={<FileTextOutlined />}>附件</Tag>;
  if (type === 'data') return <Tag icon={<DatabaseOutlined />}>数据</Tag>;
  return '未知类型';
};
const renderDescription = (part: API.Part) => {
  if (part.type === 'text') {
    return part.text;
  } else if (part.type === 'file') {
    return (
      <Image
        width={100}
        src={
          part.file?.uri ? part.file?.uri.replace(/"/g, '') : part.file?.bytes
        }
      />
    );
  } else if (part.type === 'data') {
    if (!part.data) {
      return '没有数据内容';
    }
    if ('html' in part.data) {
      // const cleanHtmlContent = DOMPurify.sanitize(part.data['html']);
      // console.log('cleanHtmlContent', cleanHtmlContent)
      return (
        <iframe
          srcDoc={part.data['html']}
          width="1000px"
          height="500px"
          title="嵌入的页面"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      );
    } else if ('form' in part.data) {
      // 假设 form 数据是一个表单对象，这里简单地渲染一个表单
      return (
        <Form>
          {Object.keys(part.data['form']).map((field, index) => (
            <Form.Item label={field} key={index}>
              <Input name={field} />
            </Form.Item>
          ))}
        </Form>
      );
    } else {
      // 其他数据类型，使用 Table 组件展示
      const columns = [
        {
          title: '字段',
          dataIndex: 'field',
          key: 'field',
        },
        {
          title: '值',
          dataIndex: 'value',
          key: 'value',
        },
      ];

      const dataSource = Object.entries(part.data).map(
        ([key, value], index) => ({
          key: index,
          field: key,
          value: value,
        }),
      );

      return <Table columns={columns} dataSource={dataSource} />;
    }
  } else {
    return '未知类型';
  }
};
/**
 * part渲染
 * @param parts
 */
const renderPart = (parts: API.Part[] | undefined): any => {
  return (
    <List
      bordered={false}
      size="small"
      dataSource={parts}
      renderItem={(part: API.Part) => (
        <List.Item>
          <List.Item.Meta
            title={renderTitle(part.type)}
            description={renderDescription(part)}
          />
        </List.Item>
      )}
    />
  );
};

/**
 * 添加节点
 * @param fields
 */
const renderArtifacts = (artifacts: API.Artifact[] | undefined): any => {
  if (artifacts) {
    return (
      <List
        bordered
        size="small"
        dataSource={artifacts}
        renderItem={(artifact: API.Artifact) => (
          <List.Item>
            <List.Item.Meta
              title={'序号：' + artifact.index}
              description={renderPart(artifact.parts)}
            />
          </List.Item>
        )}
      />
    );
  }
  return <></>;
};

/**
 * 添加节点
 * @param fields
 */
const renderMessage = (record: any): any => {
  // 则需要读取历史信息里面的数据
  if (record.status.state === 'completed') {
    return (
      <List
        bordered
        size="small"
        dataSource={record.history}
        renderItem={(message: API.ConversationMessageInfo) => (
          <List.Item>
            <List.Item.Meta description={renderPart(message.parts)} />
          </List.Item>
        )}
      />
    );
  }
  if (record.status.state === 'failed') {
    return (
      <List
        bordered
        size="small"
        dataSource={record.history}
        renderItem={(message: API.ConversationMessageInfo) => (
          <List.Item>
            <List.Item.Meta description={renderPart(message.parts)} />
          </List.Item>
        )}
      />
    );
  }
  // submitted, working, input-required.... 都是读取 record.status.message, 这样完成和未完成两个状态数据结构分离开了，并且不同状态存储不一样，这样就减少冗余存储
  return renderPart(record.status.message.parts);
};
export { renderArtifacts, renderDescription, renderMessage };
