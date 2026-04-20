import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import WikiManager from './components/WikiManager';
import { useToast } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

const App: React.FC = () => {
  const { showToast, removeToast } = useToast();
  const { session, profile, loading, signOut } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light' | 'soft'>(() => (localStorage.getItem('tita-theme') as 'dark' | 'light' | 'soft') || 'dark');
  const [finish, setFinish] = useState<'matte' | 'glossy'>(() => (localStorage.getItem('tita-finish') as 'matte' | 'glossy') || 'glossy');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('tita-chat-accent') || '#991b1b');
  const [isRetracted, setIsRetracted] = useState(() => localStorage.getItem('sidebar-retracted') === 'true');
  const navigate = useNavigate();
  const [offlineToastId, setOfflineToastId] = useState<string | null>(null);
  const [lastCtrlSpace, setLastCtrlSpace] = useState(0);

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

  // Atalhos Globais Imutáveis (v2.05.03 - Protected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sidebar Toggle (Ctrl + .)
      if (e.ctrlKey && e.key === '.') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl + Space (1x -> Dark, 2x -> Light)
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastCtrlSpace < 400) {
          setTheme('light');
          showToast('Tema: Modo Claro', 'info');
        } else {
          setTheme('dark');
          showToast('Tema: Modo Escuro', 'info');
        }
        setLastCtrlSpace(now);
      }

      // Shift + Space -> Soft Mode
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setTheme('soft');
        showToast('Tema: Modo Soft (Eye Care)', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRetracted, lastCtrlSpace, toggleSidebar, showToast]);

  // Detector de clique fora da sidebar (Blindagem UX)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isRetracted) {
        const sidebar = document.querySelector('.sidebar');
        // Não fecha se o clique for no botão de toggle ou dentro da sidebar
        if (sidebar && !sidebar.contains(e.target as Node)) {
          toggleSidebar();
        }
      }
    };

    // Pequeno delay para evitar que o clique que abriu feche instantaneamente
    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isRetracted, toggleSidebar]);

  if (loading) return <LoadingScreen />;
  if (!session) return <Auth />;

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
          <Route path="/agentes" element={<div className="loading-state"><h3>Robôs Titã AI</h3><p>Módulo de inteligência em processamento...</p></div>} />
          <Route path="/crm" element={<LeadsManager />} />
          <Route path="/crm/lead/:leadId" element={<LeadDetail />} />
          <Route path="/crm_tasks" element={<div className="loading-state"><h3>Agendas e Tarefas</h3><p>Módulo em implementação...</p></div>} />
          <Route path="/kanban" element={<SalesPipeline />} />
          <Route path="/financeiro" element={<FinanceManager />} />
          <Route path="/relatorios" element={<div className="loading-state"><h3>Business Intelligence</h3><p>Processando dados analíticos...</p></div>} />
          <Route path="/dashboard" element={<div className="loading-state"><h3>Painel Executivo</h3><p>Carregando indicadores...</p></div>} />
          <Route path="/os" element={<OSManager />} />
          <Route path="/os/:osId" element={<OSManager />} />
          <Route path="/rede" element={<NetworkManager />} />
          <Route path="/ocorrencias" element={<OcorrenciasManager />} />
          <Route path="/ajustes" element={<SettingsManager />} />
          <Route path="/wiki" element={<WikiManager />} />
          <Route path="/ajustes/:section" element={<SettingsManager />} />
          <Route path="/ajustes/:section/:subsection" element={<SettingsManager />} />
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
