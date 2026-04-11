import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import Dashboard from './components/Dashboard';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRetracted, setIsRetracted] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

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
        {activeTab === 'chats' ? (
          <>
            <ChatList selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
            {selectedChatId ? (
              <ChatArea chatId={selectedChatId} />
            ) : (
              <div className="welcome-screen">
                <div className="welcome-content">
                  <h2>Bem-vindo ao TITÃ</h2>
                  <p>Selecione uma conversa para começar a atender seus clientes.</p>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'dashboard' ? (
          <Dashboard />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h2>{activeTab === 'agents' ? 'Agentes IA' : activeTab === 'crm' ? 'Clientes' : 'Ajustes'}</h2>
              <p>Esta seção está sendo preparada para sua empresa.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
