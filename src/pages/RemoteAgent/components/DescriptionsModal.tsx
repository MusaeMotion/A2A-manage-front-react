import { Modal } from 'antd';
import React, { PropsWithChildren } from 'react';

interface CreateFormProps {
  modalVisible: boolean;
  onCancel: () => void;
}

const DescriptionsModel: React.FC<PropsWithChildren<CreateFormProps>> = (
  props,
) => {
  const { modalVisible, onCancel } = props;

  return (
    <Modal
      destroyOnClose
      width={800}
      open={modalVisible}
      onCancel={() => onCancel()}
      footer={null}
      closeIcon={null}
    >
      {props.children}
    </Modal>
  );
};

export default DescriptionsModel;
