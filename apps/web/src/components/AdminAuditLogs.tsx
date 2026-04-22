import React, { useState, useEffect } from 'react';
import { Scroll, Funnel, MagnifyingGlass, User, Hash, Clock, ArrowRight, Activity, Cpu } from '@phosphor-icons/react';
import { z } from 'zod';
import { api } from '../services/api';

export interface AuditLog {
    id: string;
    userId: string | null;
    user: { email: string, full_name: string } | null;
    action: string;
    entity: string;
    entityId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    details: any;
    createdAt: string;
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
        // Um poll de 30 segundos para "Tempo Real" passivo
        const intv = setInterval(fetchLogs, 30000);
        return () => clearInterval(intv);
    }, [filterAction, filterEntity, filterUserId]);

    return (
        <div className="audit-datadog-container">
            <header className="audit-datadog-header">
                <div>
                    <h3><Cpu size={24} weight="duotone" /> Monitor de Eventos & Auditoria (Imutável)</h3>
                    <p>Log forense de requisições, endpoints e ações de UI.</p>
                </div>
                <div className="audit-stats">
                    <div className="stat-pill"><strong>{total}</strong> Total Logs</div>
                </div>
            </header>

            <div className="audit-datadog-filters">
                <div className="titan-field">
                    <Funnel size={16} />
                    <select className="titan-input" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                        <option value="">Qualquer Ação</option>
                        <option value="ACCESS">Acessos Restritos</option>
                        <option value="CREATE">Inserções (POST)</option>
                        <option value="UPDATE">Modificações (PUT/PATCH)</option>
                        <option value="DELETE">Exclusões</option>
                    </select>
                </div>
                <div className="titan-field">
                    <Hash size={16} />
                    <select className="titan-input" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
                        <option value="">Todo o Sistema</option>
                        <option value="SYSTEM">Sistema Base</option>
                        <option value="ASSINANTE">Módulo Assinantes</option>
                        <option value="ORDEM_SERVICO">Módulo Técnico (Ordens)</option>
                        <option value="WHATSAPP">Gateway WhatsApp / Chat</option>
                        <option value="FINANCEIRO">Transações Financeiras</option>
                        <option value="TR069">Comandos Dispositivos GeniACS</option>
                    </select>
                </div>
            </div>

            <div className="audit-datadog-table">
                <div className="audit-row-header">
                    <div className="col-time"><Clock /> HORA</div>
                    <div className="col-action">EVENTO</div>
                    <div className="col-user"><User /> ALVO / AGENTE</div>
                    <div className="col-desc">CONTEXTO E CARGA</div>
                </div>
                
                <div className="audit-row-body ic-sidebar-scroll">
                    {loading && logs.length === 0 ? (
                        <div className="audit-loading">📡 Sincronizando nó central...</div>
                    ) : logs.map(log => {
                        const isExpanded = expandedLogId === log.id;
                        return (
                            <div key={log.id} className={`audit-item ${isExpanded ? 'expanded' : ''}`}>
                                <div className="audit-item-row" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                                    <div className="col-time">
                                        {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour12: false })}<br/>
                                        <small>{new Date(log.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <div className="col-action">
                                        <span className={`badge-action ${log.action.toLowerCase()}`}>{log.action}</span>
                                        <span className="badge-entity">{log.entity}</span>
                                    </div>
                                    <div className="col-user">
                                        <strong>{log.user?.full_name || 'Sistema API'}</strong>
                                        <small>{log.ipAddress}</small>
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
