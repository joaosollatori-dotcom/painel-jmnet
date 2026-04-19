import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Key, Envelope, ShieldCheck, ArrowRight, Spinner } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

const Auth: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                showToast('Bem-vindo ao TITÃ ISP!', 'success');
            } else if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                showToast('Confirme seu e-mail para ativar a conta.', 'info');
            } else {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                showToast('Link de recuperação enviado!', 'success');
            }
        } catch (err: any) {
            showToast(err.message || 'Erro na autenticação', 'error');
        } finally {
            setLoading(false);
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
                            {mode === 'signup' && 'Criar Nova Identidade'}
                            {mode === 'reset' && 'Recuperar Acesso'}
                        </h2>
                        <p>Plataforma de Gestão e Inteligência Multi-Tenant</p>
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

                        <button className="btn-titan-auth" disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : (
                                <>
                                    {mode === 'login' ? 'ENTRAR NO SISTEMA' : mode === 'signup' ? 'CADASTRAR CONTA' : 'ENVIAR LINK'}
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
