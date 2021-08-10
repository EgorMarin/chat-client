import React from 'react'
import classnames from 'classnames'

const Message = ({ id, text, sender, user, lastSeenMsg, lastSeenMsgRef }) => {
  const isMyMessage = sender === user
  const isLastSeenMessage = id === lastSeenMsg

  return (
    <div 
      className={classnames(
        'message', 
        isMyMessage ? 'message--right' : 'message--left',
        isLastSeenMessage && 'last-message'
      )}
      key={id}
      ref={isLastSeenMessage ? lastSeenMsgRef : undefined}
    >
      <div className="text">{text}</div>
      <div className="sender">{sender}</div>
    </div>
  )
}

export default Message
