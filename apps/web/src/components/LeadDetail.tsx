import React, { useState, useEffect, useRef } from 'react';
import {
    X, ArrowLeft, ArrowRight, User, MapPin,
    ClipboardText, HardDrives, ChatCircleText,
    FileText, Calendar, Plus, Phone, WhatsappLogo,
    DotsThreeVertical, CheckCircle, Warning, Clock,
    TrendUp, PaperPlaneRight, Pen, PencilSimple,
    CaretRight, MapTrifold, Info, DeviceMobile,
    AddressBook, IdentificationCard, IdentificationBadge,
    Briefcase, Buildings, Smiley, SkipForward, SkipBack,
    MagnifyingGlass, Timer, Checks, WarningCircle,
    UserSwitch, Trophy, Receipt, Wrench, CalendarPlus,
    ArrowsClockwise, ShareNetwork, EnvelopeSimple,
    CheckSquareOffset, Square, ListChecks, Kanban,
    NavigationArrow, PhoneCall, ArrowSquareOut, Prohibit,
    ArrowsCounterClockwise, Money
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './LeadDetail.css';
import { Lead, LeadHistory, updateLead, Appointment, getAppointments, getLeadHistory } from '../services/leadService';
import { getSystemSettings, SystemSetting } from '../services/systemSettingsService';
import { dispatchCall, dispatchWhatsApp, dispatchNote, logInteraction } from '../services/actionService';
import { useToast } from '../contexts/ToastContext';

interface LeadDetailProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: () => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onClose, onUpdate }) => {
    const { showToast } = useToast();
    const [localLead, setLocalLead] = useState<Lead>(lead);
    const [activeTab, setActiveTab] = useState<'timeline' | 'dados' | 'qualificacao' | 'viabilidade' | 'proposta' | 'agendamento'>('timeline');
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [relatedAppts, setRelatedAppts] = useState<Appointment[]>([]);
    const [historyLogs, setHistoryLogs] = useState<LeadHistory[]>([]);
    const [quickNote, setQuickNote] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showApptModal, setShowApptModal] = useState(false);
    const [newVendedorId, setNewVendedorId] = useState('');
    const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'CALL' | 'WA' | 'SYS'>('ALL');
    const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);

    useEffect(() => {
        setLocalLead(lead);
        loadLeadContext();
    }, [lead]);

    const loadLeadContext = async () => {
        const [appts, hist, settings] = await Promise.all([
            getAppointments(),
            getLeadHistory(lead.id),
            getSystemSettings()
        ]);
        setRelatedAppts(appts.filter(a => a.leadId === lead.id));
        setHistoryLogs(hist);
        setSystemSettings(settings);
    };

    const handleFieldUpdate = async (field: keyof Lead, value: any) => {
        try {
            await updateLead(localLead.id, { [field]: value });
            setLocalLead(prev => ({ ...prev, [field]: value }));
            showToast('Sincronizado com Supabase', 'success');
            onUpdate();
            setIsEditing(null);
            loadLeadContext();
        } catch (err) {
            showToast('Erro na sincronização', 'error');
        }
    };

    const handleActionLog = async (type: string, description: string) => {
        await logInteraction(localLead.id, type, description, '');
        showToast('Atividade registrada', 'success');
        onUpdate();
        loadLeadContext();
    };

    const handleSaveQuickNote = async () => {
        if (!quickNote.trim()) return;
        if (await dispatchNote(localLead.id, quickNote)) {
            showToast('Nota anexada à timeline', 'success');
            setQuickNote('');
            onUpdate();
            loadLeadContext();
        }
    };

    const handleAdvanceStage = async () => {
        try {
            let updates: Partial<Lead> = {};
            let logMsg = '';

            // Lógica de Funil Inteligente
            if (localLead.statusQualificacao === 'PENDENTE' || !localLead.statusQualificacao) {
                updates.statusQualificacao = 'EM_ANALISE';
                logMsg = 'Lead movido para Em Análise de Qualificação';
            } else if (localLead.statusQualificacao === 'EM_ANALISE') {
                updates.statusQualificacao = 'QUALIFICADO';
                logMsg = 'Lead QUALIFICADO com sucesso';
            } else if (localLead.statusQualificacao === 'QUALIFICADO' && (localLead.statusViabilidade === 'PENDENTE' || !localLead.statusViabilidade)) {
                updates.statusViabilidade = 'EM_ANALISE';
                logMsg = 'Iniciada análise técnica de viabilidade';
            } else if (localLead.statusViabilidade === 'EM_ANALISE') {
                updates.statusViabilidade = 'VIAVEL';
                logMsg = 'Viabilidade técnica confirmada (VIÁVEL)';
            } else if (localLead.statusViabilidade === 'VIAVEL' && !localLead.statusProposta) {
                updates.statusProposta = 'ENVIADA';
                logMsg = 'Proposta comercial enviada ao cliente';
            } else if (localLead.statusProposta === 'ENVIADA' || localLead.statusProposta === 'VISUALIZADA') {
                updates.statusProposta = 'ACEITA';
                logMsg = 'Proposta ACEITA pelo cliente';
            } else if (localLead.statusProposta === 'ACEITA') {
                showToast('Lead pronto para Instalação. Agende a visita na aba correspondente.', 'info');
                return;
            } else {
                showToast('Lead já está em estágio avançado.', 'info');
                return;
            }

            await updateLead(localLead.id, updates);
            await logInteraction(localLead.id, 'SYS', 'Avanço de Etapa', logMsg);
            setLocalLead(prev => ({ ...prev, ...updates }));
            showToast('Estágio atualizado!', 'success');
            onUpdate();
            loadLeadContext();
        } catch (err) {
            showToast('Erro ao avançar estágio', 'error');
        }
    };

    const renderHeader = () => {
        const stages = [
            { id: 'NOVO', label: 'Novo', field: 'statusQualificacao', value: 'PENDENTE' },
            { id: 'QUALIF', label: 'Qualif', field: 'statusQualificacao', value: 'QUALIFICADO' },
            { id: 'VIAB', label: 'Viab', field: 'statusViabilidade', value: 'VIAVEL' },
            { id: 'PROP', label: 'Prop', field: 'statusProposta', value: 'ENVIADA' },
            { id: 'ASSIN', label: 'Assin', field: 'statusProposta', value: 'ACEITA' }
        ];

        let currentIdx = -1;
        if (localLead?.statusQualificacao === 'PENDENTE') currentIdx = 0;
        if (localLead?.statusQualificacao === 'EM_ANALISE') currentIdx = 0;
        if (localLead?.statusQualificacao === 'QUALIFICADO') currentIdx = 1;
        if (localLead?.statusViabilidade === 'EM_ANALISE') currentIdx = 1;
        if (localLead?.statusViabilidade === 'VIAVEL') currentIdx = 2;
        if (localLead?.statusProposta === 'ENVIADA' || localLead?.statusProposta === 'VISUALIZADA') currentIdx = 3;
        if (localLead?.statusProposta === 'ACEITA') currentIdx = 4;
        if (localLead?.statusQualificacao === 'DESQUALIFICADO' || localLead?.statusProposta === 'RECUSADA') currentIdx = -2;

        return (
            <header className="fixed-header">
                <div className="header-top">
                    <button onClick={onClose} className="btn-back"><ArrowLeft weight="bold" /> VOLTAR</button>
                    {currentIdx === -2 ? (
                        <div className="status-lost-badge">
                            <Prohibit size={20} /> LEAD PERDIDO / DESQUALIFICADO
                        </div>
                    ) : (
                        <div className="status-stepper">
                            {stages.map((s, idx) => (
                                <React.Fragment key={s.id}>
                                    <div className={`step ${idx <= currentIdx ? 'active' : ''}`}>
                                        <div className="step-point">{idx + 1}</div>
                                        <span>{s.label}</span>
                                    </div>
                                    {idx < stages.length - 1 && <div className={`step-line ${idx < currentIdx ? 'active' : ''}`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    <div className="header-actions">
                        <button className="btn-titan-sm" onClick={() => setShowTransferModal(true)}><UserSwitch size={18} /> TRANSFERIR</button>
                        <button className="btn-titan-primary" onClick={handleAdvanceStage}>AVANÇAR <CaretRight weight="bold" /></button>
                    </div>
                </div>
                <div className="lead-info-row">
                    <div className="avatar-titan">{localLead.nomeCompleto.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div className="lead-meta">
                        <h1>{localLead.nomeCompleto}</h1>
                        <div className="lead-badges-row">
                            <span className="badge-titan">{localLead.tipoPessoa}</span>
                            <span className="badge-titan"><MapPin size={12} /> {localLead.cidade} / {localLead.bairro}</span>
                            <span className="badge-titan badge-blue"><NavigationArrow size={12} weight="fill" /> {localLead.canalEntrada}</span>
                        </div>
                    </div>
                </div>
            </header>
        );
    };

    const renderTimeline = () => {
        const filteredHistory = historyLogs.filter(h => {
            const t = h.type?.toUpperCase();
            if (timelineFilter === 'ALL') return true;
            if (timelineFilter === 'CALL') return t === 'CALL';
            if (timelineFilter === 'WA') return t === 'WA' || t === 'WHATSAPP';
            if (timelineFilter === 'SYS') return t === 'SYS' || t === 'SYSTEM' || t === 'STAGE_CHANGE' || t === 'TASK';
            return false;
        });

        return (
            <div className="timeline-view">
                <div className="tab-nav-titan timeline-filters">
                    <button className={timelineFilter === 'ALL' ? 'active' : ''} onClick={() => setTimelineFilter('ALL')}>TUDO</button>
                    <button className={timelineFilter === 'CALL' ? 'active' : ''} onClick={() => setTimelineFilter('CALL')}><Phone size={14} /> CHAMADAS</button>
                    <button className={timelineFilter === 'WA' ? 'active' : ''} onClick={() => setTimelineFilter('WA')}><WhatsappLogo size={14} /> WHATSAPP</button>
                    <button className={timelineFilter === 'SYS' ? 'active' : ''} onClick={() => setTimelineFilter('SYS')}><ArrowsClockwise size={14} /> SISTEMA</button>
                </div>
                <div className="timeline-feed ic-sidebar-scroll">
                    {filteredHistory.length === 0 ? (
                        <div className="empty-titan"><Clock size={48} weight="duotone" /><h4>Sem registros recentes</h4></div>
                    ) : filteredHistory.map(event => (
                        <div key={event.id} className={`timeline-card ${event.type.toLowerCase()}`}>
                            <div className="card-icon-area">
                                <div className={`type-icon ${(event.type as string).toLowerCase().replace('whatsapp', 'wa')}`}>
                                    {['CALL'].includes(event.type) && <PhoneCall size={20} weight="fill" />}
                                    {['WA', 'WHATSAPP'].includes(event.type) && <WhatsappLogo size={20} weight="fill" />}
                                    {['SYS', 'SYSTEM', 'STAGE_CHANGE', 'TASK'].includes(event.type) && <ArrowsClockwise size={20} weight="bold" />}
                                </div>
                                <div className="connector-line"></div>
                            </div>
                            <div className="card-content">
                                <header className="card-header">
                                    <span className="event-action">{event.content?.split(':')[0] || 'Atividade'}</span>
                                    <span className="event-time">{new Date(event.dataEvento).toLocaleDateString()} • {new Date(event.dataEvento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </header>
                                <div className="card-body"><p>{event.content}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderQualificacaoTab = () => (
        <div className="tab-pane-qualificacao">
            <div className="titan-form-section">
                <h3><Trophy size={20} /> Qualificação Estratégica</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Status Qualificação</label>
                        <select className="titan-select" value={localLead.statusQualificacao} onChange={(e) => handleFieldUpdate('statusQualificacao', e.target.value)}>
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="EM_ANALISE">EM ANÁLISE</option>
                            <option value="QUALIFICADO">QUALIFICADO</option>
                            <option value="DESQUALIFICADO">DESQUALIFICADO</option>
                        </select>
                    </div>
                    {localLead.statusQualificacao === 'DESQUALIFICADO' && (
                        <div className="titan-field highlight-warning">
                            <label>Motivo da Perda (Realtime BI)</label>
                            <select className="titan-select" value={localLead.motivoPerda || ''} onChange={(e) => handleFieldUpdate('motivoPerda', e.target.value)}>
                                <option value="">Selecione o motivo...</option>
                                {systemSettings.filter(s => s.category === 'LOSS_REASON' && s.isActive).map(s => (
                                    <option key={s.id} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="titan-field">
                        <label>Necessidade / Plano</label>
                        <input className="titan-input" defaultValue={localLead.interessePlano || ''} onBlur={(e) => handleFieldUpdate('interessePlano', e.target.value)} placeholder="Ex: 600MB Fibra" />
                    </div>
                </div>
            </div>

            <div className="titan-form-section section-dark">
                <h3><Money size={20} /> Inteligência Financeira (BI)</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Valor Pago Atual (R$)</label>
                        <input className="titan-input" type="number" defaultValue={localLead.valorPagoAtual || 0} onBlur={(e) => handleFieldUpdate('valorPagoAtual', Number(e.target.value))} />
                    </div>
                    <div className="titan-field">
                        <label>Custo do Lead (Mkt)</label>
                        <input className="titan-input" type="number" defaultValue={localLead.custoLead || 0} onBlur={(e) => handleFieldUpdate('custoLead', Number(e.target.value))} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPropostaTab = () => (
        <div className="tab-pane-proposta">
            <div className="titan-form-section">
                <h3><Receipt size={20} /> Proposta Comercial</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Status Proposta</label>
                        <select className="titan-select" value={localLead.statusProposta || 'ENVIADA'} onChange={(e) => handleFieldUpdate('statusProposta', e.target.value)}>
                            <option value="ENVIADA">ENVIADA</option>
                            <option value="VISUALIZADA">VISUALIZADA</option>
                            <option value="ACEITA">ACEITA / FECHADA</option>
                            <option value="RECUSADA">RECUSADA</option>
                        </select>
                    </div>
                    {localLead.statusProposta === 'RECUSADA' && (
                        <div className="titan-field highlight-warning">
                            <label>Por que recusou?</label>
                            <select className="titan-select" value={localLead.motivoPerda || ''} onChange={(e) => handleFieldUpdate('motivoPerda', e.target.value)}>
                                <option value="">Selecione...</option>
                                {systemSettings.filter(s => s.category === 'LOSS_REASON' && s.isActive).map(s => (
                                    <option key={s.id} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="titan-field">
                        <label>Valor Plano Fechado (R$)</label>
                        <input className="titan-input" type="number" defaultValue={localLead.valorPlano || 0} onBlur={(e) => handleFieldUpdate('valorPlano', Number(e.target.value))} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDadosTab = () => (
        <div className="tab-pane-dados ic-sidebar-scroll">
            <div className="titan-form-section">
                <h3><IdentificationBadge size={20} /> Contatos</h3>
                <div className="titan-grid">
                    <div className="titan-field"><label>Telefone</label><input className="titan-input" defaultValue={localLead.telefonePrincipal} onBlur={(e) => handleFieldUpdate('telefonePrincipal', e.target.value)} /></div>
                    <div className="titan-field"><label>E-mail</label><input className="titan-input" defaultValue={localLead.email || ''} onBlur={(e) => handleFieldUpdate('email', e.target.value)} /></div>
                </div>
            </div>
        </div>
    );

    const renderViabilityTab = () => (
        <div className="tab-pane-viability">
            <div className="titan-form-section">
                <h3><HardDrives size={20} /> Viabilidade Técnica</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Status Técnico</label>
                        <select className="titan-select" value={localLead.statusViabilidade} onChange={(e) => handleFieldUpdate('statusViabilidade', e.target.value)}>
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="VIAVEL">VIÁVEL</option>
                            <option value="INVIAVEL">INVIÁVEL</option>
                        </select>
                    </div>
                    {localLead.statusViabilidade === 'INVIAVEL' && (
                        <div className="titan-field highlight-warning">
                            <label>Motivo Inviabilidade</label>
                            <select className="titan-select" value={localLead.motivoPerda || ''} onChange={(e) => handleFieldUpdate('motivoPerda', e.target.value)}>
                                <option value="">Selecione...</option>
                                {systemSettings.filter(s => s.category === 'LOSS_REASON' && s.isActive).map(s => (
                                    <option key={s.id} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lead-detail-titan">
                {renderHeader()}
                <div className="detail-layout">
                    <main className="detail-tabs-area ic-sidebar-scroll">
                        <nav className="tab-nav-titan">
                            <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}><Clock size={16} /> Timeline</button>
                            <button className={activeTab === 'dados' ? 'active' : ''} onClick={() => setActiveTab('dados')}><AddressBook size={16} /> Dados</button>
                            <button className={activeTab === 'qualificacao' ? 'active' : ''} onClick={() => setActiveTab('qualificacao')}><IdentificationBadge size={16} /> Qualificação</button>
                            <button className={activeTab === 'viabilidade' ? 'active' : ''} onClick={() => setActiveTab('viabilidade')}><HardDrives size={16} /> Viabilidade</button>
                            <button className={activeTab === 'proposta' ? 'active' : ''} onClick={() => setActiveTab('proposta')}><Receipt size={16} /> Proposta</button>
                        </nav>
                        <div className="tab-viewport">
                            {activeTab === 'timeline' && renderTimeline()}
                            {activeTab === 'dados' && renderDadosTab()}
                            {activeTab === 'qualificacao' && renderQualificacaoTab()}
                            {activeTab === 'viabilidade' && renderViabilityTab()}
                            {activeTab === 'proposta' && renderPropostaTab()}
                        </div>
                    </main>
                    <aside className="sidebar-titan">
                        <div className="sidebar-section">
                            <h3>Ações Rápidas</h3>
                            <button className="btn-titan-sm w-full mb-1" onClick={() => dispatchWhatsApp(localLead.telefonePrincipal, 'Olá!', localLead.id)}><WhatsappLogo size={20} /> WHATSAPP</button>
                            <button className="btn-titan-sm w-full" onClick={() => dispatchCall(localLead.telefonePrincipal, localLead.id)}><Phone size={20} /> LIGAÇÃO</button>
                        </div>
                    </aside>
                </div>
                {showTransferModal && (
                    <div className="titan-modal-overlay">
                        <div className="titan-modal">
                            <div className="modal-title"><h2>Transferir Lead</h2><button className="tab-btn" onClick={() => setShowTransferModal(false)}><X size={20} /></button></div>
                            <div className="modal-body">
                                <select className="titan-select" value={newVendedorId} onChange={e => setNewVendedorId(e.target.value)}>
                                    <option value="">Equipe comercial...</option>
                                    <option value="11111111-1111-1111-1111-111111111111">João Sollatori</option>
                                    <option value="22222222-2222-2222-2222-222222222222">Mariana Comercial</option>
                                </select>
                            </div>
                            <div className="modal-actions"><button className="btn-titan-primary" onClick={() => { handleFieldUpdate('vendedorId', newVendedorId); setShowTransferModal(false); }}>CONFIRMAR</button></div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default LeadDetail;
