import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, MagnifyingGlass, Funnel,
    CheckCircle, XCircle, Clock, TrendUp,
    WhatsappLogo, CaretDown, PhoneCall,
    HardDrives, CalendarPlus, MapTrifold,
    NavigationArrow, MagnifyingGlassPlus,
    ChartBar, ListDashes, UserPlus, X, CalendarBlank
} from '@phosphor-icons/react';
import { Lead, updateLead, getLeads, createAppointment } from '../services/leadService';
import { handleNewLeadEntry } from '../services/automationService';
import { dispatchWhatsApp, dispatchCall, logInteraction } from '../services/actionService';
import LoadingScreen from './LoadingScreen';
import { useToast } from '../contexts/ToastContext';
import LeadReports from './LeadReports';
import './LeadsManager.css';

const LeadsManager: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'reports'>('list');

    // ... (restante do estado e dos handlers mantidos idênticos)
    const [showApptModal, setShowApptModal] = useState<Lead | null>(null);
    const [apptData, setApptData] = useState({ dataInicio: '', turno: 'Manhã', tecnicoId: '' });
    const [groupBy, setGroupBy] = useState<'none' | 'stage' | 'viability' | 'vendedor'>('none');
    const [currentQuickFilter, setCurrentQuickFilter] = useState<string | null>(null);
    const [stageFilter, setStageFilter] = useState<string | null>(null);
    const [viabilityFilter, setViabilityFilter] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Lead>>({
        nomeCompleto: '', telefonePrincipal: '', canalEntrada: 'WhatsApp',
        tipoPessoa: 'PF', tipoCliente: 'RESIDENCIAL', statusQualificacao: 'PENDENTE', statusViabilidade: 'PENDENTE',
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

    const handleCreateAppt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showApptModal) return;
        try {
            await createAppointment({ leadId: showApptModal.id, tipo: 'INSTALACAO', status: 'CONFIRMADO', dataInicio: apptData.dataInicio } as any);
            showToast('Agendamento Técnico criado!', 'success');
            await logInteraction(showApptModal.id, 'SYS', 'Agendamento Criado', `Instalação marcada para ${apptData.dataInicio}`);
            setShowApptModal(null);
            loadLeads();
        } catch (e) {
            showToast('Erro ao criar agendamento', 'error');
        }
    };

    const handleAdvanceLead = async (lead: Lead) => {
        try {
            let nextStage: Lead['statusQualificacao'] = 'QUALIFICADO';
            if (lead.statusQualificacao === 'PENDENTE') nextStage = 'EM_ANALISE';
            else if (lead.statusQualificacao === 'EM_ANALISE') nextStage = 'QUALIFICADO';
            else if (lead.statusQualificacao === 'QUALIFICADO') { showToast('Lead já está qualificado.', 'info'); return; }
            await updateLead(lead.id, { statusQualificacao: nextStage });
            await logInteraction(lead.id, 'SYS', 'Mudança de Estágio', `Lead movido para ${nextStage} via atalho rápido na listagem.`);
            showToast(`Avançado para ${nextStage}`, 'success');
            loadLeads();
        } catch (e) { showToast('Erro ao mover lead', 'error'); }
    }

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await handleNewLeadEntry(formData);
            showToast('Lead registrado e atribuído automaticamente!', 'success');
            setShowModal(false);
            setFormData({ nomeCompleto: '', telefonePrincipal: '', canalEntrada: 'WhatsApp', tipoPessoa: 'PF', tipoCliente: 'RESIDENCIAL' });
            loadLeads();
        } catch (err) { showToast('Erro ao criar lead', 'error'); }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copiado ✓`, 'success');
    };

    const stats = useMemo(() => {
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        return {
            noContact48h: leads.filter(l => new Date(l.dataUltimaInteracao) < fortyEightHoursAgo).length,
            pendingViability: leads.filter(l => l.statusViabilidade === 'PENDENTE' || l.statusViabilidade === 'EM_ANALISE').length,
            stalledProposals: leads.filter(l => l.statusProposta === 'ENVIADA' && new Date(l.updatedAt || l.updated_at) < threeDaysAgo).length,
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
            result = result.filter(l => l.statusViabilidade === 'PENDENTE' || l.statusViabilidade === 'EM_ANALISE');
        } else if (currentQuickFilter === 'stalledProposals') {
            const limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            result = result.filter(l => l.statusProposta === 'ENVIADA' && new Date(l.updatedAt || l.updated_at) < limit);
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
                        <strong>{leads.length}</strong> <span>Leads no Funil</span>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="view-toggle">
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><ListDashes size={18} /> Operação</button>
                        <button className={viewMode === 'reports' ? 'active' : ''} onClick={() => setViewMode('reports')}><ChartBar size={18} /> Dashboard</button>
                    </div>

                    {/* Barra de Busca Global - Agora persistente */}
                    <div className="search-multi-vector">
                        <MagnifyingGlass size={20} />
                        <input
                            placeholder="Nome, CPF, Tel, Endereço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="btn-add-lead" onClick={() => setShowModal(true)}>
                        <Plus size={20} weight="bold" /> Novo Lead
                    </button>
                </div>
            </header>

            {viewMode === 'reports' ? (
                <LeadReports leads={leads} />
            ) : (
                <>
                    {/* ... (restante do JSX de listagem mantido) */}
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
                                <option value="">Todos os Estágios</option>
                                <option value="PENDENTE">Pendente</option>
                                <option value="QUALIFICADO">Qualificado</option>
                                <option value="DESQUALIFICADO">Desqualificado</option>
                            </select>
                            <select value={viabilityFilter || ''} onChange={e => setViabilityFilter(e.target.value || null)}>
                                <option value="">Qualquer Viabilidade</option>
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
                                    <th className="w-28p">Identificação do Lead</th>
                                    <th className="w-20p">Contato e Canal</th>
                                    <th className="w-12p">Etapa (SLA)</th>
                                    <th className="w-12p">Qualificação</th>
                                    <th className="w-14p">Viabilidade</th>
                                    <th className="w-14p">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && leads.length === 0 ? (
                                    <tr><td colSpan={6} className="py-5rem"><LoadingScreen fullScreen={false} message="Sincronizando Leads..." /></td></tr>
                                ) : Object.entries(groupedLeads).map(([group, groupLeads]) => (
                                    <React.Fragment key={group}>
                                        {groupBy !== 'none' && (
                                            <tr className="group-divider">
                                                <td colSpan={6}><div className="group-tag"><CaretDown size={14} /> {group} <span>({groupLeads.length})</span></div></td>
                                            </tr>
                                        )}
                                        {groupLeads.map(lead => {
                                            const sla = getSLAStyle(lead.updatedAt || lead.updated_at);
                                            const qStyle = getStatusStyle(lead.statusQualificacao);
                                            const vStyle = getStatusStyle(lead.statusViabilidade);
                                            return (
                                                <tr key={lead.id} className="lead-row" onClick={() => navigate(`/crm/lead/${lead.id}`)}>
                                                    <td>
                                                        <div className="cell-id">
                                                            <div className="id-avatar">{lead.nomeCompleto.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                                            <div className="id-info">
                                                                <strong onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.nomeCompleto, 'Nome'); }} className="cursor-copy">{lead.nomeCompleto}</strong>
                                                                <small>Entrada em {new Date(lead.dataEntrada).toLocaleDateString()}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="cell-contact">
                                                            <div className="contact-main">
                                                                <span onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.telefonePrincipal, 'Telefone'); }} className="cursor-copy">{lead.telefonePrincipal}</span>
                                                                <button className="btn-wa-inline" onClick={e => { e.stopPropagation(); dispatchWhatsApp(lead.telefonePrincipal, 'Olá!', lead.id); }}><WhatsappLogo size={18} weight="fill" /></button>
                                                            </div>
                                                            <div className="channel-tag">
                                                                {lead.canalEntrada === 'WhatsApp' ? <WhatsappLogo size={12} /> : <PhoneCall size={12} />}
                                                                <span>{lead.campanha || lead.canalEntrada}</span>
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
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="cell-viab">
                                                            <span className="status-pill" style={{ background: vStyle.bg, color: vStyle.text }}>{lead.statusViabilidade}</span>
                                                            <div className="cto-info">
                                                                <HardDrives size={14} /> <span>{lead.ctoProxima || '---'}</span>
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
                                                                <button title="Registrar Contato" onClick={e => { e.stopPropagation(); dispatchCall(lead.telefonePrincipal, lead.id); }}><PhoneCall /></button>
                                                                <button title="Agendar" onClick={e => { e.stopPropagation(); setShowApptModal(lead); }}><CalendarPlus /></button>
                                                                <button title="Avançar" onClick={e => { e.stopPropagation(); handleAdvanceLead(lead); }}><TrendUp /></button>
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
                    </main>
                </>
            )}

            {/* Modals mantidos idênticos (Novo Lead e Agendamento) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content large max-w-600">
                        <header className="modal-header">
                            <div>
                                <h2>Registrar Emissão de Lead</h2>
                                <p>Cadastre os dados de entrada. O modelo de atribuição irá designar o vendedor e as tarefas SLA automaticamente.</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </header>
                        <form onSubmit={handleCreateLead} className="modal-body">
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Nome Completo</label>
                                    <input required type="text" value={formData.nomeCompleto} onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Canal Principal</label>
                                    <input required type="text" placeholder="(00) 00000-0000" value={formData.telefonePrincipal} onChange={e => setFormData({ ...formData, telefonePrincipal: e.target.value })} />
                                </div>
                            </div>
                            <footer className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-submit"><UserPlus size={20} weight="bold" /> Adicionar ao Motor</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsManager;
