import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Input } from 'antd'
import { debounce } from 'lodash'
import io from "socket.io-client";
import classnames from 'classnames'
import axios from 'axios';

import { apiUrl } from '../../utils/constants';
import Message from './components/Message';
import ScrollToBottom from './components/ScrollToBottom';
import UploadComponent from './components/UploadComponent';

import './styles.scss'

const SERVER_URL = 'http://localhost:3001'

let timeout;

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [query, setQuery] = useState({ page: 1 })
  const [lastSeenMsg, setLastSeenMsg] = useState(null)
  const [unreadMsgsCount, setUnreadMsgsCount] = useState(0)
  const [isMeTyping, setIsMeTyping] = useState(false)
  const [isShowTyping, setIsShowTyping] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
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

    const InputElem = document.querySelector('.input-elem')
    InputElem.focus()

    const chatElem = document.querySelector('.chat')
    chatElem.addEventListener('dragenter', onDragEnter)
    chatElem.addEventListener('dragleave', onDragLeave)

    return () => {
      chatElem.removeEventListener('dragenter', onDragEnter)
      chatElem.removeEventListener('dragleave', onDragLeave)
    }
  }, [])

  const onTyping = (e) =>  {
    setText(e.target.value)
    
    clearTimeout(timeout)
    timeout = setTimeout(stopTyping, 1000)

    if (!isMeTyping) {
      setIsMeTyping(true)
      socketRef.current.emit('typing', { chatId, bool: true });
    }
  }

  const onSendMessage = (e) => {
    const isEnterClicked = e.keyCode === 13
    const isMsgEmpty = !text.trim()

    if (!isEnterClicked || isMsgEmpty) {
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

  const onScrollMessages = debounce((e) => {
    const scrollTop = e.target.scrollTop;
    const visibleHeight = e.target.clientHeight;
    const containerHeight = e.target.scrollHeight;
    const littleOffset = 30;

    if (scrollTop === 0) {
      setQuery(({ page }) => ({ page: page + 1 }))
    }

    if (scrollTop + visibleHeight + littleOffset >= containerHeight) {
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

  function stopTyping() {
    setIsMeTyping(false)
    socketRef.current.emit('typing', { chatId, bool: false });
  }

  function onShowTyping(bool) {
    setIsShowTyping(bool)
  }

  function scrollToBottom(behavior = 'auto') {
    listBottomRef.current?.scrollIntoView({ behavior })
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
  
  return (
    <div className="container">
      <div className="header">Selected Chat</div>
      {isShowTyping && <div className="show-typing">User is typing ...</div>}
      <div className="chat">
        {/* {isDragActive && ( */}
          <div className={classnames("drag", isDragActive && "drag--active")}>
            <div className="drag-active__text">
              Drop it here
            </div>
          </div>
        {/* )} */}
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
            onKeyUp={onSendMessage} 
            className="input-elem"
          />
        </div>
      </div>
    </div>
  )
}

export default Chat
