import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChartPieSlice, ChartLineUp, Users,
    ArrowUpRight, ArrowDownRight, Clock,
    Funnel, MapPin, Target,
    Handshake, Warning, Calendar,
    FileText, MapTrifold, CaretRight,
    CaretLeft, DownloadSimple, User
} from '@phosphor-icons/react';
import LoadingScreen from './LoadingScreen';

type TabType = 'dashboard' | 'operacional' | 'estrategico';

const LeadReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        // Simular carregamento de dados pesados de telemetria/relatórios
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <LoadingScreen message="Gerando Inteligência de Dados..." />;

    const renderDashboard = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="reports-content"
        >
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <div className="icon-wrapper blue"><User size={24} weight="duotone" /></div>
                        <span className="trend positive"><ArrowUpRight size={14} /> 12%</span>
                    </div>
                    <div className="metric-value">482</div>
                    <div className="metric-label">Novos Leads (30d)</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <div className="icon-wrapper green"><Target size={24} weight="duotone" /></div>
                        <span className="trend positive"><ArrowUpRight size={14} /> 5%</span>
                    </div>
                    <div className="metric-value">24.8%</div>
                    <div className="metric-label">Taxa de Conversão</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <div className="icon-wrapper purple"><Clock size={24} weight="duotone" /></div>
                        <span className="trend negative"><ArrowDownRight size={14} /> 8%</span>
                    </div>
                    <div className="metric-value">3.2 dias</div>
                    <div className="metric-label">Tempo Médio de Fechamento</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <div className="icon-wrapper orange"><MapPin size={24} weight="duotone" /></div>
                        <span className="trend positive"><ArrowUpRight size={14} /> 18%</span>
                    </div>
                    <div className="metric-value">62%</div>
                    <div className="metric-label">Taxa de Viabilidade</div>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-container main-funnel">
                    <div className="container-header">
                        <h3>Funil de Vendas Visual</h3>
                        <p>Distribuição de leads por etapa do processo</p>
                    </div>
                    <div className="funnel-visual">
                        {[
                            { stage: 'Novo Lead', val: 1200, color: '#3b82f6', perc: '100%' },
                            { stage: 'Qualificação', val: 840, color: '#6366f1', perc: '70%' },
                            { stage: 'Viabilidade', val: 560, color: '#8b5cf6', perc: '46%' },
                            { stage: 'Proposta', val: 320, color: '#a855f7', perc: '26%' },
                            { stage: 'Fechamento', val: 180, color: '#d946ef', perc: '15%' }
                        ].map((item, i) => (
                            <div key={i} className="funnel-step" style={{ width: `calc(${100 - (i * 10)}% )` }}>
                                <div className="step-bar" style={{ background: item.color }}>
                                    <span className="step-name">{item.stage}</span>
                                    <span className="step-val">{item.val}</span>
                                </div>
                                <div className="conversion-tag">{item.perc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-container channel-distribution">
                    <div className="container-header">
                        <h3>Leads por Canal</h3>
                        <p>Origem dos leads qualificados</p>
                    </div>
                    <div className="channel-list">
                        {[
                            { name: 'WhatsApp', value: 45, color: '#10b981' },
                            { name: 'Instagram', value: 25, color: '#ef4444' },
                            { name: 'Indicação', value: 15, color: '#f59e0b' },
                            { name: 'Google Ads', value: 10, color: '#3b82f6' },
                            { name: 'Site', value: 5, color: '#6366f1' }
                        ].map((c, i) => (
                            <div key={i} className="channel-item">
                                <div className="channel-info">
                                    <span>{c.name}</span>
                                    <strong>{c.value}%</strong>
                                </div>
                                <div className="progress-bg">
                                    <div className="progress-fill" style={{ width: `${c.value}%`, background: c.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderOperacional = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="reports-content"
        >
            <div className="report-table-container">
                <div className="container-header">
                    <h3>Produtividade por Vendedor</h3>
                    <div className="header-actions">
                        <button className="btn-icon"><DownloadSimple size={20} /></button>
                    </div>
                </div>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Vendedor</th>
                            <th>Leads Trabalhados</th>
                            <th>Ações/Dia</th>
                            <th>Conversão</th>
                            <th>Ticket Médio</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: 'Ricardo Santos', worked: 142, actions: 45, conv: '18.2%', ticket: 'R$ 124,90', status: 'high' },
                            { name: 'Ana Oliveira', worked: 128, actions: 38, conv: '15.5%', ticket: 'R$ 132,00', status: 'mid' },
                            { name: 'Carlos Lima', worked: 115, actions: 42, conv: '21.0%', ticket: 'R$ 118,50', status: 'high' },
                            { name: 'Juliana Costa', worked: 98, actions: 25, conv: '12.8%', ticket: 'R$ 145,90', status: 'low' }
                        ].map((row, i) => (
                            <tr key={i}>
                                <td className="td-user">
                                    <div className="avatar-small">{row.name[0]}</div>
                                    {row.name}
                                </td>
                                <td>{row.worked}</td>
                                <td>{row.actions}</td>
                                <td><span className={`badge ${row.status}`}>{row.conv}</span></td>
                                <td>{row.ticket}</td>
                                <td>
                                    <div className="perf-bar">
                                        <div className="perf-fill" style={{ width: row.worked > 120 ? '90%' : '60%' }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="loss-analysis">
                <div className="chart-container">
                    <div className="container-header">
                        <h3>Motivos de Perda (Churn de Leads)</h3>
                    </div>
                    <div className="loss-grid">
                        {[
                            { reason: 'Preço/Valor', count: 45, color: '#ef4444' },
                            { reason: 'Sem Viabilidade Técnica', count: 32, color: '#f59e0b' },
                            { reason: 'Concorrência', count: 18, color: '#3b82f6' },
                            { reason: 'Desistência/Mudança', count: 5, color: '#6366f1' }
                        ].map((l, i) => (
                            <div key={i} className="loss-card">
                                <strong>{l.count}%</strong>
                                <span>{l.reason}</span>
                                <div className="mini-chart" style={{ height: `${l.count * 2}px`, background: l.color }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderEstrategico = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="reports-content"
        >
            <div className="strategic-header">
                <h2>Mapa de Oportunidades ISP</h2>
                <p>Análise geográfica de leads vs viabilidade para expansão de rede</p>
            </div>

            <div className="map-simulation">
                <div className="map-placeholder">
                    <MapTrifold size={48} weight="duotone" />
                    <span>Visualização de Mapa de Calor (Simulada)</span>
                    <p>Bairros com maior densidade de leads sem cobertura: <strong>Vila Nova, Centro, Planalto</strong></p>
                </div>
                <div className="map-legend">
                    <div className="legend-item"><div className="dot red" /> Alta Demanda / Sem Rede</div>
                    <div className="legend-item"><div className="dot green" /> Rede Disponível</div>
                    <div className="legend-item"><div className="dot blue" /> Em Expansão</div>
                </div>
            </div>

            <div className="revenue-analisys">
                <div className="chart-container">
                    <div className="container-header">
                        <h3>Performance por Plano Ofertado</h3>
                    </div>
                    <div className="plans-grid">
                        {[
                            { name: 'Fibra 300MB', conv: '42%', rev: 'R$ 54.000', color: '#10b981' },
                            { name: 'Fibra 500MB', conv: '35%', rev: 'R$ 72.500', color: '#3b82f6' },
                            { name: 'Fibra 1GB', conv: '12%', rev: 'R$ 31.200', color: '#8b5cf6' },
                            { name: 'Empresarial', conv: '11%', rev: 'R$ 88.400', color: '#f59e0b' }
                        ].map((p, i) => (
                            <div key={i} className="plan-stat-card">
                                <div className="stat-circle" style={{ borderColor: p.color }}>{p.conv}</div>
                                <h4>{p.name}</h4>
                                <p>Receita Estimada: <strong>{p.rev}</strong></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="reports-container">
            <header className="page-header">
                <div className="header-titles">
                    <h1>Indicadores & Relatórios</h1>
                    <p>Dashboard estratégico para gestão inteligente de leads</p>
                </div>
                <div className="date-filter">
                    <Calendar size={20} />
                    <span>Últimos 30 dias</span>
                </div>
            </header>

            <nav className="reports-tabs">
                <button
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <ChartPieSlice size={20} weight="duotone" /> Dashboard Real-time
                </button>
                <button
                    className={activeTab === 'operacional' ? 'active' : ''}
                    onClick={() => setActiveTab('operacional')}
                >
                    <FileText size={20} weight="duotone" /> Relatórios Operacionais
                </button>
                <button
                    className={activeTab === 'estrategico' ? 'active' : ''}
                    onClick={() => setActiveTab('estrategico')}
                >
                    <Target size={20} weight="duotone" /> Estratégico ISP
                </button>
            </nav>

            <div className="reports-viewport">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'operacional' && renderOperacional()}
                    {activeTab === 'estrategico' && renderEstrategico()}
                </AnimatePresence>
            </div>

            <style>{`
                .reports-container { padding: var(--space-lg); height: 100%; overflow-y: auto; background: var(--bg-deep); display: flex; flex-direction: column; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-titles h1 { font-size: 2rem; font-weight: 800; color: #fff; margin: 0; }
                .header-titles p { color: #666; margin: 4px 0 0 0; }
                
                .date-filter { background: var(--bg-surface); border: 1px solid var(--border); padding: 10px 16px; border-radius: 12px; display: flex; align-items: center; gap: 10px; color: #888; cursor: pointer; font-size: 0.9rem; font-weight: 600; }

                .reports-tabs { display: flex; gap: 8px; margin-bottom: 2rem; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 16px; width: fit-content; }
                .reports-tabs button { background: transparent; border: none; color: #666; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s; font-size: 0.95rem; }
                .reports-tabs button:hover { color: #aaa; background: rgba(255,255,255,0.03); }
                .reports-tabs button.active { background: #1a1a1a; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

                .reports-viewport { flex: 1; }
                
                .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .metric-card { background: var(--bg-surface); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px; }
                .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .icon-wrapper { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .icon-wrapper.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .icon-wrapper.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .icon-wrapper.orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .trend { font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; }
                .trend.positive { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .trend.negative { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .metric-value { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
                .metric-label { font-size: 0.85rem; color: #666; font-weight: 500; }

                .charts-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
                .chart-container { background: var(--bg-surface); border: 1px solid var(--border); padding: 2rem; border-radius: 24px; }
                .container-header h3 { margin: 0; font-size: 1.2rem; color: #fff; font-weight: 800; }
                .container-header p { margin: 6px 0 0 0; font-size: 0.9rem; color: #555; }

                .funnel-visual { margin-top: 3rem; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .funnel-step { position: relative; display: flex; align-items: center; justify-content: center; }
                .step-bar { width: 100%; height: 50px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; color: #fff; font-weight: 800; font-size: 0.9rem; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .conversion-tag { position: absolute; right: -60px; font-size: 0.8rem; font-weight: 900; color: #555; background: #111; padding: 4px 8px; border-radius: 6px; }

                .channel-list { margin-top: 2rem; display: flex; flex-direction: column; gap: 20px; }
                .channel-info { display: flex; justify-content: space-between; margin-bottom: 8px; color: #ccc; font-size: 0.9rem; font-weight: 600; }
                .progress-bg { height: 8px; background: #111; border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 10px; }

                .report-table-container { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; margin-bottom: 2rem; }
                .report-table { width: 100%; border-collapse: collapse; }
                .report-table th { text-align: left; padding: 1.5rem; background: rgba(255,255,255,0.02); color: #555; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900; }
                .report-table td { padding: 1.5rem; color: #ccc; border-top: 1px solid #1a1a1a; font-size: 0.95rem; }
                .td-user { display: flex; align-items: center; gap: 12px; font-weight: 600; color: #fff; }
                .avatar-small { width: 32px; height: 32px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; }
                .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; }
                .badge.high { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .badge.mid { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .badge.low { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .perf-bar { height: 6px; background: #111; border-radius: 10px; width: 100px; overflow: hidden; }
                .perf-fill { height: 100%; background: var(--primary-color); border-radius: 10px; }

                .loss-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-top: 2rem; }
                .loss-card { background: #111; padding: 1.5rem; border-radius: 16px; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
                .loss-card strong { font-size: 1.8rem; color: #fff; margin-bottom: 4px; }
                .loss-card span { font-size: 0.8rem; color: #666; text-align: center; }
                .mini-chart { position: absolute; bottom: 0; left: 0; width: 100%; opacity: 0.15; }

                .strategic-header { margin-bottom: 2rem; }
                .strategic-header h2 { margin: 0; font-size: 1.5rem; color: #fff; font-weight: 800; }
                .strategic-header p { margin: 4px 0 0 0; color: #555; }

                .map-simulation { background: #0a0a0a; border: 1px solid #222; border-radius: 24px; height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; margin-bottom: 2rem; overflow: hidden; }
                .map-placeholder { display: flex; flex-direction: column; align-items: center; gap: 20px; color: #333; }
                .map-placeholder span { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.02em; }
                .map-placeholder p { color: #555; font-size: 0.95rem; }
                .map-legend { position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 12px; border-radius: 12px; border: 1px solid #333; display: flex; flex-direction: column; gap: 8px; }
                .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #888; font-weight: 600; }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .dot.red { background: #ef4444; box-shadow: 0 0 10px #ef444455; }
                .dot.green { background: #10b981; }
                .dot.blue { background: #3b82f6; }

                .plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-top: 2rem; }
                .plan-stat-card { background: var(--bg-surface); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; }
                .stat-circle { width: 60px; height: 60px; border: 4px solid; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 1rem; }
                .plan-stat-card h4 { margin: 0 0 4px 0; color: #fff; }
                .plan-stat-card p { margin: 0; font-size: 0.8rem; color: #666; }
            `}</style>
        </div>
    );
};

export default LeadReports;
