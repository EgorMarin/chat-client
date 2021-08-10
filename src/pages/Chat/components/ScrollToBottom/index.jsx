import React from 'react'
import { Badge } from 'antd'
import { ArrowDownOutlined } from '@ant-design/icons';

const ScrollToBottom = ({ count, scrollToBottom }) => {
  const onScroll = () => {
    scrollToBottom('smooth')
  }

  return (
    <div onClick={onScroll} className="scroll-to-bottom">
      <Badge count={count} offset={[12, -8]}>
        <ArrowDownOutlined />
      </Badge>
    </div>
  )
}

export default ScrollToBottom
