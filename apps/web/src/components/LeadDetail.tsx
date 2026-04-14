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
    const [activeTab, setActiveTab] = useState<'dados' | 'qualificacao' | 'viabilidade' | 'timeline' | 'proposta' | 'agendamento'>('timeline');
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [relatedAppts, setRelatedAppts] = useState<Appointment[]>([]);
    const [qualifData, setQualifData] = useState({
        budget: lead.valorPagoAtual || 0,
        authority: lead.decisorIdentificado ? 'SIM' : 'NAO',
        need: lead.interessePlano || '',
        timeline: 'IMEDIATO',
        devices: lead.numDispositivos || 1,
        profile: lead.perfilUso || 'RESIDENCIAL_BASICO'
    });
    const [quickNote, setQuickNote] = useState('');
    const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'CALL' | 'WA' | 'SYS'>('ALL');
    const [historyLogs, setHistoryLogs] = useState<LeadHistory[]>([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [newVendedorId, setNewVendedorId] = useState('');

    useEffect(() => {
        loadLeadContext();
    }, [lead.id]);

    const loadLeadContext = async () => {
        const appts = await getAppointments();
        setRelatedAppts(appts.filter(a => a.leadId === lead.id));
        const hist = await getLeadHistory(lead.id);
        setHistoryLogs(hist);
    };

    const handleInlineEdit = async (field: keyof Lead, value: any) => {
        try {
            await updateLead(lead.id, { [field]: value });
            showToast('Informação atualizada', 'success');
            onUpdate();
            setIsEditing(null);
        } catch (err) {
            console.error('Error updating field:', err);
            showToast('Erro ao atualizar', 'error');
        }
    };

    const registerInteraction = async (type: string, content: string) => {
        await logInteraction(lead.id, type, `Interação Rápida (${type})`, content);
        showToast(`Interação de ${type} registrada`, 'success');
        onUpdate();
    };

    const handleSaveNote = async () => {
        if (await dispatchNote(lead.id, quickNote)) {
            showToast('Nota salva na timeline', 'success');
            setQuickNote('');
            onUpdate();
        }
    };

    const handleTransfer = async () => {
        if (!newVendedorId) return;
        try {
            await updateLead(lead.id, { vendedorId: newVendedorId });
            await registerInteraction('SYS', `Lead transferido do Comercial para: ${newVendedorId}`);
            setShowTransferModal(false);
            showToast('Responsável atualizado!', 'success');
        } catch (e) {
            showToast('Erro ao transferir', 'error');
        }
    };

    const handleAdvanceStage = async () => {
        showToast('Validando regras de automação...', 'info');
        // Simulate background routine to advance Bant/Viab/Proposta statuses
        setTimeout(() => {
            registerInteraction('STAGE_CHANGE', 'Avanço Automático de Etapa disparado pelo usuário.');
        }, 1000);
    };

    const renderHeader = () => {
        const stages = ['Novo', 'Qualificação', 'Viabilidade', 'Proposta', 'Contrato', 'Instalação'];
        const currentStageIdx = 2; // Simulado

        return (
            <header className="fixed-header">
                <div className="header-nav">
                    <button onClick={onClose} className="btn-back"><ArrowLeft weight="bold" /> Voltar</button>
                    <div className="status-stepper">
                        {stages.map((s, idx) => (
                            <React.Fragment key={s}>
                                <div className={`step ${idx <= currentStageIdx ? 'active' : ''}`}>
                                    <div className="step-point">{idx < currentStageIdx ? <Checks size={14} weight="bold" /> : idx + 1}</div>
                                    <span>{s}</span>
                                </div>
                                {idx < stages.length - 1 && <div className={`step-line ${idx < currentStageIdx ? 'active' : ''}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="header-controls">
                        <button className="btn-transfer" onClick={() => setShowTransferModal(true)}><UserSwitch size={20} /> Transferir</button>
                        <button className="btn-advance" onClick={handleAdvanceStage}>Avançar Etapa <CaretRight weight="bold" /></button>
                    </div>
                </div>
                <div className="lead-identity-bar">
                    <div className="id-main">
                        <div className="id-avatar-lg">{lead.nomeCompleto.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                            <h1>{lead.nomeCompleto} <small style={{ fontSize: '0.6rem', color: '#3b82f6', background: '#3b82f620', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' }}>v2.02.07</small></h1>
                            <div className="id-badges">
                                <span className={`badge-p${lead.tipoPessoa}`}>{lead.tipoPessoa}</span>
                                <span><MapPin size={14} /> {lead.cidade || 'São Paulo'}, {lead.bairro || 'Centro'}</span>
                                <span className="id-origin"><NavigationArrow size={14} weight="fill" /> {lead.canalEntrada}</span>
                            </div>
                        </div>
                    </div>
                    <div className="vendedor-widget">
                        <div className="v-info">
                            <span>Vendedor</span>
                            <strong>João Solla</strong>
                        </div>
                        <img src="https://ui-avatars.com/api/?name=JS&background=0284c7&color=fff" alt="Vendedor" />
                    </div>
                </div>
            </header>
        );
    };

    const renderSidebar = () => (
        <aside className="fixed-sidebar ic-sidebar-scroll">
            <div className="sidebar-section">
                <h3><Clock size={18} weight="duotone" /> Próxima Tarefa</h3>
                <div className="task-card overdue">
                    <div className="task-info">
                        <strong>Ligar para confirmar viabilidade</strong>
                        <span>Ontem, às 14:30</span>
                    </div>
                    <div className="task-actions">
                        <button className="btn-done" onClick={() => registerInteraction('SYS', 'Tarefa manual concluída')}><CheckSquareOffset size={20} /></button>
                        <button className="btn-reschedule" onClick={() => registerInteraction('SYS', 'Tarefa reagendada pelo usuário')}><ArrowsClockwise size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="sidebar-section">
                <h3><ChatCircleText size={18} weight="duotone" /> Registrar Contato</h3>
                <div className="quick-logs">
                    <button onClick={() => registerInteraction('CALL', 'Não atendeu')}>Não atendeu</button>
                    <button onClick={() => registerInteraction('CALL', 'Ocupado')}>Ocupado</button>
                    <button onClick={() => registerInteraction('WA', 'WhatsApp enviado')}>WA Enviado</button>
                    <button onClick={() => registerInteraction('CALL', 'Ligar mais tarde')}>Retornar later</button>
                </div>
                <div className="manual-log">
                    <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)} placeholder="Anotação rápida..."></textarea>
                    <button className="btn-save-note" onClick={handleSaveNote}>Salvar Nota</button>
                </div>
            </div>

            <div className="sidebar-shortcuts">
                <button className="sc-call" onClick={() => dispatchCall(lead.telefonePrincipal, lead.id)}><Phone size={24} weight="fill" /></button>
                <button className="sc-whatsapp" onClick={() => dispatchWhatsApp(lead.telefonePrincipal, 'Olá!', lead.id)}><WhatsappLogo size={24} weight="fill" /></button>
                <button className="sc-task" onClick={() => setActiveTab('agendamento')}><CalendarPlus size={24} weight="fill" /></button>
            </div>
        </aside>
    );

    const renderQualificacaoTab = () => (
        <div className="tab-pane-qualif">
            <div className="qualif-grid">
                <div className="qualif-card">
                    <div className="card-header"><Trophy size={20} weight="duotone" /> <h4>Camada 1: BANT (ISP)</h4></div>
                    <div className="bant-form">
                        <div className="q-field">
                            <label>Budget (Quanto paga hoje?)</label>
                            <input
                                type="number"
                                defaultValue={lead.valorPagoAtual || 0}
                                onBlur={(e) => handleInlineEdit('valorPagoAtual', Number(e.target.value))}
                            />
                        </div>
                        <div className="q-field">
                            <label>Authority (É o decisor?)</label>
                            <select
                                value={lead.decisorIdentificado ? 'SIM' : 'NAO'}
                                onChange={(e) => handleInlineEdit('decisorIdentificado', e.target.value === 'SIM')}
                            >
                                <option value="SIM">Sim, proprietário</option>
                                <option value="NAO">Não, depende de outro</option>
                            </select>
                        </div>
                        <div className="q-field">
                            <label>Need (Velocidade/Plano)</label>
                            <input
                                type="text"
                                defaultValue={lead.interessePlano || ''}
                                onBlur={(e) => handleInlineEdit('interessePlano', e.target.value)}
                                placeholder="Ex: 500MB Fibra"
                            />
                        </div>
                        <div className="q-field">
                            <label>Timeline (Quando quer?)</label>
                            <select
                                value={qualifData.timeline}
                                onChange={e => setQualifData({ ...qualifData, timeline: e.target.value })}
                            >
                                <option value="IMEDIATO">Imediato</option>
                                <option value="15DIAS">Próximos 15 dias</option>
                                <option value="PESQUISA">Apenas pesquisando</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="qualif-card">
                    <div className="card-header"><Smiley size={20} weight="duotone" /> <h4>Perfil & Score</h4></div>
                    <div className="score-widget">
                        <div className="score-circle">
                            <svg viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray={`${lead.scoreQualificacao || 0}, 100`} />
                            </svg>
                            <div className="score-text">{lead.scoreQualificacao || 0}<span>pts</span></div>
                        </div>
                        <div className="score-label">
                            <strong>{lead.scoreQualificacao > 70 ? 'Lead Quente' : 'Em Nutrição'}</strong>
                            <span>{lead.scoreQualificacao > 70 ? 'Alta probabilidade' : 'Ainda frio'}</span>
                        </div>
                    </div>
                    <div className="profile-details">
                        <div className="q-field">
                            <label>Perfil de Uso</label>
                            <select
                                value={lead.perfilUso || 'RESIDENCIAL_BASICO'}
                                onChange={(e) => handleInlineEdit('perfilUso', e.target.value)}
                            >
                                <option value="RESIDENCIAL_BASICO">Residencial Básico</option>
                                <option value="RESIDENCIAL_PREMIUM">Residencial Premium (Gamer)</option>
                                <option value="EMPRESARIAL_PEQUENO">Empresarial Pequeno</option>
                            </select>
                        </div>
                        <div className="q-field">
                            <label>Nº Dispositivos</label>
                            <input
                                type="number"
                                defaultValue={lead.numDispositivos || 1}
                                onBlur={(e) => handleInlineEdit('numDispositivos', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderViabilityTab = () => (
        <div className="tab-pane-viability">
            <div className="viab-grid">
                <div className="viab-info">
                    <div className="viab-card">
                        <div className="v-header">
                            <HardDrives size={24} weight="duotone" />
                            <div>
                                <strong>Infraestrutura Técnica</strong>
                                <span>{lead.statusViabilidade === 'VIAVEL' ? `Verificado em ${lead.dataVerificacao || 'hoje'}` : 'Aguardando vistoria técnica'}</span>
                            </div>
                        </div>
                        <div className="v-details">
                            <div className="v-stat">
                                <small>Status Atual</small>
                                <select
                                    className="v-select"
                                    value={lead.statusViabilidade}
                                    onChange={(e) => handleInlineEdit('statusViabilidade', e.target.value)}
                                    style={{ background: '#080a0f', border: 'none', color: '#fff', fontWeight: 800, padding: '4px 0', fontSize: '0.9rem', outline: 'none' }}
                                >
                                    <option value="PENDENTE">Pendente</option>
                                    <option value="VIAVEL">Viável</option>
                                    <option value="INVIAVEL">Inviável</option>
                                    <option value="EM_ANALISE">Em Análise</option>
                                    <option value="ESPECIAL">Especial</option>
                                </select>
                            </div>
                            <div className="v-stat">
                                <small>Caixa (CTO)</small>
                                <input
                                    type="text"
                                    defaultValue={lead.ctoProxima || ''}
                                    onBlur={(e) => handleInlineEdit('ctoProxima', e.target.value)}
                                    placeholder="CTO-XXX"
                                    style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 800, width: '100%', outline: 'none' }}
                                />
                            </div>
                            <div className="v-stat">
                                <small>Portas Livres</small>
                                <input
                                    type="number"
                                    defaultValue={lead.portasDisponiveis || 0}
                                    onBlur={(e) => handleInlineEdit('portasDisponiveis', Number(e.target.value))}
                                    style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 800, width: '100%', outline: 'none' }}
                                />
                            </div>
                            <div className="v-stat">
                                <small>Distância (m)</small>
                                <input
                                    type="number"
                                    defaultValue={lead.distanciaDistribuidor || 0}
                                    onBlur={(e) => handleInlineEdit('distanciaDistribuidor', Number(e.target.value))}
                                    style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 800, width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="v-obs" style={{ marginTop: '1.5rem' }}>
                            <label style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Observações da Engenharia</label>
                            <textarea
                                defaultValue={lead.obsTecnica || ''}
                                onBlur={(e) => handleInlineEdit('obsTecnica', e.target.value)}
                                placeholder="Notas técnicas..."
                                style={{ width: '100%', background: '#080a0f', border: '1px solid #1e2430', borderRadius: '8px', padding: '10px', color: '#94a3b8', fontSize: '0.85rem', minHeight: '80px', resize: 'none' }}
                            ></textarea>
                        </div>
                        <button className="btn-save-viab" onClick={() => { showToast('CPO Atualizada no sistema central', 'success'); registerInteraction('SYS', 'CPO e Viabilidade confirmados via CRM'); }}>
                            <CheckCircle size={20} weight="bold" /> Salvar e Atualizar CPO
                        </button>
                    </div>
                </div>
                <div className="viab-map-view">
                    <MapContainer center={[lead.latitude || -23.5505, lead.longitude || -46.6333]} zoom={18} scrollWheelZoom={false} style={{ height: '100%', borderRadius: '16px' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lead.latitude || -23.5505, lead.longitude || -46.6333]}>
                            <Popup>{lead.nomeCompleto}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );
    const renderPropostaTab = () => (
        <div className="tab-pane-proposta">
            <div className="proposta-grid">
                <div className="prop-form">
                    <section className="prop-section">
                        <h4>Detalhamento da Oferta</h4>
                        <div className="p-grid">
                            <div className="p-item">
                                <label>Plano Selecionado</label>
                                <strong>500 MB Fibra Ultra</strong>
                            </div>
                            <div className="p-item">
                                <label>Valor Mensal</label>
                                <strong className="price">R$ 99,90</strong>
                            </div>
                            <div className="p-item">
                                <label>Taxa de Instalação</label>
                                <span>R$ 0,00 (Isento)</span>
                            </div>
                            <div className="p-item">
                                <label>Fidelidade</label>
                                <span>12 meses</span>
                            </div>
                        </div>
                    </section>

                    <section className="prop-section">
                        <h4>Status do Contrato</h4>
                        <div className="contract-status-box">
                            <div className="c-info">
                                <div className="c-badge visualizada">Visualizada</div>
                                <span>O lead abriu a proposta às 10:45 de hoje</span>
                            </div>
                            <button className="btn-resend" onClick={() => dispatchWhatsApp(lead.telefonePrincipal, `Olá ${lead.nomeCompleto.split(' ')[0]}, segue o link da nossa proposta: \n\nhttps://jmnet.com.br/proposta/${lead.id}`, lead.id)}><EnvelopeSimple size={18} /> Reenviar no WhatsApp</button>
                        </div>
                    </section>
                </div>

                <div className="prop-visualizer">
                    <div className="pdf-mock">
                        <FileText size={48} weight="duotone" />
                        <span>Visualização da Proposta #4482</span>
                        <button className="btn-view-pdf" onClick={() => { showToast('Renderizando PDF...', 'info'); setTimeout(() => registerInteraction('SYS', 'PDF de Proposta visualizado e baixado'), 1000) }}>Abrir em nova aba <ArrowSquareOut /></button>
                    </div>
                </div>
            </div>
        </div >
    );


    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="lead-detail-titan"
            >
                {renderHeader()}

                <div className="detail-layout">
                    <main className="detail-tabs-area ic-sidebar-scroll">
                        <nav className="tab-menu">
                            <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}><Clock size={18} /> Timeline</button>
                            <button className={activeTab === 'dados' ? 'active' : ''} onClick={() => setActiveTab('dados')}><AddressBook size={18} /> Dados Cadastrais</button>
                            <button className={activeTab === 'qualificacao' ? 'active' : ''} onClick={() => setActiveTab('qualificacao')}><IdentificationBadge size={18} /> Qualificação</button>
                            <button className={activeTab === 'viabilidade' ? 'active' : ''} onClick={() => setActiveTab('viabilidade')}><HardDrives size={18} /> Viabilidade</button>
                            <button className={activeTab === 'proposta' ? 'active' : ''} onClick={() => setActiveTab('proposta')}><Receipt size={18} /> Proposta & Contrato</button>
                            <button className={activeTab === 'agendamento' ? 'active' : ''} onClick={() => setActiveTab('agendamento')}><Calendar size={18} /> Agendamento</button>
                        </nav>

                        <div className="tab-viewport">
                            {activeTab === 'timeline' && (
                                <div className="timeline-view">
                                    <div className="timeline-filters">
                                        <button className={timelineFilter === 'ALL' ? 'active' : ''} onClick={() => setTimelineFilter('ALL')}>Tudo</button>
                                        <button className={timelineFilter === 'CALL' ? 'active' : ''} onClick={() => setTimelineFilter('CALL')}>Ligações</button>
                                        <button className={timelineFilter === 'WA' ? 'active' : ''} onClick={() => setTimelineFilter('WA')}>WhatsApp</button>
                                        <button className={timelineFilter === 'SYS' ? 'active' : ''} onClick={() => setTimelineFilter('SYS')}>Sistema</button>
                                    </div>
                                    <div className="timeline-list">
                                        {historyLogs.filter(h => timelineFilter === 'ALL' || h.type === timelineFilter || (h.type === 'STAGE_CHANGE' && timelineFilter === 'SYS')).length === 0 && (
                                            <div className="empty-state">Nenhum evento registrado.</div>
                                        )}
                                        {historyLogs.filter(h => timelineFilter === 'ALL' || h.type === timelineFilter || (h.type === 'STAGE_CHANGE' && timelineFilter === 'SYS')).map(event => (
                                            <div className="timeline-item" key={event.id || Math.random()}>
                                                <div className={`t-icon ${event.type === 'CALL' ? 'call' : event.type === 'WA' ? 'wa' : 'sys'}`}>
                                                    {event.type === 'CALL' ? <PhoneCall /> : event.type === 'WA' ? <WhatsappLogo /> : <ArrowsClockwise />}
                                                </div>
                                                <div className="t-content">
                                                    <div className="t-header">
                                                        <strong>{event.metadata?.action || (event.type === 'CALL' ? 'Ligação Efetuada' : 'Ação de Sistema')}</strong>
                                                        <span>{new Date(event.dataEvento).toLocaleDateString()} {new Date(event.dataEvento).toLocaleTimeString().slice(0, 5)}</span>
                                                    </div>
                                                    <p>{event.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'dados' && (
                                <div className="tab-pane-dados">
                                    <section className="dados-section">
                                        <h4>Identidade</h4>
                                        <div className="inline-grid">
                                            <div className="i-group">
                                                <label>Nome Completo</label>
                                                <div className="i-val" onClick={() => setIsEditing('nomeCompleto')}>
                                                    {isEditing === 'nomeCompleto' ? <input autoFocus onBlur={(e) => handleInlineEdit('nomeCompleto', e.target.value)} defaultValue={lead.nomeCompleto} /> : <span className="val-content"><span className="val-text">{lead.nomeCompleto}</span> <Pen size={12} className="v-icon" /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>E-mail</label>
                                                <div className="i-val" onClick={() => setIsEditing('email')}>
                                                    {isEditing === 'email' ? <input autoFocus onBlur={(e) => handleInlineEdit('email', e.target.value)} defaultValue={lead.email} /> : <span className="val-content"><span className="val-text">{lead.email || 'Não informado'}</span> <Pen size={12} className="v-icon" /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>CPF/CNPJ</label>
                                                <div className="i-val" onClick={() => setIsEditing('cpfCnpj')}>
                                                    {isEditing === 'cpfCnpj' ? <input autoFocus onBlur={(e) => handleInlineEdit('cpfCnpj', e.target.value)} defaultValue={lead.cpfCnpj} /> : <span className="val-content"><span className="val-text">{lead.cpfCnpj || 'Adicionar doc'}</span> <Pen size={12} className="v-icon" /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>Data Nasc.</label>
                                                <div className="i-val">
                                                    <span className="val-content"><span className="val-text">{lead.dataNascimento ? new Date(lead.dataNascimento).toLocaleDateString() : '---'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="dados-section">
                                        <h4>Endereço de Instalação</h4>
                                        <div className="inline-grid">
                                            <div className="i-group full">
                                                <label>Logradouro</label>
                                                <div className="i-val" onClick={() => setIsEditing('logradouro')}>
                                                    {isEditing === 'logradouro' ? <input autoFocus onBlur={(e) => handleInlineEdit('logradouro', e.target.value)} defaultValue={lead.logradouro} /> : <span className="val-content"><span className="val-text">{lead.logradouro || 'Definir rua'}</span> <Pen size={12} className="v-icon" /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>Número</label>
                                                <div className="i-val"><span className="val-content"><span className="val-text">{lead.numero || 'S/N'}</span></span></div>
                                            </div>
                                            <div className="i-group">
                                                <label>Bairro</label>
                                                <div className="i-val"><span className="val-content"><span className="val-text">{lead.bairro || 'Centro'}</span></span></div>
                                            </div>
                                            <div className="i-group">
                                                <label>CEP</label>
                                                <div className="i-val"><span className="val-content"><span className="val-text">{lead.cep || '00000-000'}</span></span></div>
                                            </div>
                                            <div className="i-group full">
                                                <label>Ponto de Referência</label>
                                                <div className="i-val" onClick={() => setIsEditing('pontoReferencia')}>
                                                    {isEditing === 'pontoReferencia' ? <input autoFocus onBlur={(e) => handleInlineEdit('pontoReferencia', e.target.value)} defaultValue={lead.pontoReferencia} /> : <span className="val-content"><span className="val-text">{lead.pontoReferencia || 'Ex: Próximo ao mercado'}</span> <Pen size={12} className="v-icon" /></span>}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'qualificacao' && renderQualificacaoTab()}
                            {activeTab === 'viabilidade' && renderViabilityTab()}
                            {activeTab === 'proposta' && renderPropostaTab()}

                            {activeTab === 'agendamento' && (
                                <div className="tab-pane-agendamento">
                                    {relatedAppts.length > 0 ? (
                                        <div className="appt-cards-list">
                                            {relatedAppts.map(appt => (
                                                <div className="appt-card-v2" key={appt.id}>
                                                    <div className="a-status-icon"><Wrench size={24} weight="duotone" /></div>
                                                    <div className="a-main">
                                                        <div className="a-header">
                                                            <strong>{appt.tipo}</strong>
                                                            <span className={`a-status ${appt.status.toLowerCase()}`}>{appt.status}</span>
                                                        </div>
                                                        <div className="a-details">
                                                            <span><Calendar size={14} /> {new Date(appt.dataInicio).toLocaleDateString()}</span>
                                                            <span><Clock size={14} /> {new Date(appt.dataInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span><User size={14} /> Técnico: {appt.tecnicoId || 'Pendente'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <CalendarPlus size={64} weight="duotone" />
                                            <h3>Sem Instalações Agendadas</h3>
                                            <p>Ainda não há Ordens de Serviço vinculadas a este lead.</p>
                                            <button className="btn-primary">Criar Agendamento</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                    {renderSidebar()}
                </div>

                {showTransferModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <header className="modal-header">
                                <div>
                                    <h2>Transferir Responsável</h2>
                                    <p>Rotear lead para outro Vendedor/Área</p>
                                </div>
                                <button className="btn-close" onClick={() => setShowTransferModal(false)}><X size={20} /></button>
                            </header>
                            <div className="modal-body">
                                <div className="form-group full">
                                    <label>Novo Responsável</label>
                                    <select value={newVendedorId} onChange={e => setNewVendedorId(e.target.value)} style={{ padding: '10px', background: '#080a0f', color: '#fff', border: '1px solid #1e2430', borderRadius: '8px', width: '100%', outline: 'none' }}>
                                        <option value="">Selecione na equipe...</option>
                                        <option value="VD-101">Mariana (Comercial)</option>
                                        <option value="VD-102">Roberto (Retenção)</option>
                                        <option value="AG-01">Vendas BO T (IA)</option>
                                    </select>
                                </div>
                            </div>
                            <footer className="modal-footer" style={{ borderTop: 'none', padding: '1.5rem 2rem' }}>
                                <button type="button" className="btn-cancel" onClick={() => setShowTransferModal(false)}>Cancelar</button>
                                <button type="button" className="btn-submit" onClick={handleTransfer}>Confirmar Rotação</button>
                            </footer>
                        </div>
                    </div>
                )}

                <style>{`
                    .lead-detail-titan { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        height: 100vh; 
                        background: #0f172a; /* Deep Matte Blue Base */
                        width: 100%; 
                        position: relative; 
                        overflow: hidden; 
                        font-family: 'Inter', sans-serif;
                    }
                    
                    /* Header - Titan Matte */
                    .fixed-header { 
                        background: #1e293b; 
                        border-bottom: 2px solid #334155; 
                        padding: 1.25rem 2.5rem; 
                        flex-shrink: 0; 
                    }
                    .header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                    .btn-back { background: none; border: none; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
                    .status-stepper { display: flex; align-items: center; gap: 10px; }
                    .step { display: flex; align-items: center; gap: 8px; color: #475569; position: relative; }
                    .step.active { color: #60a5fa; }
                    .step-point { width: 24px; height: 24px; border-radius: 4px; background: #334155; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.2s; }
                    .step.active .step-point { background: #60a5fa; color: #0f172a; box-shadow: none; /* Removed glow */ }
                    .step-line { width: 30px; height: 3px; background: #334155; border-radius: 2px; }
                    .step-line.active { background: #60a5fa; }
                    .step span { font-size: 0.75rem; font-weight: 700; }
                    
                    .header-controls { display: flex; gap: 12px; }
                    .btn-transfer { background: #334155; border: 1px solid #475569; color: #cbd5e1; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s; }
                    .btn-transfer:hover { background: #475569; }
                    .btn-advance { background: #2563eb; border: none; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: none; /* Removed glow */ text-transform: uppercase; letter-spacing: 0.05em; }
                    .btn-advance:hover { background: #1d4ed8; }

                    .lead-identity-bar { display: flex; justify-content: space-between; align-items: flex-end; }
                    .id-main { display: flex; align-items: center; gap: 20px; }
                    .id-avatar-lg { width: 64px; height: 64px; border-radius: 8px; background: #334155; color: #60a5fa; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; border: 2px solid #475569; }
                    .id-main h1 { font-size: 1.7rem; margin: 0 0 8px 0; color: #f8fafc; font-weight: 800; }
                    .id-badges { display: flex; gap: 12px; align-items: center; color: #94a3b8; font-size: 0.85rem; }
                    .id-badges span { display: flex; align-items: center; gap: 4px; }
                    .id-origin { background: #334155; color: #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; border: 1px solid #475569; }
                    
                    .vendedor-widget { display: flex; align-items: center; gap: 12px; background: #1e293b; padding: 8px 16px; border-radius: 8px; border: 1px solid #334155; }
                    .v-info span { display: block; font-size: 0.7rem; color: #94a3b8; }
                    .v-info strong { color: #f8fafc; font-size: 0.9rem; }
                    .vendedor-widget img { width: 36px; height: 36px; border-radius: 4px; border: 2px solid #334155; filter: grayscale(0.5); }

                    /* Layout Body - Titan Matte */
                    .detail-layout { display: grid; grid-template-columns: 1fr 340px; flex: 1; overflow: hidden; min-height: 0; background: #0f172a; }
                    .detail-tabs-area { overflow-y: auto; padding: 2rem 2.5rem; display: flex; flex-direction: column; scrollbar-width: thin; scrollbar-color: #334155 #0f172a; }
                    
                    .tab-menu { display: flex; gap: 1.5rem; border-bottom: 2px solid #1e293b; margin-bottom: 2rem; position: sticky; top: -2rem; background: #0f172a; z-index: 5; flex-shrink: 0; }
                    .tab-menu button { background: none; border: none; color: #64748b; padding: 1rem 0; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 3px solid transparent; transition: all 0.2s; }
                    .tab-menu button.active { color: #60a5fa; border-bottom-color: #60a5fa; }
                    
                    /* Sidebar - Titan Matte */
                    .fixed-sidebar { background: #1e293b; border-left: 2px solid #334155; padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #334155 #1e293b; }
                    .sidebar-section h3 { font-size: 0.75rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.15em; margin-bottom: 1rem; margin-top: 0; font-weight: 800; }
                    .task-card { background: #0f172a; border: 1px solid #334155; padding: 1rem; border-radius: 8px; }
                    .task-card.overdue { border-left: 4px solid #ef4444; }
                    
                    .quick-logs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
                    .quick-logs button { background: #334155; border: 1px solid #475569; color: #cbd5e1; padding: 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                    .quick-logs button:hover { background: #475569; }
                    
                    .manual-log textarea { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 10px; color: #f8fafc; font-size: 0.85rem; min-height: 80px; resize: none; margin-bottom: 8px; outline: none; }
                    .manual-log textarea:focus { border-color: #475569; }
                    .btn-save-note { width: 100%; padding: 10px; background: #334155; color: #60a5fa; border: 1px solid #475569; font-weight: 800; border-radius: 6px; cursor: pointer; text-transform: uppercase; font-size: 0.75rem; }

                    .sidebar-shortcuts { display: flex; justify-content: space-between; margin-top: auto; padding-top: 1rem; border-top: 1px solid #334155; }
                    .sidebar-shortcuts button { width: 44px; height: 44px; border-radius: 8px; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; filter: saturate(0.7); transition: filter 0.2s; }
                    .sidebar-shortcuts button:hover { filter: saturate(1); }
                    .sc-call { background: #059669; }
                    .sc-whatsapp { background: #16a34a; }
                    .sc-task { background: #2563eb; }

                    /* Tabs Content - Titan Matte */
                    .tab-viewport { flex: 1; min-height: 0; }
                    .dados-section { background: #1e293b; border-radius: 8px; padding: 1.5rem; border: 1px solid #334155; margin-bottom: 1.5rem; }
                    .dados-section h4 { color: #60a5fa; margin: 0 0 1.5rem 0; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }
                    .inline-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                    .i-group label { display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; }
                    .i-val { background: #0f172a; min-height: 40px; padding: 0 12px; border-radius: 6px; color: #f8fafc; cursor: pointer; display: flex; align-items: center; border: 1px solid #334155; }
                    .i-val input { background: none; border: none; color: #fff; width: 100%; outline: none; padding: 10px 0; }
                    
                    /* Viabilidade */
                    .tab-pane-viability { display: flex; flex-direction: column; gap: 1.5rem; height: 100%; }
                    .viab-grid { display: grid; grid-template-columns: 360px 1fr; gap: 1.5rem; height: 100%; min-height: 400px; }
                    .viab-info { display: flex; flex-direction: column; gap: 1.5rem; }
                    .viab-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 2rem; display: flex; flex-direction: column; box-shadow: none; }
                    .v-header { display: flex; gap: 16px; margin-bottom: 2rem; align-items: center; }
                    .v-header svg { color: #60a5fa; background: #334155; padding: 10px; border-radius: 6px; }
                    .v-header strong { display: block; font-size: 1.1rem; color: #f8fafc; margin-bottom: 4px; font-weight: 800; }
                    .v-header span { font-size: 0.8rem; color: #94a3b8; }
                    
                    .v-details { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
                    .v-stat { background: #0f172a; padding: 12px 16px; border-radius: 6px; border: 1px solid #334155; transition: border-color 0.2s; }
                    .v-stat:focus-within { border-color: #60a5fa; }
                    .v-stat small { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 4px; letter-spacing: 0.05em; }
                    .v-select, .v-stat input { background: transparent; border: none; color: #f8fafc; font-weight: 700; font-size: 0.95rem; width: 100%; outline: none; padding: 4px 0; }
                    
                    .v-obs label { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 10px; letter-spacing: 0.05em; }
                    .v-obs textarea { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 12px; color: #94a3b8; font-size: 0.9rem; min-height: 120px; resize: none; outline: none; transition: border-color 0.2s; }
                    .v-obs textarea:focus { border-color: #60a5fa; color: #f8fafc; }
                    
                    .viab-map-view { background: #1e293b; border: 4px solid #334155; border-radius: 8px; overflow: hidden; height: 100%; min-height: 400px; box-shadow: none; }
                    .btn-save-viab { margin-top: 1.5rem; background: #2563eb; color: #fff; border: none; padding: 14px; border-radius: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: none; text-transform: uppercase; }
                    .btn-save-viab:hover { background: #1d4ed8; }

                    /* Modals */
                    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
                    .modal-content { background: #1e293b; border: 2px solid #334155; border-radius: 8px; width: 90%; max-width: 450px; box-shadow: 20px 20px 0px rgba(0,0,0,0.1); }
                    .modal-header { padding: 1.5rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; }
                    .modal-header h2 { margin: 0; color: #f8fafc; font-size: 1.25rem; font-weight: 800; text-transform: uppercase; }
                    .modal-body { padding: 1.5rem; }
                    .modal-footer { padding: 1.25rem 1.5rem; background: #0f172a; display: flex; justify-content: flex-end; gap: 1rem; }
                    .form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; }
                    .btn-cancel { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700; }
                    .btn-submit { background: #2563eb; border: none; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: 800; cursor: pointer; text-transform: uppercase; }

                    .timeline-view { display: flex; flex-direction: column; height: 100%; }
                    .timeline-list { flex: 1; overflow-y: auto; padding-right: 10px; }
                    .timeline-item { display: flex; gap: 16px; margin-bottom: 1.5rem; }
                    .t-icon { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #334155; color: #94a3b8; border: 1px solid #475569; }
                    .t-icon.call { color: #f59e0b; }
                    .t-icon.wa { color: #22c55e; }
                    
                    .appt-card-v2 { background: #1e293b; border: 1px solid #334155; padding: 1.25rem; border-radius: 8px; display: flex; gap: 1rem; align-items: center; }
                    .a-status-icon { color: #60a5fa; background: #334155; padding: 12px; border-radius: 6px; }
                    .a-main { flex: 1; }
                    .a-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                    .a-status { font-size: 0.7rem; font-weight: 900; background: #334155; color: #60a5fa; padding: 2px 8px; border-radius: 4px; border: 1px solid #475569; }
                    
                    .empty-state { text-align: center; padding: 60px 0; color: #64748b; }
                    .empty-state h3 { color: #94a3b8; margin: 1.5rem 0 0.5rem; font-weight: 800; }
                    .btn-primary { background: #2563eb; border: none; color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: 800; margin-top: 1rem; cursor: pointer; text-transform: uppercase; }

                `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default LeadDetail;
