import React from 'react';
import {
    TrendUp,
    CurrencyDollar,
    Wrench,
    HardDrive,
    WarningCircle,
    Users,
    CheckCircle,
    Clock
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import './DashboardManager.css';

const DashboardManager: React.FC = () => {
    const { profile } = useAuth();
    const role = profile?.role || 'READONLY';

    const renderAdminDashboard = () => (
        <div className="dashboard-grid">
            <StatCard title="Total Leads" value="1,284" icon={TrendUp} trend="+12%" color="#3b82f6" />
            <StatCard title="Faturamento Mensal" value="R$ 42.500" icon={CurrencyDollar} trend="+5%" color="#10b981" />
            <StatCard title="O.S. Pendentes" value="18" icon={Wrench} trend="-2" color="#f59e0b" />
            <StatCard title="Equipamentos Online" value="98%" icon={HardDrive} trend="Estável" color="#06b6d4" />

            <div className="dashboard-row">
                <div className="dashboard-card main-chart">
                    <h3>Crescimento de Assinantes</h3>
                    <div className="chart-placeholder">[Gráfico de Linha: 12 meses]</div>
                </div>
                <div className="dashboard-card alerts-panel">
                    <h3>Alertas Críticos</h3>
                    <div className="alert-item danger">
                        <WarningCircle size={20} />
                        <span>OLT Principal: Alta Temperatura (72°C)</span>
                    </div>
                    <div className="alert-item warning">
                        <WarningCircle size={20} />
                        <span>Link Backup: Perda de pacotes detectada</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFinanceiroDashboard = () => (
        <div className="dashboard-grid">
            <StatCard title="Receita Prevista" value="R$ 150.200" icon={CurrencyDollar} trend="No Alvo" color="#3b82f6" />
            <StatCard title="Inadimplência" value="4.2%" icon={WarningCircle} trend="-0.5%" color="#ef4444" />
            <StatCard title="Faturas Liquidadas" value="892" icon={CheckCircle} trend="+12" color="#10b981" />
            <StatCard title="Contas a Pagar" value="R$ 12.400" icon={Clock} trend="Vence Hoje" color="#f59e0b" />

            <div className="dashboard-row">
                <div className="dashboard-card full">
                    <h3>Últimas Transações (Pluggy)</h3>
                    <div className="table-placeholder">
                        <p>Aguardando integração em tempo real...</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTecnicoDashboard = () => (
        <div className="dashboard-grid">
            <StatCard title="Minha Agenda (O.S)" value="6" icon={Wrench} trend="Hoje" color="#3b82f6" />
            <StatCard title="Sinal Médio Rede" value="-19 dBm" icon={HardDrive} trend="Excelente" color="#10b981" />
            <StatCard title="Ocorrências Abertas" value="12" icon={WarningCircle} trend="+3" color="#ef4444" />
            <StatCard title="Instalações Concluídas" value="42" icon={CheckCircle} trend="Mês" color="#06b6d4" />

            <div className="dashboard-row">
                <div className="dashboard-card main-chart">
                    <h3>Equipamentos por Status (GenieACS)</h3>
                    <div className="chart-placeholder">[Gráfico de Pizza: Online/Offline/Alert]</div>
                </div>
            </div>
        </div>
    );

    const renderComercialDashboard = () => (
        <div className="dashboard-grid">
            <StatCard title="Novos Leads" value="14" icon={Users} trend="Hoje" color="#3b82f6" />
            <StatCard title="Propostas Aceitas" value="28" icon={CheckCircle} trend="Conversão 15%" color="#10b981" />
            <StatCard title="Tickets Médio" value="R$ 98,90" icon={CurrencyDollar} trend="+R$ 5,00" color="#f59e0b" />
            <StatCard title="Contatos Pendentes" value="5" icon={Clock} trend="Urgente" color="#ef4444" />
        </div>
    );

    return (
        <div className="dashboard-manager">
            <header className="dashboard-header">
                <h1>Painel Executivo</h1>
                <p>Visão estratégica para perfil: <strong>{role}</strong></p>
            </header>

            {role === 'ADMIN' || role === 'SUPER_ADMIN' ? renderAdminDashboard() :
                role === 'FINANCEIRO' ? renderFinanceiroDashboard() :
                    role === 'TECNICO' ? renderTecnicoDashboard() :
                        role === 'VENDEDOR' || role === 'COMERCIAL' ? renderComercialDashboard() :
                            renderTecnicoDashboard() /* Default fallback */}
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    icon: any;
    trend: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => (
    <div className="stat-card glass">
        <div className="stat-content">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-trend" style={{ color: trend.includes('+') || trend.includes('Excelente') ? 'var(--success)' : trend.includes('-') && !trend.includes('pacotes') ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {trend}
            </span>
        </div>
        <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={28} weight="fill" />
        </div>
    </div>
);

export default DashboardManager;
