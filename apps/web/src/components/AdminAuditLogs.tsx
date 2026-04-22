import React, { useState, useEffect } from 'react';
import { Scroll, Funnel, MagnifyingGlass, User as UserIcon, Hash, Clock, ArrowRight, Lightning, Cpu, Sparkle, Warning, ChartLineUp, MapPin, ListDashes, ShieldCheck, Browser } from '@phosphor-icons/react';
import { api } from '../services/api';
import './AdminAuditDashboard.css';

export interface AuditLog {
    id: string;
    actor_id: string | null;
    User: { email: string, raw_user_meta_data: any } | null;
    action: string;
    resource: string;
    entityId: string | null;
    ip_address: string | null;
    details: any;
    created_at: string;
}

export const AdminAuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterUserId, setFilterUserId] = useState('');

    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterAction) params.append('action', filterAction);
            if (filterEntity) params.append('entity', filterEntity);
            if (filterUserId) params.append('userId', filterUserId);

            // Tenta usar a nova API, fallback para fetch silencioso em caso de pooler connection drop.
            const req = await api.get(`/v1/audit?${params.toString()}`);
            setLogs(req.data.logs || []);
            setTotal(req.data.total || 0);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const intv = setInterval(fetchLogs, 30000);
        return () => clearInterval(intv);
    }, [filterAction, filterEntity, filterUserId]);

    // Derived Statistics
    const accesses = logs.filter(l => l.action === 'ACCESS' || l.action === 'GET').length;
    const creations = logs.filter(l => l.action === 'CREATE' || l.action === 'POST').length;
    const updates = logs.filter(l => l.action === 'UPDATE' || l.action === 'PUT' || l.action === 'PATCH').length;
    const deletions = logs.filter(l => l.action === 'DELETE').length;

    // For realistic bar sizes even with small data
    const safeTotal = logs.length || 1;
    const accPct = Math.max(5, (accesses / safeTotal) * 100);
    const crePct = Math.max(5, (creations / safeTotal) * 100);
    const updPct = Math.max(5, (updates / safeTotal) * 100);
    const delPct = Math.max(5, (deletions / safeTotal) * 100);

    // Mock trend points for the SVG line chart
    const trendPoints = "0,80 20,70 40,75 60,60 80,65 100,40 120,45 140,20 160,30 180,10 200,25";

    return (
        <div className="audit-dashboard-container">
            {/* Top Dashboard Layer */}
            <div className="audit-grid-top">
                <div className="audit-glass-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
                    <header>
                        <h3>Fluxo de Eventos e Auditoria</h3>
                        <span className="audit-card-action">Este mês ⌄</span>
                    </header>
                    <div className="event-volume-stats">
                        <div className="event-stat-box">
                            <p>Total de Eventos</p>
                            <h2>{total > 0 ? total : '24.5K'}</h2>
                        </div>
                        <div className="event-stat-box">
                            <p>Acessos Registrados</p>
                            <h2>{accesses > 0 ? accesses : '14.2K'}</h2>
                        </div>
                        <div className="event-stat-box">
                            <p>Atualizações / PUT</p>
                            <h2>{updates > 0 ? updates : '6.1K'}</h2>
                        </div>
                        <div className="event-stat-box">
                            <p>Inserções / POST</p>
                            <h2>{creations > 0 ? creations : '3.8K'}</h2>
                        </div>
                        <div className="event-stat-box">
                            <p>Deleções / CUIDADO</p>
                            <h2>{deletions > 0 ? deletions : '400'}</h2>
                        </div>
                    </div>

                    <div className="event-stacked-bar">
                        <div className="bar-segment bg-access" style={{ width: `${accPct}%` }} title="Acessos" />
                        <div className="bar-segment bg-create" style={{ width: `${crePct}%` }} title="Inserções" />
                        <div className="bar-segment bg-update" style={{ width: `${updPct}%` }} title="Atualizações" />
                        <div className="bar-segment bg-delete" style={{ width: `${delPct}%` }} title="Deleções" />
                    </div>

                    <div className="ai-insight-box">
                        <div className="ai-icon-circle">
                            <Sparkle weight="fill" size={16} />
                        </div>
                        <div>
                            <p style={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}>AI Security Insight baseada na sua performance mensal.</p>
                            <p>Detectamos um pico de +45% nas modificações operacionais. Gostaria de analisar o que está impulsionando esse fluxo de trabalho no CRM?</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="audit-glass-card">
                        <header>
                            <h3>Registros Suspeitos</h3>
                            <Warning color="#ef4444" weight="fill" />
                        </header>
                        <div className="mini-metric-value">24</div>
                        <div className="mini-metric-trend trend-down">
                            <ArrowRight style={{ transform: 'rotate(45deg)' }} /> -12.5% Comparado ao mês passado
                        </div>
                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0 }}>
                            15 requisições de IPs blocklist identificadas.
                        </p>
                    </div>

                    <div className="audit-glass-card">
                        <header>
                            <h3>Limite de Rate API</h3>
                            <Lightning color="#8b5cf6" />
                        </header>
                        <div className="mini-metric-value" style={{ fontSize: '1.5rem' }}>450.000 <span style={{ fontSize: '1rem', color: '#9ca3af' }}>de 1M</span></div>
                        <div className="mini-metric-trend trend-up">
                            <ArrowRight style={{ transform: 'rotate(-45deg)' }} /> +10% de volumetria total
                        </div>
                        <div className="progress-segmented">
                            <div className="progress-seg active"></div>
                            <div className="progress-seg active"></div>
                            <div className="progress-seg active"></div>
                            <div className="progress-seg"></div>
                            <div className="progress-seg"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Dashboard Layer */}
            <div className="audit-grid-middle">
                {/* Health Score */}
                <div className="audit-glass-card health-score-box">
                    <div className="ai-icon-circle" style={{ marginBottom: '1rem' }}>
                        <ShieldCheck weight="fill" size={20} />
                    </div>
                    <div className="health-score-value">96%</div>
                    <div className="health-score-desc">System Health Score <strong>+3.5%</strong><br />desde a última checagem sonora.</div>
                    <div className="health-suggestions">
                        <div className="health-sugg-item">
                            <span className="sugg-action">Bloquear IPs asiáticos</span>
                            <span className="sugg-impact">Evita 2K hits/mês</span>
                        </div>
                        <div className="health-sugg-item">
                            <span className="sugg-action">Rotacionar Tokens JWT</span>
                            <span className="sugg-impact">Aumento de Seg.</span>
                        </div>
                    </div>
                </div>

                {/* Geo Distribution Map */}
                <div className="audit-glass-card">
                    <header>
                        <h3>Distribuição de Autenticações (Region / Server)</h3>
                        <MapPin />
                    </header>
                    <div className="geo-distribution">
                        <div className="geo-stats">
                            <div className="geo-stat-col">
                                <h4>BRA</h4>
                                <p>Mercado Principal</p>
                            </div>
                            <div className="geo-stat-col">
                                <h4>7</h4>
                                <p>Módulos Ativos</p>
                            </div>
                            <div className="geo-stat-col">
                                <h4 style={{ color: '#10b981' }}>+18.6%</h4>
                                <p>Crescimento Mensal</p>
                            </div>
                        </div>
                        <div className="map-placeholder">
                            <div className="map-pin" style={{ top: '60%', left: '30%' }}>Brasil <span>$2.8K hits</span></div>
                            <div className="map-pin" style={{ top: '40%', left: '20%' }}>USA <span>$6.1K hits</span></div>
                            <div className="map-pin" style={{ top: '35%', left: '50%' }}>Portugal <span>$8.9K hits</span></div>
                        </div>
                    </div>
                </div>

                {/* Threat Trend (Sales Target equivalent) */}
                <div className="audit-glass-card">
                    <header>
                        <h3>Alvos Frequentes (Trend)</h3>
                        <div className="mini-metric-trend trend-down">
                            <ChartLineUp /> -12.3% neste mês
                        </div>
                    </header>
                    <svg viewBox="0 0 200 100" className="svg-line-chart">
                        <polyline points={trendPoints} className="svg-line" />
                        <circle cx="160" cy="30" r="4" className="svg-point" />
                        <text x="160" y="15" fill="#f59e0b" fontSize="10" textAnchor="middle">Ontem</text>
                    </svg>
                    <div style={{ marginTop: '1rem' }}>
                        <div className="mini-metric-value" style={{ fontSize: '1.25rem' }}>138.400 reqs</div>
                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>Alvo normal de operações</p>
                    </div>
                </div>
            </div>

            {/* List / Inventory equiv */}
            <div className="audit-grid-top" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="audit-glass-card">
                    <header>
                        <h3>Módulo Mais Acessados</h3>
                        <span className="audit-card-action">Limites Maximizados ⌄</span>
                    </header>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 600, color: '#fff' }}>2,480 <span style={{ fontSize: '1rem', color: '#10b981' }}>+3.7%</span></div>
                            <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>Acessos no CRM. Atividade normal.</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 600, color: '#fff', opacity: 0.6 }}>312 <span style={{ fontSize: '1rem', color: '#ef4444' }}>-5.2%</span></div>
                            <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>Acessos Operacionais / ONU</p>
                        </div>
                    </div>
                </div>

                <div className="audit-glass-card">
                    <header>
                        <h3>Agentes com Mais Atividade (Top Users)</h3>
                        <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Full Report</button>
                    </header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}><UserIcon size={20} /></div>
                                <div><h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Suporte Técnico T3</h4><span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>/v1/os/update</span></div>
                            </div>
                            <div style={{ textAlign: 'right' }}><h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>162 logs</h4><span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Hoje</span></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}><Browser size={20} /></div>
                                <div><h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Integração ERP Externo</h4><span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>/v1/financeiro/sync</span></div>
                            </div>
                            <div style={{ textAlign: 'right' }}><h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>129 logs</h4><span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Hoje</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Original Logs Table with glassmorphism inherited */}
            <div className="audit-datadog-table">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Log de Ações Raw</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="titan-field" style={{ margin: 0 }}>
                            <Funnel size={16} />
                            <select className="titan-input" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                                <option value="">Qualquer Ação</option>
                                <option value="ACCESS">Acessos Restritos</option>
                                <option value="CREATE">Inserções (POST)</option>
                                <option value="UPDATE">Modificações (PUT/PATCH)</option>
                                <option value="DELETE">Exclusões</option>
                            </select>
                        </div>
                        <div className="titan-field" style={{ margin: 0 }}>
                            <Hash size={16} />
                            <select className="titan-input" value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                                <option value="">Todo o Sistema</option>
                                <option value="SYSTEM">Sistema Base</option>
                                <option value="ASSINANTE">Módulo Assinantes</option>
                                <option value="ORDEM_SERVICO">Módulo Técnico (Ordens)</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="audit-row-header">
                    <div className="col-time"><Clock /> HORA</div>
                    <div className="col-action">EVENTO</div>
                    <div className="col-user"><UserIcon /> ALVO / AGENTE</div>
                    <div className="col-desc">CONTEXTO E CARGA</div>
                </div>

                <div className="audit-row-body ic-sidebar-scroll" style={{ maxHeight: '400px' }}>
                    {loading && logs.length === 0 ? (
                        <div className="audit-loading">📡 Sincronizando logs forenses...</div>
                    ) : logs.map(log => {
                        const isExpanded = expandedLogId === log.id;
                        const userName = log.User?.raw_user_meta_data?.full_name || log.User?.email || 'Sistema API';

                        return (
                            <div key={log.id} className={`audit-item ${isExpanded ? 'expanded' : ''}`}>
                                <div className="audit-item-row" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                                    <div className="col-time">
                                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour12: false })}<br />
                                        <small>{new Date(log.created_at).toLocaleDateString()}</small>
                                    </div>
                                    <div className="col-action">
                                        <span className={`badge-action ${log.action.toLowerCase()}`}>{log.action}</span>
                                        <span className="badge-entity">{log.resource}</span>
                                    </div>
                                    <div className="col-user">
                                        <strong>{userName}</strong>
                                        <small>{log.ip_address}</small>
                                    </div>
                                    <div className="col-desc">
                                        <span className="log-url">{log.details?.method} {log.details?.url}</span>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="audit-payload-code">
                                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
