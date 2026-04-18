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

/* ====== Agents Page ====== */
const AgentsPage: React.FC = () => {
  const agents = [
    { name: 'Titã AI', description: 'Atendimento automatizado de N1 — responde dúvidas técnicas e direciona ao suporte humano.', active: true, color: '#10b981' },
    { name: 'Vendas Bot', description: 'Qualifica leads e apresenta planos de internet automaticamente.', active: false, color: '#3b82f6' },
    { name: 'Cobranças Bot', description: 'Envia lembretes de fatura e negocia prazos via WhatsApp.', active: false, color: '#f59e0b' },
  ];
  const [states, setStates] = useState(agents.map(a => a.active));
  return (
    <div className="agents-page">
      <h1>Agentes IA</h1>
      <p className="agents-page-subtitle">Gerencie os bots e automações da JMnet Telecom.</p>
      <div className="agents-list">
        {agents.map((a, i) => (
          <div key={i} className="agent-card">
            <div>
              <div className="agent-header">
                <div className="agent-status-dot" style={{ background: states[i] ? '#10b981' : '#6b7280' }} />
                <strong className="agent-name">{a.name}</strong>
              </div>
              <p className="agent-description">{a.description}</p>
            </div>
            <button onClick={() => setStates(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
              className="agent-button"
              style={{ border: `1px solid ${states[i] ? '#ef4444' : '#10b981'}`, color: states[i] ? '#ef4444' : '#10b981' }}>
              {states[i] ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ====== Atendimento Wrap ====== */
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
            <p>Gestão completa de atendimento e infraestrutura.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ====== CRM Lead View ====== */
const LeadView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    if (id) {
      getLeads().then(leads => {
        const found = leads.find(l => l.id === id);
        if (found) setLead(found);
      });
    }
  }, [id]);

  if (!lead) return null;

  return (
    <LeadDetail
      lead={lead}
      onClose={() => navigate('/crm')}
      onUpdate={() => { }}
    />
  );
};

const SettingsPageWrapper: React.FC<{
  theme: 'light' | 'dark' | 'soft';
  finish: 'matte' | 'glossy';
  onToggleTheme: () => void;
  onToggleFinish: () => void;
}> = ({ theme, finish, onToggleTheme, onToggleFinish }) => {
  const [notif, setNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [autoAI, setAutoAI] = useState(true);
  const items = [
    { label: 'Notificações Desktop', desc: 'Receber alertas de novas mensagens', value: notif, toggle: () => setNotif(!notif) },
    { label: 'Sons', desc: 'Reproduzir som ao receber mensagem', value: sound, toggle: () => setSound(!sound) },
    { label: 'IA Automática', desc: 'Ativar Titã AI em novos atendimentos por padrão', value: autoAI, toggle: () => setAutoAI(!autoAI) },
    { label: theme === 'dark' ? 'Modo Escuro' : theme === 'soft' ? 'Modo Soft' : 'Modo Claro', desc: 'Alternar aparência da plataforma (Dark, Light, Soft)', value: theme !== 'light', toggle: onToggleTheme },
    { label: finish === 'matte' ? 'Modo Fosco' : 'Modo Brilho', desc: 'Remover transparências e efeitos de desfoque', value: finish === 'matte', toggle: onToggleFinish },
  ];
  return (
    <div className="settings-page">
      <h1>Ajustes</h1>
      <p className="settings-page-subtitle">Preferências de notificação, aparência e automação.</p>
      <div className="settings-list">
        {items.map((it, i) => (
          <div key={i} className="settings-card">
            <div>
              <strong>{it.label}</strong>
              <p className="settings-desc">{it.desc}</p>
            </div>
            <button onClick={it.toggle} className="settings-toggle-btn" style={{ background: it.value ? 'var(--accent)' : '#555' }}>
              <div className="settings-toggle-dot" style={{ left: it.value ? '25px' : '3px' }} />
            </button>
          </div>
        ))}

        {/* Logout Section */}
        <div className="logout-section">
          <div>
            <strong className="logout-title">Deseja sair da conta?</strong>
            <p className="logout-desc">Sua sessão será encerrada com segurança.</p>
          </div>
          <button
            onClick={() => { if (window.confirm('Deseja realmente sair?')) window.location.reload(); }}
            className="logout-button"
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div >
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'soft'>(() => {
    return (localStorage.getItem('tita-theme') as 'dark' | 'light' | 'soft') || 'dark';
  });
  const [finish, setFinish] = useState<'matte' | 'glossy'>(() => {
    return (localStorage.getItem('tita-finish') as 'matte' | 'glossy') || 'glossy';
  });
  const [isRetracted, setIsRetracted] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  React.useEffect(() => {
    trackModuleAccess(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (localStorage.getItem('cookie-consent') === 'accepted') {
      localStorage.setItem('tita-theme', theme);
    }
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-finish', finish);
    if (localStorage.getItem('cookie-consent') === 'accepted') {
      localStorage.setItem('tita-finish', finish);
    }
  }, [finish]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSoftTheme = () => {
    setTheme(prev => prev === 'soft' ? 'dark' : 'soft');
  };
  const toggleFinish = () => {
    setFinish(prev => prev === 'glossy' ? 'matte' : 'glossy');
  };
  const toggleSidebar = () => setIsRetracted(prev => !prev);
  const retractSidebar = () => {
    if (!isRetracted) setIsRetracted(true);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '.') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleTheme();
      }
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        toggleSoftTheme();
      }
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === '<' || e.key === ',') {
          e.preventDefault();
          navigate(-1);
        }
        if (e.key === '>' || e.key === '.') {
          e.preventDefault();
          navigate(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRetracted, theme]);

  if (isLanding) {
    return (
      <div className="app-container no-sidebar">
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
        <CookieConsent />
      </div>
    );
  }

  return (
    <div className={`app-container ${isRetracted ? 'sidebar-retracted' : ''}`}>
      <div className="sidebar-placeholder" onClick={retractSidebar} />
      <Sidebar
        isRetracted={isRetracted}
        onToggleRetraction={toggleSidebar}
        theme={theme}
        finish={finish}
        onToggleTheme={toggleTheme}
        onToggleFinish={toggleFinish}
      />
      <button className="mobile-menu-trigger" onClick={toggleSidebar}>
        <div className="hamburger" />
      </button>
      <main className="main-layout" onClick={() => { if (!isRetracted) setIsRetracted(true); }}>
        <Routes>
          <Route path="/" element={<Navigate to="/atendimento" replace />} />

          <Route path="/atendimento" element={<Atendimento />} />
          <Route path="/atendimento/:chatId" element={<Atendimento />} />

          <Route path="/interno" element={<InternalChat />} />
          <Route path="/agentes" element={<AgentsPage />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/crm" element={<LeadsManager />} />
          <Route path="/crm/lead/:id" element={<LeadView />} />
          <Route path="/crm_tasks" element={<AppointmentManager />} />

          <Route path="/kanban" element={<SalesPipeline />} />
          <Route path="/automacoes" element={<AutomationsDashboard />} />
          <Route path="/relatorios" element={<LeadReports leads={[]} />} />
          <Route path="/financeiro" element={<FinanceManager />} />
          <Route path="/os" element={<OSManager />} />
          <Route path="/os/:osId" element={<OSManager />} />
          <Route path="/ocorrencias" element={<OcorrenciasManager />} />
          <Route path="/rede" element={<NetworkManager />} />
          <Route path="/ajustes" element={<SettingsPageWrapper
            theme={theme}
            finish={finish}
            onToggleTheme={toggleTheme}
            onToggleFinish={toggleFinish}
          />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          <Route path="*" element={
            <div className="welcome-screen">
              <div className="welcome-content">
                <h2>Página não encontrada</h2>
                <p>O módulo solicitado não está disponível no momento.</p>
              </div>
            </div>
          } />
        </Routes>
      </main>
      <CookieConsent />
    </div>
  );
};

export default App;
