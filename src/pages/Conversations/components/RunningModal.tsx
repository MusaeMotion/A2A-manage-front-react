import type { ThoughtChainItem, ThoughtChainProps } from '@ant-design/x';
import { ThoughtChain } from '@ant-design/x';
import { Card, Empty, Modal } from 'antd';
import markdownit from 'markdown-it';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

// @ts-ignore
const md = markdownit({ html: true, breaks: true });
interface RunningModalProps {
  modalVisible: boolean;
  onCancel: () => void;
}
// 定义回调函数的类型
type CallbackFunction = () => void;
export interface RunningModalRef {
  addItem: (newItem: ThoughtChainItem) => void;
  updateItemContent: (
    key: string,
    newContent: string,
    callback?: CallbackFunction,
  ) => void;
  updateItemStatus: (
    key: string,
    status: 'pending' | 'success' | 'error',
  ) => void;
  setItemClear: () => void;
}

const RunningModal = forwardRef<RunningModalRef, RunningModalProps>(
  (props, ref) => {
    const { modalVisible, onCancel } = props;
    const [items, setItems] = useState<ThoughtChainItem[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const callbackRef = useRef<CallbackFunction | null>(undefined);
    // 动态添加 item
    const addItem = (newItem: ThoughtChainItem) => {
      setItems([...items, newItem]);
      // 默认展开新添加的 item
      setExpandedKeys([...expandedKeys, newItem.key as string]);
    };

    // 动态更新 item 的 content
    const updateItemContent = (
      key: string,
      newContent: string,
      callback?: CallbackFunction,
    ) => {
      callbackRef.current = callback;
      setItems(
        items.map((item) =>
          item.key === key
            ? {
                ...item,
                content: (
                  <div
                    dangerouslySetInnerHTML={{ __html: md.render(newContent) }}
                  />
                ),
              }
            : item,
        ),
      );
    };
    useEffect(() => {
      if (callbackRef.current) {
        callbackRef.current();
        callbackRef.current = null; // 清空回调函数
      }
    }, [items]);
    // 动态更新 item 的 content
    const updateItemStatus = (
      key: string,
      status: 'pending' | 'success' | 'error',
    ) => {
      setItems(
        items.map((item) => (item.key === key ? { ...item, status } : item)),
      );
    };

    /**
     * 清空
     */
    const setItemClear = () => {
      setItems([]);
    };

    //暴露给父组件使用的方法
    useImperativeHandle(ref, () => ({
      addItem,
      updateItemContent,
      updateItemStatus,
      setItemClear,
    }));

    const collapsible: ThoughtChainProps['collapsible'] = {
      expandedKeys,
      onExpand: (keys: string[]) => {
        setExpandedKeys(keys);
      },
    };

    return (
      <Modal
        destroyOnClose
        width={1200}
        open={modalVisible}
        onCancel={onCancel}
        footer={null}
        closeIcon={null}
        title="远程智能体实时工作内容"
      >
        <Card style={{ width: '100%' }}>
          {items.length === 0 ? (
            <Empty
              style={{ width: '100%' }}
              description="暂无数据，请稍后再试"
            />
          ) : (
            <ThoughtChain items={items} collapsible={collapsible} />
          )}
        </Card>
      </Modal>
    );
  },
);

export default RunningModal;
