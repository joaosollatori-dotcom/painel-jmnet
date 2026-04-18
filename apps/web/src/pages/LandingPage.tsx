import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Wifi,
    Users2,
    CreditCard,
    ArrowRight,
    Mail,
    Phone,
    Building2,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        provedor: ''
    });

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome || !formData.email) {
            addToast('Por favor, preencha nome e e-mail.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('landing_leads')
                .insert([{
                    nome: formData.nome,
                    email: formData.email,
                    provedor: formData.provedor,
                    status: 'novo'
                }]);

            if (error) throw error;

            setSent(true);
            addToast('Dados enviados!', 'success');
        } catch (error: any) {
            addToast('Erro ao enviar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="lp-nav">
                <div className="lp-nav-content">
                    <div className="lp-logo">
                        <div className="lp-logo-icon">
                            <Zap className="text-white fill-current" size={24} />
                        </div>
                        <span className="lp-logo-text">
                            TITÃ <span style={{ color: 'var(--lp-accent)' }}>ISP</span>
                        </span>
                    </div>
                    <div className="lp-nav-links">
                        <a href="#features" className="lp-nav-link">Funcionalidades</a>
                        <button
                            onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
                            className="lp-btn-demo"
                        >
                            Agendar Demo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="lp-hero">
                <div className="lp-hero-blur" />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div {...fadeIn} className="lp-badge">
                        <span style={{ display: 'flex', position: 'relative', height: '8px', width: '8px', marginRight: '8px' }}>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        A Revolução dos Provedores
                    </motion.div>

                    <motion.h1 {...fadeIn} transition={{ delay: 0.2 }} className="lp-title">
                        O Ecossistema <span>AIO</span> definitivo<br /> para o seu Provedor.
                    </motion.h1>

                    <motion.p {...fadeIn} transition={{ delay: 0.3 }} className="lp-subtitle">
                        CRM, Redes, Financeiro e Atendimento Inteligente em uma única interface premium.
                        O controle total da sua ISP, de onde você estiver.
                    </motion.p>

                    <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="lp-hero-actions">
                        <button
                            onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
                            className="lp-btn-primary"
                        >
                            Centralizar minha ISP
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="lp-features">
                <motion.div whileHover={{ y: -5 }} className="lp-feature-card">
                    <div className="lp-feature-icon" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                        <Users2 className="text-blue-500" size={32} />
                    </div>
                    <h3 className="lp-feature-title">CRM Inteligente</h3>
                    <p className="lp-feature-desc">
                        Funil de vendas integrado com WhatsApp Cloud API e automação de leads desde a primeira mensagem.
                    </p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="lp-feature-card">
                    <div className="lp-feature-icon" style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                        <Wifi className="text-indigo-500" size={32} />
                    </div>
                    <h3 className="lp-feature-title">Gestão de Rede</h3>
                    <p className="lp-feature-desc">
                        Monitoramento de OLTs, ativação de ONUs e mapa técnico em tempo real para sua equipe de campo.
                    </p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="lp-feature-card">
                    <div className="lp-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <CreditCard className="text-emerald-500" size={32} />
                    </div>
                    <h3 className="lp-feature-title">Financeiro</h3>
                    <p className="lp-feature-desc">
                        Emissão de faturas, baixa automática de pagamentos e controle de inadimplência rigoroso.
                    </p>
                </motion.div>
            </section>

            {/* Contact Footer */}
            <footer id="contato" className="lp-footer">
                <div className="lp-footer-content">
                    <div>
                        <h2 className="lp-title" style={{ fontSize: '3rem', textAlign: 'left' }}>Pronto para o<br /><span>próximo nível?</span></h2>
                        <p className="lp-subtitle" style={{ margin: '0 0 3rem 0', textAlign: 'left' }}>
                            Deixe seus dados e nossa equipe técnica entrará em contato para uma demonstração.
                        </p>

                        <div className="lp-info-item">
                            <div className="lp-info-icon"><Mail size={18} /></div>
                            <span>joaosollatori@gmail.com</span>
                        </div>
                        <div className="lp-info-item">
                            <div className="lp-info-icon"><Phone size={18} /></div>
                            <span>(73) 98210-6307</span>
                        </div>
                        <div className="lp-info-item">
                            <div className="lp-info-icon"><Building2 size={18} /></div>
                            <span>CNPJ: 62.195.228/0001-31</span>
                        </div>
                    </div>

                    <div className="lp-form-card">
                        {sent ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lp-success">
                                <div className="lp-success-icon"><CheckCircle2 size={40} /></div>
                                <h3>Mensagem Enviada!</h3>
                                <p>Fique atento ao seu telefone e e-mail.</p>
                                <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--lp-accent)', fontWeight: 'bold', marginTop: '2rem', cursor: 'pointer' }}>
                                    Enviar outra
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="lp-input-group">
                                    <label className="lp-label">Nome Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="lp-input"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    />
                                </div>
                                <div className="lp-input-group">
                                    <label className="lp-label">E-mail Profissional</label>
                                    <input
                                        required
                                        type="email"
                                        className="lp-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="lp-input-group">
                                    <label className="lp-label">Nome do Provedor</label>
                                    <input
                                        type="text"
                                        className="lp-input"
                                        value={formData.provedor}
                                        onChange={(e) => setFormData({ ...formData, provedor: e.target.value })}
                                    />
                                </div>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="lp-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                    {loading ? 'Processando...' : 'Solicitar Demonstração'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
