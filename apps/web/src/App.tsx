import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { supabase } from './lib/supabase';

// Services
import * as chatService from './services/chatService';
import * as userService from './services/userService';
import * as leadService from './services/leadService';
import * as osService from './services/osService';
import * as financeiroService from './services/financeiroService';
import * as auditService from './services/auditService';

const App: React.FC = () => {
  const { session, profile, loading, signOut } = useAuth();
  const { showToast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecuting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message, 'error');
    else showToast('Login realizado', 'success');
    setExecuting(false);
  };

  const runAction = async (name: string, action: () => Promise<any>) => {
    setExecuting(true);
    setResult({ status: 'executing', service: name });
    try {
      const data = await action();
      setResult(data);
      showToast(`${name} executado com sucesso`, 'success');
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message || 'Erro desconhecido' });
      showToast(`Erro em ${name}`, 'error');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando motor Titã...</div>;

  if (!session) {
    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
        <div className="card">
          <h1>Titã Engineering Mode</h1>
          <p style={{ marginBottom: '1.5rem', color: '#888' }}>Validação direta de Backend & Regras de Negócio</p>
          <form onSubmit={handleLogin}>
            <label>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <label>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={executing} style={{ width: '100%', marginTop: '1rem' }}>
              {executing ? 'Autenticando...' : 'Entrar (Acesso Direto)'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Titã Core Dashboard</h1>
          <p>Status: <span className="status-badge status-success">Autenticado</span> | User: {profile?.fullName || session.user.email}</p>
        </div>
        <button onClick={signOut} style={{ background: '#444' }}>Encerrar Sessão</button>
      </header>

      <div className="grid">
        {/* USER & SYSTEM */}
        <div className="card">
          <h3>Usuários & Sistema</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => runAction('getCurrentProfile', () => userService.getCurrentProfile(session.user))}>Get My Profile</button>
            <button onClick={() => runAction('getTenantUsers', () => userService.getTenantUsers(profile?.tenantId || ''))}>List All Profiles</button>
          </div>
        </div>

        {/* CHAT LOGIC */}
        <div className="card">
          <h3>Chat & Atendimento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => runAction('getConversations', () => chatService.getConversations())}>List Conversations</button>
            <button onClick={() => runAction('getInternalMessages', () => chatService.getInternalMessages('general'))}>Internal Chat Logs</button>
          </div>
        </div>

        {/* CRM & SALES */}
        <div className="card">
          <h3>CRM & Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => runAction('getLeads', () => leadService.getLeads())}>List My Leads</button>
            <button onClick={() => runAction('getAppointments', () => leadService.getAppointments())}>Service Appointments</button>
          </div>
        </div>

        {/* OPERATIONAL */}
        <div className="card">
          <h3>Operacional & OS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => runAction('getServiceOrders', () => osService.getServiceOrders())}>List OS (Orders)</button>
            <button onClick={() => runAction('getFaturasSummary', () => financeiroService.getFaturasSummary())}>Get Billing Data</button>
          </div>
        </div>

        {/* AUDIT */}
        <div className="card">
          <h3>Logs & Auditoria</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => runAction('getGlobalAuditLogs', () => auditService.getGlobalAuditLogs())}>Security Audit Logs</button>
          </div>
        </div>
      </div>

      {/* DEBUGGER TIP: To add new tests, import the service and add a button calling runAction('Label', () => service.method()) */}

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Execution Result</h3>
          {executing && <span style={{ color: 'var(--accent)' }}>Processing...</span>}
          <button onClick={() => setResult(null)} style={{ background: '#333', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Clear</button>
        </div>
        <pre>{result ? JSON.stringify(result, null, 2) : '// No action executed yet. Select a service above.'}</pre>
      </div>
    </div>
  );
};

export default App;
