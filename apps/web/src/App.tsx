import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { getConversations } from './services/chatService';
import type { Conversation } from './services/chatService';
import { getLeads } from './services/leadService';
import { AnimatePresence } from 'framer-motion';
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
    <div style={{ padding: 'var(--space-lg)', flex: 1, overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Agentes IA</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Gerencie os bots e automações da JMnet Telecom.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
        {agents.map((a, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: states[i] ? '#10b981' : '#6b7280' }} />
                <strong style={{ fontSize: '1.1rem' }}>{a.name}</strong>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{a.description}</p>
            </div>
            <button onClick={() => setStates(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
              style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', border: `1px solid ${states[i] ? '#ef4444' : '#10b981'}`, background: 'transparent', color: states[i] ? '#ef4444' : '#10b981', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
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

  return (
    <>
      <ChatList selectedChatId={chatId || null} onSelectChat={(id) => navigate(`/atendimento/${id}`)} />
      {chatId ? (
        <ChatArea chatId={chatId} />
      ) : (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>Bem-vindo ao TITÃ | ISP</h2>
            <p>Gestão completa de atendimento e infraestrutura.</p>
          </div>
        </div>
      )}
    </>
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

const SettingsPageWrapper: React.FC<{ theme: 'light' | 'dark'; onToggleTheme: () => void }> = ({ theme, onToggleTheme }) => {
  const [notif, setNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [autoAI, setAutoAI] = useState(true);
  const toggleStyle = (active: boolean) => ({
    width: '48px', height: '26px', borderRadius: '999px', border: 'none',
    background: active ? 'var(--accent)' : '#555', position: 'relative' as const, cursor: 'pointer', transition: 'background 0.2s',
  });
  const dotStyle = (active: boolean) => ({
    width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute' as const, top: '3px',
    left: active ? '25px' : '3px', transition: 'left 0.2s',
  });
  const items = [
    { label: 'Notificações Desktop', desc: 'Receber alertas de novas mensagens', value: notif, toggle: () => setNotif(!notif) },
    { label: 'Sons', desc: 'Reproduzir som ao receber mensagem', value: sound, toggle: () => setSound(!sound) },
    { label: 'IA Automática', desc: 'Ativar Titã AI em novos atendimentos por padrão', value: autoAI, toggle: () => setAutoAI(!autoAI) },
    { label: theme === 'dark' ? 'Modo Escuro' : 'Modo Claro', desc: 'Alternar aparência da plataforma', value: theme === 'dark', toggle: onToggleTheme },
  ];
  return (
    <div style={{ padding: 'var(--space-lg)', flex: 1, overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Ajustes</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Preferências de notificação, aparência e automação.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{it.label}</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>{it.desc}</p>
            </div>
            <button onClick={it.toggle} style={toggleStyle(it.value)}>
              <div style={dotStyle(it.value)} />
            </button>
          </div>
        ))}

        {/* Logout Section */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#ef4444' }}>Deseja sair da conta?</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>Sua sessão será encerrada com segurança.</p>
          </div>
          <button
            onClick={() => { if (window.confirm('Deseja realmente sair?')) window.location.reload(); }}
            style={{
              padding: '10px 24px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div >
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRetracted, setIsRetracted] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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

  return (
    <div className={`app-container ${isRetracted ? 'sidebar-retracted' : ''}`}>
      <div className="sidebar-placeholder" onClick={retractSidebar} />
      <Sidebar
        isRetracted={isRetracted}
        onToggleRetraction={toggleSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="main-layout" onClick={retractSidebar}>
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
          <Route path="/ocorrencias" element={<OcorrenciasManager />} />
          <Route path="/rede" element={<NetworkManager />} />
          <Route path="/ajustes" element={<SettingsPageWrapper theme={theme} onToggleTheme={toggleTheme} />} />

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
    </div>
  );
};

export default App;
