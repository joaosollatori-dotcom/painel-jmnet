import React, { useState, useEffect, useMemo } from 'react';
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
    CalendarPlus
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, getLeads, deleteLead, updateLead } from '../services/leadService';
import { genericFilter } from '../utils/filterUtils';
import LeadDetail from './LeadDetail';
import './Dashboard.css';

const LeadsManager: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [viewingDetail, setViewingDetail] = useState<Lead | null>(null);
    const [groupBy, setGroupBy] = useState<'none' | 'stage' | 'viability'>('none');
    const [currentQuickFilter, setCurrentQuickFilter] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Lead, direction: 'asc' | 'desc' } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filtros de Chips
    const [stageFilter, setStageFilter] = useState<string | null>(null);
    const [viabilityFilter, setViabilityFilter] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Lead>>({
        nomeCompleto: '',
        telefonePrincipal: '',
        canalEntrada: 'WhatsApp',
        statusViabilidade: 'PENDENTE',
        statusQualificacao: 'PENDENTE',
        tipoCliente: 'RESIDENCIAL',
        tipoPessoa: 'PF',
        decisorIdentificado: false,
        tentativasContato: 0,
        isFrio: false
    });

    useEffect(() => {
        loadLeads();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedLead) {
                await updateLead(selectedLead.id, formData);
            } else {
                await createLead(formData);
            }
            setShowModal(false);
            setSelectedLead(null);
            loadLeads();
        } catch (err) {
            console.error('Error saving lead:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Atenção: Esta ação é irreversível. Deseja excluir este lead?")) return;
        try {
            await deleteLead(id);
            loadLeads();
        } catch (err) {
            console.error('Error deleting lead:', err);
        }
    };

    // Estatísticas para o Painel de Atenção
    const stats = useMemo(() => {
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        return {
            noContact48h: leads.filter(l => new Date(l.dataUltimaInteracao) < fortyEightHoursAgo).length,
            pendingViability: leads.filter(l => l.statusViabilidade === 'PENDENTE').length,
            slaOverdue: leads.filter(l => {
                // Simplificado: se está em 'Novo Lead' há mais de 24h
                const limit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                return new Date(l.updatedAt) < limit;
            }).length,
            waitingContract: leads.filter(l => l.statusQualificacao === 'QUALIFICADO' && !l.dataAceite).length,
        };
    }, [leads]);

    const handleSort = (key: keyof Lead) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processedLeads = useMemo(() => {
        let result = genericFilter(leads, searchTerm);

        // Quick Filters (Attention Panel)
        if (currentQuickFilter === 'noContact48h') {
            const limit = new Date(Date.now() - 48 * 60 * 60 * 1000);
            result = result.filter(l => new Date(l.dataUltimaInteracao) < limit);
        } else if (currentQuickFilter === 'pendingViability') {
            result = result.filter(l => l.statusViabilidade === 'PENDENTE');
        } else if (currentQuickFilter === 'stalledProposals') {
            const limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            result = result.filter(l => l.statusQualificacao === 'QUALIFICADO' && new Date(l.updatedAt) < limit);
        }

        // Chip Filters
        if (stageFilter) result = result.filter(l => l.statusQualificacao === stageFilter);
        if (viabilityFilter) result = result.filter(l => l.statusViabilidade === viabilityFilter);

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = String(a[sortConfig.key] ?? '');
                const bVal = String(b[sortConfig.key] ?? '');
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [leads, searchTerm, currentQuickFilter, stageFilter, viabilityFilter, sortConfig]);

    // Grouping Logic
    const groupedLeads = useMemo(() => {
        if (groupBy === 'none') return { 'Todos os Leads': processedLeads };

        return processedLeads.reduce((acc, lead) => {
            const groupKey = groupBy === 'stage' ? lead.statusQualificacao : lead.statusViabilidade;
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(lead);
            return acc;
        }, {} as Record<string, Lead[]>);
    }, [processedLeads, groupBy]);

    const toggleSelectAll = () => {
        if (selectedIds.length === processedLeads.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(processedLeads.map(l => l.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copiado: ${text}`);
    };

    const getDaysInStage = (updatedAt: string) => {
        const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APROVADA': case 'QUALIFICADO': return { bg: '#10b98122', text: '#10b981', label: status };
            case 'REPROVADA': case 'DESQUALIFICADO': return { bg: '#ef444422', text: '#ef4444', label: status };
            case 'EM_ANALISE': return { bg: '#8b5cf622', text: '#8b5cf6', label: 'Em Análise' };
            default: return { bg: '#f59e0b22', text: '#f59e0b', label: 'Pendente' };
        }
    };

    const renderEmptyState = () => {
        if (loading) {
            return (
                <div className="loading-state">
                    <div className="spinner-premium"></div>
                    <p>Sincronizando Leads Titã...</p>
                </div>
            );
        }
        if (leads.length === 0) {
            return (
                <div className="empty-state">
                    <UserPlus size={64} weight="duotone" />
                    <h2>Bem-vindo ao Titã CRM</h2>
                    <p>Você ainda não possui leads cadastrados. Comece agora para impulsionar suas vendas.</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary">Criar Meu Primeiro Lead</button>
                </div>
            );
        }
        return (
            <div className="empty-state">
                <MagnifyingGlass size={64} weight="duotone" />
                <h2>Nada encontrado</h2>
                <p>Não encontramos resultados para "{searchTerm || currentQuickFilter}".</p>
                <button onClick={() => { setSearchTerm(''); setCurrentQuickFilter(null); }} className="btn-secondary">Limpar filtros</button>
            </div>
        );
    };

    return (
        <div className="manager-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: 'var(--bg-deep)' }}>
            {/* Barra Superior */}
            <header className="listing-header">
                <div>
                    <h1 className="main-title">
                        <Users size={32} weight="duotone" color="var(--primary-color)" />
                        Gestão Comercial de Leads
                    </h1>
                    <div className="results-counter">
                        <span>{processedLeads.length}</span> leads encontrados
                    </div>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <MagnifyingGlass size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisa unificada (Nome, CPF, Tel...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button onClick={() => setShowModal(true)} className="btn-new-lead">
                        <Plus size={20} weight="bold" /> Novo Lead
                    </button>
                </div>
            </header>

            {/* Painel de Atenção */}
            <section className="attention-panel">
                <div
                    className={`stat-card ${currentQuickFilter === 'slaOverdue' ? 'active' : ''}`}
                    onClick={() => setCurrentQuickFilter(currentQuickFilter === 'slaOverdue' ? null : 'slaOverdue')}
                >
                    <div className="stat-value error">{stats.slaOverdue}</div>
                    <div className="stat-label">SLA Vencido</div>
                </div>
                <div
                    className={`stat-card ${currentQuickFilter === 'noContact48h' ? 'active' : ''}`}
                    onClick={() => setCurrentQuickFilter(currentQuickFilter === 'noContact48h' ? null : 'noContact48h')}
                >
                    <div className="stat-value warning">{stats.noContact48h}</div>
                    <div className="stat-label">Sem contato (+48h)</div>
                </div>
                <div
                    className={`stat-card ${currentQuickFilter === 'pendingViability' ? 'active' : ''}`}
                    onClick={() => setCurrentQuickFilter(currentQuickFilter === 'pendingViability' ? null : 'pendingViability')}
                >
                    <div className="stat-value info">{stats.pendingViability}</div>
                    <div className="stat-label">Viab. Pendentes</div>
                </div>
                <div
                    className={`stat-card ${currentQuickFilter === 'waitingContract' ? 'active' : ''}`}
                    onClick={() => setCurrentQuickFilter(currentQuickFilter === 'waitingContract' ? null : 'waitingContract')}
                >
                    <div className="stat-value success">{stats.waitingContract}</div>
                    <div className="stat-label">Aguard. Assinatura</div>
                </div>
            </section>

            {/* Toolbar de Filtros e Agrupamento */}
            <div className="filter-toolbar">
                <div className="filter-chips">
                    <div className="filter-label"><Funnel size={16} /> Filtros:</div>
                    <select value={stageFilter || ''} onChange={e => setStageFilter(e.target.value || null)} className="chip-select">
                        <option value="">Etapa do Funil</option>
                        <option value="PENDENTE">Novo / Pendente</option>
                        <option value="QUALIFICADO">Qualificado</option>
                        <option value="DESQUALIFICADO">Desqualificado</option>
                    </select>
                    <select value={viabilityFilter || ''} onChange={e => setViabilityFilter(e.target.value || null)} className="chip-select">
                        <option value="">Viabilidade</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="APROVADA">Aprovada</option>
                        <option value="REPROVADA">Inviável</option>
                    </select>
                    {(stageFilter || viabilityFilter || searchTerm || currentQuickFilter) && (
                        <button className="clear-chip" onClick={() => { setStageFilter(null); setViabilityFilter(null); setSearchTerm(''); setCurrentQuickFilter(null); }}>
                            Limpar Tudo <XCircle size={14} />
                        </button>
                    )}
                </div>

                <div className="view-actions">
                    <span className="filter-label">Agrupar por:</span>
                    <div className="toggle-group">
                        <button className={groupBy === 'none' ? 'active' : ''} onClick={() => setGroupBy('none')}>Nenhum</button>
                        <button className={groupBy === 'stage' ? 'active' : ''} onClick={() => setGroupBy('stage')}>Etapa</button>
                        <button className={groupBy === 'viability' ? 'active' : ''} onClick={() => setGroupBy('viability')}>Viabilidade</button>
                    </div>
                </div>
            </div>

            {/* Tabela de Listagem */}
            <div className="table-container">
                <table className="leads-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input type="checkbox" checked={selectedIds.length === processedLeads.length && processedLeads.length > 0} onChange={toggleSelectAll} />
                            </th>
                            <th onClick={() => handleSort('nomeCompleto')} className="sortable">
                                Lead {sortConfig?.key === 'nomeCompleto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Contato e Canal</th>
                            <th onClick={() => handleSort('statusQualificacao')} className="sortable">Etapa {sortConfig?.key === 'statusQualificacao' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th onClick={() => handleSort('statusQualificacao')} className="sortable">Qualificação</th>
                            <th onClick={() => handleSort('statusViabilidade')} className="sortable">Viabilidade</th>
                            <th onClick={() => handleSort('dataProximoContato')} className="sortable">Próxima Ação</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="td-loading">Sincronizando com TITÃ Cloud...</td></tr>
                        ) : Object.entries(groupedLeads).map(([groupName, groupLeads]) => (
                            <React.Fragment key={groupName}>
                                {groupBy !== 'none' && (
                                    <tr className="group-header-row">
                                        <td colSpan={8}>
                                            <div className="group-header">
                                                <CaretDown size={14} /> {groupName} <span>({groupLeads.length})</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {groupLeads.map(lead => {
                                    const viab = getStatusStyles(lead.statusViabilidade);
                                    const qual = getStatusStyles(lead.statusQualificacao);
                                    const daysInStage = getDaysInStage(lead.updatedAt);

                                    return (
                                        <tr key={lead.id} className={`lead-row ${selectedIds.includes(lead.id) ? 'selected' : ''}`}>
                                            <td><input type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => toggleSelect(lead.id)} /></td>
                                            <td onClick={() => setViewingDetail(lead)}>
                                                <div className="lead-id-cell">
                                                    <div className="lead-avatar">
                                                        {lead.nomeCompleto.charAt(0)}
                                                    </div>
                                                    <div className="lead-info-text">
                                                        <div className="lead-name" onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.nomeCompleto, 'Nome'); }} title={lead.nomeCompleto}>
                                                            {lead.nomeCompleto}
                                                            <span className={`badge-p${lead.tipoPessoa}`} style={{ marginLeft: '8px' }}>{lead.tipoPessoa}</span>
                                                        </div>
                                                        <div className="lead-meta">Entrada: {new Date(lead.dataEntrada).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-cell">
                                                    <div className="contact-main" onClick={() => copyToClipboard(lead.telefonePrincipal, 'Telefone')} title="Clique para copiar">
                                                        <PhoneCall size={18} /> {lead.telefonePrincipal}
                                                        <a href={`https://wa.me/55${lead.telefonePrincipal.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                                            <WhatsappLogo size={20} weight="fill" color="#25D366" />
                                                        </a>
                                                    </div>
                                                    <div className="lead-meta" style={{ marginTop: '2px' }}>
                                                        {lead.canalEntrada} • {lead.campanha || 'Direto'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="stage-cell">
                                                    <div className="stage-badge" style={{ background: 'var(--primary-color-dim)', color: 'var(--primary-color)' }}>
                                                        Pendente
                                                    </div>
                                                    <div className={`stage-sla ${daysInStage > 3 ? 'over' : ''}`}>
                                                        {daysInStage} dias nesta etapa
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="qual-cell">
                                                    <span className="badge-status" style={{ background: qual.bg, color: qual.text }}>{qual.label}</span>
                                                    <div className="decisor-flag">
                                                        {lead.decisorIdentificado ? <CheckCircle color="#10b981" weight="fill" /> : <XCircle color="#ef4444" weight="fill" />}
                                                        Decisor
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="viab-cell">
                                                    <span className="badge-status" style={{ background: viab.bg, color: viab.text }}>{viab.label}</span>
                                                    <div className="viab-meta">
                                                        <MapPinLine size={14} /> {lead.bairro || 'S/B'}
                                                        <a href={`https://maps.google.com?q=${lead.latitude},${lead.longitude}`} target="_blank" rel="noreferrer" className="map-link">
                                                            <MapTrifold size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-cell">
                                                    {lead.dataProximoContato ? (
                                                        <div className={`next-task ${new Date(lead.dataProximoContato) < new Date() ? 'overdue' : ''}`}>
                                                            <CalendarBlank size={14} />
                                                            {new Date(lead.dataProximoContato).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </div>
                                                    ) : (
                                                        <div className="no-task">Sem agendamento</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="actions-inline">
                                                    <button
                                                        className={`btn-options ${openMenuId === lead.id ? 'active' : ''}`}
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === lead.id ? null : lead.id); }}
                                                    >
                                                        Opções <CaretDown size={14} weight="bold" />
                                                    </button>

                                                    {openMenuId === lead.id && (
                                                        <div className="options-dropdown" onClick={e => e.stopPropagation()}>
                                                            <div className="dropdown-item">
                                                                <ChatCircleDots size={18} weight="duotone" /> Novo Registro
                                                            </div>
                                                            <div className="dropdown-item">
                                                                <CalendarPlus size={18} weight="duotone" /> Nova Tarefa
                                                            </div>
                                                            <div className="dropdown-item">
                                                                <ArrowSquareOut size={18} weight="duotone" /> Mover Etapa
                                                            </div>
                                                            <div className="dropdown-item danger" onClick={() => { handleDelete(lead.id); setOpenMenuId(null); }}>
                                                                <Archive size={18} weight="duotone" /> Arquivar Lead
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {renderEmptyState()}
            </div>

            <AnimatePresence>
                {viewingDetail && (
                    <LeadDetail
                        lead={viewingDetail}
                        onClose={() => setViewingDetail(null)}
                        onUpdate={() => { loadLeads(); }}
                    />
                )}
            </AnimatePresence>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="bulk-action-bar"
                    >
                        <div className="bulk-info">
                            <span className="count">{selectedIds.length}</span>
                            <span>leads selecionados</span>
                        </div>
                        <div className="bulk-actions">
                            <button className="btn-bulk"><User size={18} /> Mudar Vendedor</button>
                            <button className="btn-bulk"><TrendUp size={18} /> Mover Estágio</button>
                            <button className="btn-bulk warning"><Warning size={18} /> Marcar como Frio</button>
                            <button className="btn-bulk error" onClick={() => {
                                if (window.confirm(`Deseja excluir ${selectedIds.length} leads permanentemente?`)) {
                                    Promise.all(selectedIds.map(id => deleteLead(id))).then(() => {
                                        setSelectedIds([]);
                                        loadLeads();
                                    });
                                }
                            }}><Trash size={18} /> Excluir em Lote</button>
                        </div>
                        <button className="btn-cancel-bulk" onClick={() => setSelectedIds([])}>Cancelar</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Novo Lead Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="lead-modal"
                        >
                            <header className="modal-header">
                                <h2><UserPlus size={24} weight="duotone" /> Novo Lead Comercial</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}><XCircle size={32} /></button>
                            </header>
                            <form onSubmit={handleSubmit} className="modal-content">
                                <section className="modal-section">
                                    <h3>Informações Básicas</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Nome Completo</label>
                                            <input required type="text" placeholder="Ex: João da Silva"
                                                onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Telefone Principal</label>
                                            <input required type="text" placeholder="(00) 00000-0000"
                                                onChange={e => setFormData({ ...formData, telefonePrincipal: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>E-mail</label>
                                            <input type="email" placeholder="cliente@email.com"
                                                onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Origem / Canal</label>
                                            <select onChange={e => setFormData({ ...formData, canalEntrada: e.target.value })}>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Indicação">Indicação</option>
                                                <option value="Site/Formulário">Site/Formulário</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                                <footer className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary">Registrar Lead no Sistema</button>
                                </footer>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .listing-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
                .main-title { font-size: 1.7rem; font-weight: 800; display: flex; align-items: center; gap: 12px; margin: 0; color: #fff; }
                .results-counter { margin-top: 4px; color: #666; font-size: 0.9rem; }
                .results-counter span { color: var(--primary-color); font-weight: 700; }
                
                .header-actions { display: flex; gap: 1rem; align-items: center; }
                .search-box { position: relative; width: 350px; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 16px; color: #666; pointer-events: none; display: flex; align-items: center; }
                .search-box input { 
                    width: 100%; padding: 12px 16px 12px 48px; border-radius: 12px; 
                    background: var(--bg-surface); border: 1px solid var(--border); 
                    color: #fff; font-size: 0.95rem; transition: all 0.2s;
                    line-height: 1;
                }
                .search-box input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                
                .btn-new-lead { 
                    background: var(--primary-color); color: #fff; border: none; padding: 12px 24px;
                    border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px;
                    cursor: pointer; transition: transform 0.2s, background 0.2s;
                }
                .btn-new-lead:hover { background: #2563eb; transform: translateY(-2px); }

                .attention-panel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { 
                    background: var(--bg-surface); border: 1px solid var(--border); padding: 1.25rem 1.5rem;
                    border-radius: 16px; cursor: pointer; transition: all 0.2s;
                    display: flex; align-items: center; gap: 12px;
                }
                .stat-card:hover { border-color: #444; background: rgba(255,255,255,0.02); }
                .stat-card.active { border-color: var(--primary-color); background: rgba(59, 130, 246, 0.05); }
                .stat-value { font-size: 2.2rem; font-weight: 900; line-height: 1; }
                .stat-label { font-size: 0.75rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; }
                
                .stat-value.warning { color: #f59e0b; }
                .stat-value.purple { color: #8b5cf6; }
                .stat-value.urgent { color: #ef4444; }
                .stat-value.success { color: #10b981; }

                .table-container { 
                    background: var(--bg-surface); border: 1px solid var(--border); 
                    border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .leads-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                .leads-table th { 
                    padding: 1.25rem 1.5rem; text-align: left; color: #555; font-size: 0.75rem;
                    text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;
                    border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.1);
                }
                
                .lead-row { border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer; }
                .lead-row:hover { background: rgba(255,255,255,0.02); }
                .lead-row td { padding: 1.25rem 1.5rem; vertical-align: middle; }
                
                .lead-id-cell { display: flex; align-items: center; gap: 14px; white-space: nowrap; min-width: 280px; }
                .lead-avatar { 
                    width: 44px; height: 44px; border-radius: 12px; background: #3b82f622; color: #3b82f6;
                    display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0;
                }
                .lead-info-text { display: flex; flex-direction: column; overflow: hidden; }
                .lead-name { font-weight: 700; color: #f8fafc; font-size: 1rem; overflow: hidden; text-overflow: ellipsis; }
                .lead-name:hover { color: var(--primary-color); }
                .lead-meta { font-size: 0.7rem; color: #555; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
                
                .badge-pPF { font-size: 9px; padding: 2px 6px; background: #10b98122; color: #10b981; border-radius: 4px; }
                .badge-pPJ { font-size: 9px; padding: 2px 6px; background: #3b82f622; color: #3b82f6; border-radius: 4px; }

                .contact-cell { min-width: 240px; }
                .contact-cell .contact-main { display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--primary-color); cursor: pointer; white-space: nowrap; font-size: 1.15rem; letter-spacing: -0.02em; }
                .contact-cell .contact-main:hover { filter: brightness(1.2); }
                .contact-cell .lead-meta { color: #444; font-size: 0.65rem; opacity: 0.7; }
                
                .stage-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
                .stage-sla { font-size: 0.7rem; color: #666; margin-top: 6px; }
                .stage-sla.over { color: #ef4444; font-weight: 600; }

                .badge-status { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .decisor-flag { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #666; margin-top: 6px; }
                
                .viab-meta { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #666; margin-top: 6px; }
                .map-link { color: var(--primary-color); display: flex; align-items: center; border-radius: 4px; padding: 2px; }
                .map-link:hover { background: rgba(59, 130, 246, 0.1); }

                .next-task { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #aaa; }
                .next-task.overdue { color: #ef4444; }
                .no-task { font-size: 0.75rem; color: #444; font-style: italic; }

                .actions-inline { display: flex; gap: 4px; justify-content: flex-end; opacity: 0; transition: opacity 0.2s; }
                .lead-row:hover .actions-inline { opacity: 1; }
                .actions-inline button { 
                    background: transparent; border: none; color: #555; padding: 6px; cursor: pointer; border-radius: 6px;
                }
                .actions-inline button:hover { background: rgba(255,255,255,0.05); color: #fff; }

                .empty-state { padding: 100px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #555; }
                .empty-state h2 { color: #888; margin: 0; }
                .empty-state p { max-width: 400px; margin: 0; line-height: 1.6; }
                
                .lead-modal { background: var(--bg-surface); width: 100%; maxWidth: 900px; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 50px 100px rgba(0,0,0,0.5); }
                .modal-content { padding: 2.5rem; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }
                .modal-header h2 { margin: 0; font-size: 1.5rem; color: #fff; }
                .btn-close { background: transparent; border: none; color: #666; cursor: pointer; }
                .btn-close:hover { color: #fff; }

                .modal-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
                .modal-section-col { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .filter-toolbar { 
                    display: flex; justify-content: space-between; align-items: center; 
                    margin-bottom: 1.5rem; background: rgba(0,0,0,0.2); padding: 0.75rem 1.5rem;
                    border-radius: 12px; border: 1px solid var(--border);
                }
                .filter-chips { display: flex; align-items: center; gap: 12px; }
                .filter-label { font-size: 0.75rem; color: #555; font-weight: 700; display: flex; align-items: center; gap: 6px; text-transform: uppercase; }
                
                .chip-select { 
                    background: var(--bg-surface); border: 1px solid var(--border); color: #aaa;
                    padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; outline: none;
                    cursor: pointer; transition: all 0.2s;
                }
                .chip-select:hover { border-color: #555; color: #fff; }
                
                .clear-chip { 
                    background: transparent; border: 1px solid #ef444444; color: #ef4444; 
                    padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer;
                    display: flex; align-items: center; gap: 6px; transition: all 0.2s;
                }
                .clear-chip:hover { background: #ef444411; }

                .view-actions { display: flex; align-items: center; gap: 12px; }
                .toggle-group { display: flex; background: var(--bg-deep); padding: 3px; border-radius: 8px; border: 1px solid var(--border); }
                .toggle-group button { 
                    background: transparent; border: none; color: #666; padding: 6px 12px; 
                    font-size: 0.8rem; font-weight: 600; cursor: pointer; border-radius: 6px;
                    transition: all 0.2s;
                }
                .toggle-group button.active { background: var(--primary-color); color: #fff; }

                .group-header-row { background: rgba(0,0,0,0.15) !important; }
                .group-header { 
                    display: flex; align-items: center; gap: 10px; font-size: 0.8rem; 
                    font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.05em;
                }
                .group-header span { color: var(--primary-color); }

                .sortable { cursor: pointer; transition: color 0.1s; position: relative; }
                .sortable:hover { color: #fff !important; }
                
                .lead-row.selected { background: rgba(59, 130, 246, 0.03) !important; }

                /* Loading Premium */
                .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 0; gap: 1rem; color: #666; }
                .spinner-premium { 
                    width: 40px; height: 40px; border: 3px solid rgba(59, 130, 246, 0.1); border-top-color: var(--primary-color);
                    border-radius: 50%; animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Bulk Action Bar */
                .bulk-action-bar { 
                    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
                    background: #111; border: 1px solid var(--primary-color); padding: 12px 24px;
                    border-radius: 999px; display: flex; align-items: center; gap: 2rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 100;
                }
                .bulk-info { display: flex; align-items: center; gap: 8px; color: #888; font-size: 0.9rem; }
                .bulk-info .count { background: var(--primary-color); color: #fff; padding: 2px 10px; border-radius: 999px; font-weight: 800; }
                .bulk-actions { display: flex; gap: 12px; }
                .btn-bulk { 
                    background: transparent; border: none; color: #eee; font-size: 13px; font-weight: 600;
                    display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; border-radius: 8px;
                    transition: all 0.2s;
                }
                .btn-bulk:hover { background: rgba(255,255,255,0.05); }
                .btn-bulk.error { color: #ef4444; }
                .btn-bulk.error:hover { background: #ef444411; }
                .btn-cancel-bulk { background: transparent; border: 1px solid #333; color: #555; padding: 6px 12px; border-radius: 999px; cursor: pointer; font-size: 12px; }

                /* Modal Elite Pattern */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
                .lead-modal { background: #131313; width: 100%; max-width: 650px; border-radius: 28px; border: 1px solid #222; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.6); }
                .modal-header { padding: 2rem 2.5rem; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
                .modal-header h2 { margin: 0; font-size: 1.4rem; color: #fff; display: flex; align-items: center; gap: 12px; font-weight: 800; }
                .btn-close { background: #1c1c1c; border: 1px solid #333; color: #666; cursor: pointer; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .btn-close:hover { color: #fff; border-color: #555; transform: rotate(90deg); }

                .modal-content { padding: 2.5rem; }
                .modal-section h3 { font-size: 0.75rem; text-transform: uppercase; color: #444; margin-bottom: 2rem; letter-spacing: 0.1em; font-weight: 900; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .form-group label { display: block; font-size: 11px; color: #777; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                .form-group input, .form-group select { 
                    width: 100%; background: #0a0a0a; border: 1px solid #222; color: #fff; padding: 14px 16px; 
                    border-radius: 14px; outline: none; transition: all 0.2s; font-size: 0.95rem; font-weight: 500;
                }
                .form-group input:focus, .form-group select:focus { border-color: var(--primary-color); background: #000; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                .form-group input::placeholder { color: #333; }

                .modal-footer { padding: 2rem 2.5rem; background: #0e0e0e; display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; border-top: 1px solid #222; }
                .btn-secondary { background: transparent; border: 1px solid #333; color: #888; padding: 0 24px; height: 48px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; }
                .btn-secondary:hover { color: #fff; border-color: #555; background: #1a1a1a; }
                
                .btn-primary { 
                    background: var(--primary-color); color: #fff; border: none; padding: 0 32px; height: 48px; border-radius: 14px; 
                    font-weight: 800; cursor: pointer; transition: all 0.2s; font-size: 0.95rem;
                    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
                    display: flex; align-items: center; justify-content: center;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(59, 130, 246, 0.3); background: #2563eb; }
                .btn-primary:active { transform: translateY(0); }
            `}</style>
        </div>
    );
};

export default LeadsManager;
