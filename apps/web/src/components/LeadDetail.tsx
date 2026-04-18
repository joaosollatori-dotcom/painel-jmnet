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
    NavigationArrow, PhoneCall, ArrowSquareOut
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './LeadDetail.css';
import { Lead, LeadHistory, updateLead, Appointment, getAppointments, getLeadHistory } from '../services/leadService';
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

    useEffect(() => {
        setLocalLead(lead);
        loadLeadContext();
    }, [lead]);

    const loadLeadContext = async () => {
        const [appts, hist] = await Promise.all([
            getAppointments(),
            getLeadHistory(lead.id)
        ]);
        setRelatedAppts(appts.filter(a => a.leadId === lead.id));
        setHistoryLogs(hist);
    };

    const handleFieldUpdate = async (field: keyof Lead, value: any) => {
        try {
            await updateLead(localLead.id, { [field]: value });
            setLocalLead(prev => ({ ...prev, [field]: value }));
            showToast('Informação sincronizada', 'success');
            onUpdate();
            setIsEditing(null);
            loadLeadContext();
        } catch (err) {
            showToast('Falha na sincronização', 'error');
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
            } else if (localLead.statusProposta === 'ENVIADA') {
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
            { id: 'QUALIF', label: 'Qualif', field: 'statusQualificacao', value: 'EM_ANALISE' },
            { id: 'VIAB', label: 'Viab', field: 'statusViabilidade', value: 'EM_ANALISE' },
            { id: 'PROP', label: 'Prop', field: 'statusProposta', value: 'ENVIADA' },
            { id: 'ASSIN', label: 'Assin', field: 'statusProposta', value: 'ACEITA' },
            { id: 'INSTAL', label: 'Instal', field: 'statusQualificacao', value: 'CONCLUIDO' }
        ];

        // Lógica dinâmica para o Stepper
        let currentIdx = -1;
        if (localLead.statusQualificacao === 'PENDENTE') currentIdx = 0;
        if (localLead.statusQualificacao === 'EM_ANALISE') currentIdx = 1;
        if (localLead.statusQualificacao === 'QUALIFICADO') currentIdx = 1;
        if (localLead.statusViabilidade === 'EM_ANALISE') currentIdx = 2;
        if (localLead.statusViabilidade === 'VIAVEL') currentIdx = 2;
        if (localLead.statusProposta === 'ENVIADA') currentIdx = 3;
        if (localLead.statusProposta === 'VISUALIZADA') currentIdx = 3;
        if (localLead.statusProposta === 'ACEITA') currentIdx = 4;
        if (localLead.statusQualificacao === 'CONCLUIDO') currentIdx = 5;

        return (
            <header className="fixed-header">
                <div className="header-top">
                    <button onClick={onClose} className="btn-back"><ArrowLeft weight="bold" /> VOLTAR</button>
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
                    <div className="header-actions">
                        <button className="btn-titan-sm" onClick={() => setShowTransferModal(true)}><UserSwitch size={18} /> TRANSFERIR</button>
                        <button className="btn-titan-primary" onClick={handleAdvanceStage}>AVANÇAR <CaretRight weight="bold" /></button>
                    </div>
                </div>
                <div className="lead-info-row">
                    <div className="avatar-titan">{lead.nomeCompleto.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div className="lead-meta">
                        <h1>{lead.nomeCompleto}</h1>
                        <div className="lead-badges-row">
                            <span className="badge-titan">{lead.tipoPessoa}</span>
                            <span className="badge-titan"><MapPin size={12} /> {lead.cidade} / {lead.bairro}</span>
                            <span className="badge-titan badge-blue"><NavigationArrow size={12} weight="fill" /> {lead.canalEntrada}</span>
                        </div>
                    </div>
                </div>
            </header>
        );
    };

    const renderTimeline = () => {
        const matchesFilter = (type: string) => {
            const t = type?.toUpperCase();
            if (timelineFilter === 'ALL') return true;
            if (timelineFilter === 'CALL') return t === 'CALL';
            if (timelineFilter === 'WA') return t === 'WA' || t === 'WHATSAPP';
            if (timelineFilter === 'SYS') return t === 'SYS' || t === 'SYSTEM' || t === 'STAGE_CHANGE' || t === 'TASK';
            return false;
        };

        const filteredHistory = historyLogs.filter(h => matchesFilter(h.type));

        return (
            <div className="timeline-view">
                <div className="tab-nav-titan timeline-filters">
                    <button className={timelineFilter === 'ALL' ? 'active' : ''} onClick={() => setTimelineFilter('ALL')}>TUDO</button>
                    <button className={timelineFilter === 'CALL' ? 'active' : ''} onClick={() => setTimelineFilter('CALL')}>
                        <Phone size={14} /> CHAMADAS
                    </button>
                    <button className={timelineFilter === 'WA' ? 'active' : ''} onClick={() => setTimelineFilter('WA')}>
                        <WhatsappLogo size={14} /> WHATSAPP
                    </button>
                    <button className={timelineFilter === 'SYS' ? 'active' : ''} onClick={() => setTimelineFilter('SYS')}>
                        <ArrowsClockwise size={14} /> SISTEMA
                    </button>
                </div>

                <div className="timeline-feed ic-sidebar-scroll">
                    {filteredHistory.length === 0 ? (
                        <div className="empty-titan">
                            <Clock size={48} weight="duotone" />
                            <h4>Sem registros nesta categoria</h4>
                            <p>Ainda não há interações registradas para este filtro.</p>
                        </div>
                    ) : filteredHistory.map(event => (
                        <div key={event.id} className={`timeline-card ${event.type.toLowerCase()}`}>
                            <div className="card-icon-area">
                                <div className={`type-icon ${(event.type as string).toLowerCase().replace('whatsapp', 'wa')}`}>
                                    {['CALL'].includes(event.type) && <PhoneCall size={20} weight="fyll" />}
                                    {['WA', 'WHATSAPP'].includes(event.type) && <WhatsappLogo size={20} weight="fill" />}
                                    {['SYS', 'SYSTEM', 'STAGE_CHANGE', 'TASK'].includes(event.type) && <ArrowsClockwise size={20} weight="bold" />}
                                </div>
                                <div className="connector-line"></div>
                            </div>
                            <div className="card-content">
                                <header className="card-header">
                                    <span className="event-action">{event.metadata?.action || event.metadados?.action || 'Atividade de Sistema'}</span>
                                    <span className="event-time">
                                        {new Date(event.dataEvento || event.data_evento || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {new Date(event.dataEvento || event.data_evento || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </header>
                                <div className="card-body">
                                    <p>{event.content || 'Nenhuma descrição adicional.'}</p>
                                </div>
                                <footer className="card-footer">
                                    <div className="history-responsible">
                                        <div className="resp-avatar">JS</div>
                                        <span>João Solla</span>
                                    </div>
                                    {event.duration && <span className="call-duration"><Timer size={14} /> {Math.floor(event.duration / 60)}m {event.duration % 60}s</span>}
                                </footer>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDadosTab = () => (
        <div className="tab-pane-dados">
            <div className="titan-form-section">
                <h3><IdentificationBadge size={20} /> Informações de Contato</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Telefone Principal</label>
                        <input className="titan-input" defaultValue={lead.telefonePrincipal} onBlur={(e) => handleFieldUpdate('telefonePrincipal', e.target.value)} />
                    </div>
                    <div className="titan-field">
                        <label>E-mail</label>
                        <input className="titan-input" defaultValue={lead.email || ''} onBlur={(e) => handleFieldUpdate('email', e.target.value)} placeholder="vazio@provedor.com" />
                    </div>
                    <div className="titan-field">
                        <label>CPF / CNPJ</label>
                        <input className="titan-input" defaultValue={lead.cpfCnpj || ''} onBlur={(e) => handleFieldUpdate('cpfCnpj', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="titan-form-section">
                <h3><MapPin size={20} /> Endereço de Instalação</h3>
                <div className="titan-grid">
                    <div className="titan-field col-span-2">
                        <label>Logradouro</label>
                        <input className="titan-input" defaultValue={lead.logradouro || ''} onBlur={(e) => handleFieldUpdate('logradouro', e.target.value)} />
                    </div>
                    <div className="titan-field">
                        <label>Nº</label>
                        <input className="titan-input" defaultValue={lead.numero || ''} onBlur={(e) => handleFieldUpdate('numero', e.target.value)} />
                    </div>
                    <div className="titan-field">
                        <label>Bairro</label>
                        <input className="titan-input" defaultValue={lead.bairro || ''} onBlur={(e) => handleFieldUpdate('bairro', e.target.value)} />
                    </div>
                    <div className="titan-field">
                        <label>Cidade</label>
                        <input className="titan-input" defaultValue={lead.cidade || ''} onBlur={(e) => handleFieldUpdate('cidade', e.target.value)} />
                    </div>
                    <div className="titan-field">
                        <label>CEP</label>
                        <input className="titan-input" defaultValue={lead.cep || ''} onBlur={(e) => handleFieldUpdate('cep', e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderViabilityTab = () => (
        <div className="tab-pane-viability">
            <div className="viab-grid">
                <div className="viab-info">
                    <div className="titan-form-section">
                        <h3><HardDrives size={20} /> Vistoria Técnica</h3>
                        <div className="titan-grid">
                            <div className="titan-field">
                                <label>Status</label>
                                <select className="titan-select" value={lead.statusViabilidade} onChange={(e) => handleFieldUpdate('statusViabilidade', e.target.value)}>
                                    <option value="PENDENTE">PENDENTE</option>
                                    <option value="EM_ANALISE">EM ANÁLISE</option>
                                    <option value="VIAVEL">VIÁVEL</option>
                                    <option value="INVIAVEL">INVIÁVEL</option>
                                </select>
                            </div>
                            <div className="titan-field">
                                <label>Caixa Próxima (CTO)</label>
                                <input className="titan-input" defaultValue={lead.ctoProxima || ''} onBlur={(e) => handleFieldUpdate('ctoProxima', e.target.value)} placeholder="CTO-000" />
                            </div>
                            <div className="titan-field">
                                <label>Distância Estimada (m)</label>
                                <input className="titan-input" type="number" defaultValue={lead.distanciaDistribuidor || 0} onBlur={(e) => handleFieldUpdate('distanciaDistribuidor', Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="titan-field mt-1-5">
                            <label>Observações Técnicas</label>
                            <textarea className="titan-input auto-height" defaultValue={lead.obsTecnica || ''} onBlur={(e) => handleFieldUpdate('obsTecnica', e.target.value)} />
                        </div>
                        <button
                            className="btn-titan-primary w-full mt-1-5"
                            onClick={() => {
                                handleFieldUpdate('statusViabilidade', 'VIAVEL');
                                handleActionLog('SYS', 'Viabilidade Validada (CPO OK)');
                            }}
                        >
                            SALVAR E VALIDAR CPO
                        </button>
                    </div>
                </div>
                <div className="map-container-titan">
                    <MapContainer center={[lead.latitude || -23.5505, lead.longitude || -46.6333]} zoom={18} className="h-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lead.latitude || -23.5505, lead.longitude || -46.6333]}>
                            <Popup>{lead.nomeCompleto}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );

    const renderQualificacaoTab = () => (
        <div className="tab-pane-qualificacao">
            <div className="titan-form-section">
                <h3><Trophy size={20} /> Qualificação BANT</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Budget (R$)</label>
                        <input className="titan-input" type="number" defaultValue={lead.valorPagoAtual || 0} onBlur={(e) => handleFieldUpdate('valorPagoAtual', Number(e.target.value))} />
                    </div>
                    <div className="titan-field">
                        <label>É o decisor?</label>
                        <select className="titan-select" value={lead.decisorIdentificado ? 'S' : 'N'} onChange={(e) => handleFieldUpdate('decisorIdentificado', e.target.value === 'S')}>
                            <option value="S">SIM - PROPRIETÁRIO</option>
                            <option value="N">NÃO - DEPENDENTE</option>
                        </select>
                    </div>
                    <div className="titan-field">
                        <label>Necessidade / Plano</label>
                        <input className="titan-input" defaultValue={lead.interessePlano || ''} onBlur={(e) => handleFieldUpdate('interessePlano', e.target.value)} placeholder="Ex: 500MB Fibra" />
                    </div>
                    <div className="titan-field">
                        <label>Urgência</label>
                        <select className="titan-select">
                            <option>IMEDIATO</option>
                            <option>15 DIAS</option>
                            <option>PESQUISA</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="titan-form-section section-dark">
                <h3><Smiley size={20} /> Perfil do Lead</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Score Atual</label>
                        <div className="score-display">{lead.scoreQualificacao || 0} <span className="score-unit">pts</span></div>
                    </div>
                    <div className="titan-field">
                        <label>Tipo de Perfil</label>
                        <select className="titan-select" value={lead.perfilUso || 'RESIDENCIAL'} onChange={(e) => handleFieldUpdate('perfilUso', e.target.value)}>
                            <option value="RESIDENCIAL">RESIDENCIAL</option>
                            <option value="GAMER">GAMER / PREMIUM</option>
                            <option value="BUSINESS">EMPRESARIAL</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderPropostaTab = () => (
        <div className="tab-pane-proposta">
            <div className="titan-form-section">
                <h3><Receipt size={20} /> Oferta Ativa</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Plano</label>
                        <strong className="text-white">500 MB FIBRA ULTRA</strong>
                    </div>
                    <div className="titan-field">
                        <label>Valor Mensal</label>
                        <strong className="price-tag">R$ 99,90</strong>
                    </div>
                    <div className="titan-field">
                        <label>Status Contrato</label>
                        <span className="badge-titan badge-success">ENVIADO</span>
                    </div>
                </div>
                <div className="flex-gap-12-mt">
                    <button className="btn-titan-sm" onClick={() => dispatchWhatsApp(lead.telefonePrincipal, 'Segue sua proposta...', lead.id)}><WhatsappLogo size={16} /> REENVIAR WHATSAPP</button>
                    <button className="btn-titan-sm" onClick={() => handleActionLog('SYS', 'Proposta Visualizada')}><ArrowSquareOut size={16} /> VISUALIZAR PDF</button>
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
                            <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}><Clock size={16} /> Timeline</button>
                            <button className={`tab-btn ${activeTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveTab('dados')}><AddressBook size={16} /> Dados</button>
                            <button className={`tab-btn ${activeTab === 'qualificacao' ? 'active' : ''}`} onClick={() => setActiveTab('qualificacao')}><IdentificationBadge size={16} /> Qualificação</button>
                            <button className={`tab-btn ${activeTab === 'viabilidade' ? 'active' : ''}`} onClick={() => setActiveTab('viabilidade')}><HardDrives size={16} /> Viabilidade</button>
                            <button className={`tab-btn ${activeTab === 'proposta' ? 'active' : ''}`} onClick={() => setActiveTab('proposta')}><Receipt size={16} /> Proposta</button>
                            <button className={`tab-btn ${activeTab === 'agendamento' ? 'active' : ''}`} onClick={() => setActiveTab('agendamento')}><Calendar size={16} /> Agendamento</button>
                        </nav>

                        <div className="tab-viewport ic-sidebar-scroll">
                            {activeTab === 'timeline' && renderTimeline()}
                            {activeTab === 'dados' && renderDadosTab()}
                            {activeTab === 'qualificacao' && renderQualificacaoTab()}
                            {activeTab === 'viabilidade' && renderViabilityTab()}
                            {activeTab === 'proposta' && renderPropostaTab()}
                            {activeTab === 'agendamento' && (
                                <div className="scheduling-form-titan">
                                    <div className="section-header">
                                        <CalendarPlus size={24} />
                                        <h3>Programação Técnica de Instalação</h3>
                                    </div>
                                    <div className="scheduling-grid">
                                        <div className="titan-field">
                                            <label>Data da Visita/Instalação</label>
                                            <input
                                                type="date"
                                                className="titan-input"
                                                value={lead.dataInstalacao ? new Date(lead.dataInstalacao).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleFieldUpdate('dataInstalacao', e.target.value)}
                                            />
                                        </div>
                                        <div className="titan-field">
                                            <label>Turno</label>
                                            <select
                                                className="titan-select"
                                                value={lead.turnoInstalacao || ''}
                                                onChange={(e) => handleFieldUpdate('turnoInstalacao', e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="MANHA">Manhã (08h - 12h)</option>
                                                <option value="TARDE">Tarde (13h - 18h)</option>
                                                <option value="NOITE">Noite (Especial)</option>
                                            </select>
                                        </div>
                                        <div className="titan-field">
                                            <label>Técnico Responsável</label>
                                            <select
                                                className="titan-select"
                                                value={lead.tecnicoId || ''}
                                                onChange={(e) => handleFieldUpdate('tecnicoId', e.target.value)}
                                            >
                                                <option value="">Selecione o técnico...</option>
                                                <option value="33333333-3333-3333-3333-333333333333">Roberto Técnico</option>
                                                <option value="11111111-1111-1111-1111-111111111111">João Sollatori</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="scheduling-actions">
                                        <button className="btn-titan-primary" onClick={() => {
                                            handleActionLog('TASK', `Agendamento técnico atualizado para ${lead.dataInstalacao} no turno ${lead.turnoInstalacao}`);
                                            showToast('Agendamento Sincronizado!', 'success');
                                        }}>CONFIRMAR PROGRAMAÇÃO</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>

                    <aside className="sidebar-titan">
                        <div className="sidebar-section">
                            <h3>Ações Rápidas</h3>
                            <div className="action-card">
                                <h4>Registrar Feedback</h4>
                                <div className="quick-buttons">
                                    <button className="btn-log" onClick={() => handleActionLog('CALL', 'Não atendeu')}>Não atendeu</button>
                                    <button className="btn-log" onClick={() => handleActionLog('CALL', 'Ocupado')}>Ocupado</button>
                                    <button className="btn-log" onClick={() => handleActionLog('WA', 'Envio de Proposta')}>Enviou Prop</button>
                                    <button className="btn-log" onClick={() => handleActionLog('CALL', 'Ligar amanhã')}>Agendar Ret</button>
                                </div>
                            </div>

                            <div className="note-area">
                                <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)} placeholder="Descreva a interação recente..." />
                                <button className="btn-save-note" onClick={handleSaveQuickNote}>SALVAR NA TIMELINE</button>
                            </div>
                        </div>

                        <div className="contact-grid">
                            <button className="c-btn tel" onClick={() => dispatchCall(lead.telefonePrincipal, lead.id)}><Phone size={24} weight="fill" /></button>
                            <button className="c-btn wa" onClick={() => dispatchWhatsApp(lead.telefonePrincipal, 'Olá!', lead.id)}><WhatsappLogo size={24} weight="fill" /></button>
                            <button className="c-btn appt" onClick={() => setActiveTab('agendamento')}><CalendarPlus size={24} weight="fill" /></button>
                        </div>
                    </aside>
                </div>

                {/* Modals */}
                {showTransferModal && (
                    <div className="titan-modal-overlay">
                        <div className="titan-modal">
                            <div className="modal-title"><h2>Mover Responsável</h2><button className="tab-btn" onClick={() => setShowTransferModal(false)}><X size={20} /></button></div>
                            <div className="modal-body">
                                <div className="titan-field">
                                    <label>Novo Operador</label>
                                    <select className="titan-select" value={newVendedorId} onChange={e => setNewVendedorId(e.target.value)}>
                                        <option value="">Selecione na equipe...</option>
                                        <option value="11111111-1111-1111-1111-111111111111">João Sollatori</option>
                                        <option value="22222222-2222-2222-2222-222222222222">Mariana Comercial</option>
                                        <option value="33333333-3333-3333-3333-333333333333">Roberto Técnico</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-titan-sm" onClick={() => setShowTransferModal(false)}>CANCELAR</button>
                                <button className="btn-titan-primary" onClick={() => { handleFieldUpdate('vendedorId', newVendedorId); setShowTransferModal(false); }}>CONFIRMAR</button>
                            </div>
                        </div>
                    </div>
                )}

            </motion.div>
        </AnimatePresence>
    );
};

export default LeadDetail;
