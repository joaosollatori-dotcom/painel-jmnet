import React, { useEffect, useState } from 'react';
import { Users, ChatCircleDots, Clock, TrendUp, CheckCircle } from '@phosphor-icons/react';
import { getConversations, getMessages } from '../services/chatService';
import type { Conversation } from '../services/chatService';
import LoadingScreen from './LoadingScreen';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [avgTime, setAvgTime] = useState('--');
    const [activities, setActivities] = useState<{ text: string; color: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const convs = await getConversations();
            setConversations(convs);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayConvs = convs.filter(c => new Date(c.last_message_at) >= today);

            // Calcular tempo médio de resposta (simplificado)
            let totalDiffMin = 0;
            let count = 0;
            for (const c of todayConvs.slice(0, 5)) {
                try {
                    const msgs = await getMessages(c.id);
                    if (msgs.length >= 2) {
                        const first = new Date(msgs[0].created_at).getTime();
                        const second = new Date(msgs[1].created_at).getTime();
                        totalDiffMin += (second - first) / 60000;
                        count++;
                    }
                } catch { /* skip */ }
            }
            if (count > 0) {
                const avg = Math.round(totalDiffMin / count);
                setAvgTime(`${avg}m`);
            }

            // Gerar atividades recentes reais
            const recentActivities = convs.slice(0, 5).map(c => {
                if (c.is_closed) return { text: `${c.contact_name} teve atendimento encerrado`, color: 'orange' };
                if (c.is_archived) return { text: `${c.contact_name} foi arquivado`, color: '' };
                return { text: `${c.contact_name} — última msg: ${new Date(c.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, color: 'green' };
            });
            setActivities(recentActivities);
        } catch (err) {
            console.error('Erro ao carregar dados do dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const todayCount = conversations.filter(c => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return new Date(c.last_message_at) >= today;
    }).length;

    const closedCount = conversations.filter(c => c.is_closed).length;
    const newClients = conversations.filter(c => {
        const d = new Date(c.created_at);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return d >= today;
    }).length;

    const stats = [
        { label: 'Atendimentos Hoje', value: String(todayCount), icon: ChatCircleDots, color: '#3b82f6' },
        { label: 'Tempo Médio', value: avgTime, icon: Clock, color: '#10b981' },
        { label: 'Novos Clientes', value: String(newClients), icon: Users, color: '#f59e0b' },
        { label: 'Concluídos', value: String(closedCount), icon: CheckCircle, color: '#8b5cf6' },
    ];

    if (loading) return <LoadingScreen message="Inicializando Painel de Performance..." />;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Relatórios e Performance <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400 }}>v2.05.28</span></h1>
                    <p>Operação unificada: CRM, Agenda Técnica e Ocorrências em tempo real.</p>
                </div>
                <div className="dashboard-date">
                    {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
            </header>

            <div className="stats-grid">
                {stats.map((item, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                            <item.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{item.value}</span>
                            <span className="stat-label">{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-charts">
                <div className="chart-card placeholder">
                    <div className="chart-header">
                        <h3>Volume de Atendimento por Hora</h3>
                        <TrendUp size={20} />
                    </div>
                    <div className="chart-content">
                        <div className="bar-container">
                            {[40, 60, 45, 90, 65, 80, 50, 70, 85].map((h, i) => (
                                <div key={i} className="bar" style={{ height: `${h}%` }}>
                                    <span className="bar-tooltip">{h} atend.</span>
                                </div>
                            ))}
                        </div>
                        <div className="bar-labels">
                            {['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h'].map(l => <span key={l}>{l}</span>)}
                        </div>
                    </div>
                </div>

                <div className="activity-list chart-card">
                    <h3>Últimas Atividades</h3>
                    <div className="activity-items">
                        {activities.length === 0 ? (
                            <div className="activity-item"><div className="activity-dot" /><div className="activity-text">Carregando atividades...</div></div>
                        ) : activities.map((act, i) => (
                            <div className="activity-item" key={i}>
                                <div className={`activity-dot ${act.color}`} />
                                <div className="activity-text">{act.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
