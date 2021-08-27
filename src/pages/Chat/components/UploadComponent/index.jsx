import React from 'react'
import { Button, message, Upload } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';

import { apiUrl } from '../../../../utils/constants';

const validMimeTypes = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'video/mp4',
  'video/mpeg'
]

const props = {
  action: `${apiUrl}/media/upload`,
  multiple: true,
  showUploadList: false,
  beforeUpload: file => {
    if (!validMimeTypes.includes(file.type)) {
      message.error(`${file.name} is not a valid format`);
      return Upload.LIST_IGNORE
    }

    return true;
  },
  onChange: info => {
    console.log(info.fileList);
  },
}

const UploadComponent = () => {
  return (
    <Upload {...props}>
      <Button icon={<PaperClipOutlined />} />
    </Upload>
  )
}

export default UploadComponent
