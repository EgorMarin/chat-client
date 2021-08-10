import React from 'react'
import { BrowserRouter, Route } from "react-router-dom";

import Chats from './pages/Chats';
import Chat from './pages/Chat';

import './styles.scss'

const App = () => {
  return (
    <BrowserRouter>
      <Route path="/:user" exact component={Chats} />
      <Route path="/chat/:id/:user" exact component={Chat} />
    </BrowserRouter>
  )
}

export default App

