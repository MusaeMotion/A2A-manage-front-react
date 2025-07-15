/* eslint-disable no-case-declarations */
import {
  BookOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Button, Form, Image, Input, List, Space, Table, Tag } from 'antd';
// import DOMPurify from 'dompurify';
// TODO import DOMPurify from 'dompurify'; 后面可以增加该组件过滤风险内容。

// 将Base64字符串还原为文件并下载
const downloadFile = (base64String: string) => {
  if (!base64String) {
    console.error('Base64字符串为空');
    return;
  }
  try {
    // 解码Base64字符串
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/zip' });

    // 创建一个下载链接
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'downloaded-file.xlsx'; // 设置文件名为.xlsx
    link.click();

    // 释放对象URL
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('解码Base64字符串失败:', error);
  }
};

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
    switch (true) {
      case 'html' in part.data:
        return (
          <iframe
            srcDoc={part.data['html']}
            title="嵌入的页面"
            style={{ border: 'none', width: '100%', height: '500px' }}
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        );
      case 'xlsx' in part.data:
        const xlsxBase64 = part.data.xlsx;
        // console.log('xlsxBase64', xlsxBase64)
        return (
          <Button
            type="primary"
            onClick={() => downloadFile(xlsxBase64)}
            icon={<DownloadOutlined />}
          >
            点击下载
          </Button>
        );
      // eslint-disable-next-line no-duplicate-case
      case 'form' in part.data:
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
      default:
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
 * 按最小可显示单元格式化金额（输入：元）
 * @param {number} yuan 金额，单位：元
 * @returns {string}   格式化后的字符串
 */
export function formatMoneyFromYuan(yuan: number) {
  if (typeof yuan !== 'number' || Number.isNaN(yuan)) return '';

  // 先转成“厘”再处理，彻底避免浮点误差
  const li = Math.round(yuan * 1000);

  // 1. 厘
  if (li < 10) {
    return `${li} 厘`;
  }

  // 2. 分
  if (li < 100) {
    return `${Math.round(li / 10)} 分`;
  }

  // 3. 角
  if (li < 1000) {
    return `${Math.round(li / 100)} 角`;
  }

  // 4. 元
  return `${(li / 1000).toFixed(2).replace(/\.00$/, '')} 元`;
}
/**
 * 计算费用
 * @param data
 * @returns
 */
const renderCalculateAmount = (
  metadata: Record<string, any> | undefined,
): any => {
  if (metadata?.total_amount) {
    return (
      <Space size={[8, 16]} wrap>
        <Tag>该消息输入 Token：{metadata?.prompt_tokens}</Tag>
        <Tag color="red">
          输入费用：{formatMoneyFromYuan(metadata?.prompt_tokens_amount)}
        </Tag>
        <Tag>该消息输出 Token：{metadata?.completion_tokens}</Tag>
        <Tag color="red">
          输出费用：{formatMoneyFromYuan(metadata?.completion_tokens_amount)}
        </Tag>
        <Tag color="blue">总耗用 Token：{metadata?.total_tokens}</Tag>
        <Tag color="red">
          总费用：{formatMoneyFromYuan(metadata?.total_amount)}
        </Tag>
      </Space>
    );
  }
  return <></>;
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
export {
  renderArtifacts,
  renderCalculateAmount,
  renderDescription,
  renderMessage,
};
