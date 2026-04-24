import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import * as userService from './services/userService';
import * as chatService from './services/chatService';
import * as leadService from './services/leadService';
import * as auditService from './services/auditService';
import * as osService from './services/osService';
import * as invitationService from './services/invitationService';
import * as remoteAccessService from './services/remoteAccessService';
import * as kraService from './services/kraService';
import * as ipService from './services/ipService';

import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, signOut } = useAuth();
  return (
    <div className="tech-dashboard">
      <header>
        <h1>Dashboard de Engenharia (TITÃ V2)</h1>
        <div className="user-blob">
          <span>{profile?.full_name_user} ({profile?.role_user})</span>
          <button onClick={signOut}>Sair</button>
        </div>
      </header>
      {children}
    </div>
  );
};

const MainDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { tenantId } = useParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentIp, setCurrentIp] = useState<string>('Detectando...');

  useEffect(() => {
    ipService.getUserIP().then(setCurrentIp);
  }, []);

  const runAction = async (name: string, fn: () => Promise<any>) => {
    setLoading(true);
    try {
      console.log(`Executando [Tenant: ${tenantId}]: ${name}`);
      const res = await fn();
      setResult(res || { success: true });
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid">
      {/* SEÇÕES ORIGINAIS ADAPTADAS PARA O CONTEXTO DE ROTA */}
      <section className="card">
        <h2>Segurança & Prisma (Contexto: {tenantId})</h2>
        <p>IP Atual: <strong>{currentIp}</strong></p>
        <div className="actions">
          <button onClick={() => runAction('List Invitations', () => invitationService.getInvitations())}>Puxar Convites</button>
          <button onClick={() => runAction('List Allowed IPs', () => remoteAccessService.getAllowedIPs())}>Listar IPs</button>
        </div>
      </section>

      <section className="card">
        <h2>Auditoria Forense</h2>
        <div className="actions">
          <button onClick={() => runAction('Get Audit Logs', () => auditService.getGlobalAuditLogs(40))}>Puxar 40 Eventos</button>
        </div>
      </section>

      <section className="card">
        <h2>Lógica de Negócio (Macro)</h2>
        <div className="actions">
          <button onClick={() => runAction('Get CRM Leads', () => leadService.getLeads())}>CRM Leads</button>
          <button onClick={() => runAction('Get OS', () => osService.getServiceOrders())}>OS Operacional</button>
        </div>
      </section>

      <div className="result-viewer">
        <div className="viewer-header">
          <h3>Production Console [{tenantId}]</h3>
          <button onClick={() => setResult(null)}>Limpar</button>
        </div>
        <pre>
          {loading ? '// Emitindo comandos para o backend...' : result ? JSON.stringify(result, null, 2) : '// Aguardando ação técnica'}
        </pre>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();

  if (authLoading) return <div className="tech-dashboard"><h1>Autenticando no TITÃ...</h1></div>;

  if (!user) {
    return (
      <div className="tech-dashboard">
        <h1>Painel Técnico JMNet (Autenticação Necessária)</h1>
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${profile?.tenant_id_user || 'master'}/dashboard`} replace />} />
      <Route path="/:tenantId/dashboard" element={<Layout><MainDashboard /></Layout>} />
      {/* Futuras rotas dinâmicas como /:tenantId/config/... serão adicionadas aqui */}
    </Routes>
  );
};

export default App;

export default App;
