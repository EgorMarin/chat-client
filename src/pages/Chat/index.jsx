import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Input } from 'antd'
import { SendOutlined, AudioOutlined } from '@ant-design/icons';
import { debounce } from 'lodash'
import io from "socket.io-client";
import classnames from 'classnames'
import axios from 'axios';

import { apiUrl } from '../../utils/constants';
import Message from './components/Message';
import ScrollToBottom from './components/ScrollToBottom';
import UploadComponent from './components/UploadComponent';
import ScheduleMessageModal from './components/ScheduleMessageModal';

import './styles.scss'

const SERVER_URL = 'http://localhost:3001'

let textTypingTimeout;

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [query, setQuery] = useState({ page: 1 })
  const [lastSeenMsg, setLastSeenMsg] = useState(null)
  const [unreadMsgsCount, setUnreadMsgsCount] = useState(0)
  const [isMeTyping, setIsMeTyping] = useState(false)
  const [isShowTyping, setIsShowTyping] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [scheduleMessageModalVisible, setScheduleMessageModalVisible] = useState(false)
  const { id: chatId, user } = useParams()
  const socketRef = useRef()
  const listRef = useRef()
  const listBottomRef = useRef()
  const lastSeenMsgRef = useRef()

  const fetchMessages = async () => {
    const { data } = await axios.get(`${apiUrl}/messages?page=${query.page}&limit=10`)

    if (messages.length) {
      if (data.length) {
        setMessages([ ...data, ...messages])
        lastSeenMsgRef.current.scrollIntoView()
        setLastSeenMsg(data[0]?.id)
      }
    } else {
      setLastSeenMsg(data[0]?.id)
      setMessages(data)
      scrollToBottom()
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [query])

  useEffect(() => {
    socketRef.current = io(SERVER_URL);
    socketRef.current.emit('join', { chatId, user });
    socketRef.current.on('message', onReceiveMessage)
    socketRef.current.on('showTyping', onShowTyping)

    const chatElem = document.querySelector('.chat')
    chatElem.addEventListener('dragenter', onDragEnter)
    chatElem.addEventListener('dragleave', onDragLeave)

    const sendMsgBtn = document.querySelector('.send-msg-btn')
    sendMsgBtn.addEventListener("mousedown", onTouchSendMsgBtn, false);
    sendMsgBtn.addEventListener("mouseup", onTouchEndSendMsgBtn, false);

    onInputFocus()
    return () => {
      chatElem.removeEventListener('dragenter', onDragEnter)
      chatElem.removeEventListener('dragleave', onDragLeave)
      sendMsgBtn.removeEventListener("mousedown", onTouchSendMsgBtn);
      sendMsgBtn.removeEventListener("mouseup", onTouchEndSendMsgBtn);
    }
  }, [])

  const onTyping = (e) => {
    setText(e.target.value)
    
    clearTimeout(textTypingTimeout)
    textTypingTimeout = setTimeout(onStopTyping, 1000)

    if (!isMeTyping) {
      setIsMeTyping(true)
      socketRef.current.emit('typing', { chatId, bool: true });
    }
  }

  const onSendTextMessage = () => {
    const isMsgEmpty = !text.trim()

    if (isMsgEmpty) {
      return;
    }

    const msg = {
      id: messages[messages.length - 1].id + 1,
      text,
      sender: user,
    }

    if (isMeTyping) {
      socketRef.current.emit('typing', { chatId, bool: false });
    }

    socketRef.current.emit('sendMessage', { chatId, msg })
    setText('')
  }

  const onSendScheduleMessage = async (dateTime) => {
    const isMsgEmpty = !text.trim()

    if (isMsgEmpty) {
      return;
    }

    const msg = {
      id: messages[messages.length - 1].id + 1,
      text,
      sender: user,
      schedule: dateTime
    }

    onClearMessage()
    await axios.post(`${apiUrl}/messages/schedule`, msg)
  }

  const onKeyPress = (e) => {
    const isEnterClicked = e.keyCode === 13

    if (isEnterClicked) {
      onSendTextMessage()
    }
  }

  const onScrollMessages = debounce((e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    const littleOffset = 30;

    if (scrollTop === 0) {
      setQuery(({ page }) => ({ page: page + 1 }))
    }

    if (scrollTop + clientHeight + littleOffset >= scrollHeight) {
      setUnreadMsgsCount(null)
    }
  }, 100)

  function onReceiveMessage(message) {
    const scrollTop = listRef.current?.scrollTop
    const visibleHeight = listRef.current?.clientHeight
    const containerHeight = listRef.current?.scrollHeight

    setMessages(messages => [ ...messages, message ])

    if (containerHeight - visibleHeight - scrollTop >=  visibleHeight / 2) {
      setUnreadMsgsCount(count => count + 1)
    } else {
      scrollToBottom('smooth')
    }
  }

  function onStopTyping() {
    setIsMeTyping(false)
    socketRef.current.emit('typing', { chatId, bool: false });
  }

  function onShowTyping(bool) {
    setIsShowTyping(bool)
  }

  function onClearMessage() {
    setText('')
  }

  function scrollToBottom(behavior = 'auto') {
    listBottomRef.current?.scrollIntoView({ behavior })
  }

  function onInputFocus() {
    const InputElem = document.querySelector('.input-elem')
    InputElem.focus()
  }

  let lastActiveElem;
  function onDragEnter(e) {
    lastActiveElem = e.target;
    setIsDragActive(true)
  }
  function onDragLeave(e) {
    if (e.target === lastActiveElem) {
      setIsDragActive(false)
    }
  }

  let touchTimer;
  const longTouch = 500;
  const clearTouchTimer = () => {
    clearTimeout(touchTimer)
    touchTimer = null
  }
  const onOpenScheduleMessageModal = () => {
    if (touchTimer) {
      clearTouchTimer()
      setScheduleMessageModalVisible(true)
    }
  }
  function onTouchSendMsgBtn() {
    touchTimer = setTimeout(onOpenScheduleMessageModal, longTouch)
  }
  function onTouchEndSendMsgBtn() {
    if (touchTimer) {
      clearTouchTimer()
      onSendTextMessage()
    }
  }

  const onCloseScheduleModal = () => {
    setScheduleMessageModalVisible(false)
  }

  return (
    <div className="container">
      <div className="header">Selected Chat</div>
      {isShowTyping && <div className="show-typing">User is typing ...</div>}
      <div className="chat">
        <div className={classnames("drag", isDragActive && "drag--active")}>
          <div className="drag-active__text">
            Drop it here
          </div>
        </div>
        <ul 
          ref={listRef}
          onScroll={onScrollMessages} 
          className="messages-list"
        >
          {messages.map(message => (
            <Message 
              {...message} 
              user={user} 
              lastSeenMsg={lastSeenMsg} 
              lastSeenMsgRef={lastSeenMsgRef}  
            />
          ))}
          {unreadMsgsCount && (
            <ScrollToBottom count={unreadMsgsCount} scrollToBottom={scrollToBottom} />
          )}
          <div ref={listBottomRef} />
        </ul>
        <div className="input-block">
          <UploadComponent />
          <Input 
            value={text} 
            onChange={onTyping} 
            onKeyUp={onKeyPress} 
            className="input-elem"
          />
          <Button 
            className="send-msg-btn"
            icon={text ? <SendOutlined /> : <AudioOutlined />}  
          />
        </div>
      </div>
      <ScheduleMessageModal
        visible={scheduleMessageModalVisible}
        onSendMsg={onSendScheduleMessage}
        onClose={onCloseScheduleModal}
      />
    </div>
  )
}

export default Chat
