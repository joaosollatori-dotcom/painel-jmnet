import React from 'react';
import { Users, MessageSquare, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const stats = [
        { label: 'Atendimentos Hoje', value: '42', icon: MessageSquare, color: '#3b82f6' },
        { label: 'Tempo Médio', value: '12m', icon: Clock, color: '#10b981' },
        { label: 'Novos Clientes', value: '8', icon: Users, color: '#f59e0b' },
        { label: 'Concluídos', value: '38', icon: CheckCircle, color: '#8b5cf6' },
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Relatórios e Performance</h1>
                    <p>Visão geral da sua operação em tempo real.</p>
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
                        <h3>Volume de Atendimento per Hora</h3>
                        <TrendingUp size={20} />
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
                        <div className="activity-item">
                            <div className="activity-dot" />
                            <div className="activity-text">
                                <strong>João Silva</strong> finalizou atendimento às 13:40
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-dot green" />
                            <div className="activity-text">
                                <strong>Titã AI</strong> resolveu dúvida técnica de Maria S.
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-dot orange" />
                            <div className="activity-text">
                                <strong>Equipe Financeira</strong> recebeu transferência de chat
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
