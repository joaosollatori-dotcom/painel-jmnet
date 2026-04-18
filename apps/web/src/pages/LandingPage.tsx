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
                .insert([
                    {
                        nome: formData.nome,
                        email: formData.email,
                        provedor: formData.provedor,
                        status: 'novo'
                    }
                ]);

            if (error) throw error;

            setSent(true);
            addToast('Solicitação enviada! Nossa equipe entrará em contato.', 'success');
            setFormData({ nome: '', email: '', provedor: '' });
        } catch (error: any) {
            console.error('Erro ao salvar lead:', error);
            addToast('Falha ao enviar. Verifique sua conexão.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans selection:text-blue-200 overflow-x-hidden">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap className="text-white fill-current" size={24} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            TITÃ <span className="text-blue-500">ISP</span>
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
                        <button
                            onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition-all font-semibold"
                        >
                            Agendar Demo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        {...fadeIn}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        A Revolução dos Provedores
                    </motion.div>

                    <motion.h1
                        {...fadeIn}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
                    >
                        O Ecossistema <span className="text-blue-500 italic">AIO</span> definitivo para o seu Provedor.
                    </motion.h1>

                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        CRM, Redes, Financeiro e Atendimento Inteligente em uma única interface premium. O controle total da sua ISP, de onde você estiver.
                    </motion.p>

                    <motion.div
                        {...fadeIn}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-bold text-lg shadow-xl shadow-blue-500/20"
                        >
                            Centralizar minha ISP
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* CRM */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users2 className="text-blue-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">CRM Inteligente</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Funil de vendas integrado com WhatsApp Cloud API e automação de leads desde a primeira mensagem.
                            </p>
                        </motion.div>

                        {/* Redes */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Wifi className="text-indigo-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Gestão de Rede</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Monitoramento de OLTs, ativação de ONUs e mapa técnico em tempo real para sua equipe de campo.
                            </p>
                        </motion.div>

                        {/* Financeiro */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <CreditCard className="text-emerald-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Financeiro</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Emissão de faturas, baixa automática de pagamentos e controle de inadimplência rigoroso.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer with Contact Form */}
            <footer id="contato" className="pt-24 pb-12 px-6 bg-gradient-to-b from-transparent to-blue-900/5 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
                        <div>
                            <h2 className="text-4xl font-bold mb-6 italic tracking-tight">Pronto para o próximo nível?</h2>
                            <p className="text-gray-400 text-lg mb-8 max-w-md">
                                Deixe seus dados e nossa equipe técnica entrará em contato para uma demonstração exclusiva do módulo ISP.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Mail size={18} />
                                    </div>
                                    <span>joaosollatori@gmail.com</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Phone size={18} />
                                    </div>
                                    <span>(73) 98210-6307</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Building2 size={18} />
                                    </div>
                                    <span>CNPJ: 62.195.228/0001-31</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] shadow-2xl backdrop-blur-lg relative overflow-hidden">
                            {sent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Mensagem Enviada!</h3>
                                    <p className="text-gray-400">Em breve entraremos em contato.</p>
                                    <button
                                        onClick={() => setSent(false)}
                                        className="mt-8 text-blue-500 hover:text-blue-400 font-bold"
                                    >
                                        Enviar outra mensagem
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Seu Nome</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="João Silva"
                                                value={formData.nome}
                                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-2">E-mail Profissional</label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="nome@provedor.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-2">Nome do seu Provedor</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: JMnet Telecom"
                                            value={formData.provedor}
                                            onChange={(e) => setFormData({ ...formData, provedor: e.target.value })}
                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait transition-all text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                    >
                                        {loading ? 'Enviando...' : 'Solicitar Demonstração'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 text-sm text-gray-500 gap-4">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-blue-500" />
                            <span>TITÃ ISP © 2026. Todos os direitos reservados.</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                            <a href="#" className="hover:text-white transition-colors">Termos</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
