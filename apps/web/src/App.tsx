import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import Dashboard from './components/Dashboard';
import InternalChat from './components/InternalChat';
import OSManager from './components/OSManager';
import FinanceManager from './components/FinanceManager';
import NetworkManager from './components/NetworkManager';
import LeadsManager from './components/LeadsManager';
import { getConversations } from './services/chatService';
import type { Conversation } from './services/chatService';
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
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
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

/* ====== CRM Page ====== */
const CRMPage: React.FC = () => {
  const [clients, setClients] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => { getConversations().then(setClients); }, []);
  const filtered = clients.filter(c => c.contact_name.toLowerCase().includes(search.toLowerCase()) || c.contact_phone?.includes(search));
  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Clientes CRM</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Base de clientes carregada do Supabase em tempo real.</p>
      <input type="text" placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {filtered.map(c => (
          <div key={c.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{c.contact_name.charAt(0)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.contact_name}</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.contact_phone || 'Sem telefone'}</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: c.is_closed ? '#ef444420' : '#10b98120', color: c.is_closed ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {c.is_closed ? 'Encerrado' : 'Ativo'}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }}>{c.platform}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Nenhum cliente encontrado.</p>}
      </div>
    </div>
  );
};

/* ====== Settings Page ====== */
const SettingsPage: React.FC<{ theme: 'light' | 'dark'; onToggleTheme: () => void }> = ({ theme, onToggleTheme }) => {
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
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
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
      </div>
    </div>
  );
};

/* ====== Financeiro Page Gerenciado por components/FinanceManager.tsx ====== */


/* ====== OS Page Gerenciado por components/OSManager.tsx ====== */


/* ====== Rede Page Gerenciado por components/NetworkManager.tsx ====== */


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
                  <h2>Bem-vindo ao TITÃ | ISP</h2>
                  <p>Gestão completa de atendimento e infraestrutura.</p>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'dashboard' ? (
          <Dashboard />
        ) : activeTab === 'internal_chat' ? (
          <InternalChat />
        ) : activeTab === 'agents' ? (
          <AgentsPage />
        ) : activeTab === 'crm' ? (
          <LeadsManager />
        ) : activeTab === 'financeiro' ? (
          <FinanceManager />
        ) : activeTab === 'os' ? (
          <OSManager />
        ) : activeTab === 'rede' ? (
          <NetworkManager />
        ) : activeTab === 'settings' ? (
          <SettingsPage theme={theme} onToggleTheme={toggleTheme} />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h2>Módulo {activeTab.toUpperCase()}</h2>
              <p>Esta seção está sendo configurada com os dados do seu provedor.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
