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

const App: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentIp, setCurrentIp] = useState<string>('Detectando...');

  useEffect(() => {
    ipService.getUserIP().then(setCurrentIp);
  }, []);

  const runAction = async (name: string, fn: () => Promise<any>) => {
    setLoading(true);
    try {
      console.log(`Executando: ${name}`);
      const res = await fn();
      setResult(res || { success: true });
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="tech-dashboard">
        <h1>Painel Técnico JMNet (Autenticação Necessária)</h1>
        <p>Use o formulário de login padrão ou convite.</p>
      </div>
    );
  }

  return (
    <div className="tech-dashboard">
      <header>
        <h1>Dashboard de Engenharia</h1>
        <div className="user-blob">
          <span>{profile?.full_name_user} ({profile?.role_user})</span>
          <button onClick={signOut}>Sair</button>
        </div>
      </header>

      <div className="grid">
        {/* 1. SEÇÃO DE SEGURANÇA */}
        <section className="card">
          <h2>Autenticação & Segurança (Produção)</h2>
          <p>IP Atual: <strong>{currentIp}</strong></p>
          <div className="actions">
            <div className="group">
              <h3>Convites (Invites)</h3>
              <button onClick={() => runAction('List Invitations', () => invitationService.getInvitations())}>Listar Ativos</button>
              <button onClick={() => {
                const email = prompt('Email do alvo:');
                if (email) runAction('Create Invite', () => invitationService.createInvitation(email, 'ADMIN'));
              }}>Novo Convite (ADMIN)</button>
              <button onClick={() => {
                const id = prompt('ID do convite:');
                if (id) runAction('Reset Invite', () => invitationService.resetInvitation(id));
              }}>Reset Link (ID)</button>
              <button onClick={() => {
                const id = prompt('ID do convite:');
                if (id) runAction('Cancel Invite', () => invitationService.cancelInvitation(id));
              }}>Cancelar Convite (ID)</button>
            </div>

            <div className="group">
              <h3>Whitelist de IP</h3>
              <button onClick={() => runAction('List Allowed IPs', () => remoteAccessService.getAllowedIPs())}>Listar IPs Permitidos</button>
              <button onClick={() => runAction('Add Current IP', () => remoteAccessService.addAllowedIP(currentIp, 'Suporte Manual'))}>Liberar Meu IP</button>
              <button onClick={() => {
                const id = prompt('ID do IP p/ remover:');
                if (id) runAction('Remove IP', () => remoteAccessService.removeAllowedIP(id));
              }}>Bloquear IP (Remover ID)</button>
            </div>

            <div className="group">
              <h3>KRA / CVA Support</h3>
              <button onClick={() => {
                const code = prompt('Código CVA:');
                if (code) runAction('Validate CVA', () => kraService.validateCVA(code, currentIp));
              }}>Validar CVA & Desbloquear</button>
            </div>
          </div>
        </section>

        {/* 2. LOGS & AUDITORIA */}
        <section className="card">
          <h2>Auditoria (Real Time)</h2>
          <div className="actions">
            <button onClick={() => runAction('Get Audit Logs', () => auditService.getGlobalAuditLogs(20))}>Puxar 20 Logs</button>
          </div>
        </section>

        {/* 3. CORE DATA */}
        <section className="card">
          <h2>Engenharia de Dados</h2>
          <div className="actions">
            <button onClick={() => runAction('Get CRM Leads', () => leadService.getLeads())}>Leads CRM</button>
            <button onClick={() => runAction('Get Chat', () => chatService.getConversations())}>Conversas</button>
            <button onClick={() => runAction('Get OS', () => osService.getServiceOrders())}>Ordens de Serviço</button>
          </div>
        </section>
      </div>

      {/* CONSOLE DE RESULTADOS */}
      <div className="result-viewer">
        <div className="viewer-header">
          <h3>Resultado da Execução (JSON Bruto)</h3>
          <button onClick={() => setResult(null)}>Limpar</button>
        </div>
        <pre>
          {loading ? '// Carregando dados de produção...' : result ? JSON.stringify(result, null, 2) : '// Escolha uma ação para validar a engenharia de backend'}
        </pre>
      </div>
    </div>
  );
};

export default App;
