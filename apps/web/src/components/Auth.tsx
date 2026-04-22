import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Key, Envelope, ShieldCheck, ArrowRight, Spinner, Buildings, IdentificationCard, UserCircle, Cpu, Lock } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

// Componente de Partículas Minimalista (Estilo Security Grid)
const Particles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            resize();
            particles = Array.from({ length: 50 }, () => new Particle());
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Desenhar conexões próximas
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();
        window.addEventListener('resize', resize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="particles-canvas" />;
};

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
            } else {
                showToast(res.data.message || 'Convite inválido.', 'error');
                setMode('login');
            }
        } catch (err) {
            console.error('Invalid invite token:', err);
            setMode('login');
        }
    };

    const claimInvite = async (userId: string) => {
        if (!inviteData || !searchParams.get('invite')) return;
        try {
            const { error: profileError } = await supabase.from('profiles').update({
                tenant_id: inviteData.tenant_id,
                role: inviteData.role
            }).eq('id', userId);
            if (profileError) throw profileError;

            await supabase.from('invitations').update({ used_at: new Date().toISOString() })
                .eq('invite_token', searchParams.get('invite'));

            showToast(`Sua conta agora está vinculada a ${inviteData.company_name || 'Organização'}`, 'success');
        } catch (err) {
            console.error('Error claiming invite:', err);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (data.user && inviteData) await claimInvite(data.user.id);
                showToast('Acesso validado. Bem-vindo à Estação Matrix.', 'success');
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
                    if (signUpError.message.toLowerCase().includes('already registered') || signUpError.status === 400) {
                        showToast('Você já possui uma conta! Detectamos seu registro anterior.', 'info');
                        setMode('login');
                        setLoading(false);
                        return;
                    }
                    throw signUpError;
                }

                if (signUpData.user && inviteData) {
                    await supabase.from('invitations').update({ used_at: new Date().toISOString() })
                        .eq('invite_token', searchParams.get('invite'));
                }
                showToast('Identidade criada. Verifique seu e-mail para confirmação final.', 'success');
            } else {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                showToast('Instruções de recuperação enviadas.', 'success');
            }
        } catch (err: any) {
            showToast(err.message || 'Erro na autenticação de segurança', 'error');
        } finally {
            setLoading(true); // Manter carregando até o redirect do AuthContext
        }
    };

    return (
        <div className="auth-hero">
            <div className="auth-container">
                <div className="auth-glass">
                    <header className="auth-header">
                        <div className="auth-logo">
                            <ShieldCheck size={40} weight="fill" color="#3b82f6" />
                            <span>TITÃ | ISP</span>
                        </div>
                        <h2>
                            {mode === 'login' && (inviteData ? 'Vincular Identidade' : 'Estação de Comando')}
                            {mode === 'signup' && (inviteData ? `Integrar-se à ${inviteData.company_name || 'Organização'}` : 'Fundar Nova Estação')}
                            {mode === 'reset' && 'Recuperar Segurança'}
                        </h2>
                        <p>
                            {inviteData
                                ? `Protocolo de acesso ativo para ${inviteData.role}.`
                                : 'Ambiente de gestão blindada para ISPs de alta performance.'}
                        </p>

                        {inviteData && (
                            <div className="invite-badge">
                                <span className="invite-tag">Protocolo Válido</span>
                                <div className="invite-badge-icon">
                                    <IdentificationCard size={32} weight="duotone" />
                                </div>
                                <div className="invite-badge-info">
                                    <h4>Nível de Acesso</h4>
                                    <p>{inviteData.role} • {inviteData.company_name || 'TITÃ'}</p>
                                </div>
                            </div>
                        )}

                        {mode === 'signup' && inviteData && (
                            <div className="invite-tip">
                                <span>Já é um oficial da plataforma?</span>
                                <button type="button" onClick={() => setMode('login')}>Entrar e vincular contrato</button>
                            </div>
                        )}
                    </header>

                    <form onSubmit={handleAuth} className="auth-form">
                        <div className="titan-field">
                            <label><Envelope size={16} /> Identidade Digital (E-mail)</label>
                            <input
                                className="titan-input"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                readOnly={!!inviteData}
                                placeholder="usuario@tita.com"
                            />
                        </div>

                        {mode !== 'reset' && (
                            <div className="titan-field">
                                <label><Lock size={16} /> Chave de Segurança (Senha)</label>
                                <input
                                    className="titan-input"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {mode === 'signup' && !inviteData && (
                            <>
                                <div className="titan-field">
                                    <label><Buildings size={18} /> Nome da Organização</label>
                                    <input
                                        className="titan-input"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        required
                                        placeholder="Minha Empresa ISP"
                                    />
                                </div>
                                <div className="titan-field">
                                    <label><Cpu size={18} /> Identificador de Sistema (Slug)</label>
                                    <input
                                        className="titan-input"
                                        value={companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}
                                        readOnly
                                    />
                                </div>
                            </>
                        )}

                        <button className="btn-titan-auth" disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : (
                                <>
                                    {mode === 'login'
                                        ? (inviteData ? 'ENTRAR E VINCULAR AO CONVITE' : 'ENTRAR NA ESTAÇÃO')
                                        : mode === 'signup'
                                            ? (inviteData ? 'CRIAR CONTA E ACEITAR CONVITE' : 'FUNDAR ESTAÇÃO & CRIAR CONTA')
                                            : 'SOLICITAR RECONEXÃO'}
                                    <ArrowRight size={18} weight="bold" />
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="auth-footer">
                        {mode === 'login' ? (
                            <>
                                <button onClick={() => setMode('reset')}>Recuperar Chave</button>
                                <span className="divider" />
                                <button onClick={() => setMode('signup')}>Ainda não tenho acesso</button>
                            </>
                        ) : (
                            <button onClick={() => setMode('login')}>Voltar para Login</button>
                        )}
                    </footer>
                </div>

                <div className="auth-visual">
                    <Particles />
                    <div className="v-grid" />
                    <div className="v-content">
                        <h3>Gestão Central Blindada</h3>
                        <p>Infraestrutura multi-tenant com isolamento de dados via RLS e auditoria militar.</p>
                        <div className="v-badges">
                            <div className="v-badge"><ShieldCheck size={18} weight="bold" /> Proteção RLS Ativa</div>
                            <div className="v-badge"><Lock size={18} weight="bold" /> Auditoria de Operações</div>
                            <div className="v-badge"><Cpu size={18} weight="bold" /> Núcleo de Processamento TITÃ</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
