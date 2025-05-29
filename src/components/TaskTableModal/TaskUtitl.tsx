import {
  BookOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Image, List, Tag } from 'antd';

const renderTitle = (type: string) => {
  if (type === 'text') return <Tag icon={<BookOutlined />}>文本</Tag>;
  if (type === 'file') return <Tag icon={<FileTextOutlined />}>附件</Tag>;
  if (type === 'data') return <Tag icon={<DatabaseOutlined />}>数据</Tag>;
  return '未知类型';
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
            description={
              part.type === 'text' ? (
                part.text
              ) : (
                <Image
                  width={100}
                  src={
                    part.file?.uri
                      ? part.file?.uri.replace(/"/g, '')
                      : part.file?.bytes
                  }
                />
              )
            }
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
export { renderArtifacts, renderMessage };
