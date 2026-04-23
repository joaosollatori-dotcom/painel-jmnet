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
import { getSystemSettings, SystemSetting } from '../services/systemSettingsService';
import { useEffect, useState } from 'react';

interface LeadReportsProps {
    leads: Lead[];
}

const LeadReports: React.FC<LeadReportsProps> = ({ leads }) => {

    const [settings, setSettings] = useState<SystemSetting[]>([]);

    useEffect(() => {
        getSystemSettings().then(data => setSettings(data));
    }, []);

    const reportData = useMemo(() => {
        const now = new Date();
        const total = leads.length;

        // 1. Conversão e Ticket Médio (Real do Banco)
        const fechados = leads.filter(l => l.statusProposta === 'ACEITA');
        const conversionRate = total > 0 ? (fechados.length / total) * 100 : 0;
        const ticketMedio = fechados.length > 0
            ? fechados.reduce((acc, l) => acc + (l.valorPlano || 0), 0) / fechados.length
            : 0;

        // 2. CAC Real (Custo Lead / Conversão)
        const custoTotal = leads.reduce((acc, l) => acc + (l.custoLead || 0), 0);
        const cacReal = fechados.length > 0 ? custoTotal / fechados.length : 0;

        // 3. Sales Velocity (Ciclo de Venda Real em Dias)
        const avgVelocity = fechados.length > 0
            ? fechados.reduce((acc, l) => {
                const diff = (new Date(l.updatedAt || l.updated_at || now).getTime() - new Date(l.dataEntrada).getTime()) / (1000 * 60 * 60 * 24);
                return acc + diff;
            }, 0) / fechados.length
            : 0;

        // 4. Motivos de Perda Reais (Vindo da coluna 'motivoPerda')
        const lossMapping = settings
            .filter(s => s.category === 'LOSS_REASON')
            .reduce((acc, s) => {
                acc[s.value] = s.label;
                return acc;
            }, {} as Record<string, string>);

        const lossStats = leads.reduce((acc, l) => {
            if (l.motivoPerda) {
                const label = lossMapping[l.motivoPerda] || l.motivoPerda;
                acc[label] = (acc[label] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // 5. Eficiência por Vendedor (Ranking Real)
        const teamStats = leads.reduce((acc, l) => {
            const name = l.vendedorNome || l.vendedorId || 'Entrada Orgânica';
            if (!acc[name]) acc[name] = { wins: 0, total: 0 };
            acc[name].total++;
            if (l.statusProposta === 'ACEITA') acc[name].wins++;
            return acc;
        }, {} as Record<string, { wins: number, total: number }>);

        return {
            total,
            fechados: fechados.length,
            conversionRate,
            ticketMedio,
            cacReal,
            avgVelocity,
            losses: Object.entries(lossStats)
                .map(([reason, count]) => ({ reason, count, perc: (count / (total - fechados.length || 1)) * 100 }))
                .sort((a, b) => b.count - a.count),
            team: Object.entries(teamStats)
                .map(([name, s]) => ({ name, wins: s.wins, rate: (s.wins / s.total) * 100 }))
                .sort((a, b) => b.rate - a.rate)
                .slice(0, 5)
        };
    }, [leads, settings]);

    return (
        <div className="reports-container">
            {/* Cards Financeiros de Alta Precisão */}
            <div className="stats-grid-hex">
                <div className="stat-card-premium">
                    <div className="s-header"><Money size={24} weight="duotone" color="#10b981" /><span className="s-label">Ticket Médio (ARPU)</span></div>
                    <span className="s-value">R$ {reportData.ticketMedio.toFixed(2)}</span>
                    <span className="s-desc">Faturamento Médio / Contrato</span>
                </div>
                <div className="stat-card-premium">
                    <div className="s-header"><ChartLine size={24} weight="duotone" color="#3b82f6" /><span className="s-label">CAC Real</span></div>
                    <span className="s-value">R$ {reportData.cacReal.toFixed(2)}</span>
                    <span className="s-desc">Custo de Aquisição Médio</span>
                </div>
                <div className="stat-card-premium">
                    <div className="s-header"><Clock size={24} weight="duotone" color="#f59e0b" /><span className="s-label">Ciclo Médio (Velocity)</span></div>
                    <span className="s-value">{reportData.avgVelocity.toFixed(1)} dias</span>
                    <span className="s-desc">Velocidade do Lead ao Contrato</span>
                </div>
                <div className="stat-card-premium">
                    <div className="s-header"><Target size={24} weight="duotone" color="#8b5cf6" /><span className="s-label">Closing Rate</span></div>
                    <span className="s-value">{reportData.conversionRate.toFixed(1)}%</span>
                    <span className="s-desc">Eficiência Total do Funil</span>
                </div>
            </div>

            <div className="main-reports-grid">
                {/* Ranking Real de Vendedores */}
                <section className="report-panel">
                    <div className="p-header"><h3><Trophy size={20} weight="duotone" /> Ranking da Equipe de Vendas</h3><span className="p-badge success">Top Performance</span></div>
                    <div className="team-ranking">
                        {reportData.team.map((m, i) => (
                            <div key={m.name} className="rank-item">
                                <div className="rank-num">#{i + 1}</div>
                                <div className="rank-name"><strong>{m.name}</strong><span>{m.wins} vendas efetuadas</span></div>
                                <div className="rank-perc" style={{ color: i === 0 ? '#10b981' : '#fff' }}>{m.rate.toFixed(0)}%</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Motivos de Perda - BI Baseado em Colunas de Retorno */}
                <section className="report-panel">
                    <div className="p-header"><h3><Prohibit size={20} weight="duotone" /> Motivos de Perda (Insight)</h3><span className="p-badge warning">Churn Pré-Venda</span></div>
                    <div className="loss-grid-detailed">
                        {reportData.losses.length === 0 ? (
                            <div className="empty-bi">Alimente o campo 'Motivo de Perda' no Lead para ver dados aqui.</div>
                        ) : reportData.losses.map(l => (
                            <div key={l.reason} className="loss-row-bi">
                                <div className="bi-label"><span>{l.reason}</span><strong>{l.count}</strong></div>
                                <div className="bi-bar-container"><div className="bi-bar-fill" style={{ width: `${l.perc}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <style>{`
                .reports-container { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .stats-grid-hex { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                .stat-card-premium { background: #11141d; border: 1px solid #1e2430; padding: 1.25rem; border-radius: 20px; }
                .s-header { display: flex; align-items: center; gap: 8px; margin-bottom: 0.75rem; }
                .s-label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .s-value { font-size: 1.6rem; font-weight: 950; color: #fff; display: block; }
                .s-desc { font-size: 0.65rem; color: #475569; margin-top: 4px; display: block; }

                .main-reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .report-panel { background: #11141d; border: 1px solid #1e2430; border-radius: 24px; padding: 1.5rem; }
                .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .p-header h3 { font-size: 0.95rem; color: #f8fafc; margin:0; }

                .team-ranking { display: flex; flex-direction: column; gap: 12px; }
                .rank-item { display: flex; align-items: center; gap: 1rem; background: #080a0f; padding: 12px; border-radius: 12px; }
                .rank-num { font-size: 0.8rem; font-weight: 900; color: #3b82f6; width: 24px; }
                .rank-name { flex: 1; }
                .rank-name strong { display: block; font-size: 0.85rem; color: #fff; }
                .rank-name span { font-size: 0.7rem; color: #475569; }
                .rank-perc { font-weight: 900; font-size: 1.1rem; }

                .loss-grid-detailed { display: flex; flex-direction: column; gap: 1.5rem; }
                .loss-row-bi { display: flex; flex-direction: column; gap: 8px; }
                .bi-label { display: flex; justify-content: space-between; align-items: baseline; }
                .bi-label span { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
                .bi-label strong { color: #f8fafc; font-size: 1rem; }
                .bi-bar-container { height: 6px; background: #ef444410; border-radius: 3px; }
                .bi-bar-fill { height: 100%; background: #ef4444; border-radius: 3px; }
                .empty-bi { padding: 40px; text-align: center; color: #475569; font-style: italic; font-size: 0.9rem; }
            `}</style>
        </div>
    );
};

export default LeadReports;
