import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightning, WhatsappLogo, MapPin,
    UserPlus, Clock, Bell,
    TrendUp, Calendar, Warning,
    CheckCircle, ChartLine, Plus,
    Gear, Info, ArrowsClockwise
} from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

interface AutomationRule {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    active: boolean;
    category: 'entry' | 'funnel' | 'isp';
}

const AutomationsDashboard: React.FC = () => {
    const { showToast } = useToast();
    const [rules, setRules] = useState<AutomationRule[]>([
        // Entrada do lead
        {
            id: 'assign_region',
            title: 'Atribuição por Região (CEP)',
            description: 'Direciona novos leads automaticamente para vendedores baseados na cobertura geográfica do CEP.',
            icon: <MapPin weight="duotone" />,
            active: true,
            category: 'entry'
        },
        {
            id: 'whatsapp_welcome',
            title: 'Boas-vindas WhatsApp',
            description: 'Envia template de saudação oficial assim que o lead cai no CRM.',
            icon: <WhatsappLogo weight="duotone" />,
            active: true,
            category: 'entry'
        },
        {
            id: 'first_contact_task',
            title: 'Tarefa de 1º Contato',
            description: 'Gera tarefa automática com deadline de 2h para garantir agilidade comercial.',
            icon: <Clock weight="duotone" />,
            active: true,
            category: 'entry'
        },

        // Durante o funil
        {
            id: 'sla_alert_48h',
            title: 'Alerta SLA 48h',
            description: 'Notifica o vendedor quando um lead prioritário fica mais de 2 dias sem novas interações.',
            icon: <Warning weight="duotone" />,
            active: true,
            category: 'funnel'
        },
        {
            id: 'overdue_reminder',
            title: 'Lembrete de Tarefa Vencida',
            description: 'Notificação recorrente a cada 4h para tarefas que ultrapassaram o prazo.',
            icon: <Bell weight="duotone" />,
            active: false,
            category: 'funnel'
        },
        {
            id: 'followup_proposal',
            title: 'Follow-up Automático Proposta',
            description: 'Envia mensagem se o cliente não responder ao link do contrato em X dias.',
            icon: <TrendUp weight="duotone" />,
            active: true,
            category: 'funnel'
        },

        // ISP Específicos
        {
            id: 'viability_notif',
            title: 'Notificação Viabilidade OK',
            description: 'Avisa o comercial instantaneamente quando o setor técnico aprova a viabilidade do endereço.',
            icon: <CheckCircle weight="duotone" />,
            active: true,
            category: 'isp'
        },
        {
            id: 'expansion_list',
            title: 'Gatilho de Expansão',
            description: 'Dispara aviso para leads em lista de espera quando a fibra chega no bairro deles.',
            icon: <ChartLine weight="duotone" />,
            active: true,
            category: 'isp'
        },
        {
            id: 'upsell_trigger',
            title: 'Pós-Instalação & Upsell',
            description: 'Gera alerta assim que o técnico finaliza a ativação para pesquisa de satisfação.',
            icon: <Plus weight="duotone" />,
            active: false,
            category: 'isp'
        }
    ]);

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
        const rule = rules.find(r => r.id === id);
        showToast(`${rule?.title} ${!rule?.active ? 'ativada' : 'desativada'}`, 'info');
    };

    const renderCategory = (cat: 'entry' | 'funnel' | 'isp', label: string) => (
        <section className="automation-section">
            <h2 className="section-title">{label}</h2>
            <div className="automation-grid">
                {rules.filter(r => r.category === cat).map(rule => (
                    <motion.div
                        key={rule.id}
                        className={`automation-card ${rule.active ? 'active' : ''}`}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className="card-header">
                            <div className="icon-box">{rule.icon}</div>
                            <button
                                className={`toggle-switch ${rule.active ? 'on' : 'off'}`}
                                onClick={() => toggleRule(rule.id)}
                            >
                                <motion.div
                                    className="switch-dot"
                                    animate={{ x: rule.active ? 18 : 0 }}
                                />
                            </button>
                        </div>
                        <div className="card-body">
                            <h3>{rule.title}</h3>
                            <p>{rule.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );

    return (
        <div className="automations-container">
            <header className="page-header">
                <div>
                    <h1>Centro de Automações</h1>
                    <p>Configure gatilhos e fluxos automáticos para otimizar o funil comercial</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary"><Gear size={20} /> Configurações Gerais</button>
                    <button className="btn-primary"><Plus size={20} /> Nova Regra</button>
                </div>
            </header>

            <div className="stats-row">
                <div className="stat-box">
                    <ArrowsClockwise size={24} color="#3b82f6" />
                    <div className="stat-info">
                        <strong>1.242</strong>
                        <span>Ações executadas (30d)</span>
                    </div>
                </div>
                <div className="stat-box">
                    <Clock size={24} color="#10b981" />
                    <div className="stat-info">
                        <strong>4h 12m</strong>
                        <span>Tempo economizado p/ vendedor</span>
                    </div>
                </div>
                <div className="stat-box">
                    <Bell size={24} color="#f59e0b" />
                    <div className="stat-info">
                        <strong>12</strong>
                        <span>Regras ativas agora</span>
                    </div>
                </div>
            </div>

            {renderCategory('entry', 'Entrada do Lead')}
            {renderCategory('funnel', 'Acompanhamento do Funil')}
            {renderCategory('isp', 'Eventos Específicos ISP')}

            <style>{`
                .automations-container {
                    padding: var(--space-lg);
                    height: 100%;
                    overflow-y: auto;
                    background: var(--bg-deep);
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2.5rem;
                }
                .page-header h1 { font-size: 2rem; font-weight: 800; margin: 0; color: #fff; }
                .page-header p { color: #666; margin-top: 4px; }
                
                .header-actions { display: flex; gap: 12px; }
                
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .stat-box {
                    background: var(--bg-surface);
                    border: 1px solid var(--border);
                    padding: 1.5rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .stat-info { display: flex; flex-direction: column; }
                .stat-info strong { font-size: 1.4rem; color: #fff; line-height: 1; }
                .stat-info span { font-size: 0.8rem; color: #555; margin-top: 4px; }

                .automation-section { margin-bottom: 3rem; }
                .section-title { 
                    font-size: 1rem; 
                    text-transform: uppercase; 
                    letter-spacing: 0.15em; 
                    color: #444; 
                    margin-bottom: 1.5rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .section-title::after { content: ''; flex: 1; height: 1px; background: #222; }

                .automation-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .automation-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    padding: 1.5rem;
                    transition: all 0.2s;
                    position: relative;
                }
                .automation-card.active { border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.02); }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }
                .icon-box {
                    width: 48px;
                    height: 48px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    font-size: 1.5rem;
                }
                .automation-card.active .icon-box { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }

                .toggle-switch {
                    width: 44px;
                    height: 24px;
                    background: #222;
                    border-radius: 999px;
                    border: none;
                    cursor: pointer;
                    padding: 3px;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                }
                .toggle-switch.on { background: #10b981; }
                .switch-dot {
                    width: 18px;
                    height: 18px;
                    background: #fff;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .card-body h3 { font-size: 1.1rem; color: #fff; margin: 0 0 8px 0; font-weight: 700; }
                .card-body p { font-size: 0.85rem; color: #666; margin: 0; line-height: 1.5; }

                .btn-primary { background: var(--primary-color); color: #fff; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
                .btn-secondary { background: transparent; border: 1px solid var(--border); color: #888; padding: 10px 20px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default AutomationsDashboard;
