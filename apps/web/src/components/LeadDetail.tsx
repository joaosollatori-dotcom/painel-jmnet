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
    CheckSquareOffset, Square, ListChecks, Kanban
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Lead, LeadHistory, updateLead, Appointment, getAppointments } from '../services/leadService';
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

    useEffect(() => {
        loadLeadContext();
    }, [lead.id]);

    const loadLeadContext = async () => {
        const appts = await getAppointments();
        setRelatedAppts(appts.filter(a => a.leadId === lead.id));
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

    const registerInteraction = (type: string, content: string) => {
        // Mock de registro de interação
        showToast(`Interação de ${type} registrada`, 'success');
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
                        <button className="btn-transfer"><UserSwitch size={20} /> Transferir</button>
                        <button className="btn-advance">Avançar Etapa <CaretRight weight="bold" /></button>
                    </div>
                </div>
                <div className="lead-identity-bar">
                    <div className="id-main">
                        <div className="id-avatar-lg">{lead.nomeCompleto.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                            <h1>{lead.nomeCompleto}</h1>
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
                        <button className="btn-done"><CheckSquareOffset size={20} /></button>
                        <button className="btn-reschedule"><ArrowsClockwise size={20} /></button>
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
                    <textarea placeholder="Anotação rápida..."></textarea>
                    <button className="btn-save-note">Salvar Nota</button>
                </div>
            </div>

            <div className="sidebar-shortcuts">
                <button className="sc-call"><Phone size={24} weight="fill" /></button>
                <button className="sc-whatsapp"><WhatsappLogo size={24} weight="fill" /></button>
                <button className="sc-task"><CalendarPlus size={24} weight="fill" /></button>
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
                            <input type="number" value={qualifData.budget} onChange={e => setQualifData({ ...qualifData, budget: Number(e.target.value) })} />
                        </div>
                        <div className="q-field">
                            <label>Authority (É o decisor?)</label>
                            <select value={qualifData.authority} onChange={e => setQualifData({ ...qualifData, authority: e.target.value })}>
                                <option value="SIM">Sim, proprietário</option>
                                <option value="NAO">Não, depende de outro</option>
                            </select>
                        </div>
                        <div className="q-field">
                            <label>Need (Velocidade/Plano)</label>
                            <input type="text" value={qualifData.need} onChange={e => setQualifData({ ...qualifData, need: e.target.value })} placeholder="Ex: 500MB Fibra" />
                        </div>
                        <div className="q-field">
                            <label>Timeline (Quando quer?)</label>
                            <select value={qualifData.timeline} onChange={e => setQualifData({ ...qualifData, timeline: e.target.value })}>
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
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="85, 100" />
                            </svg>
                            <div className="score-text">85<span>pts</span></div>
                        </div>
                        <div className="score-label">
                            <strong>Lead Quente</strong>
                            <span>Alta probabilidade de conversão</span>
                        </div>
                    </div>
                    <div className="profile-details">
                        <div className="q-field">
                            <label>Perfil de Uso</label>
                            <select value={qualifData.profile} onChange={e => setQualifData({ ...qualifData, profile: e.target.value as any })}>
                                <option value="RESIDENCIAL_BASICO">Residencial Básico</option>
                                <option value="RESIDENCIAL_PREMIUM">Residencial Premium (Gamer)</option>
                                <option value="EMPRESARIAL_PEQUENO">Empresarial Pequeno</option>
                            </select>
                        </div>
                        <div className="q-field">
                            <label>Nº Dispositivos</label>
                            <input type="number" value={qualifData.devices} onChange={e => setQualifData({ ...qualifData, devices: Number(e.target.value) })} />
                        </div>
                    </div>
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
                            <button className="btn-resend"><EnvelopeSimple size={18} /> Reenviar no WhatsApp</button>
                        </div>
                    </section>
                </div>

                <div className="prop-visualizer">
                    <div className="pdf-mock">
                        <FileText size={48} weight="duotone" />
                        <span>Visualização da Proposta #4482</span>
                        <button className="btn-view-pdf">Abrir em nova aba <ArrowSquareOut /></button>
                    </div>
                </div>
            </div>
        </div >
    );

    const renderViabilidadeTab = () => (
        <div className="tab-pane-viabilidade">
            <div className="viab-grid">
                <div className="viab-info">
                    <div className="viab-card active">
                        <div className="v-header">
                            <HardDrives size={24} weight="duotone" />
                            <div>
                                <strong>Viabilidade Confirmada</strong>
                                <span>Verificado por Técnico (Gabriel) em 12/04</span>
                            </div>
                        </div>
                        <div className="v-details">
                            <div className="v-stat">
                                <small>Caixa (CTO)</small>
                                <strong>CTO-CENTRO-04</strong>
                            </div>
                            <div className="v-stat">
                                <small>Portas Livres</small>
                                <strong>03</strong>
                            </div>
                            <div className="v-stat">
                                <small>Distância drop</small>
                                <strong>45 metros</strong>
                            </div>
                            <div className="v-stat">
                                <small>Tecnologia</small>
                                <strong>FTTH (Fibra)</strong>
                            </div>
                        </div>
                        <div className="v-obs">
                            <label>Observação Técnica:</label>
                            <p>Instalação padrão via poste frontal. Sem impedimentos. Necessário escada de 7 metros.</p>
                        </div>
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
                                        <button className="active">Tudo</button>
                                        <button>Ligações</button>
                                        <button>WhatsApp</button>
                                        <button>Sistema</button>
                                    </div>
                                    <div className="timeline-list">
                                        <div className="timeline-item">
                                            <div className="t-icon sys"><ArrowsClockwise /></div>
                                            <div className="t-content">
                                                <div className="t-header"><strong>Alteração de Etapa</strong> <span>Há 2 horas</span></div>
                                                <p>Lead movido para <strong>Qualificação</strong> por João Solla.</p>
                                            </div>
                                        </div>
                                        <div className="timeline-item">
                                            <div className="t-icon call"><PhoneCall /></div>
                                            <div className="t-content">
                                                <div className="t-header"><strong>Ligação Efetuada</strong> <span>Há 5 horas</span></div>
                                                <p>Resultado: <strong>Ocupado</strong>. Tentativa nº 2.</p>
                                            </div>
                                        </div>
                                        <div className="timeline-item">
                                            <div className="t-icon wa"><WhatsappLogo /></div>
                                            <div className="t-content">
                                                <div className="t-header"><strong>Mensagem Enviada</strong> <span>Ontem às 18:00</span></div>
                                                <p>"Olá {lead.nomeCompleto.split(' ')[0]}, vi seu interesse no plano de 500MB..."</p>
                                            </div>
                                        </div>
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
                                                    {isEditing === 'nomeCompleto' ? <input autoFocus onBlur={(e) => handleInlineEdit('nomeCompleto', e.target.value)} defaultValue={lead.nomeCompleto} /> : <span>{lead.nomeCompleto} <Pen size={12} /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>E-mail</label>
                                                <div className="i-val" onClick={() => setIsEditing('email')}>
                                                    {isEditing === 'email' ? <input autoFocus onBlur={(e) => handleInlineEdit('email', e.target.value)} defaultValue={lead.email} /> : <span>{lead.email || 'Não informado'} <Pen size={12} /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>CPF/CNPJ</label>
                                                <div className="i-val" onClick={() => setIsEditing('cpfCnpj')}>
                                                    {isEditing === 'cpfCnpj' ? <input autoFocus onBlur={(e) => handleInlineEdit('cpfCnpj', e.target.value)} defaultValue={lead.cpfCnpj} /> : <span>{lead.cpfCnpj || 'Adicionar documento'} <Pen size={12} /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>Data Nasc.</label>
                                                <span>{lead.dataNascimento ? new Date(lead.dataNascimento).toLocaleDateString() : '---'}</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="dados-section">
                                        <h4>Endereço de Instalação</h4>
                                        <div className="inline-grid">
                                            <div className="i-group full">
                                                <label>Logradouro</label>
                                                <div className="i-val" onClick={() => setIsEditing('logradouro')}>
                                                    {isEditing === 'logradouro' ? <input autoFocus onBlur={(e) => handleInlineEdit('logradouro', e.target.value)} defaultValue={lead.logradouro} /> : <span>{lead.logradouro || 'Definir rua'} <Pen size={12} /></span>}
                                                </div>
                                            </div>
                                            <div className="i-group">
                                                <label>Número</label><span>{lead.numero || 'S/N'}</span>
                                            </div>
                                            <div className="i-group">
                                                <label>Bairro</label><span>{lead.bairro || 'Centro'}</span>
                                            </div>
                                            <div className="i-group">
                                                <label>CEP</label><span>{lead.cep || '00000-000'}</span>
                                            </div>
                                            <div className="i-group">
                                                <label>Ponto de Referência</label>
                                                <div className="i-val" onClick={() => setIsEditing('pontoReferencia')}>
                                                    {isEditing === 'pontoReferencia' ? <input autoFocus onBlur={(e) => handleInlineEdit('pontoReferencia', e.target.value)} defaultValue={lead.pontoReferencia} /> : <span>{lead.pontoReferencia || 'Ex: Próximo ao mercado'} <Pen size={12} /></span>}
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

                <style>{`
                    .lead-detail-titan { position: fixed; inset: 0; background: #080a0f; z-index: 2000; display: flex; flex-direction: column; overflow: hidden; }
                    
                    /* Header */
                    .fixed-header { background: #0c0f16; border-bottom: 1px solid #1e2430; padding: 1.25rem 2.5rem; }
                    .header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                    .btn-back { background: none; border: none; color: #64748b; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
                    .status-stepper { display: flex; align-items: center; gap: 10px; }
                    .step { display: flex; align-items: center; gap: 8px; color: #475569; position: relative; }
                    .step.active { color: #3b82f6; }
                    .step-point { width: 24px; height: 24px; border-radius: 50%; background: #1e2430; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
                    .step.active .step-point { background: #3b82f6; color: #fff; box-shadow: 0 0 15px #3b82f640; }
                    .step-line { width: 30px; height: 2px; background: #1e2430; }
                    .step-line.active { background: #3b82f6; }
                    .step span { font-size: 0.75rem; font-weight: 700; }
                    
                    .header-controls { display: flex; gap: 12px; }
                    .btn-transfer { background: #1e2430; border: 1px solid #334155; color: #94a3b8; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; }
                    .btn-advance { background: #3b82f6; border: none; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px #3b82f630; }

                    .lead-identity-bar { display: flex; justify-content: space-between; align-items: flex-end; }
                    .id-main { display: flex; align-items: center; gap: 20px; }
                    .id-avatar-lg { width: 64px; height: 64px; border-radius: 16px; background: #3b82f620; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; }
                    .id-main h1 { font-size: 1.7rem; margin: 0 0 8px 0; color: #fff; font-weight: 800; }
                    .id-badges { display: flex; gap: 12px; align-items: center; color: #64748b; font-size: 0.85rem; }
                    .id-badges span { display: flex; align-items: center; gap: 4px; }
                    .id-origin { background: #1e293b; color: #cbd5e1; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
                    
                    .vendedor-widget { display: flex; align-items: center; gap: 12px; background: #161b22; padding: 8px 16px; border-radius: 12px; border: 1px solid #30363d; }
                    .v-info span { display: block; font-size: 0.7rem; color: #8b949e; }
                    .v-info strong { color: #f0f6fc; font-size: 0.9rem; }
                    .vendedor-widget img { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #3b82f6; }

                    /* Layout Body */
                    .detail-layout { display: grid; grid-template-columns: 1fr 340px; flex: 1; overflow: hidden; }
                    .detail-tabs-area { overflow-y: auto; padding: 2rem 2.5rem; }
                    
                    .tab-menu { display: flex; gap: 1.5rem; border-bottom: 1px solid #1e2430; margin-bottom: 2rem; position: sticky; top: -2rem; background: #080a0f; z-index: 5; }
                    .tab-menu button { background: none; border: none; color: #64748b; padding: 1rem 0; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid transparent; transition: all 0.2s; }
                    .tab-menu button.active { color: #3b82f6; border-bottom-color: #3b82f6; }
                    .tab-menu button:hover:not(.active) { color: #94a3b8; }

                    /* Sidebar */
                    .fixed-sidebar { background: #0c0f16; border-left: 1px solid #1e2430; padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; overflow-y: auto; }
                    .sidebar-section h3 { font-size: 0.75rem; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1rem; }
                    .task-card { background: #11141d; border: 1px solid #1e2430; padding: 1rem; border-radius: 12px; }
                    .task-card.overdue { border-left: 4px solid #ef4444; }
                    .task-info strong { display: block; font-size: 0.85rem; color: #f8fafc; margin-bottom: 4px; }
                    .task-info span { font-size: 0.75rem; color: #ef4444; font-weight: 700; }
                    .task-actions { display: flex; gap: 8px; margin-top: 12px; }
                    .task-actions button { flex: 1; height: 32px; background: #1e2430; border: none; color: #94a3b8; border-radius: 6px; cursor: pointer; }
                    .btn-done:hover { background: #10b98120; color: #10b981; }
                    
                    .quick-logs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
                    .quick-logs button { background: #1e2430; border: 1px solid #334155; color: #94a3b8; padding: 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                    .quick-logs button:hover { background: #3b82f610; border-color: #3b82f6; color: #3b82f6; }
                    
                    .manual-log textarea { width: 100%; background: #080a0f; border: 1px solid #1e2430; border-radius: 8px; padding: 10px; color: #fff; font-size: 0.85rem; min-height: 80px; resize: none; margin-bottom: 8px; }
                    .btn-save-note { width: 100%; padding: 10px; background: #3b82f620; color: #3b82f6; border: none; font-weight: 700; border-radius: 8px; cursor: pointer; }

                    .sidebar-shortcuts { display: flex; justify-content: space-between; margin-top: auto; padding-top: 1rem; border-top: 1px solid #1e2430; }
                    .sidebar-shortcuts button { width: 50px; height: 50px; border-radius: 14px; border: none; cursor: pointer; color: #fff; transition: transform 0.2s; }
                    .sc-call { background: #10b981; box-shadow: 0 4px 15px #10b98130; }
                    .sc-whatsapp { background: #25d366; box-shadow: 0 4px 15px #25d36630; }
                    .sc-task { background: #3b82f6; box-shadow: 0 4px 15px #3b82f630; }
                    .sidebar-shortcuts button:hover { transform: translateY(-3px); }

                    /* Tabs Content */
                    .tab-viewport { min-height: 400px; }
                    .dados-section { background: #11141d; border-radius: 16px; padding: 1.5rem; border: 1px solid #1e2430; margin-bottom: 1.5rem; }
                    .dados-section h4 { color: #3b82f6; margin: 0 0 1.5rem 0; font-size: 0.95rem; }
                    .inline-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                    .inline-grid .full { grid-column: 1 / -1; }
                    .i-group label { display: block; font-size: 0.7rem; color: #475569; margin-bottom: 6px; text-transform: uppercase; font-weight: 800; }
                    .i-val { background: #080a0f; padding: 8px 12px; border-radius: 8px; color: #f8fafc; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border: 1px solid transparent; }
                    .i-val:hover { border-color: #3b82f640; }
                    .i-val input { background: none; border: none; color: #fff; width: 100%; outline: none; }
                    
                    /* Qualif */
                    .qualif-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; }
                    .qualif-card { background: #11141d; border: 1px solid #1e2430; border-radius: 16px; padding: 1.5rem; }
                    .card-header { display: flex; align-items: center; gap: 10px; color: #cbd5e1; margin-bottom: 1.5rem; }
                    .card-header h4 { margin: 0; font-size: 0.95rem; }
                    .bant-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                    .q-field label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 8px; }
                    .q-field input, .q-field select { width: 100%; background: #080a0f; border: 1px solid #1e2430; color: #fff; padding: 10px; border-radius: 8px; font-weight: 600; }
                    
                    .score-widget { display: flex; align-items: center; gap: 20px; background: #080a0f; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #3b82f620; }
                    .score-circle { width: 60px; height: 60px; position: relative; }
                    .score-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: #0ea5e9; }
                    .score-text span { font-size: 0.6rem; margin-top: -4px; }
                    .score-label strong { display: block; color: #10b981; }
                    .score-label span { font-size: 0.75rem; color: #475569; }

                    /* Proposta */
                    .prop-section { background: #11141d; border: 1px solid #1e2430; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
                    .prop-section h4 { margin: 0 0 1.25rem 0; color: #cbd5e1; font-size: 0.9rem; }
                    .p-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
                    .p-item label { display: block; font-size: 0.7rem; color: #475569; margin-bottom: 4px; }
                    .p-item strong { color: #f8fafc; font-size: 1.1rem; }
                    .p-item strong.price { color: #3b82f6; }
                    .contract-status-box { background: #080a0f; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
                    .c-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 4px; }
                    .c-badge.visualizada { background: #3b82f620; color: #3b82f6; }
                    .c-info span { display: block; font-size: 0.8rem; color: #64748b; }
                    .btn-resend { background: #3b82f620; border: none; color: #3b82f6; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }

                    /* Timeline */
                    .timeline-filters { display: flex; gap: 10px; margin-bottom: 2rem; }
                    .timeline-filters button { background: #11141d; border: 1px solid #1e2430; color: #64748b; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; }
                    .timeline-filters button.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
                    .timeline-list { display: flex; flex-direction: column; gap: 1.5rem; }
                    .timeline-item { display: flex; gap: 16px; }
                    .t-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                    .t-icon.sys { background: #1e293b; color: #cbd5e1; }
                    .t-icon.call { background: #f59e0b20; color: #f59e0b; }
                    .t-icon.wa { background: #25d36620; color: #25d366; }
                    .t-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
                    .t-header strong { color: #e2e8f0; font-size: 0.9rem; }
                    .t-header span { font-size: 0.75rem; color: #475569; }
                    .t-content p { margin: 0; font-size: 0.85rem; color: #94a3b8; line-height: 1.5; }

                    /* Viabilidade Grid */
                    .viab-grid { display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; height: 450px; }
                    .v-header { display: flex; gap: 12px; margin-bottom: 1.5rem; color: #3b82f6; }
                    .v-header strong { display: block; font-size: 1rem; color: #f8fafc; }
                    .v-details { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
                    .v-stat small { display: block; font-size: 0.7rem; color: #475569; text-transform: uppercase; }
                    .v-stat strong { font-size: 0.95rem; color: #f8fafc; }
                    .v-obs label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 6px; }
                    .v-obs p { font-size: 0.85rem; color: #94a3b8; line-height: 1.6; background: #080a0f; padding: 10px; border-radius: 8px; border: 1px solid #1e2430; }

                    .appt-card-v2 { background: #11141d; border: 1px solid #1e2430; padding: 1.25rem; border-radius: 16px; display: flex; gap: 1rem; align-items: center; }
                    .a-status-icon { color: #3b82f6; background: #3b82f610; padding: 12px; border-radius: 12px; }
                    .a-main { flex: 1; }
                    .a-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                    .a-status { font-size: 0.7rem; font-weight: 900; background: #3b82f620; color: #3b82f6; padding: 2px 8px; border-radius: 4px; }
                    .a-details { display: flex; gap: 12px; font-size: 0.75rem; color: #64748b; }
                    .a-details span { display: flex; align-items: center; gap: 4px; }
                    
                    .empty-state { text-align: center; padding: 60px 0; color: #475569; }
                    .empty-state h3 { color: #cbd5e1; margin: 1.5rem 0 0.5rem; }
                    .btn-primary { background: #3b82f6; border: none; color: #fff; padding: 12px 24px; border-radius: 10px; font-weight: 700; margin-top: 1rem; cursor: pointer; }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default LeadDetail;
