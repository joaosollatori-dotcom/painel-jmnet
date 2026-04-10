import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRetracted, setIsRetracted] = useState(true);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setIsRetracted(prev => !prev);

  return (
    <div className={`app-container ${isRetracted ? 'sidebar-retracted' : ''}`}>
      <div className="sidebar-placeholder" />
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRetracted={isRetracted}
        onToggleRetraction={toggleSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="main-layout">
        <ChatList />
        <ChatArea />
      </main>
    </div>
  );
};

export default App;
