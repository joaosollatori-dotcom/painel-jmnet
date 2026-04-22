import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Key, Envelope, ShieldCheck, ArrowRight, Spinner, Buildings } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

const Auth: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
    const [inviteData, setInviteData] = useState<{ tenant_id: string, role: string, company_name?: string } | null>(null);

    useEffect(() => {
        const token = searchParams.get('invite');
        if (token) {
            setMode('signup');
            validateInvite(token);
        }
    }, [searchParams]);

    const validateInvite = async (token: string) => {
        try {
            const { api } = await import('../services/api');
            const ua = navigator.userAgent;
            const res = await api.post('/v1/invitations/validate', { token, userAgent: ua });

            if (res.data.status === 'VALID') {
                setInviteData({
                    tenant_id: res.data.data.tenant_id,
                    role: res.data.data.role,
                    company_name: res.data.data.company_name
                });
                setEmail(res.data.data.email);
                showToast(`Convite aceito para ${res.data.data.company_name}`, 'success');
            } else if (res.data.status === 'EXPIRED') {
                showToast(res.data.message || 'Convite expirado. Contate o administrador.', 'error');
                setSearchParams({});
                setMode('login');
            } else {
                showToast(res.data.message || 'Convite inválido.', 'error');
                setSearchParams({});
                setMode('login');
            }
        } catch (err) {
            console.error('Invalid invite token:', err);
            showToast('Erro ao validar o convite.', 'error');
            setSearchParams({});
            setMode('login');
        }
    };

    const claimInvite = async (userId: string) => {
        if (!inviteData || !searchParams.get('invite')) return;

        try {
            // 1. Atualizar o Perfil do Usuário com Tenant e Role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    tenant_id: inviteData.tenant_id,
                    role: inviteData.role
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // 2. Marcar convite como utilizado
            const { error: inviteError } = await supabase
                .from('invitations')
                .update({ used_at: new Date().toISOString() })
                .eq('invite_token', searchParams.get('invite'));

            if (inviteError) throw inviteError;

            showToast(`Vínculo com ${inviteData.company_name} estabelecido!`, 'success');
        } catch (err) {
            console.error('Error claiming invite:', err);
            showToast('Falha ao vincular convite à sua conta.', 'error');
        }
    };

    const isMounted = useRef(true);
    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                if (data.user && inviteData && isMounted.current) {
                    await claimInvite(data.user.id);
                }

                if (isMounted.current) showToast('Bem-vindo ao TITÃ ISP!', 'success');
            } else if (mode === 'signup') {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            company_name: inviteData ? inviteData.company_name : companyName,
                            full_name: email.split('@')[0],
                            invite_role: inviteData?.role,
                            invite_tenant_id: inviteData?.tenant_id
                        }
                    }
                });

                if (signUpError) {
                    // Trata erro de SMTP ou usuário já existente que retornou 500
                    if (signUpError.status === 400 || signUpError.status === 500) {
                        if (isMounted.current) {
                            showToast('Esta conta já pode estar ativa. Tente fazer login agora!', 'warning');
                            setMode('login');
                            setLoading(false);
                            return;
                        }
                    }
                    throw signUpError;
                }

                if (signUpData.user && inviteData) {
                    await supabase
                        .from('invitations')
                        .update({ used_at: new Date().toISOString() })
                        .eq('invite_token', searchParams.get('invite'));
                }

                if (isMounted.current) showToast('Verifique seu e-mail para confirmar a conta!', 'success');
            } else {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                if (isMounted.current) showToast('Link de recuperação enviado!', 'success');
            }
        } catch (err: any) {
            if (isMounted.current) showToast(err.message || 'Erro na autenticação', 'error');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    return (
        <div className="auth-hero">
            <div className="auth-container">
                <div className="auth-glass">
                    <header className="auth-header">
                        <div className="auth-logo">
                            <ShieldCheck size={40} weight="fill" className="text-blue-500" />
                            <span>TITÃ | ISP</span>
                        </div>
                        <h2>
                            {mode === 'login' && 'Acesso à Estação Matrix'}
                            {mode === 'signup' && (inviteData ? `Integrar-se à ${inviteData.company_name}` : 'Criar Nova Identidade')}
                            {mode === 'reset' && 'Recuperar Acesso'}
                        </h2>
                        <p>{inviteData ? `Você foi convidado como ${inviteData.role}` : 'Plataforma de Gestão e Inteligência Multi-Tenant'}</p>
                    </header>

                    <form onSubmit={handleAuth} className="auth-form">
                        <div className="titan-field">
                            <label><Envelope size={16} /> E-mail Profissional</label>
                            <input
                                className="titan-input"
                                type="email"
                                placeholder="nome@provedor.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                readOnly={!!inviteData}
                            />
                        </div>

                        {mode !== 'reset' && (
                            <div className="titan-field">
                                <label><Key size={16} /> Chave de Segurança (Senha)</label>
                                <input
                                    className="titan-input"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {mode === 'signup' && !searchParams.get('invite') && !inviteData && (
                            <div className="titan-field">
                                <label><Buildings size={18} /> Nome da Organização / ISP</label>
                                <input
                                    className="titan-input"
                                    placeholder="Ex: PoloNet Telecom"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <button className="btn-titan-auth" disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : (
                                <>
                                    {mode === 'login' ? 'ENTRAR NO SISTEMA' : mode === 'signup' ? (inviteData ? 'ACEITAR CONVITE E CRIAR CONTA' : searchParams.get('invite') ? 'VALIDANDO CONVITE...' : 'FUNDAR ORGANIZAÇÃO & CRIAR CONTA') : 'ENVIAR LINK'}
                                    <ArrowRight weight="bold" />
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="auth-footer">
                        {mode === 'login' ? (
                            <>
                                <button onClick={() => setMode('reset')}>Esqueci minha senha</button>
                                <span className="divider" />
                                <button onClick={() => setMode('signup')}>Ainda não tenho conta</button>
                            </>
                        ) : (
                            <button onClick={() => setMode('login')}>Voltar para o login</button>
                        )}
                    </footer>
                </div>

                <div className="auth-visual">
                    <div className="v-blob" />
                    <div className="v-grid" />
                    <div className="v-content">
                        <h3>Monitoramento Global em Tempo Real</h3>
                        <p>Gerencie leads, ordens de serviço e auditoria em uma única interface blindada.</p>
                        <div className="v-badges">
                            <div className="v-badge"><ShieldCheck size={14} /> Multi-Tenant RLS</div>
                            <div className="v-badge"><Key size={14} /> Audit Trail logs</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
