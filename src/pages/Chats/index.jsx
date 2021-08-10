import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import axios from 'axios'

import { apiUrl } from '../../utils/constants'

import './styles.scss'

const Chats = () => {
  const [chats, setChats] = useState([])
  const { user } = useParams()
  const history = useHistory()

  const fetchChats = async () => {
    const { data } = await axios.get(`${apiUrl}/chats?user=${user}`)
    setChats(data)
  }

  useEffect(() => {
    fetchChats()
  }, [])

  const onSelectChat = (id) => () => {
    history.push(`/chat/${id}/${user}`)
  }

  return (
    <div className="container">
      <div className="header">Chats</div>
      <div className="chats-list">
        {chats.map(({ id, sender, receiver, description }) => (
          <div onClick={onSelectChat(id)} className="chats-list__item" key={id}>
            <div className="item-title">
              <div>Sender: <b>{sender}</b></div>
              <div>Receiver: <b>{receiver}</b></div>
            </div>
            <div className="item-description">Description: {description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Chats
