import React, { useState, useEffect } from 'react';
import {
    X, ArrowLeft, ArrowRight, User, MapPin,
    ClipboardText, HardDrives, ChatCircleText,
    FileText, Calendar, Plus, Phone, WhatsappLogo,
    DotsThreeVertical, CheckCircle, Warning, Clock,
    TrendUp, PaperPlaneRight, Pen, PencilSimple,
    CaretRight, MapTrifold, Info, DeviceMobile,
    AddressBook, IdentificationCard, IdentificationBadge,
    Briefcase, Buildings, Smiley, SkipForward, SkipBack,
    MagnifyingGlass, Timer, Checks, WarningCircle
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
        }
    };

    const renderHeader = () => (
        <header className="detail-header">
            <div className="header-top">
                <button onClick={onClose} className="btn-back">
                    <ArrowLeft size={20} weight="bold" />
                </button>
                <div className="lead-brief">
                    <h1>{lead.nomeCompleto}</h1>
                    <div className="lead-badges">
                        <span className={`badge-type ${lead.tipoPessoa.toLowerCase()}`}>{lead.tipoPessoa}</span>
                        <span className="badge-id">ID: {lead.id.slice(0, 8)}</span>
                        {lead.statusQualificacao === 'QUALIFICADO' && <span className="badge-verified"><CheckCircle size={14} weight="fill" /> QUALIFICADO</span>}
                    </div>
                </div>
                <div className="header-actions">
                    <div className="vendedor-select">
                        <img src={`https://ui-avatars.com/api/?name=${lead.indicador || 'Vendedor'}&background=random`} alt="Vendedor" />
                        <div className="vendedor-info">
                            <span>Vendedor Responsável</span>
                            <strong>{lead.indicador || 'Vendedor Titã'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );

    const renderSidePanel = () => {
        const activeAppt = relatedAppts.find(a => a.status === 'EM_ANDAMENTO');
        return (
            <aside className="detail-sidebar">
                {activeAppt && (
                    <div className="sidebar-card live-status">
                        <h3><Timer size={18} weight="duotone" /> Operação em Campo</h3>
                        <div className="live-appt-info">
                            <span className="live-pulse"></span>
                            <div>
                                <strong>{activeAppt.tipo}</strong>
                                <p>Técnico em execução no local</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="sidebar-card quick-log">
                    <h3>Registrar Contato</h3>
                    <div className="quick-actions-grid">
                        <button><Phone size={20} /> Liguei</button>
                        <button><WhatsappLogo size={20} /> WhatsApp</button>
                    </div>
                    <textarea placeholder="Relato da interação..."></textarea>
                    <button className="btn-save-log">Salvar Log</button>
                </div>

                <div className="sidebar-shortcuts">
                    <button className="shortcut call" title="Ligar"><Phone size={24} weight="fill" /></button>
                    <button className="shortcut wa" title="WhatsApp"><WhatsappLogo size={24} weight="fill" /></button>
                    <button className="shortcut move" title="Avançar Funil"><TrendUp size={24} weight="fill" /></button>
                </div>
            </aside>
        );
    };

    const renderViabilityTab = () => (
        <div className="tab-pane-viabilidade">
            <div className="viab-grid">
                <div className="viab-form">
                    <section className="viab-section">
                        <div className="section-header">
                            <HardDrives size={20} weight="duotone" />
                            <h4>Viabilidade Técnica (ISP)</h4>
                        </div>
                        <div className="infra-grid">
                            <div className="infra-item">
                                <label>CTO Selecionada</label>
                                <div className="infra-value">
                                    <strong>{lead.ctoProxima || 'Aguardando verificação'}</strong>
                                    {lead.statusViabilidade === 'APROVADA' && <span className="badge-distance">{lead.distanciaDistribuidor || 0}m</span>}
                                </div>
                            </div>
                            <div className="infra-item">
                                <label>Status Técnico</label>
                                <div className={`viab-status-display ${lead.statusViabilidade.toLowerCase()}`}>
                                    {lead.statusViabilidade === 'APROVADA' ? <Checks weight="bold" /> : <WarningCircle weight="bold" />}
                                    {lead.statusViabilidade}
                                </div>
                            </div>
                            <div className="infra-item full">
                                <label>Observação Técnica de Campo</label>
                                <p className="obs-text">{lead.obsTecnica || 'Nenhuma observação técnica registrada.'}</p>
                            </div>
                        </div>
                    </section>
                </div>
                <div className="viab-map">
                    <MapContainer center={[lead.latitude || -23.5505, lead.longitude || -46.6333]} zoom={17} style={{ height: '400px', width: '100%', borderRadius: '20px' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lead.latitude || -23.5505, lead.longitude || -46.6333]}><Popup>Local da Instalação</Popup></Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );

    const renderAgendamentoTab = () => (
        <div className="tab-pane-agendamento">
            {relatedAppts.length > 0 ? (
                <div className="appts-list">
                    {relatedAppts.map(appt => (
                        <div key={appt.id} className="appt-card-premium">
                            <div className="appt-header">
                                <div className="appt-type-badge">{appt.tipo}</div>
                                <div className={`appt-status ${appt.status.toLowerCase()}`}>{appt.status}</div>
                            </div>
                            <div className="appt-body">
                                <div className="appt-info-item">
                                    <Calendar size={20} />
                                    <div>
                                        <span>Data e Hora</span>
                                        <strong>{new Date(appt.dataInicio).toLocaleString()}</strong>
                                    </div>
                                </div>
                                <div className="appt-info-item">
                                    <User size={20} />
                                    <div>
                                        <span>Responsável Téc.</span>
                                        <strong>{appt.tecnicoId || 'Aguardando Escala'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-appts">
                    <CalendarPlus size={64} weight="duotone" />
                    <h3>Nenhum agendamento ativo</h3>
                    <p>O lead ainda não possui ordens de serviço ou visitas agendadas.</p>
                    <button className="btn-primary">Agendar Agora</button>
                </div>
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="lead-detail-wrapper"
        >
            {renderHeader()}
            <div className="detail-body ic-sidebar-scroll">
                <main className="detail-main">
                    <nav className="detail-tabs">
                        <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}><Clock size={18} /> Timeline</button>
                        <button className={activeTab === 'dados' ? 'active' : ''} onClick={() => setActiveTab('dados')}><AddressBook size={18} /> Cadastral</button>
                        <button className={activeTab === 'qualificacao' ? 'active' : ''} onClick={() => setActiveTab('qualificacao')}><IdentificationBadge size={18} /> Comercial</button>
                        <button className={activeTab === 'viabilidade' ? 'active' : ''} onClick={() => setActiveTab('viabilidade')}><HardDrives size={18} /> Técnico</button>
                        <button className={activeTab === 'agendamento' ? 'active' : ''} onClick={() => setActiveTab('agendamento')}><Calendar size={18} /> Agenda</button>
                    </nav>
                    <div className="tab-content">
                        {activeTab === 'viabilidade' && renderViabilityTab()}
                        {activeTab === 'agendamento' && renderAgendamentoTab()}
                        {/* Outras abas seguem o padrão Titan */}
                        {activeTab === 'dados' && (
                            <div className="tab-pane-dados">
                                <section className="data-card">
                                    <div className="card-header"><h4>Endereço de Instalação</h4></div>
                                    <div className="fields-grid">
                                        <div className="field-item full">
                                            <label>Logradouro</label>
                                            <div className="editable-value" onClick={() => setIsEditing('logradouro')}>
                                                {isEditing === 'logradouro' ? <input autoFocus onBlur={(e) => handleInlineEdit('logradouro', e.target.value)} defaultValue={lead.logradouro} /> : <span>{lead.logradouro || 'Definir Endereço'} <PencilSimple size={12} /></span>}
                                            </div>
                                        </div>
                                        <div className="field-item">
                                            <label>Bairro</label>
                                            <span>{lead.bairro || '---'}</span>
                                        </div>
                                        <div className="field-item">
                                            <label>Ponto de Referência</label>
                                            <div className="editable-value" onClick={() => setIsEditing('pontoReferencia')}>
                                                {isEditing === 'pontoReferencia' ? <input autoFocus onBlur={(e) => handleInlineEdit('pontoReferencia', e.target.value)} defaultValue={lead.pontoReferencia} /> : <span>{lead.pontoReferencia || 'Clique para adicionar'}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </main>
                {renderSidePanel()}
            </div>

            <style>{`
                .lead-detail-wrapper { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: #080a0f; z-index: 2000; display: flex; flex-direction: column; }
                .detail-header { background: #0c0f16; padding: 1.5rem 2.5rem; border-bottom: 1px solid #1e2430; }
                .header-top { display: flex; align-items: center; gap: 2rem; }
                .lead-brief h1 { color: #fff; margin: 0; font-size: 1.8rem; }
                .badge-type { background: #3b82f620; color: #3b82f6; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; }
                .detail-body { display: flex; flex: 1; overflow: hidden; }
                .detail-main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
                .detail-tabs { display: flex; gap: 2rem; padding: 0 2.5rem; border-bottom: 1px solid #1e2430; }
                .detail-tabs button { background: none; border: none; color: #475569; padding: 1.2rem 0; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; }
                .detail-tabs button.active { color: #3b82f6; border-bottom: 2px solid #3b82f6; }
                .tab-content { padding: 2.5rem; }
                .viab-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .viab-section { background: #11141d; border: 1px solid #1e2430; border-radius: 20px; padding: 1.5rem; }
                .viab-status-display { display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 12px; font-weight: 800; margin-top: 10px; }
                .viab-status-display.aprovada { background: #10b98120; color: #10b981; }
                .detail-sidebar { width: 340px; background: #0c0f16; border-left: 1px solid #1e2430; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .sidebar-card { background: #11141d; border: 1px solid #1e2430; border-radius: 16px; padding: 1.2rem; }
                .live-status { border: 1px solid #8b5cf660; background: #8b5cf60a; }
                .live-pulse { width: 10px; height: 10px; background: #8b5cf6; border-radius: 50%; display: inline-block; animation: pulse-titan 1.5s infinite; margin-right: 12px; }
                @keyframes pulse-titan { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
                .appt-card-premium { background: #11141d; border: 1px solid #1e2430; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; }
                .appt-type-badge { font-size: 10px; font-weight: 900; color: #3b82f6; }
                .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem; }
                .editable-value { color: #fff; cursor: pointer; }
                .editable-value input { background: #080a0f; border: 1px solid #3b82f6; color: #fff; width: 100%; border-radius: 4px; padding: 2px 6px; }
            `}</style>
        </motion.div>
    );
};

export default LeadDetail;
