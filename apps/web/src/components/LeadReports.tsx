import React, { useMemo } from 'react';
import {
    ChartBar, TrendUp, MapTrifold, Users,
    Clock, HardDrives, Funnel, ArrowUpRight,
    ArrowDownRight, ChartLine, Target, MapPin
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Lead } from '../services/leadService';

interface LeadReportsProps {
    leads: Lead[];
}

const LeadReports: React.FC<LeadReportsProps> = ({ leads }) => {

    const dashboardData = useMemo(() => {
        const total = leads.length;
        const viáveis = leads.filter(l => l.statusViabilidade === 'VIAVEL').length;
        const qualificados = leads.filter(l => l.statusQualificacao === 'QUALIFICADO').length;
        const contratos = leads.filter(l => l.statusProposta === 'ACEITA').length;

        // Agrupamento por Bairro para o "Mapa de Calor"
        const bairroStats = leads.reduce((acc, lead) => {
            const bairro = lead.bairro || 'Desconhecido';
            if (!acc[bairro]) acc[bairro] = { total: 0, viáveis: 0 };
            acc[bairro].total++;
            if (lead.statusViabilidade === 'VIAVEL') acc[bairro].viáveis++;
            return acc;
        }, {} as Record<string, { total: number; viáveis: number }>);

        return {
            total,
            viabilidadeRate: total > 0 ? (viáveis / total) * 100 : 0,
            conversionRate: qualificados > 0 ? (contratos / qualificados) * 100 : 0,
            funnel: {
                novo: leads.filter(l => l.statusQualificacao === 'PENDENTE').length,
                qualificado: qualificados,
                proposta: leads.filter(l => l.statusProposta === 'ENVIADA').length,
                contrato: contratos
            },
            bairros: Object.entries(bairroStats)
                .map(([nome, s]) => ({ nome, rate: (s.viáveis / s.total) * 100, total: s.total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
        };
    }, [leads]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1 }
        })
    };

    return (
        <div className="reports-container">
            <header className="reports-header">
                <div className="h-title">
                    <ChartBar size={32} weight="duotone" />
                    <div>
                        <h1>Dashboard Estratégico ISP</h1>
                        <span>Análise de performance e viabilidade geográfica</span>
                    </div>
                </div>
            </header>

            <div className="stats-grid">
                {[
                    { label: 'Viabilidade de Rede', value: `${dashboardData.viabilidadeRate.toFixed(1)}%`, icon: MapTrifold, color: '#3b82f6', trend: '+2.4%' },
                    { label: 'Conversão Comercial', value: `${dashboardData.conversionRate.toFixed(1)}%`, icon: Target, color: '#10b981', trend: '+1.8%' },
                    { label: 'Leads Ativos', value: dashboardData.total, icon: Users, color: '#8b5cf6', trend: 'Estável' },
                    { label: 'Tempo Médio Fechamento', value: '3.2 dias', icon: Clock, color: '#f59e0b', trend: '-12%' }
                ].map((stat, i) => (
                    <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={cardVariants} className="stat-card-titan">
                        <div className="s-icon" style={{ background: `${stat.color}20`, color: stat.color }}><stat.icon size={28} /></div>
                        <div className="s-data">
                            <span className="s-label">{stat.label}</span>
                            <div className="s-value-group">
                                <span className="s-value">{stat.value}</span>
                                <span className={`s-trend ${stat.trend.startsWith('+') ? 'up' : 'down'}`}>{stat.trend}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="main-reports-grid">
                <section className="report-panel funnel-panel">
                    <h3><Funnel size={20} weight="duotone" /> Funil de Vendas Real-Time</h3>
                    <div className="funnel-viz">
                        {Object.entries(dashboardData.funnel).map(([stage, count], i) => (
                            <div key={stage} className="funnel-tier" style={{ width: `${100 - i * 15}%` }}>
                                <div className="tier-label">{stage.toUpperCase()}</div>
                                <div className="tier-bar">
                                    <div className="tier-fill" style={{ width: `${(count / dashboardData.total) * 100}%` }} />
                                    <span className="tier-count">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="report-panel heatmap-panel">
                    <h3><MapPin size={20} weight="duotone" /> Mapa de Oportunidades por Bairro</h3>
                    <table className="neighborhood-table">
                        <thead>
                            <tr>
                                <th>Bairro</th>
                                <th>Total Leads</th>
                                <th>Taxa Viabilidade</th>
                                <th>Potencial</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.bairros.map(b => (
                                <tr key={b.nome}>
                                    <td><strong>{b.nome}</strong></td>
                                    <td>{b.total}</td>
                                    <td>
                                        <div className="progress-mini">
                                            <div className="p-bar" style={{ width: `${b.rate}%`, background: b.rate > 70 ? '#10b981' : b.rate > 40 ? '#f59e0b' : '#ef4444' }} />
                                            <span>{b.rate.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`pot-tag ${b.total > 5 ? 'high' : 'low'}`}>
                                            {b.total > 5 ? 'Expansão Urgente' : 'Saturado'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>

            <style>{`
                .reports-container { padding: 2rem; background: #080a0f; display: flex; flex-direction: column; gap: 2rem; }
                .reports-header { display: flex; justify-content: space-between; align-items: center; }
                .h-title { display: flex; align-items: center; gap: 1rem; color: #fff; }
                .h-title h1 { font-size: 1.5rem; margin: 0; font-weight: 800; }
                .h-title span { font-size: 0.85rem; color: #64748b; }

                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                .stat-card-titan { background: #11141d; border: 1px solid #1e2430; padding: 1.5rem; border-radius: 20px; display: flex; gap: 1.25rem; align-items: center; }
                .s-label { font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; }
                .s-value { font-size: 1.8rem; font-weight: 900; color: #fff; display: block; margin-top: 4px; }
                .s-trend { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
                .s-trend.up { background: #10b98120; color: #10b981; }
                .s-trend.down { background: #ef444420; color: #ef4444; }

                .main-reports-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; min-height: 400px; }
                .report-panel { background: #11141d; border: 1px solid #1e2430; border-radius: 24px; padding: 1.5rem; }
                .report-panel h3 { color: #f8fafc; font-size: 1rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; }

                /* Funnel Viz */
                .funnel-viz { display: flex; flex-direction: column; gap: 10px; align-items: center; padding: 1rem 0; }
                .funnel-tier { background: #1e2430; height: 50px; border-radius: 12px; position: relative; overflow: hidden; display: flex; align-items: center; padding: 0 1.5rem; }
                .tier-label { font-size: 0.7rem; font-weight: 800; color: #64748b; z-index: 2; width: 100px; }
                .tier-bar { flex: 1; height: 8px; background: #080a0f; border-radius: 4px; position: relative; }
                .tier-fill { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px; }
                .tier-count { position: absolute; right: 0; top: -20px; font-size: 0.9rem; font-weight: 800; color: #3b82f6; }

                /* Heatmap Table */
                .neighborhood-table { width: 100%; border-collapse: collapse; }
                .neighborhood-table th { text-align: left; padding: 12px; font-size: 0.75rem; color: #475569; border-bottom: 1px solid #1e2430; }
                .neighborhood-table td { padding: 16px 12px; font-size: 0.85rem; color: #cbd5e1; border-bottom: 1px solid #1e243050; }
                .progress-mini { display: flex; align-items: center; gap: 10px; }
                .p-bar { height: 6px; border-radius: 3px; max-width: 100px; }
                .pot-tag { font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; }
                .pot-tag.high { background: #ef444420; color: #ef4444; }
                .pot-tag.low { background: #1e293b; color: #64748b; }
            `}</style>
        </div>
    );
};

export default LeadReports;
