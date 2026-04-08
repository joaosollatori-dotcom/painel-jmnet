import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chats');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-layout">
        <ChatList />
        <ChatArea />
      </main>
    </div>
  );
};

export default App;
