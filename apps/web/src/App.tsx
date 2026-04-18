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
  accentColor: string;
  onToggleTheme: () => void;
  onToggleFinish: () => void;
  onUpdateAccent: (color: string) => void;
}> = ({ theme, finish, accentColor, onToggleTheme, onToggleFinish, onUpdateAccent }) => {
  const [notif, setNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [autoAI, setAutoAI] = useState(true);

  const colors = [
    { name: 'Titã Red', hex: '#991b1b' },
    { name: 'Royal Blue', hex: '#1e40af' },
    { name: 'Emerald', hex: '#065f46' },
    { name: 'Midnight', hex: '#1e1b4b' },
    { name: 'Sunset', hex: '#9a3412' }
  ];

  const items = [
    { label: 'Notificações Desktop', desc: 'Receber alertas de novas mensagens', value: notif, toggle: () => setNotif(!notif) },
    { label: 'Sons', desc: 'Reproduzir som ao receber mensagem', value: sound, toggle: () => setSound(!sound) },
    { label: 'IA Automática', desc: 'Ativar Titã AI em novos atendimentos por padrão', value: autoAI, toggle: () => setAutoAI(!autoAI) },
    { label: theme === 'dark' ? 'Modo Escuro' : theme === 'soft' ? 'Modo Soft' : 'Modo Claro', desc: 'Alternar aparência da plataforma', value: theme !== 'light', toggle: onToggleTheme },
    { label: finish === 'matte' ? 'Modo Fosco' : 'Modo Brilho', desc: 'Ajustar reflexos e transparência', value: finish === 'matte', toggle: onToggleFinish },
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

        <div className="settings-card" style={{ display: 'block' }}>
          <strong>Cor dos Balões de Chat</strong>
          <p className="settings-desc">Personalize a cor das suas mensagens enviadas.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
            {colors.map(c => (
              <div
                key={c.hex}
                onClick={() => onUpdateAccent(c.hex)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: c.hex,
                  cursor: 'pointer', border: accentColor === c.hex ? '3px solid #fff' : 'none',
                  boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
                }}
                title={c.name}
              />
            ))}
          </div>
        </div>

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
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('tita-chat-accent') || '#991b1b';
  });

  const location = useLocation();
  const navigate = useNavigate();
  const isRetracted = location.pathname !== '/atendimento' && (localStorage.getItem('sidebar-retracted') === 'true');

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

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleFinish = () => setFinish(prev => prev === 'glossy' ? 'matte' : 'glossy');

  return (
    <div className="app-container">
      <Sidebar
        isRetracted={false}
        onToggleRetraction={() => { }}
        theme={theme}
        finish={finish}
        onToggleTheme={toggleTheme}
        onToggleFinish={toggleFinish}
      />
      <main className="main-layout" style={{ paddingLeft: '280px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/atendimento" replace />} />
          <Route path="/atendimento" element={<Atendimento />} />
          <Route path="/atendimento/:chatId" element={<Atendimento />} />
          <Route path="/crm" element={<LeadsManager />} />
          <Route path="/crm/lead/:id" element={<LeadView />} />
          <Route path="/kanban" element={<SalesPipeline />} />
          <Route path="/ajustes" element={<SettingsPageWrapper
            theme={theme}
            finish={finish}
            accentColor={accentColor}
            onToggleTheme={toggleTheme}
            onToggleFinish={toggleFinish}
            onUpdateAccent={setAccentColor}
          />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
