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
    ArrowsCounterClockwise, Money, WifiHigh, Tag, LinkSimple,
    FloppyDisk, Printer, Signature, CurrencyCircleDollar
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './LeadDetail.css';
import { Lead, LeadHistory, updateLead, Appointment, getAppointments, getLeadHistory } from '../services/leadService';
import { getSystemSettings, SystemSetting } from '../services/systemSettingsService';
import { dispatchCall, dispatchWhatsApp, dispatchNote, logInteraction } from '../services/actionService';
import { useToast } from '../contexts/ToastContext';
import {
    Contrato, ContratoFatura,
    getContratByLeadCpf, provisionarContrato,
    updateContrato, getFaturasDoContrato, vincularONU
} from '../services/contratoService';
import { getGenieDevices, GenieDevice } from '../services/genieacsService';

interface LeadDetailProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: () => void;
}

const LeadDetail: React.FC<Partial<LeadDetailProps>> = ({ lead: propLead, onClose, onUpdate }) => {
    const { leadId: paramLeadId } = useParams<{ leadId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [localLead, setLocalLead] = useState<Lead | null>(propLead || null);
    const [loading, setLoading] = useState(!propLead);
    const [activeTab, setActiveTab] = useState<'timeline' | 'dados' | 'qualificacao' | 'viabilidade' | 'proposta' | 'contratos'>('timeline');
    const [contrato, setContrato] = useState<Contrato | null>(null);
    const [contratoForm, setContratoForm] = useState<Partial<Contrato>>({});
    const [faturas, setFaturas] = useState<ContratoFatura[]>([]);
    const [loadingContrato, setLoadingContrato] = useState(false);
    const [showOnuModal, setShowOnuModal] = useState(false);

    useEffect(() => {
        if (!propLead && paramLeadId) {
            loadLeadData(paramLeadId);
        } else if (propLead) {
            setLocalLead(propLead);
            setLoading(false);
        }
    }, [propLead, paramLeadId]);

    const loadLeadData = async (id: string) => {
        setLoading(true);
        try {
            const { getLead } = await import('../services/leadService');
            const data = await getLead(id);
            setLocalLead(data);
        } catch (err) {
            showToast('Erro ao carregar lead', 'error');
        } finally {
            setLoading(false);
        }
    };
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
        if (lead) {
            setLocalLead(lead);
            loadLeadContext();
        }
    }, [lead]);

    const loadLeadContext = async () => {
        if (!lead) return;
        const [appts, hist, settings] = await Promise.all([
            getAppointments(),
            getLeadHistory(lead.id),
            getSystemSettings()
        ]);
        setRelatedAppts(appts.filter(a => a.leadId === lead.id));
        setHistoryLogs(hist);
        setSystemSettings(settings);
    };

    const loadContrato = async () => {
        if (!localLead?.cpfCnpj) return;
        setLoadingContrato(true);
        try {
            const c = await getContratByLeadCpf(localLead.cpfCnpj);
            setContrato(c);
            if (c) {
                setContratoForm(c);
                const fs = await getFaturasDoContrato(c.id);
                setFaturas(fs);
            }
        } finally {
            setLoadingContrato(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'contratos') loadContrato();
    }, [activeTab]);

    const handleProvisionarContrato = async () => {
        if (!localLead?.cpfCnpj) { showToast('CPF/CNPJ obrigatório para gerar contrato!', 'warning'); return; }
        try {
            const c = await provisionarContrato({
                id: localLead.id,
                nomeCompleto: localLead.nomeCompleto,
                cpfCnpj: localLead.cpfCnpj,
                planoSelecionado: localLead.interessePlano,
                valorPlano: localLead.valorPlano,
            });
            setContrato(c);
            setContratoForm(c);
            showToast('Contrato provisionado no Supabase!', 'success');
        } catch (err) {
            showToast('Erro ao provisionar contrato.', 'error');
        }
    };

    const handleSalvarContrato = async () => {
        if (!contrato) return;
        try {
            await updateContrato(contrato.id, contratoForm);
            showToast('Contrato salvo!', 'success');
            loadContrato();
        } catch (err) {
            showToast('Erro ao salvar contrato.', 'error');
        }
    };

    const handleVincularONU = async (serial: string, mac?: string) => {
        if (!contrato) return;
        try {
            await vincularONU(contrato.id, serial, mac);
            setContratoForm(f => ({ ...f, serialONU: serial, macONU: mac }));
            setShowOnuModal(false);
            showToast(`ONU ${serial} vinculada ao contrato!`, 'success');
        } catch (err) {
            showToast('Erro ao vincular ONU.', 'error');
        }
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
        if (!localLead) return null;
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

    if (loading) return <div className="loading-state"><h3>Carregando Lead...</h3></div>;
    if (!localLead) return <div className="loading-state"><h3>Lead não encontrado</h3><button onClick={() => onClose ? onClose() : navigate('/crm')}>Voltar</button></div>;


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

    const renderContratoTab = () => {
        const statusColor: Record<string, string> = {
            ATIVO: '#22c55e', SUSPENSO: '#f59e0b', CANCELADO: '#ef4444', PENDENTE: '#64748b'
        };
        return (
            <div className="tab-pane-contrato ic-sidebar-scroll">
                {loadingContrato ? (
                    <div className="empty-titan"><ArrowsClockwise size={40} className="spin-titan" /><h4>Consultando Supabase...</h4></div>
                ) : !contrato ? (
                    <div className="contrato-empty-state">
                        <WifiHigh size={64} weight="duotone" style={{ color: '#3b82f6', opacity: 0.5 }} />
                        <h3>Nenhum Contrato Ativo</h3>
                        <p>Este lead ainda não possui um contrato de serviço provisionado no sistema.</p>
                        {localLead?.cpfCnpj ? (
                            <button className="btn-titan-primary" onClick={handleProvisionarContrato}>
                                <Plus weight="bold" /> PROVISIONAR CONTRATO
                            </button>
                        ) : (
                            <p className="warn-text"><Warning weight="fill" /> Cadastre o CPF/CNPJ do lead na aba Dados primeiro.</p>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Cabeçalho do Contrato */}
                        <div className="contrato-header-bar">
                            <div>
                                <h2>{contrato.nome}</h2>
                                <span className="cpf-label">{contrato.cpfCnpj}</span>
                            </div>
                            <div className="contrato-badges">
                                <span className="status-badge-titan" style={{ background: statusColor[contrato.status] || '#64748b' }}>
                                    {contrato.status}
                                </span>
                                {contrato.tags?.map(t => (
                                    <span key={t} className="tag-badge"><Tag size={11} /> {t}</span>
                                ))}
                            </div>
                            <div className="contrato-header-actions">
                                <button className="btn-titan-sm" onClick={() => showToast('Geração de PDF em breve!', 'info')}><Printer size={16} /> IMPRIMIR</button>
                                <button className="btn-titan-sm" onClick={() => showToast('Assinatura Eletrônica em breve!', 'info')}><Signature size={16} /> ASSINAR</button>
                                <button className="btn-titan-primary" onClick={handleSalvarContrato}><FloppyDisk size={16} /> SALVAR</button>
                            </div>
                        </div>

                        {/* Status do Contrato */}
                        <div className="titan-form-section">
                            <h3><FileText size={18} /> Dados do Contrato</h3>
                            <div className="titan-grid">
                                <div className="titan-field">
                                    <label>Status do Contrato</label>
                                    <select className="titan-select" value={contratoForm.status || 'ATIVO'}
                                        onChange={e => setContratoForm(f => ({ ...f, status: e.target.value as any }))}>
                                        <option value="ATIVO">ATIVO</option>
                                        <option value="SUSPENSO">SUSPENSO</option>
                                        <option value="CANCELADO">CANCELADO</option>
                                        <option value="PENDENTE">PENDENTE</option>
                                    </select>
                                </div>
                                <div className="titan-field">
                                    <label>Data de Início</label>
                                    <input className="titan-input" type="date"
                                        value={contratoForm.dataInicio?.slice(0, 10) || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, dataInicio: e.target.value }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Dia de Vencimento Fatura</label>
                                    <input className="titan-input" type="number" min={1} max={31}
                                        value={contratoForm.dataVencimentoFatura || 10}
                                        onChange={e => setContratoForm(f => ({ ...f, dataVencimentoFatura: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Serviço de Internet - inspirado no SGP TSMX */}
                        <div className="titan-form-section section-dark">
                            <h3><WifiHigh size={18} /> Serviço de Internet</h3>
                            <div className="titan-grid">
                                <div className="titan-field">
                                    <label>Plano de Internet</label>
                                    <input className="titan-input" placeholder="Ex: 200 MB + TV Aberta"
                                        value={contratoForm.planoInternet || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, planoInternet: e.target.value }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Valor Mensal (R$)</label>
                                    <input className="titan-input" type="number"
                                        value={contratoForm.valorMensal || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, valorMensal: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Download (Mb)</label>
                                    <input className="titan-input" type="number"
                                        value={contratoForm.velocidadeDown || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, velocidadeDown: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Upload (Mb)</label>
                                    <input className="titan-input" type="number"
                                        value={contratoForm.velocidadeUp || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, velocidadeUp: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Tipo de Conexão</label>
                                    <select className="titan-select" value={contratoForm.tipoConexao || 'FIBRA'}
                                        onChange={e => setContratoForm(f => ({ ...f, tipoConexao: e.target.value as any }))}>
                                        <option value="FIBRA">FIBRA</option>
                                        <option value="RADIO">RÁDIO</option>
                                        <option value="CABO">CABO</option>
                                        <option value="SATELITE">SATÉLITE</option>
                                    </select>
                                </div>
                                <div className="titan-field">
                                    <label>Tipo PPP / Autenticação</label>
                                    <select className="titan-select" value={contratoForm.tipoPPP || 'PPPoE'}
                                        onChange={e => setContratoForm(f => ({ ...f, tipoPPP: e.target.value as any }))}>
                                        <option value="PPPoE">PPPoE</option>
                                        <option value="DHCP">DHCP</option>
                                        <option value="IP_FIXO">IP Fixo</option>
                                    </select>
                                </div>
                                <div className="titan-field">
                                    <label>POP / PoP</label>
                                    <input className="titan-input" placeholder="Ex: ITB-PBV-BA"
                                        value={contratoForm.pop || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, pop: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dados Técnicos de Acesso */}
                        <div className="titan-form-section">
                            <h3><HardDrives size={18} /> Dados Técnicos da Rede</h3>
                            <div className="titan-grid">
                                <div className="titan-field">
                                    <label>Login PPPoE</label>
                                    <input className="titan-input" placeholder="login@isp"
                                        value={contratoForm.loginPPP || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, loginPPP: e.target.value }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Senha PPPoE</label>
                                    <input className="titan-input" type="text" placeholder="senha_do_cliente"
                                        value={contratoForm.senhaPPP || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, senhaPPP: e.target.value }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>CTO</label>
                                    <input className="titan-input" placeholder="Ex: CA_046"
                                        value={contratoForm.cto || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, cto: e.target.value }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Porta na CTO</label>
                                    <input className="titan-input" type="number" min={1}
                                        value={contratoForm.portaCto || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, portaCto: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>Endereço IP</label>
                                    <input className="titan-input" placeholder="0.0.0.0"
                                        value={contratoForm.enderecoIP || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, enderecoIP: e.target.value }))}
                                    />
                                </div>
                                <div className="titan-field">
                                    <label>VLAN</label>
                                    <input className="titan-input" placeholder="Ex: 100"
                                        value={contratoForm.vlan || ''}
                                        onChange={e => setContratoForm(f => ({ ...f, vlan: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ONU/CPE Vinculada - GenieACS */}
                        <div className="titan-form-section section-dark">
                            <h3><DeviceMobile size={18} /> ONU / Equipamento (GenieACS)</h3>
                            <div className="onu-link-box">
                                {contratoForm.serialONU ? (
                                    <div className="onu-linked">
                                        <div className="onu-icon-circle"><WifiHigh size={28} weight="fill" /></div>
                                        <div>
                                            <strong>Serial: {contratoForm.serialONU}</strong>
                                            {contratoForm.macONU && <span> | MAC: {contratoForm.macONU}</span>}
                                        </div>
                                        <button className="btn-titan-sm" onClick={() => setShowOnuModal(true)}>
                                            <ArrowsClockwise size={14} /> TROCAR
                                        </button>
                                    </div>
                                ) : (
                                    <div className="onu-unlinked">
                                        <p>Nenhum equipamento vinculado. Vincule a ONU do GenieACS para monitoramento em tempo real.</p>
                                        <button className="btn-titan-primary" onClick={() => setShowOnuModal(true)}>
                                            <LinkSimple size={16} /> VINCULAR ONU
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Histórico de Faturas */}
                        <div className="titan-form-section">
                            <h3><CurrencyCircleDollar size={18} /> Histórico de Faturas</h3>
                            {faturas.length === 0 ? (
                                <div className="empty-titan" style={{ padding: '20px' }}>
                                    <Receipt size={36} weight="duotone" />
                                    <p>Nenhuma fatura gerada.</p>
                                </div>
                            ) : (
                                <div className="faturas-table">
                                    <div className="faturas-header">
                                        <span>VENCIMENTO</span><span>VALOR</span><span>STATUS</span>
                                    </div>
                                    {faturas.map(f => (
                                        <div key={f.id} className={`fatura-row status-${f.status.toLowerCase()}`}>
                                            <span>{new Date(f.vencimento).toLocaleDateString('pt-BR')}</span>
                                            <span>R$ {f.valor.toFixed(2)}</span>
                                            <span className={`fatura-badge ${f.status.toLowerCase()}`}>{f.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal de Vinculação de ONU */}
                <AnimatePresence>
                    {showOnuModal && (
                        <OuuModal
                            onClose={() => setShowOnuModal(false)}
                            onSelect={handleVincularONU}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    };

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
                            <button className={activeTab === 'contratos' ? 'active' : ''} onClick={() => setActiveTab('contratos')} style={activeTab === 'contratos' ? {} : { borderColor: '#22c55e33' }}>
                                <WifiHigh size={16} /> Contrato
                            </button>
                        </nav>
                        <div className="tab-viewport">
                            {activeTab === 'timeline' && renderTimeline()}
                            {activeTab === 'dados' && renderDadosTab()}
                            {activeTab === 'qualificacao' && renderQualificacaoTab()}
                            {activeTab === 'viabilidade' && renderViabilityTab()}
                            {activeTab === 'proposta' && renderPropostaTab()}
                            {activeTab === 'contratos' && renderContratoTab()}
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

// ─── Sub-componente: Modal de Seleção de ONU do GenieACS ───────────────────
const OuuModal: React.FC<{
    onClose: () => void;
    onSelect: (serial: string, mac?: string) => void;
}> = ({ onClose, onSelect }) => {
    const [devices, setDevices] = useState<GenieDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [manualSerial, setManualSerial] = useState('');
    const [manualMac, setManualMac] = useState('');
    const [apiError, setApiError] = useState(false);

    useEffect(() => {
        getGenieDevices()
            .then(d => { setDevices(d || []); setLoading(false); })
            .catch(() => { setApiError(true); setLoading(false); });
    }, []);

    return (
        <motion.div
            className="permissions-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <motion.div
                className="permissions-modal"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            >
                <header>
                    <div>
                        <h3><WifiHigh size={20} /> Vincular ONU / CPE (GenieACS)</h3>
                        <p>Selecione o dispositivo cadastrado ou informe o serial manualmente</p>
                    </div>
                    <button className="close-modal" onClick={onClose}>×</button>
                </header>

                {/* Lista de dispositivos do GenieACS */}
                {loading ? (
                    <div className="empty-titan" style={{ padding: '20px' }}><ArrowsClockwise size={32} className="spin-titan" /></div>
                ) : apiError || devices.length === 0 ? (
                    <div className="onu-api-warn">
                        <Warning size={22} weight="fill" style={{ color: '#f59e0b' }} />
                        <span>{apiError ? 'API local (porta 3001) offline. Use o modo manual abaixo.' : 'Nenhum dispositivo registrado no GenieACS.'}</span>
                    </div>
                ) : (
                    <div className="device-list">
                        {devices.map(d => (
                            <button key={d._id} className="device-row-btn" onClick={() => onSelect(d._id)}>
                                <DeviceMobile size={20} weight="duotone" />
                                <div>
                                    <strong>{d._id}</strong>
                                    <span>{d.InternetGatewayDevice?.DeviceInfo?.Manufacturer} {d.InternetGatewayDevice?.DeviceInfo?.ModelName}</span>
                                </div>
                                <CheckCircle size={18} weight="fill" style={{ color: '#22c55e', marginLeft: 'auto' }} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Entrada manual */}
                <div className="titan-form-section" style={{ marginTop: '16px' }}>
                    <h3 style={{ fontSize: '0.85rem' }}>Cadastro Manual</h3>
                    <div className="titan-grid">
                        <div className="titan-field">
                            <label>Serial ONU</label>
                            <input className="titan-input" placeholder="Ex: ZXHN-XXXXXXXXXX" value={manualSerial} onChange={e => setManualSerial(e.target.value)} />
                        </div>
                        <div className="titan-field">
                            <label>MAC (opcional)</label>
                            <input className="titan-input" placeholder="AA:BB:CC:DD:EE:FF" value={manualMac} onChange={e => setManualMac(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-titan-secondary" onClick={onClose}>CANCELAR</button>
                    <button
                        className="btn-titan-primary"
                        disabled={!manualSerial}
                        onClick={() => onSelect(manualSerial, manualMac || undefined)}
                    >
                        <LinkSimple size={16} /> VINCULAR MANUAL
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default LeadDetail;

