import React, { useMemo } from 'react';
import {
    ChartBar, TrendUp, MapTrifold, Users,
    Clock, HardDrives, Funnel, ArrowUpRight,
    ArrowDownRight, ChartLine, Target, MapPin,
    Money, CalendarCheck, Warning, Trophy,
    ChatCircleDots, Prohibit
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Lead } from '../services/leadService';

interface LeadReportsProps {
    leads: Lead[];
}

const LeadReports: React.FC<LeadReportsProps> = ({ leads }) => {

    const reportData = useMemo(() => {
        const now = new Date();
        const total = leads.length;

        // 1. Taxa de Conversão Real
        const qualificados = leads.filter(l => l.statusQualificacao === 'QUALIFICADO' || l.statusProposta === 'ACEITA').length;
        const fechados = leads.filter(l => l.statusProposta === 'ACEITA').length;
        const conversionRate = total > 0 ? (fechados / total) * 100 : 0;

        // 2. Sales Velocity (Média de dias para fechamento)
        const closedLeads = leads.filter(l => l.statusProposta === 'ACEITA' && l.dataEntrada);
        const avgVelocity = closedLeads.length > 0
            ? closedLeads.reduce((acc, l) => {
                const diff = (new Date(l.updatedAt || l.updated_at || now).getTime() - new Date(l.dataEntrada).getTime()) / (1000 * 60 * 60 * 24);
                return acc + diff;
            }, 0) / closedLeads.length
            : 0;

        // 3. Performance por Canal (Benchmarking)
        const channels = leads.reduce((acc, l) => {
            const ch = l.canalEntrada || 'Outros';
            if (!acc[ch]) acc[ch] = { total: 0, wins: 0 };
            acc[ch].total++;
            if (l.statusProposta === 'ACEITA') acc[ch].wins++;
            return acc;
        }, {} as Record<string, { total: number, wins: number }>);

        // 4. Ranking de Vendedores (Closing Rate)
        const salesTeam = leads.reduce((acc, l) => {
            const runner = l.vendedorId || 'Não Atribuído';
            if (!acc[runner]) acc[runner] = { total: 0, wins: 0, name: runner };
            acc[runner].total++;
            if (l.statusProposta === 'ACEITA') acc[runner].wins++;
            return acc;
        }, {} as Record<string, { total: number, wins: number, name: string }>);

        // 5. Motivos de Perda (Loss Reasons)
        const losses = {
            'Inviabilidade Técnica': leads.filter(l => l.statusViabilidade === 'INVIAVEL').length,
            'Desqualificado': leads.filter(l => l.statusQualificacao === 'DESQUALIFICADO').length,
            'Proposta Recusada': leads.filter(l => l.statusProposta === 'RECUSADA').length,
            'Sem Contato': leads.filter(l => {
                const limit = new Date(now.getTime() - 48 * 60 * 60 * 1000);
                return new Date(l.dataUltimaInteracao) < limit && l.statusProposta !== 'ACEITA';
            }).length
        };

        return {
            total,
            qualificados,
            fechados,
            conversionRate,
            avgVelocity,
            channels: Object.entries(channels).map(([name, data]) => ({ name, rate: (data.wins / data.total) * 100, total: data.total })),
            team: Object.values(salesTeam).sort((a, b) => (b.wins / b.total) - (a.wins / a.total)).slice(0, 5),
            losses: Object.entries(losses).map(([reason, count]) => ({ reason, count, perc: total > 0 ? (count / total) * 100 : 0 }))
        };
    }, [leads]);

    const cardVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } })
    };

    return (
        <div className="reports-container">
            {/* Top KPIs - Inteligência ISP */}
            <div className="stats-grid-hex">
                {[
                    { label: 'Conversão Geral', value: `${reportData.conversionRate.toFixed(1)}%`, icon: Target, color: '#10b981', desc: 'Leads x Fechados' },
                    { label: 'Sales Velocity', value: `${reportData.avgVelocity.toFixed(1)}d`, icon: Clock, color: '#3b82f6', desc: 'Média de Ciclo' },
                    { label: 'CAC Projetado', value: 'R$ 42,50', icon: Money, color: '#f59e0b', desc: 'Custo por Venda' },
                    { label: 'Qualificação', value: `${((reportData.qualificados / reportData.total) * 100 || 0).toFixed(0)}%`, icon: Trophy, color: '#8b5cf6', desc: 'MQL Efficiency' }
                ].map((stat, i) => (
                    <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={cardVariants} className="stat-card-premium">
                        <div className="s-header">
                            <stat.icon size={24} weight="duotone" style={{ color: stat.color }} />
                            <span className="s-label">{stat.label}</span>
                        </div>
                        <div className="s-body">
                            <span className="s-value">{stat.value}</span>
                            <span className="s-desc">{stat.desc}</span>
                        </div>
                        <div className="s-progress" style={{ background: `${stat.color}15` }}>
                            <div className="s-progress-fill" style={{ width: stat.value.includes('%') ? stat.value : '70%', background: stat.color }} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="main-reports-grid">
                {/* 1. Performance por Canal */}
                <section className="report-panel">
                    <div className="p-header">
                        <h3><ChartBar size={20} weight="duotone" /> Eficiência por Canal</h3>
                        <span className="p-badge">Benchmarking</span>
                    </div>
                    <div className="channel-list">
                        {reportData.channels.map(c => (
                            <div key={c.name} className="channel-row">
                                <div className="ch-info">
                                    <strong>{c.name}</strong>
                                    <span>{c.total} Leads</span>
                                </div>
                                <div className="ch-bar-group">
                                    <div className="ch-bar-bg"><div className="ch-bar-fill" style={{ width: `${c.rate}%` }} /></div>
                                    <div className="ch-rate">{c.rate.toFixed(1)}% Conv.</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Ranking de Vendedores */}
                <section className="report-panel">
                    <div className="p-header">
                        <h3><Trophy size={20} weight="duotone" /> Elite de Vendas</h3>
                        <span className="p-badge success">Top Close</span>
                    </div>
                    <div className="team-ranking">
                        {reportData.team.map((member, i) => (
                            <div key={member.name} className="rank-item">
                                <div className="rank-num">#{i + 1}</div>
                                <div className="rank-name">
                                    <strong>{member.name}</strong>
                                    <span>{member.wins} vendas / {member.total} leads</span>
                                </div>
                                <div className="rank-perc" style={{ color: i === 0 ? '#10b981' : '#cbd5e1' }}>
                                    {((member.wins / member.total) * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Funil de Perdas (Loss Analysis) */}
                <section className="report-panel">
                    <div className="p-header">
                        <h3><Warning size={20} weight="duotone" /> Análise de Motivos de Perda</h3>
                        <span className="p-badge warning">Churn Precoce</span>
                    </div>
                    <div className="loss-grid">
                        {reportData.losses.map(l => (
                            <div key={l.reason} className="loss-item">
                                <div className="loss-info">
                                    <span>{l.reason}</span>
                                    <strong>{l.count}</strong>
                                </div>
                                <div className="loss-bar-container">
                                    <div className="loss-bar" style={{ width: `${l.perc}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Mapa de Viabilidade */}
                <section className="report-panel">
                    <div className="p-header">
                        <h3><MapTrifold size={20} weight="duotone" /> Viabilidade por Região</h3>
                        <button className="btn-text">Ver Mapa Completo</button>
                    </div>
                    <div className="viability-preview">
                        <div className="v-stat">
                            <span className="v-val">82%</span>
                            <span className="v-lab">Viabilidade Média</span>
                        </div>
                        <div className="v-map-mock">
                            {/* Visual representativo de calor */}
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="v-dot" style={{
                                    opacity: Math.random() * 0.8 + 0.2,
                                    transform: `scale(${Math.random() * 0.5 + 0.8})`,
                                    background: Math.random() > 0.3 ? '#10b981' : '#f59e0b'
                                }} />
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
                .reports-container { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: var(--bg-deep); }
                
                .stats-grid-hex { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                .stat-card-premium { background: var(--bg-surface); border: 1px solid var(--border); padding: 1.25rem; border-radius: 20px; position: relative; overflow: hidden; }
                .s-header { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
                .s-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em; }
                .s-value { font-size: 1.8rem; font-weight: 900; color: var(--text-primary); display: block; }
                .s-desc { font-size: 0.7rem; color: #64748b; margin-top: 4px; display: block; }
                .s-progress { height: 3px; width: 100%; border-radius: 2px; margin-top: 12px; }
                .s-progress-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }

                .main-reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                .report-panel { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 1.25rem; }
                .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .p-header h3 { font-size: 0.95rem; color: var(--text-primary); font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0; }
                .p-badge { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; background: #3b82f615; color: #3b82f6; text-transform: uppercase; }
                .p-badge.success { background: #10b98115; color: #10b981; }
                .p-badge.warning { background: #f59e0b15; color: #f59e0b; }

                /* Channel List */
                .channel-list { display: flex; flex-direction: column; gap: 1rem; }
                .channel-row { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 1rem; }
                .ch-info strong { display: block; font-size: 0.85rem; color: var(--text-primary); }
                .ch-info span { font-size: 0.7rem; color: #64748b; }
                .ch-bar-group { display: flex; align-items: center; gap: 12px; }
                .ch-bar-bg { flex: 1; height: 8px; background: var(--bg-deep); border-radius: 4px; position: relative; overflow: hidden; }
                .ch-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px; }
                .ch-rate { font-size: 0.8rem; font-weight: 700; color: #3b82f6; width: 60px; }

                /* Team Ranking */
                .team-ranking { display: flex; flex-direction: column; gap: 12px; }
                .rank-item { display: flex; align-items: center; gap: 1rem; background: var(--bg-deep); padding: 12px; border-radius: 12px; }
                .rank-num { font-size: 0.75rem; font-weight: 900; color: #64748b; width: 24px; }
                .rank-name { flex: 1; }
                .rank-name strong { display: block; font-size: 0.85rem; color: var(--text-primary); }
                .rank-name span { font-size: 0.7rem; color: #64748b; }
                .rank-perc { font-weight: 900; font-size: 1rem; }

                /* Loss Grid */
                .loss-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .loss-item { background: var(--bg-deep); padding: 1rem; border-radius: 16px; display: flex; flex-direction: column; gap: 10px; }
                .loss-info { display: flex; justify-content: space-between; align-items: baseline; }
                .loss-info span { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                .loss-info strong { font-size: 1.2rem; color: #f8fafc; }
                .loss-bar-container { height: 4px; background: #ef444415; border-radius: 2px; }
                .loss-bar { height: 100%; background: #ef4444; border-radius: 2px; }

                /* Viability Preview */
                .viability-preview { display: flex; align-items: center; gap: 2rem; }
                .v-val { font-size: 2.5rem; font-weight: 950; color: #10b981; display: block; }
                .v-lab { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .v-map-mock { flex: 1; height: 80px; background: var(--bg-deep); border-radius: 16px; position: relative; overflow: hidden; display: flex; flex-wrap: wrap; gap: 10px; padding: 15px; }
                .v-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }

                .btn-text { background: transparent; border: none; color: #3b82f6; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default LeadReports;
