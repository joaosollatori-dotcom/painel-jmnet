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
        loadLeadContext();
    }, [lead.id]);

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
            await updateLead(lead.id, { [field]: value });
            showToast('Informação sincronizada', 'success');
            onUpdate();
            setIsEditing(null);
            loadLeadContext();
        } catch (err) {
            showToast('Falha na sincronização', 'error');
        }
    };

    const handleActionLog = async (type: string, description: string) => {
        await logInteraction(lead.id, type, description, '');
        showToast('Atividade registrada', 'success');
        onUpdate();
        loadLeadContext();
    };

    const handleSaveQuickNote = async () => {
        if (!quickNote.trim()) return;
        if (await dispatchNote(lead.id, quickNote)) {
            showToast('Nota anexada à timeline', 'success');
            setQuickNote('');
            onUpdate();
            loadLeadContext();
        }
    };

    const handleAdvanceStage = async () => {
        showToast('Analisando pré-requisitos...', 'info');
        setTimeout(() => {
            handleActionLog('SYS', 'Avanço de etapa solicitado');
        }, 800);
    };

    const renderHeader = () => {
        const stages = ['Novo', 'Qualif', 'Viab', 'Prop', 'Assin', 'Instal'];
        const currentIdx = 2; // Logic can be expanded based on lead.status

        return (
            <header className="fixed-header">
                <div className="header-top">
                    <button onClick={onClose} className="btn-back"><ArrowLeft weight="bold" /> VOLTAR</button>
                    <div className="status-stepper">
                        {stages.map((s, idx) => (
                            <React.Fragment key={s}>
                                <div className={`step ${idx <= currentIdx ? 'active' : ''}`}>
                                    <div className="step-point">{idx + 1}</div>
                                    <span>{s}</span>
                                </div>
                                {idx < stages.length - 1 && <div className={`step-line ${idx < currentIdx ? 'active' : ''}`} style={{ width: '20px', height: '2px', background: idx < currentIdx ? '#2563eb' : '#334155' }} />}
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
                            <span className="badge-titan" style={{ color: '#60a5fa' }}><NavigationArrow size={12} weight="fill" /> {lead.canalEntrada}</span>
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
                    <div className="titan-field" style={{ gridColumn: 'span 2' }}>
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
                        <div className="titan-field" style={{ marginTop: '1.5rem' }}>
                            <label>Observações Técnicas</label>
                            <textarea className="titan-input" style={{ minHeight: '80px', resize: 'none' }} defaultValue={lead.obsTecnica || ''} onBlur={(e) => handleFieldUpdate('obsTecnica', e.target.value)} />
                        </div>
                        <button className="btn-titan-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => handleActionLog('SYS', 'CPO Validada')}>SALVAR E VALIDAR CPO</button>
                    </div>
                </div>
                <div className="map-container-titan">
                    <MapContainer center={[lead.latitude || -23.5505, lead.longitude || -46.6333]} zoom={18} style={{ height: '100%' }}>
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

            <div className="titan-form-section" style={{ background: '#1e293b' }}>
                <h3><Smiley size={20} /> Perfil do Lead</h3>
                <div className="titan-grid">
                    <div className="titan-field">
                        <label>Score Atual</label>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{lead.scoreQualificacao || 0} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>pts</span></div>
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
                        <strong style={{ color: '#fff' }}>500 MB FIBRA ULTRA</strong>
                    </div>
                    <div className="titan-field">
                        <label>Valor Mensal</label>
                        <strong style={{ color: '#60a5fa', fontSize: '1.2rem' }}>R$ 99,90</strong>
                    </div>
                    <div className="titan-field">
                        <label>Status Contrato</label>
                        <span className="badge-titan" style={{ background: '#16a34a20', color: '#16a34a', border: '1px solid #16a34a' }}>ENVIADO</span>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px' }}>
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

                        <div className="tab-viewport ic-sidebar-scroll" style={{ flex: 1, overflowY: 'auto' }}>
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

                <style>{`
                    .lead-detail-titan { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        height: 100vh; 
                        background: var(--bg-deep); 
                        width: 100%; 
                        position: relative; 
                        overflow: hidden; 
                        color: var(--text-primary);
                    }

                    .fixed-header { 
                        background: var(--bg-surface); 
                        border-bottom: 1px solid var(--border); 
                        padding: 1rem 2rem; 
                        flex-shrink: 0; 
                        z-index: 10;
                        backdrop-filter: var(--glass);
                    }
                    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                    .btn-back { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-weight: 700; cursor: pointer; font-size: 0.8rem; }
                    .btn-back:hover { color: var(--text-primary); }
                    
                    .status-stepper { display: flex; align-items: center; gap: 6px; background: var(--bg-surface-light); padding: 4px 12px; border-radius: 99px; border: 1px solid var(--border-light); }
                    .step { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); opacity: 0.6; }
                    .step.active { color: var(--accent); opacity: 1; }
                    .step-point { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); font-size: 0.6rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
                    .step.active .step-point { background: var(--accent); border-color: var(--accent); color: #fff; }
                    .step span { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
                    
                    .header-actions { display: flex; gap: 10px; }
                    .btn-titan-sm { background: var(--bg-surface-light); color: var(--text-primary); border: 1px solid var(--border-light); padding: 8px 14px; border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
                    .btn-titan-primary { background: var(--accent); color: #fff; padding: 8px 16px; border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 6px; text-transform: uppercase; box-shadow: 0 4px 15px var(--accent-soft); }

                    .lead-info-row { display: flex; align-items: center; gap: 16px; }
                    .avatar-titan { width: 48px; height: 48px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; border: 2px solid var(--accent); }
                    .lead-meta h1 { font-size: 1.6rem; margin: 0; color: var(--text-primary); font-weight: 700; }
                    .lead-badges-row { display: flex; gap: 8px; margin-top: 4px; }
                    .badge-titan { background: var(--bg-surface-light); border: 1px solid var(--border-light); color: var(--text-secondary); padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }

                    .detail-layout { display: grid; grid-template-columns: 1fr 340px; flex: 1; overflow: hidden; }
                    .detail-tabs-area { overflow-y: auto; display: flex; flex-direction: column; height: 100%; border-right: 1px solid var(--border); }

                    .tab-nav-titan { display: flex; gap: 1.5rem; padding: 0.5rem 2rem; border-bottom: 1px solid var(--border); background: var(--bg-surface); position: sticky; top: 0; z-index: 5; }
                    .tab-btn { background: none; border: none; color: var(--text-secondary); padding: 1rem 0; font-weight: 700; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 8px; }
                    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

                    .tab-viewport { flex: 1; padding: 2rem; }

                    /* Timeline Modern Feed */
                    .timeline-filters { margin-bottom: 2rem; justify-content: flex-start; background: var(--bg-surface-light); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 4px; gap: 4px; position: relative; top: 0; }
                    .timeline-filters button { flex: 1; padding: 8px 12px; border-radius: var(--radius-sm); border: none; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
                    .timeline-filters button.active { background: var(--bg-surface); color: var(--accent); box-shadow: var(--shadow); }

                    .timeline-feed { display: flex; flex-direction: column; gap: 0; }
                    .timeline-card { display: flex; gap: 20px; }
                    .card-icon-area { display: flex; flex-direction: column; align-items: center; width: 40px; }
                    .type-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--bg-surface-light); border: 1px solid var(--border); color: var(--text-secondary); z-index: 2; }
                    .type-icon.wa { color: #22c55e; border-color: #22c55e44; background: #22c55e11; }
                    .type-icon.call { color: #f59e0b; border-color: #f59e0b44; background: #f59e0b11; }
                    .type-icon.sys { color: var(--accent); border-color: var(--accent-soft); background: var(--accent-soft); }
                    .connector-line { width: 2px; flex: 1; background: var(--border); opacity: 0.5; margin: 4px 0; }
                    .timeline-card:last-child .connector-line { display: none; }

                    .card-content { flex: 1; padding-bottom: 2.5rem; }
                    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                    .event-action { font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
                    .event-time { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }
                    .card-body p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }
                    .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
                    .history-responsible { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
                    .resp-avatar { width: 20px; height: 20px; border-radius: 50%; background: var(--border); font-size: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                    .call-duration { font-size: 0.75rem; color: var(--accent); font-weight: 700; display: flex; align-items: center; gap: 4px; }

                    /* Sidebar Center */
                    .sidebar-titan { background: var(--bg-surface); padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; }
                    .sidebar-section h3 { font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 1rem; letter-spacing: 1px; }
                    
                    .action-card { background: var(--bg-surface-light); border: 1px solid var(--border-light); padding: 1rem; border-radius: var(--radius-lg); }
                    .quick-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                    .btn-log { background: var(--bg-surface); border: 1px solid var(--border); color: var(--text-secondary); padding: 10px; border-radius: var(--radius-md); font-size: 0.7rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }
                    .btn-log:hover { border-color: var(--accent); color: var(--accent); }

                    .note-area textarea { width: 100%; height: 120px; background: var(--bg-surface-light); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1rem; color: var(--text-primary); font-size: 0.9rem; resize: none; margin-top: 1rem; }
                    .btn-save-note { width: 100%; margin-top: 8px; background: var(--accent); color: white; padding: 12px; border-radius: var(--radius-md); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px var(--accent-soft); }

                    .contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-top: 1.5rem; border-top: 1px solid var(--border); }
                    .c-btn { height: 56px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
                    .c-btn.tel { background: #16a34a; }
                    .c-btn.wa { background: #25d366; }
                    .c-btn.appt { background: var(--accent); }

                    /* Generic Form Styles */
                    .titan-form-section { background: var(--bg-surface-light); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--border-light); }
                    .titan-form-section h3 { font-size: 1rem; color: var(--text-primary); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px; }
                    .titan-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
                    .titan-field { display: flex; flex-direction: column; gap: 8px; }
                    .titan-field label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
                    .titan-input, .titan-select { background: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary); padding: 12px; border-radius: var(--radius-md); font-size: 0.9rem; }
                    .titan-input:focus { border-color: var(--accent); }

                    /* Transitions */
                    .tab-viewport { animation: fadeIn 0.3s ease; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

                    @media (max-width: 1024px) {
                        .detail-layout { grid-template-columns: 1fr; }
                        .sidebar-titan { border-top: 1px solid var(--border); }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default LeadDetail;
