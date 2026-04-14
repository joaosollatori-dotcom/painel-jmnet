import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, MagnifyingGlass, Funnel,
    IdentificationCard, Phone, MapPin,
    Suitcase, Calendar, Info,
    CheckCircle, XCircle, Clock,
    TrendUp, UserPlus, FileText,
    Buildings, User, WhatsappLogo,
    DotsThreeVertical, PencilSimple, Trash,
    ChatCircleDots, CalendarBlank, ArrowSquareOut,
    Archive, MapTrifold, Warning, CaretDown,
    PhoneCall, DeviceMobile, HardDrives, MapPinLine,
    CalendarPlus, X, WarningCircle, Checks,
    NavigationArrow, MagnifyingGlassPlus
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, getLeads, deleteLead, updateLead, createLead } from '../services/leadService';
import LoadingScreen from './LoadingScreen';
import { useToast } from '../contexts/ToastContext';

const LeadsManager: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [groupBy, setGroupBy] = useState<'none' | 'stage' | 'viability' | 'vendedor'>('none');
    const [currentQuickFilter, setCurrentQuickFilter] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [stageFilter, setStageFilter] = useState<string | null>(null);
    const [viabilityFilter, setViabilityFilter] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Lead>>({
        nomeCompleto: '',
        telefonePrincipal: '',
        canalEntrada: 'WhatsApp',
        tipoPessoa: 'PF',
        tipoCliente: 'RESIDENCIAL',
        statusQualificacao: 'PENDENTE',
        statusViabilidade: 'PENDENTE',
        scoreQualificacao: 0,
        tentativasContato: 0,
        isFrio: false,
        decisorIdentificado: false
    });

    useEffect(() => { loadLeads(); }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await getLeads();
            setLeads(data);
        } catch (err) {
            console.error('Error loading leads:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        return {
            noContact48h: leads.filter(l => new Date(l.dataUltimaInteracao) < fortyEightHoursAgo).length,
            pendingViability: leads.filter(l => l.statusViabilidade === 'PENDENTE' || l.statusViabilidade === 'EM_ANALISE').length,
            stalledProposals: leads.filter(l => l.statusProposta === 'ENVIADA' && new Date(l.updatedAt) < threeDaysAgo).length,
            overdueTasks: leads.filter(l => l.dataProximoContato && new Date(l.dataProximoContato) < now).length
        };
    }, [leads]);

    const processedLeads = useMemo(() => {
        let result = leads.filter(l => {
            const matchesSearch =
                l.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.cpfCnpj?.includes(searchTerm) ||
                l.telefonePrincipal.includes(searchTerm) ||
                l.logradouro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.bairro?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStage = !stageFilter || l.statusQualificacao === stageFilter;
            const matchesViability = !viabilityFilter || l.statusViabilidade === viabilityFilter;

            return matchesSearch && matchesStage && matchesViability;
        });

        if (currentQuickFilter === 'noContact48h') {
            const limit = new Date(Date.now() - 48 * 60 * 60 * 1000);
            result = result.filter(l => new Date(l.dataUltimaInteracao) < limit);
        } else if (currentQuickFilter === 'pendingViability') {
            result = result.filter(l => l.statusViabilidade === 'PENDENTE');
        } else if (currentQuickFilter === 'stalledProposals') {
            const limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            result = result.filter(l => l.statusProposta === 'ENVIADA' && new Date(l.updatedAt) < limit);
        }

        return result;
    }, [leads, searchTerm, stageFilter, viabilityFilter, currentQuickFilter]);

    const groupedLeads = useMemo(() => {
        if (groupBy === 'none') return { 'Todos os Leads': processedLeads };
        return processedLeads.reduce((acc, lead) => {
            const groupKey = groupBy === 'stage' ? lead.statusQualificacao : groupBy === 'viability' ? lead.statusViabilidade : lead.vendedorId || 'Sem Vendedor';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(lead);
            return acc;
        }, {} as Record<string, Lead[]>);
    }, [processedLeads, groupBy]);

    const getSLAStyle = (updatedAt: string) => {
        const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 4) return { color: '#ef4444', label: `${days}d parado (Crítico)` };
        if (days > 2) return { color: '#f59e0b', label: `${days}d parado (Alerta)` };
        return { color: '#10b981', label: days === 0 ? 'Entrou hoje' : `${days}d parado` };
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'VIAVEL': case 'QUALIFICADO': case 'ACEITA': return { bg: '#10b98120', text: '#10b981' };
            case 'INVIAVEL': case 'DESQUALIFICADO': case 'RECUSADA': return { bg: '#ef444420', text: '#ef4444' };
            case 'EM_ANALISE': return { bg: '#8b5cf620', text: '#8b5cf6' };
            default: return { bg: '#3b82f620', text: '#3b82f6' };
        }
    };

    return (
        <div className="crm-dashboard">
            <header className="crm-header">
                <div className="header-brand">
                    <div className="title-box">
                        <Users size={32} weight="duotone" />
                        <h1>Gestão de Leads ISP</h1>
                    </div>
                    <div className="count-pill">
                        <strong>{processedLeads.length}</strong> <span>Leads no Funil</span>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="search-multi-vector">
                        <MagnifyingGlass size={20} />
                        <input
                            placeholder="Busca unificada (Nome, CPF, Tel, Endereço...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-add-lead" onClick={() => setShowModal(true)}>
                        <Plus size={20} weight="bold" /> Novo Lead
                    </button>
                </div>
            </header>

            <section className="attention-bar">
                <div className={`attn-card ${currentQuickFilter === 'noContact48h' ? 'active' : ''}`} onClick={() => setCurrentQuickFilter(currentQuickFilter === 'noContact48h' ? null : 'noContact48h')}>
                    <span className="attn-val warning">{stats.noContact48h}</span>
                    <span className="attn-label">Sem contato +48h</span>
                </div>
                <div className={`attn-card ${currentQuickFilter === 'pendingViability' ? 'active' : ''}`} onClick={() => setCurrentQuickFilter(currentQuickFilter === 'pendingViability' ? null : 'pendingViability')}>
                    <span className="attn-val info">{stats.pendingViability}</span>
                    <span className="attn-label">Viab. Pendentes</span>
                </div>
                <div className={`attn-card ${currentQuickFilter === 'overdueTasks' ? 'active' : ''}`} onClick={() => setCurrentQuickFilter(currentQuickFilter === 'overdueTasks' ? null : 'overdueTasks')}>
                    <span className="attn-val overdue">{stats.overdueTasks}</span>
                    <span className="attn-label">Tarefas Vencidas</span>
                </div>
                <div className={`attn-card ${currentQuickFilter === 'stalledProposals' ? 'active' : ''}`} onClick={() => setCurrentQuickFilter(currentQuickFilter === 'stalledProposals' ? null : 'stalledProposals')}>
                    <span className="attn-val success">{stats.stalledProposals}</span>
                    <span className="attn-label">Propostas Paradas</span>
                </div>
            </section>

            <div className="toolbar-filters">
                <div className="chip-group">
                    <Funnel size={16} />
                    <select value={stageFilter || ''} onChange={e => setStageFilter(e.target.value || null)}>
                        <option value="">Filtro: Funil</option>
                        <option value="PENDENTE">Novo</option>
                        <option value="QUALIFICADO">Qualificado</option>
                        <option value="DESQUALIFICADO">Desqualificado</option>
                    </select>
                    <select value={viabilityFilter || ''} onChange={e => setViabilityFilter(e.target.value || null)}>
                        <option value="">Filtro: Viabilidade</option>
                        <option value="VIAVEL">Viável</option>
                        <option value="INVIAVEL">Inviável</option>
                        <option value="PENDENTE">Pendente</option>
                    </select>
                </div>

                <div className="group-toggle">
                    <span>Agrupar por:</span>
                    <div className="toggle-btns">
                        <button className={groupBy === 'none' ? 'active' : ''} onClick={() => setGroupBy('none')}>Nenhum</button>
                        <button className={groupBy === 'stage' ? 'active' : ''} onClick={() => setGroupBy('stage')}>Etapa</button>
                        <button className={groupBy === 'vendedor' ? 'active' : ''} onClick={() => setGroupBy('vendedor')}>Vendedor</button>
                    </div>
                </div>
            </div>

            <main className="crm-table-container ic-sidebar-scroll">
                <table className="crm-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}><input type="checkbox" /></th>
                            <th style={{ width: '28%' }}>Identificação do Lead</th>
                            <th style={{ width: '20%' }}>Contato e Canal</th>
                            <th style={{ width: '12%' }}>Etapa (SLA)</th>
                            <th style={{ width: '12%' }}>Qualificação</th>
                            <th style={{ width: '14%' }}>Viabilidade</th>
                            <th style={{ width: '14%' }}>Próxima Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '5rem 0' }}><LoadingScreen fullScreen={false} message="Sincronizando Base..." /></td></tr>
                        ) : Object.entries(groupedLeads).map(([group, groupLeads]) => (
                            <React.Fragment key={group}>
                                {groupBy !== 'none' && (
                                    <tr className="group-divider">
                                        <td colSpan={7}><div className="group-tag"><CaretDown size={14} /> {group} <span>({groupLeads.length})</span></div></td>
                                    </tr>
                                )}
                                {groupLeads.map(lead => {
                                    const sla = getSLAStyle(lead.updatedAt);
                                    const qStyle = getStatusStyle(lead.statusQualificacao);
                                    const vStyle = getStatusStyle(lead.statusViabilidade);

                                    return (
                                        <tr key={lead.id} className="lead-row" onClick={() => navigate(`/crm/lead/${lead.id}`)}>
                                            <td><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
                                            <td>
                                                <div className="cell-id">
                                                    <div className="id-avatar">{lead.nomeCompleto.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                                    <div className="id-info">
                                                        <strong>{lead.nomeCompleto} <span className={`type-tag ${lead.tipoPessoa.toLowerCase()}`}>{lead.tipoPessoa}</span></strong>
                                                        <small>Entrada em {new Date(lead.dataEntrada).toLocaleDateString()}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-contact">
                                                    <div className="contact-main">
                                                        {lead.telefonePrincipal}
                                                        <a href={`https://wa.me/55${lead.telefonePrincipal.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><WhatsappLogo size={18} weight="fill" /></a>
                                                    </div>
                                                    <div className="channel-tag">
                                                        {lead.canalEntrada === 'WhatsApp' ? <WhatsappLogo size={12} /> : <PhoneCall size={12} />}
                                                        <span>{lead.campanha || 'Direto'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-sla">
                                                    <div className="sla-badge" style={{ background: `${sla.color}20`, color: sla.color }}>{lead.statusQualificacao}</div>
                                                    <small style={{ color: sla.color }}>{sla.label}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-qual">
                                                    <span className="status-pill" style={{ background: qStyle.bg, color: qStyle.text }}>{lead.statusQualificacao}</span>
                                                    <div className="decisor-flag">{lead.decisorIdentificado ? <CheckCircle color="#10b981" /> : <XCircle color="#ef4444" />} Decisor</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-viab">
                                                    <span className="status-pill" style={{ background: vStyle.bg, color: vStyle.text }}>{lead.statusViabilidade}</span>
                                                    <div className="cto-info">
                                                        <HardDrives size={14} /> <span>{lead.ctoProxima || '---'}</span>
                                                        <a href={`https://maps.google.com?q=${lead.latitude},${lead.longitude}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><MapTrifold size={16} /></a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-action">
                                                    {lead.dataProximoContato ? (
                                                        <div className={`action-task ${new Date(lead.dataProximoContato) < new Date() ? 'overdue' : ''}`}>
                                                            <CalendarBlank size={14} /> {new Date(lead.dataProximoContato).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </div>
                                                    ) : <span className="no-action">Sem ação</span>}
                                                    <div className="inline-btns">
                                                        <button title="Ligar"><PhoneCall /></button>
                                                        <button title="Tarefa"><CalendarPlus /></button>
                                                        <button title="Mover"><TrendUp /></button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {processedLeads.length === 0 && !loading && (
                    <div className="crm-empty">
                        <MagnifyingGlassPlus size={64} weight="duotone" />
                        <h2>Nenhum resultado para "{searchTerm}"</h2>
                        <p>Tente ajustar os filtros ou a busca unificada.</p>
                        <button className="btn-secondary" onClick={() => { setSearchTerm(''); setStageFilter(null); setViabilityFilter(null); setCurrentQuickFilter(null); }}>Limpar filtros</button>
                    </div>
                )}
            </main>

            <style>{`
                .crm-dashboard { padding: 2rem; background: #080a0f; height: 100vh; display: flex; flex-direction: column; gap: 1.5rem; }
                .crm-header { display: flex; justify-content: space-between; align-items: center; }
                .header-brand { display: flex; align-items: center; gap: 2rem; }
                .title-box { display: flex; align-items: center; gap: 12px; color: #fff; }
                .title-box h1 { font-size: 1.5rem; font-weight: 800; margin: 0; }
                .count-pill { background: #1e2430; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; color: #64748b; }
                .count-pill strong { color: #3b82f6; }
                
                .header-actions { display: flex; gap: 1rem; align-items: center; }
                .search-multi-vector { position: relative; width: 350px; }
                .search-multi-vector svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #475569; }
                .search-multi-vector input { width: 100%; background: #11141d; border: 1px solid #1e2430; border-radius: 12px; padding: 12px 16px 12px 42px; color: #fff; font-size: 0.9rem; }

                .attention-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                .attn-card { background: #11141d; border: 1px solid #1e2430; padding: 1.25rem; border-radius: 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 1rem; }
                .attn-card:hover { border-color: #3b82f640; background: #11141d90; }
                .attn-card.active { border-color: #3b82f6; background: #3b82f60a; }
                .attn-val { font-size: 2.2rem; font-weight: 900; }
                .attn-val.warning { color: #f59e0b; }
                .attn-val.info { color: #3b82f6; }
                .attn-val.overdue { color: #ef4444; }
                .attn-val.success { color: #10b981; }
                .attn-label { font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

                .toolbar-filters { display: flex; justify-content: space-between; align-items: center; background: #11141d80; padding: 0.75rem 1.5rem; border-radius: 12px; border: 1px solid #1e2430; }
                .chip-group { display: flex; align-items: center; gap: 12px; color: #475569; }
                .chip-group select { background: #080a0f; border: 1px solid #1e2430; color: #94a3b8; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; }
                
                .group-toggle { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: #475569; }
                .toggle-btns { display: flex; background: #080a0f; padding: 3px; border-radius: 8px; }
                .toggle-btns button { background: none; border: none; color: #475569; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 700; }
                .toggle-btns button.active { background: #3b82f6; color: #fff; }

                .crm-table-container { flex: 1; overflow-y: auto; background: #11141d; border: 1px solid #1e2430; border-radius: 20px; }
                .crm-table { width: 100%; border-collapse: collapse; }
                .crm-table th { text-align: left; padding: 1rem; font-size: 0.7rem; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; border-bottom: 1px solid #1e2430; position: sticky; top: 0; background: #11141d; z-index: 10; }
                .lead-row { border-bottom: 1px solid #1e2430; transition: all 0.2s; cursor: pointer; }
                .lead-row:hover { background: #1e243050; }
                .lead-row td { padding: 1.25rem 1rem; vertical-align: middle; }

                .cell-id { display: flex; align-items: center; gap: 12px; }
                .id-avatar { width: 40px; height: 40px; border-radius: 10px; background: #3b82f615; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
                .id-info strong { display: block; color: #f8fafc; font-size: 0.9rem; }
                .type-tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; border: 1px solid #ffffff10; vertical-align: middle; }
                .type-tag.pf { color: #10b981; border-color: #10b98140; }
                .id-info small { color: #475569; font-size: 0.75rem; }

                .cell-contact .contact-main { display: flex; align-items: center; gap: 8px; color: #3b82f6; font-weight: 700; font-size: 0.95rem; }
                .channel-tag { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #475569; margin-top: 4px; }
                
                .sla-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
                .cell-sla small { display: block; margin-top: 6px; font-size: 0.7rem; }

                .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; }
                .decisor-flag { font-size: 0.7rem; color: #475569; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
                
                .cto-info { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #475569; margin-top: 8px; }
                .cto-info a { color: #3b82f6; }

                .cell-action { display: flex; flex-direction: column; gap: 8px; }
                .action-task { font-size: 0.75rem; font-weight: 600; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
                .action-task.overdue { color: #ef4444; }
                .inline-btns { display: flex; gap: 4px; margin-top: 4px; opacity: 0; transition: opacity 0.2s; }
                .lead-row:hover .inline-btns { opacity: 1; }
                .inline-btns button { background: #1e2430; border: 1px solid #ffffff05; color: #64748b; padding: 4px; border-radius: 6px; cursor: pointer; }
                .inline-btns button:hover { background: #3b82f6; color: #fff; }

                .group-divider { background: #0c0f16; }
                .group-tag { font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 6px; }
                .group-tag span { color: #3b82f6; }

                .crm-empty { padding: 100px 0; text-align: center; color: #475569; }
                .crm-empty h2 { color: #94a3b8; margin: 1.5rem 0 0.5rem; }
            `}</style>
        </div>
    );
};

export default LeadsManager;
