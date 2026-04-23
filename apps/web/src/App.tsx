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
        {/* 1. SEÇÃO DE SEGURANÇA (ZONA DE PRODUÇÃO) */}
        <section className="card">
          <h2>Segurança & Prisma de Vinculação (Real)</h2>
          <p>IP Atual: <strong>{currentIp}</strong></p>
          <div className="actions">
            <div className="group">
              <h3>Gestão de Convites + Contas</h3>
              <button onClick={() => runAction('List Invitations', () => invitationService.getInvitations())}>Puxar Convites</button>
              <button onClick={() => {
                const email = prompt('E-mail do novo usuário:');
                const password = prompt('Senha temporária para o usuário:');
                if (email && password && profile?.tenant_id_user) {
                  runAction('Create User & Invite (Prisma Bind)',
                    () => invitationService.createInvitationWithUser(email, password, 'ADMIN', profile.tenant_id_user!)
                  );
                }
              }}>Criar Conta & Convite</button>
              <button onClick={() => {
                const id = prompt('ID do convite:');
                if (id) runAction('Reset Prisma', () => invitationService.resetInvitation(id));
              }}>Resetar Vínculo (ID)</button>
              <button onClick={() => {
                const id = prompt('ID do convite:');
                if (id) runAction('Cancel (Delete)', () => invitationService.cancelInvitation(id));
              }}>Excluir Permanente (ID)</button>
            </div>

            <div className="group">
              <h3>Whitelist de Produção</h3>
              <button onClick={() => runAction('List Allowed IPs', () => remoteAccessService.getAllowedIPs())}>Listar IPs</button>
              <button onClick={() => runAction('Add Current', () => remoteAccessService.addAllowedIP(currentIp, 'Suporte Manual', 24))}>Liberar 24h</button>
              <button onClick={() => {
                const id = prompt('ID do IP:');
                if (id) runAction('Remove IP', () => remoteAccessService.removeAllowedIP(id));
              }}>Remover Acesso (ID)</button>
            </div>

            <div className="group">
              <h3>KRA / CVA Support (Zero Simulation)</h3>
              <button onClick={() => {
                const code = prompt('Código CVA:');
                if (code) runAction('Validate & Auto-Lock', () => kraService.validateCVA(code, currentIp));
              }}>Validar CVA & Liberar IP</button>
              <button onClick={() => runAction('Generate CVA Key', () => remoteAccessService.generateRemoteAccessKey(1))}>Gerar Chave KRA (1h)</button>
              <button onClick={() => runAction('List All Keys', () => remoteAccessService.listRemoteAccessKeys())}>Ver Chaves CVA</button>
            </div>
          </div>
        </section>

        {/* 2. LOGS & AUDITORIA */}
        <section className="card">
          <h2>Auditoria Forense (Logs Reais)</h2>
          <div className="actions">
            <button onClick={() => runAction('Get Audit Logs', () => auditService.getGlobalAuditLogs(40))}>Puxar 40 Eventos</button>
          </div>
        </section>

        {/* 3. CORE DATA */}
        <section className="card">
          <h2>Lógica de Negócio (Stretched)</h2>
          <div className="actions">
            <button onClick={() => runAction('Get CRM Leads', () => leadService.getLeads())}>CRM Leads</button>
            <button onClick={() => runAction('Get Chat Conversations', () => chatService.getConversations())}>Conversas</button>
            <button onClick={() => runAction('Get OS', () => osService.getServiceOrders())}>OS Operacional</button>
          </div>
        </section>
      </div>

      <div className="result-viewer">
        <div className="viewer-header">
          <h3>Production Console</h3>
          <button onClick={() => setResult(null)}>Limpar</button>
        </div>
        <pre>
          {loading ? '// Emitindo comandos para o backend...' : result ? JSON.stringify(result, null, 2) : '// Aguardando ação técnica'}
        </pre>
      </div>
    </div>
  );
};

export default App;
