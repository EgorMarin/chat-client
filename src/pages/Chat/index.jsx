import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Input, Button } from 'antd'
import { debounce } from 'lodash'
import io from "socket.io-client";
import axios from 'axios';

import { apiUrl } from '../../utils/constants';
import Message from './components/Message';
import ScrollToBottom from './components/ScrollToBottom';

import './styles.scss'

const SERVER_URL = 'http://localhost:3001'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [query, setQuery] = useState({ page: 1 })
  const [lastSeenMsg, setLastSeenMsg] = useState(null)
  const [unreadMsgsCount, setUnreadMsgsCount] = useState(0)
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
  }, [])

  const onChangeText = (e) => setText(e.target.value)

  const onSendMessage = () => {
    if (!text.trim()) {
      return;
    }

    const msg = {
      id: messages[messages.length - 1].id + 1,
      text,
      sender: user,
    }

    socketRef.current.emit('sendMessage', { chatId, msg })
    setText('')
  }

  const onScrollMessages = debounce((e) => {
    const scrollTop = e.target.scrollTop;
    const visibleHeight = e.target.clientHeight;
    const containerHeight = e.target.scrollHeight;

    console.log(scrollTop, visibleHeight, containerHeight);

    if (scrollTop === 0) {
      setQuery(({ page }) => ({ page: page + 1 }))
    }

    if (scrollTop + visibleHeight + 30 >= containerHeight) {
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

  function scrollToBottom(behavior = 'auto') {
    listBottomRef.current?.scrollIntoView({ behavior })
  }

  return (
    <div className="container">
      <div className="header">Selected Chat</div>
      <div className="chat">
        <ul onScroll={onScrollMessages} ref={listRef} className="messages-list">
          {messages.map(message => (
            <Message 
              {...message} 
              user={user} 
              lastSeenMsg={lastSeenMsg} 
              lastSeenMsgRef={lastSeenMsgRef}  
            />
          ))}
          {unreadMsgsCount && <ScrollToBottom count={unreadMsgsCount} scrollToBottom={scrollToBottom} />}
          <div ref={listBottomRef} />
        </ul>
        <div className="input-block">
          <Input value={text} onChange={onChangeText} />
          <Button onClick={onSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  )
}

export default Chat
