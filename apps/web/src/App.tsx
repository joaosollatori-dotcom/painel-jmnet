import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatList from './components/ChatList';
import SalesPipeline from './components/SalesPipeline';
import LeadsManager from './components/LeadsManager';
import LeadDetail from './components/LeadDetail';
import FinanceManager from './components/FinanceManager';
import OSManager from './components/OSManager';
import NetworkManager from './components/NetworkManager';
import OcorrenciasManager from './components/OcorrenciasManager';
import SettingsManager from './components/SettingsManager';
import { useToast } from './contexts/ToastContext';
import './App.css';

const App: React.FC = () => {
  const { showToast, removeToast } = useToast();
  const [theme, setTheme] = useState<'dark' | 'light' | 'soft'>(() => (localStorage.getItem('tita-theme') as 'dark' | 'light' | 'soft') || 'dark');
  const [finish, setFinish] = useState<'matte' | 'glossy'>(() => (localStorage.getItem('tita-finish') as 'matte' | 'glossy') || 'glossy');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('tita-chat-accent') || '#991b1b');
  const [isRetracted, setIsRetracted] = useState(() => localStorage.getItem('sidebar-retracted') === 'true');
  const [offlineToastId, setOfflineToastId] = useState<string | null>(null);

  // Monitor de Conexão Real-time
  useEffect(() => {
    const handleOnline = () => {
      if (offlineToastId) {
        removeToast(offlineToastId);
        setOfflineToastId(null);
      }
      showToast('Conexão restabelecida!', 'success', 3000);
    };

    const handleOffline = () => {
      const id = showToast('Sem conexão. Reconectando...', 'warning', 0); // 0 = infinito
      setOfflineToastId(id);
    };

    if (!navigator.onLine && !offlineToastId) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineToastId, showToast, removeToast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tita-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-finish', finish);
    localStorage.setItem('tita-finish', finish);
  }, [finish]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-chat', accentColor);
    localStorage.setItem('tita-chat-accent', accentColor);
  }, [accentColor]);

  const toggleSidebar = () => {
    const newState = !isRetracted;
    setIsRetracted(newState);
    localStorage.setItem('sidebar-retracted', newState.toString());
  };

  // Atalhos Globais Imutáveis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '.') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRetracted]);

  return (
    <div className={`app-layout ${isRetracted ? 'retracted' : ''}`}>
      <Sidebar
        isRetracted={isRetracted}
        onToggleRetraction={toggleSidebar}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'soft' : 'dark')}
        finish={finish}
        onToggleFinish={() => setFinish(prev => prev === 'matte' ? 'glossy' : 'matte')}
      />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/atendimento" />} />
          <Route path="/atendimento" element={<ChatPage />} />
          <Route path="/agentes" element={<div className="loading-state"><h3>Robôs Titã AI</h3><p>Módulo em implementação...</p></div>} />
          <Route path="/crm" element={<LeadsManager />} />
          <Route path="/crm/lead/:leadId" element={<LeadDetail />} />
          <Route path="/kanban" element={<SalesPipeline />} />
          <Route path="/financeiro" element={<FinanceManager />} />
          <Route path="/os" element={<OSManager />} />
          <Route path="/os/:osId" element={<OSManager />} />
          <Route path="/rede" element={<NetworkManager />} />
          <Route path="/ocorrencias" element={<OcorrenciasManager />} />
          <Route path="/ajustes" element={<SettingsManager />} />
        </Routes>
      </main>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <ChatList selectedChatId={selectedChat} onSelectChat={setSelectedChat} />
      {selectedChat ? <ChatArea chatId={selectedChat} /> : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', color: 'var(--text-secondary)' }}>
          Escolha uma conversa para começar
        </div>
      )}
    </div>
  );
};

export default App;
