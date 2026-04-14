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

    const renderTimeline = () => (
        <div className="timeline-view">
            <div className="tab-nav-titan">
                <button className={timelineFilter === 'ALL' ? 'active' : ''} onClick={() => setTimelineFilter('ALL')}>TUDO</button>
                <button className={timelineFilter === 'CALL' ? 'active' : ''} onClick={() => setTimelineFilter('CALL')}>CHAMADAS</button>
                <button className={timelineFilter === 'WA' ? 'active' : ''} onClick={() => setTimelineFilter('WA')}>WHATSAPP</button>
                <button className={timelineFilter === 'SYS' ? 'active' : ''} onClick={() => setTimelineFilter('SYS')}>SISTEMA</button>
            </div>
            <div className="timeline-content ic-sidebar-scroll">
                <table className="timeline-table">
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Descrição / Conteúdo</th>
                            <th>Data/Hora</th>
                            <th>Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyLogs.filter(h => timelineFilter === 'ALL' || h.type === timelineFilter).length === 0 ? (
                            <tr><td colSpan={4} className="empty-titan">Sem registros para este filtro.</td></tr>
                        ) : historyLogs.filter(h => timelineFilter === 'ALL' || h.type === timelineFilter).map(event => (
                            <tr key={event.id} className="event-row">
                                <td style={{ width: '60px' }}>
                                    <div className={`type-icon ${(event.type as string).toLowerCase() === 'wa' ? 'wa' : (event.type as string).toLowerCase() === 'call' ? 'call' : 'sys'}`}>
                                        {(event.type as string) === 'CALL' ? <PhoneCall size={18} /> : (event.type as string) === 'WA' ? <WhatsappLogo size={18} /> : <ArrowsClockwise size={18} />}
                                    </div>
                                </td>
                                <td>
                                    <strong>{event.metadata?.action || event.metadados?.action || 'Atividade Geral'}</strong>
                                    <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.8rem' }}>{event.content || 'Nenhuma descrição detalhada.'}</p>
                                </td>
                                <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                    {new Date(event.dataEvento || event.data_evento || Date.now()).toLocaleDateString()} <br />
                                    {new Date(event.dataEvento || event.data_evento || Date.now()).toLocaleTimeString().slice(0, 5)}
                                </td>
                                <td style={{ fontSize: '0.75rem' }}>João Solla</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

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

                        <div className="tab-viewport">
                            {activeTab === 'timeline' && renderTimeline()}
                            {activeTab === 'dados' && renderDadosTab()}
                            {activeTab === 'viabilidade' && renderViabilityTab()}
                            {activeTab === 'qualificacao' && renderQualificacaoTab()}
                            {activeTab === 'proposta' && renderPropostaTab()}
                            {activeTab === 'agendamento' && (
                                <div className="empty-titan">
                                    <CalendarPlus size={48} />
                                    <h4>Gestão de Agendamentos</h4>
                                    <button className="btn-titan-primary" onClick={() => setShowApptModal(true)}>CRIAR NOVA ORDEM</button>
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
                    /* Global Titan Matte Styles */
                    .lead-detail-titan { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        height: 100vh; 
                        background: #0f172a; 
                        width: 100%; 
                        position: relative; 
                        overflow: hidden; 
                        font-family: 'Inter', sans-serif;
                        color: #f8fafc;
                    }

                    /* Scrollbar Matte Customization */
                    .ic-sidebar-scroll::-webkit-scrollbar { width: 6px; }
                    .ic-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                    .ic-sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                    .detail-tabs-area { scrollbar-width: thin; scrollbar-color: #334155 transparent; }

                    /* Header - Titan Motor View */
                    .fixed-header { 
                        background: #1e293b; 
                        border-bottom: 2px solid #334155; 
                        padding: 1rem 2.5rem; 
                        flex-shrink: 0; 
                        z-index: 10;
                    }
                    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                    .btn-back { background: #334155; border: 1px solid #475569; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; }
                    
                    .status-stepper { display: flex; align-items: center; gap: 8px; background: #0f172a; padding: 4px 16px; border-radius: 20px; border: 1px solid #334155; }
                    .step { display: flex; align-items: center; gap: 6px; color: #475569; }
                    .step.active { color: #60a5fa; }
                    .step-point { width: 18px; height: 18px; border-radius: 4px; background: #334155; font-size: 0.6rem; font-weight: 900; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                    .step.active .step-point { background: #2563eb; color: #fff; }
                    .step span { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
                    
                    .header-actions { display: flex; gap: 10px; }
                    .btn-titan-sm { background: #334155; color: #fff; border: 1px solid #475569; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
                    .btn-titan-sm:hover { background: #475569; }
                    .btn-titan-primary { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .btn-titan-primary:hover { background: #1d4ed8; transform: translateY(-1px); }

                    .lead-info-row { display: flex; align-items: center; gap: 20px; }
                    .avatar-titan { width: 50px; height: 50px; border-radius: 8px; background: #334155; color: #60a5fa; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 900; border: 2px solid #475569; }
                    .lead-meta h1 { font-size: 1.5rem; margin: 0; color: #fff; font-weight: 800; line-height: 1.2; }
                    .lead-badges-row { display: flex; gap: 10px; margin-top: 4px; }
                    .badge-titan { background: #0f172a; border: 1px solid #334155; color: #94a3b8; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }

                    /* Layout Body */
                    .detail-layout { display: grid; grid-template-columns: 1fr 320px; flex: 1; overflow: hidden; background: #0f172a; }
                    .detail-tabs-area { overflow-y: auto; padding: 1.5rem 2rem; }

                    /* Tab Menu - Matte Blue */
                    .tab-nav-titan { display: flex; gap: 1.5rem; border-bottom: 2px solid #1e293b; margin-bottom: 1.5rem; position: sticky; top: -1.5rem; background: #0f172a; z-index: 5; padding-top: 0.5rem; }
                    .tab-btn { background: none; border: none; color: #64748b; padding: 0.75rem 0; font-weight: 800; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 3px solid transparent; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
                    .tab-btn.active { color: #60a5fa; border-bottom-color: #60a5fa; }

                    /* Forms & Inputs - Titan Matte */
                    .titan-form-section { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
                    .titan-form-section h3 { font-size: 0.9rem; color: #60a5fa; text-transform: uppercase; margin-top: 0; margin-bottom: 1.5rem; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
                    .titan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                    .titan-field { display: flex; flex-direction: column; gap: 6px; }
                    .titan-field label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
                    .titan-input, .titan-select { background: #0f172a; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; }
                    .titan-input:focus, .titan-select:focus { border-color: #60a5fa; }
                    .titan-input:read-only { opacity: 0.7; cursor: not-allowed; }

                    /* Event Table (Timeline) */
                    .timeline-table { width: 100%; border-collapse: collapse; }
                    .timeline-table th { text-align: left; padding: 12px; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; border-bottom: 2px solid #334155; background: #1e293b; position: sticky; top: 0; }
                    .timeline-table td { padding: 14px 12px; font-size: 0.85rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
                    .event-row:hover { background: #1e293b50; }
                    .type-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #334155; color: #fff; }
                    .type-icon.wa { color: #22c55e; background: #22c55e15; }
                    .type-icon.call { color: #f59e0b; background: #f59e0b15; }
                    .type-icon.sys { color: #60a5fa; background: #60a5fa15; }

                    /* Sidebar - Action Center */
                    .sidebar-titan { background: #1e293b; border-left: 2px solid #334155; padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; overflow-y: auto; }
                    .action-card { background: #0f172a; border: 1px solid #334155; padding: 1.25rem; border-radius: 8px; }
                    .action-card h4 { font-size: 0.7rem; text-transform: uppercase; color: #64748b; margin: 0 0 1rem 0; letter-spacing: 1px; font-weight: 900; }
                    
                    .quick-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                    .btn-log { background: #334155; border: 1px solid #475569; color: #cbd5e1; padding: 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; cursor: pointer; text-transform: uppercase; transition: all 0.2s; }
                    .btn-log:hover { background: #475569; color: #fff; }

                    .note-area { margin-top: 1rem; position: relative; }
                    .note-area textarea { width: 100%; height: 100px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 10px; color: #fff; font-size: 0.8rem; resize: none; outline: none; transition: border-color 0.2s; }
                    .note-area textarea:focus { border-color: #60a5fa; }
                    .btn-save-note { margin-top: 8px; width: 100%; border: none; background: #2563eb; color: #fff; font-weight: 800; padding: 10px; border-radius: 6px; cursor: pointer; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }

                    .contact-grid { display: flex; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 1.5rem; border-top: 1px solid #334155; }
                    .c-btn { width: 50px; height: 50px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem; transition: transform 0.2s; filter: saturate(0.8); }
                    .c-btn:hover { transform: scale(1.05); filter: saturate(1); }
                    .c-btn.tel { background: #059669; }
                    .c-btn.wa { background: #16a34a; }
                    .c-btn.appt { background: #2563eb; }

                    /* Modal - Matte Command overlay */
                    .titan-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
                    .titan-modal { background: #1e293b; border: 2px solid #475569; width: 90%; max-width: 450px; border-radius: 8px; overflow: hidden; box-shadow: 20px 20px 0px rgba(0,0,0,0.2); }
                    .modal-title { background: #334155; padding: 1.25rem 1.5rem; border-bottom: 2px solid #475569; display: flex; justify-content: space-between; align-items: center; }
                    .modal-title h2 { margin: 0; font-size: 1rem; color: #fff; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
                    .modal-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                    .modal-actions { background: #0f172a; padding: 1.25rem 1.5rem; display: flex; justify-content: flex-end; gap: 12px; }

                    /* Map Widget */
                    .map-container-titan { background: #1e293b; border: 4px solid #334155; border-radius: 8px; height: 400px; position: relative; overflow: hidden; }

                    /* Empty States */
                    .empty-titan { text-align: center; padding: 4rem 1rem; opacity: 0.5; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                    .empty-titan h4 { margin: 0; font-size: 1rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; }


                `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default LeadDetail;
