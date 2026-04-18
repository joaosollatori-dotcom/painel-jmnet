import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { trackModuleAccess } from './services/usageService';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import Dashboard from './components/Dashboard';
import InternalChat from './components/InternalChat';
import OSManager from './components/OSManager';
import FinanceManager from './components/FinanceManager';
import NetworkManager from './components/NetworkManager';
import OcorrenciasManager from './components/OcorrenciasManager';
import LeadsManager from './components/LeadsManager';
import SalesPipeline from './components/SalesPipeline';
import LeadDetail from './components/LeadDetail';
import AutomationsDashboard from './components/AutomationsDashboard';
import LeadReports from './components/LeadReports';
import AppointmentManager from './components/AppointmentManager';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookieConsent from './components/CookieConsent';
import { getConversations } from './services/chatService';
import type { Conversation } from './services/chatService';
import { getLeads } from './services/leadService';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import './App.css';

/* ====== Componentes Auxiliares (Wrappers) ====== */

const AgentsPage: React.FC = () => {
  const agents = [
    { name: 'Titã AI', description: 'Atendimento automatizado de N1.', active: true, color: '#10b981' },
    { name: 'Vendas Bot', description: 'Qualifica leads automaticamente.', active: false, color: '#3b82f6' },
  ];
  return (
    <div className="agents-page">
      <h1>Agentes IA</h1>
      <div className="agents-list">
        {agents.map((a, i) => (
          <div key={i} className="agent-card">
            <strong>{a.name}</strong>
            <p className="agent-description">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Atendimento: React.FC = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;
  const showList = !isMobile || !chatId;
  const showChat = chatId && (!isMobile || !!chatId);

  return (
    <div className="atendimento-layout">
      {showList && <ChatList selectedChatId={chatId || null} onSelectChat={(id) => navigate(`/atendimento/${id}`)} />}
      {showChat ? (
        <ChatArea chatId={chatId} />
      ) : (!chatId && !isMobile) ? (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>Bem-vindo ao TITÃ | ISP</h2>
            <p>Selecione uma conversa para iniciar o atendimento.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const LeadView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  useEffect(() => {
    if (id) getLeads().then(leads => setLead(leads.find(l => l.id === id)));
  }, [id]);
  if (!lead) return null;
  return <LeadDetail lead={lead} onClose={() => navigate('/crm')} onUpdate={() => { }} />;
};

const SettingsPageWrapper: React.FC<{
  theme: 'light' | 'dark' | 'soft';
  finish: 'matte' | 'glossy';
  accentColor: string;
  onToggleTheme: () => void;
  onToggleSoftTheme: () => void;
  onToggleFinish: () => void;
  onUpdateAccent: (color: string) => void;
}> = ({ theme, finish, accentColor, onToggleTheme, onToggleSoftTheme, onToggleFinish, onUpdateAccent }) => {
  const colors = [{ hex: '#991b1b' }, { hex: '#1e40af' }, { hex: '#065f46' }, { hex: '#1e1b4b' }, { hex: '#9a3412' }];
  return (
    <div className="settings-page">
      <h1>Ajustes</h1>
      <div className="settings-list">
        <div className="settings-card">
          <div>
            <strong>Tema Atual: {theme.toUpperCase()}</strong>
            <p className="settings-desc">Clique para alternar (Dark / Light)</p>
          </div>
          <button onClick={onToggleTheme} className="btn-titan-sm">ALTERAR</button>
        </div>
        <div className="settings-card">
          <div>
            <strong>Modo Soft</strong>
            <p className="settings-desc">Visual mais suave</p>
          </div>
          <button onClick={onToggleSoftTheme} className="btn-titan-sm">{theme === 'soft' ? 'DESATIVAR' : 'ATIVAR'}</button>
        </div>
        <div className="settings-card" style={{ display: 'block' }}>
          <strong>Cor Personalizada do Chat</strong>
          <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
            {colors.map(c => (
              <div key={c.hex} onClick={() => onUpdateAccent(c.hex)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.hex, cursor: 'pointer', border: accentColor === c.hex ? '3px solid #fff' : 'none' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ====== Main App Component ====== */

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'soft'>(() => (localStorage.getItem('tita-theme') as 'dark' | 'light' | 'soft') || 'dark');
  const [finish, setFinish] = useState<'matte' | 'glossy'>(() => (localStorage.getItem('tita-finish') as 'matte' | 'glossy') || 'glossy');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('tita-chat-accent') || '#991b1b');
  const [isRetracted, setIsRetracted] = useState(() => localStorage.getItem('sidebar-retracted') === 'true');

  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    localStorage.setItem('sidebar-retracted', isRetracted.toString());
  }, [isRetracted]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSoftTheme = () => setTheme(prev => prev === 'soft' ? 'dark' : 'soft');
  const toggleFinish = () => setFinish(prev => prev === 'glossy' ? 'matte' : 'glossy');
  const toggleSidebar = () => setIsRetracted(prev => !prev);

  // Restaurando Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + . : Retração da Sidebar
      if (e.ctrlKey && e.key === '.') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl + Space : Alternar entre Dark e Light
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleTheme();
      }
      // Shift + Space : Alternar Modo Soft
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        toggleSoftTheme();
      }
      // Navegação Histórica (Ctrl + Shift + < ou >)
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === '<' || e.key === ',') { navigate(-1); }
        if (e.key === '>' || e.key === '.') { navigate(1); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRetracted, theme]);

  if (location.pathname === '/') return <Routes><Route path="/" element={<LandingPage />} /></Routes>;

  return (
    <div className={`app-container ${isRetracted ? 'sidebar-retracted' : ''}`}>
      <Sidebar
        isRetracted={isRetracted}
        onToggleRetraction={toggleSidebar}
        theme={theme}
        finish={finish}
        onToggleTheme={toggleTheme}
        onToggleFinish={toggleFinish}
      />
      <main className="main-layout" onClick={() => { if (!isRetracted) setIsRetracted(true); }}>
        <Routes>
          <Route path="/" element={<Navigate to="/atendimento" replace />} />
          <Route path="/atendimento" element={<Atendimento />} />
          <Route path="/atendimento/:chatId" element={<Atendimento />} />
          <Route path="/crm" element={<LeadsManager />} />
          <Route path="/crm/lead/:id" element={<LeadView />} />
          <Route path="/kanban" element={<SalesPipeline />} />
          <Route path="/os" element={<OSManager />} />
          <Route path="/financeiro" element={<FinanceManager />} />
          <Route path="/ocorrencias" element={<OcorrenciasManager />} />
          <Route path="/rede" element={<NetworkManager />} />
          <Route path="/ajustes" element={<SettingsPageWrapper
            theme={theme}
            finish={finish}
            accentColor={accentColor}
            onToggleTheme={toggleTheme}
            onToggleSoftTheme={toggleSoftTheme}
            onToggleFinish={toggleFinish}
            onUpdateAccent={setAccentColor}
          />} />
        </Routes>
      </main>
      <CookieConsent />
    </div>
  );
};

export default App;
