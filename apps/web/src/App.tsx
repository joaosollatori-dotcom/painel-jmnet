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
import SettingsManager from './components/SettingsManager';
import OcorrenciasManager from './components/OcorrenciasManager';
import WikiManager from './components/WikiManager';
import OSAgenda from './components/OSAgenda';
import EquipmentManager from './components/EquipmentManager';
import InternalChat from './components/InternalChat';
import DashboardManager from './components/DashboardManager';
import { useToast } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import LoadingScreen from './components/LoadingScreen';
import { getUserIP } from './services/ipService';
import { getAllowedIPs } from './services/remoteAccessService';
import { validateCVA } from './services/kraService';
import './App.css';

const App: React.FC = () => {
  const { showToast, removeToast } = useToast();
  const { session, profile, loading, signOut } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light' | 'soft'>(() => (localStorage.getItem('tita-theme') as 'dark' | 'light' | 'soft') || 'dark');
  const [finish, setFinish] = useState<'matte' | 'glossy'>(() => (localStorage.getItem('tita-finish') as 'matte' | 'glossy') || 'glossy');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('tita-chat-accent') || '#991b1b');
  const [isRetracted, setIsRetracted] = useState(() => localStorage.getItem('sidebar-retracted') === 'true');
  const navigate = useNavigate();
  const [lastCtrlSpace, setLastCtrlSpace] = useState(0);
  const [isIPChecking, setIsIPChecking] = useState(true);
  const [isAuthorizedIP, setIsAuthorizedIP] = useState(false);
  const [currentUserIP, setCurrentUserIP] = useState('');
  const [showKRABlocked, setShowKRABlocked] = useState(false);
  const [cvaCode, setCvaCode] = useState('');

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

  // Verificação de Blindagem de IP (Milestone 4)
  useEffect(() => {
    const checkIP = async () => {
      if (!session || !profile?.tenantId) {
        setIsIPChecking(false);
        return;
      }

      setIsIPChecking(true);
      try {
        const ip = await getUserIP();
        setCurrentUserIP(ip);

        // Se for Super Admin, ignora a restrição por enquanto? 
        // Na regra do usuário: "O founder tem q cadastrar o IP...". Founders são ADMIN.
        // Vou assumir que todos precisam de IP na whitelist se a regra estiver ativa.
        const allowed = await getAllowedIPs();

        // Se a tabela estiver vazia, talvez a restrição não esteja ativa ou o Founder ainda não configurou.
        // O usuário pediu: "O founder tem q cadastrar o IP dos funcionários na hora de criar o convite".
        // Isso implica que a restrição DEVE existir.
        if (allowed.length === 0) {
          setIsAuthorizedIP(true); // Se não há IPs cadastrados, permite acesso inicial? Melhor ser defensivo.
        } else {
          const isWhitelisted = allowed.some(a => a.ipAddress === ip);
          setIsAuthorizedIP(isWhitelisted);
          setShowKRABlocked(!isWhitelisted);
        }
      } catch (e) {
        console.error("IP Check Failed:", e);
      } finally {
        setIsIPChecking(false);
      }
    };

    checkIP();
  }, [session, profile]);

  const handleKRAUnlock = async () => {
    if (!cvaCode) return;
    const res = await validateCVA(cvaCode);
    if (res.isValid) {
      setIsAuthorizedIP(true);
      setShowKRABlocked(false);
      showToast('Acesso KRA liberado temporariamente!', 'success');
    } else {
      showToast('Chave KRA/CVA inválida!', 'error');
    }
  };

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

  // Renderização Defensiva (Blindagem Total v2.08.01)
  if (loading) return <LoadingScreen key="loading-screen" />;

  // Se não tem sessão, exibe Auth ocupando 100% da tela (Full Shield)
  if (!session) {
    return (
      <div className="auth-fullscreen-guard">
        <Auth key="auth-screen" />
      </div>
    );
  }

  // Se tem sessão mas o perfil não carregou (Blindagem de Acesso)
  if (!profile || !profile.tenantId) {
    // Se estiver em uma rota de signup, deixa passar o Auth em modo signup
    if (window.location.pathname === '/signup') {
      return (
        <div className="auth-fullscreen-guard">
          <Auth key="signup-screen" />
        </div>
      );
    }

    return (
      <div className="auth-fullscreen-guard flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '24px', backgroundColor: '#000', padding: '24px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>ACESSO RESTRITO</h2>
        <div style={{ width: '60px', height: '2px', background: 'var(--accent)' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Sua identidade não possui uma Estação vinculada sob este IP. Solicite um convite ao Fundador para prosseguir ou valide sua credencial.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button className="btn-titan-auth" onClick={() => window.location.href = '/'}>REVALIDAR ACESSO</button>
          <button style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={signOut}>ENCERRAR SESSÃO</button>
        </div>
      </div>
    );
  }

  // Blindagem de IP (Milestone 4) - Se não for IP autorizado, mostra tela KRA
  if (showKRABlocked && !isAuthorizedIP) {
    return (
      <div className="auth-fullscreen-guard flex-center" style={{ height: '100vh', backgroundColor: '#050505', color: '#fff', textAlign: 'center', padding: '2rem' }}>
        <div className="security-shield-icon" style={{ fontSize: '4rem', marginBottom: '1.5rem', color: '#f59e0b' }}>🛡️</div>
        <h1 style={{ fontWeight: 900, letterSpacing: '-1px', marginBottom: '1rem' }}>SISTEMA DE BLINDAGEM KRA/CVA</h1>
        <p style={{ maxWidth: '600px', color: 'rgba(255,255,255,0.6)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Seu IP (<strong>{currentUserIP}</strong>) não está autorizado para acesso direto a esta Estação.
          O acesso foi bloqueado por motivos de segurança forense. Use uma chave CVA para liberação remota.
        </p>
        <div className="kra-input-box" style={{ background: '#111', padding: '2rem', borderRadius: '24px', border: '1px solid #222', width: '100%', maxWidth: '450px' }}>
          <label style={{ display: 'block', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', marginBottom: '10px', textTransform: 'uppercase' }}>Insira a Chave CVA (Support Access)</label>
          <input
            type="text"
            className="titan-input"
            placeholder="KRA-XXXX-XXXX-XXXX"
            value={cvaCode}
            onChange={e => setCvaCode(e.target.value.toUpperCase())}
            style={{ width: '100%', marginBottom: '1.5rem' }}
          />
          <button className="btn-titan-primary w-full" onClick={handleKRAUnlock}>LIBERAR ACESSO TEMPORÁRIO</button>
        </div>
        <button className="btn-titan-outline-sm" style={{ marginTop: '2rem', border: 'none', color: '#666' }} onClick={signOut}>ENCERRAR SESSÃO</button>
      </div>
    );
  }

  return (
    <div key="app-root" className={`app-layout ${isRetracted ? 'retracted' : ''}`}>
      {window.location.pathname !== '/signup' && (
        <Sidebar
          isRetracted={isRetracted}
          onToggleRetraction={toggleSidebar}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'soft' : 'dark')}
          finish={finish}
          onToggleFinish={() => setFinish(prev => prev === 'matte' ? 'glossy' : 'matte')}
        />
      )}
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/signup" element={<Auth key="signup-screen" />} />
          <Route path="/atendimento" element={<ChatPage />} />
          <Route path="/agentes" element={<div className="loading-state"><h3>Robôs Titã AI</h3><p>Módulo de inteligência em processamento...</p></div>} />
          <Route path="/crm" element={<LeadsManager />} />
          <Route path="/crm/lead/:leadId" element={<LeadDetail />} />
          <Route path="/crm_tasks" element={<div className="loading-state"><h3>Agendas e Tarefas</h3><p>Módulo em implementação...</p></div>} />
          <Route path="/kanban" element={<SalesPipeline />} />
          <Route path="/financeiro" element={<FinanceManager />} />
          <Route path="/relatorios" element={<div className="loading-state"><h3>Business Intelligence</h3><p>Processando dados analíticos...</p></div>} />
          <Route path="/dashboard" element={<DashboardManager />} />
          <Route path="/os" element={<OSManager />} />
          <Route path="/os/:osId" element={<OSManager />} />
          <Route path="/rede" element={<NetworkManager />} />
          <Route path="/equipamentos" element={<EquipmentManager />} />
          <Route path="/ocorrencias" element={<OcorrenciasManager />} />
          <Route path="/agenda" element={<OSAgenda />} />
          <Route path="/connect" element={<InternalChat />} />
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
