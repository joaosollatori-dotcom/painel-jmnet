import React, { useState } from 'react';
import {
    X, ArrowLeft, ArrowRight, User, MapPin,
    ClipboardText, HardDrives, ChatCircleText,
    FileText, Calendar, Plus, Phone, WhatsappLogo,
    DotsThreeVertical, CheckCircle, Warning, Clock,
    TrendUp, PaperPlaneRight, Pen, PencilSimple,
    CaretRight, MapTrifold, Info, DeviceMobile,
    AddressBook, IdentificationCard, IdentificationBadge,
    Briefcase, Buildings, Smiley, SkipForward, SkipBack,
    MagnifyingGlass
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Lead, LeadHistory, updateLead } from '../services/leadService';
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

    const funnelStages = ['Novo Lead', 'Qualificação', 'Viabilidade', 'Proposta', 'Agendamento', 'Fechamento'];
    const currentStageIndex = 2; // Mock

    const handleInlineEdit = async (field: keyof Lead, value: any) => {
        try {
            await updateLead(lead.id, { [field]: value });
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
                    </div>
                </div>
                <div className="header-actions">
                    <div className="stage-navigator">
                        <button className="btn-nav"><SkipBack size={18} /></button>
                        <div className="current-stage">
                            <span className="stage-label">Etapa Atual</span>
                            <span className="stage-name">Viabilidade Técnica</span>
                        </div>
                        <button className="btn-nav active"><SkipForward size={18} /></button>
                    </div>
                    <div className="vendedor-select">
                        <img src={`https://ui-avatars.com/api/?name=${lead.indicador || 'Vendedor'}&background=random`} alt="Vendedor" />
                        <div className="vendedor-info">
                            <span>Responsável</span>
                            <strong>João Sales</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div className="funnel-progress">
                {funnelStages.map((stage, idx) => (
                    <div key={stage} className={`progress-step ${idx <= currentStageIndex ? 'active' : ''} ${idx === currentStageIndex ? 'current' : ''}`}>
                        <div className="step-bar"></div>
                        <span className="step-label">{stage}</span>
                    </div>
                ))}
            </div>
        </header>
    );

    const renderSidePanel = () => (
        <aside className="detail-sidebar">
            <div className="sidebar-card next-task">
                <h3><Calendar size={18} weight="duotone" /> Próxima Tarefa</h3>
                <div className="task-content">
                    <div className="task-info">
                        <strong>Ligar para confirmar viabilidade</strong>
                        <span>Hoje, 14:30</span>
                    </div>
                    <div className="task-actions">
                        <button className="btn-task-done"><CheckCircle size={20} /></button>
                        <button className="btn-task-edit"><Clock size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="sidebar-card quick-log">
                <h3>Registrar Contato</h3>
                <div className="quick-actions-grid">
                    <button><Phone size={20} /> Liguei</button>
                    <button><WhatsappLogo size={20} /> WhatsApp</button>
                    <button><PaperPlaneRight size={20} /> E-mail</button>
                    <button><ClipboardText size={20} /> Nota</button>
                </div>
                <textarea placeholder="Resumo rápido da conversa..."></textarea>
                <button className="btn-save-log">Salvar Interação</button>
            </div>

            <div className="sidebar-card interaction-mini">
                <h3>Últimas Interações</h3>
                <div className="mini-timeline">
                    <div className="mini-item">
                        <div className="mini-icon call"><Phone size={12} weight="fill" /></div>
                        <div className="mini-text">
                            <strong>Ligação S/ Sucesso</strong>
                            <span>há 2 horas</span>
                        </div>
                    </div>
                    <div className="mini-item">
                        <div className="mini-icon stage"><TrendUp size={12} weight="fill" /></div>
                        <div className="mini-text">
                            <strong>Movido p/ Viabilidade</strong>
                            <span>ontem às 10:00</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sidebar-shortcuts">
                <button className="shortcut call" title="Ligar Agora"><Phone size={24} weight="fill" /></button>
                <button className="shortcut wa" title="Abrir WhatsApp"><WhatsappLogo size={24} weight="fill" /></button>
                <button className="shortcut plan" title="Agendar Tarefa"><Calendar size={24} weight="fill" /></button>
                <button
                    className={`shortcut move ${lead.statusQualificacao === 'QUALIFICADO' && lead.statusViabilidade === 'APROVADA' ? '' : 'locked'}`}
                    title="Avançar Etapa"
                    onClick={() => {
                        if (lead.statusQualificacao !== 'QUALIFICADO' || lead.statusViabilidade !== 'APROVADA') {
                            showToast('Atenção: O lead deve estar Qualificado e com Viabilidade Aprovada.', 'warning');
                        } else {
                            // Lógica de avanço
                        }
                    }}
                >
                    <TrendUp size={24} weight="fill" />
                </button>
            </div>
        </aside>
    );

    const renderRegistrationTab = () => (
        <div className="tab-pane-registration">
            <div className="registration-grid">
                <div className="data-sections">
                    <section className="data-card">
                        <div className="card-header">
                            <h2><IdentificationCard size={20} /> Identidade</h2>
                        </div>
                        <div className="fields-grid">
                            <div className="field-item">
                                <label>Nome Completo</label>
                                <div className="editable-value" onClick={() => setIsEditing('nomeCompleto')}>
                                    {isEditing === 'nomeCompleto' ? (
                                        <input autoFocus onBlur={(e) => handleInlineEdit('nomeCompleto', e.target.value)} defaultValue={lead.nomeCompleto} />
                                    ) : (
                                        <span>{lead.nomeCompleto} <PencilSimple size={14} /></span>
                                    )}
                                </div>
                            </div>
                            <div className="field-item">
                                <label>CPF / CNPJ</label>
                                <span>{lead.cpfCnpj || 'Não informado'}</span>
                            </div>
                            <div className="field-item">
                                <label>E-mail</label>
                                <span>{lead.email || 'Não informado'}</span>
                            </div>
                        </div>
                    </section>

                    <section className="data-card">
                        <div className="card-header">
                            <h2><MapPin size={20} /> Endereço de Cadastro</h2>
                        </div>
                        <div className="fields-grid">
                            <div className="field-item full">
                                <label>Logradouro</label>
                                <span>{lead.logradouro || 'S/L'}, {lead.numero || 'S/N'}</span>
                            </div>
                            <div className="field-item">
                                <label>Bairro</label>
                                <span>{lead.bairro || 'Não informado'}</span>
                            </div>
                            <div className="field-item">
                                <label>Cidade</label>
                                <span>{lead.cidade} - {lead.uf}</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="map-section">
                    <div className="map-container-wrapper">
                        <MapContainer center={[lead.latitude || -23.5505, lead.longitude || -46.6333]} zoom={15} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[lead.latitude || -23.5505, lead.longitude || -46.6333]}>
                                <Popup>{lead.nomeCompleto}</Popup>
                            </Marker>
                        </MapContainer>
                        <div className="coverage-badge">
                            <CheckCircle size={16} weight="fill" color="#10b981" /> Área de Cobertura Confirmada
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTimelineTab = () => (
        <div className="tab-pane-timeline">
            <div className="timeline-filters">
                <button className="active">Tudo</button>
                <button>Notas</button>
                <button>Ligações</button>
                <button>WhatsApp</button>
                <button>Tarefas</button>
            </div>
            <div className="timeline-list">
                {lead.history && lead.history.length > 0 ? lead.history.map((event) => (
                    <div key={event.id} className="timeline-item">
                        <div className="timeline-connector"></div>
                        <div className={`timeline-icon ${event.type.toLowerCase()}`}>
                            {event.type === 'CALL' && <Phone size={16} weight="fill" />}
                            {event.type === 'WHATSAPP' && <WhatsappLogo size={16} weight="fill" />}
                            {event.type === 'NOTE' && <ChatCircleText size={16} weight="fill" />}
                            {event.type === 'STAGE_CHANGE' && <TrendUp size={16} weight="fill" />}
                            {event.type === 'TASK' && <CheckCircle size={16} weight="fill" />}
                        </div>
                        <div className="timeline-card">
                            <div className="timeline-header">
                                <strong>{event.type === 'STAGE_CHANGE' ? 'Mudança de Etapa' : event.type}</strong>
                                <span>{new Date(event.dataEvento).toLocaleString()}</span>
                            </div>
                            <div className="timeline-body">
                                <p>{event.content}</p>
                                {event.metadata?.msg_preview && (
                                    <div className="msg-preview">"{event.metadata.msg_preview}"</div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="empty-timeline">
                        <MagnifyingGlass size={48} weight="duotone" />
                        <p>Nenhuma interação registrada ainda.</p>
                    </div>
                )}
            </div>
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

            <div className="detail-body">
                <main className="detail-main">
                    <nav className="detail-tabs">
                        <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}><Clock size={18} /> Linha do Tempo</button>
                        <button className={activeTab === 'dados' ? 'active' : ''} onClick={() => setActiveTab('dados')}><User size={18} /> Dados Cadastrais</button>
                        <button className={activeTab === 'qualificacao' ? 'active' : ''} onClick={() => setActiveTab('qualificacao')}><ClipboardText size={18} /> Qualificação</button>
                        <button className={activeTab === 'viabilidade' ? 'active' : ''} onClick={() => setActiveTab('viabilidade')}><HardDrives size={18} /> Viabilidade</button>
                        <button className={activeTab === 'proposta' ? 'active' : ''} onClick={() => setActiveTab('proposta')}><FileText size={18} /> Proposta</button>
                        <button className={activeTab === 'agendamento' ? 'active' : ''} onClick={() => setActiveTab('agendamento')}><Calendar size={18} /> Instalação</button>
                    </nav>

                    <div className="tab-content">
                        {activeTab === 'dados' && renderRegistrationTab()}
                        {activeTab === 'timeline' && renderTimelineTab()}
                        {activeTab === 'qualificacao' && (
                            <div className="tab-pane-qualificacao">
                                <div className="qual-header">
                                    <div className="score-widget">
                                        <div className="score-circle">
                                            <svg viewBox="0 0 36 36">
                                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="circle" strokeDasharray={`${lead.scoreQualificacao}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="score-text">
                                                <strong>{lead.scoreQualificacao || 0}</strong>
                                                <span>pts</span>
                                            </div>
                                        </div>
                                        <div className="score-label">
                                            <h3>Score de Conversão</h3>
                                            <p>{lead.scoreQualificacao && lead.scoreQualificacao > 70 ? 'Alta Probabilidade' : 'Qualificação em Andamento'}</p>
                                        </div>
                                    </div>
                                    <div className="qual-decision">
                                        <label>Decisão Comercial</label>
                                        <div className="decision-buttons">
                                            <button className={lead.statusQualificacao === 'QUALIFICADO' ? 'active green' : ''}>Qualificado</button>
                                            <button className={lead.statusQualificacao === 'DESQUALIFICADO' ? 'active red' : ''}>Desqualificado</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="qual-layers">
                                    <section className="qual-layer bant">
                                        <div className="layer-title">
                                            <span className="layer-number">01</span>
                                            <h4>Camada BANT (Fundamentos)</h4>
                                        </div>
                                        <div className="bant-grid">
                                            <div className="bant-item" onClick={() => setIsEditing('valorPagoAtual')}>
                                                <div className="bant-icon"><Briefcase /></div>
                                                <div className="bant-info">
                                                    <label>Budget (Paga atual)</label>
                                                    <strong>{lead.valorPagoAtual ? `R$ ${Number(lead.valorPagoAtual).toFixed(2)}` : 'Não informado'}</strong>
                                                </div>
                                            </div>
                                            <div className="bant-item">
                                                <div className="bant-icon"><User /></div>
                                                <div className="bant-info">
                                                    <label>Authority (Decisor?)</label>
                                                    <strong>{lead.decisorIdentificado ? 'Sim, Titular' : 'Não, Familiar/Terceiro'}</strong>
                                                </div>
                                            </div>
                                            <div className="bant-item">
                                                <div className="bant-icon"><DeviceMobile /></div>
                                                <div className="bant-info">
                                                    <label>Need (Uso/Velocidade)</label>
                                                    <strong>{lead.interessePlano || 'Standard Fiber'}</strong>
                                                </div>
                                            </div>
                                            <div className="bant-item">
                                                <div className="bant-icon"><Clock /></div>
                                                <div className="bant-info">
                                                    <label>Timeline (Prazo)</label>
                                                    <strong>{lead.dataProximoContato ? new Date(lead.dataProximoContato).toLocaleDateString() : 'Imediato'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="qual-layer business">
                                        <div className="layer-title">
                                            <span className="layer-number">02</span>
                                            <h4>Perfil de Uso e Negócio</h4>
                                        </div>
                                        <div className="business-questions">
                                            <div className="q-item">
                                                <span>Uso principal da internet:</span>
                                                <div className="q-tags">
                                                    <button className={lead.usoPrincipal === 'Trabalho' ? 'active' : ''}>Trabalho</button>
                                                    <button className={lead.usoPrincipal === 'Jogos' ? 'active' : ''}>Jogos</button>
                                                    <button className={lead.usoPrincipal === 'Streaming' ? 'active' : ''}>Streaming</button>
                                                </div>
                                            </div>
                                            <div className="q-item">
                                                <span>Quantidade de dispositivos ativos:</span>
                                                <div className="q-value"><strong>{lead.numDispositivos || 0}</strong> dispositivos</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}
                        {activeTab === 'viabilidade' && (
                            <div className="tab-pane-viabilidade">
                                <div className="viab-grid">
                                    <div className="viab-form">
                                        <section className="viab-section">
                                            <div className="section-header">
                                                <HardDrives size={20} weight="duotone" />
                                                <h4>Infraestrutura de Rede</h4>
                                            </div>
                                            <div className="infra-grid">
                                                <div className="infra-item">
                                                    <label>Caixa (CTO) mais próxima</label>
                                                    <div className="infra-value">
                                                        <strong>{lead.ctoProxima || 'CTO-CENTRO-042'}</strong>
                                                        <span className="badge-distance">{lead.distanciaDistribuidor || 45}m</span>
                                                    </div>
                                                </div>
                                                <div className="infra-item">
                                                    <label>Portas Disponíveis</label>
                                                    <div className="infra-progress">
                                                        <div className="bar"><div className="fill" style={{ width: '25%' }}></div></div>
                                                        <span>2 de 8 livres</span>
                                                    </div>
                                                </div>
                                                <div className="infra-item">
                                                    <label>Tipo de Tecnologia</label>
                                                    <select className="input-viab">
                                                        <option>FTTH - Fibra Direta</option>
                                                        <option>FTTB - Building</option>
                                                        <option>Rádio / Wireless</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="viab-section">
                                            <div className="section-header">
                                                <FileText size={20} weight="duotone" />
                                                <h4>Resultado e Custos</h4>
                                            </div>
                                            <div className="results-list">
                                                <div className="result-option active">
                                                    <div className="opt-check"><CheckCircle size={20} weight="fill" /></div>
                                                    <div className="opt-text">
                                                        <strong>Viável - Instalação Padrão</strong>
                                                        <span>Sem custo adicional de extensão de drop</span>
                                                    </div>
                                                    <div className="opt-price">R$ 0,00</div>
                                                </div>
                                                <div className="result-option">
                                                    <div className="opt-check"><Warning size={20} /></div>
                                                    <div className="opt-text">
                                                        <strong>Viável - Instalação Especial</strong>
                                                        <span>Necessita mais que 300m de fibra</span>
                                                    </div>
                                                    <div className="opt-price">Sob Consult.</div>
                                                </div>
                                                <div className="result-option disabled">
                                                    <div className="opt-check"><X size={20} /></div>
                                                    <div className="opt-text">
                                                        <strong>Inviável Definitivo</strong>
                                                        <span>Fora da poligonal de cobertura atual</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                    <div className="viab-map">
                                        <div className="map-card">
                                            <MapContainer center={[lead.latitude || -23.5505, lead.longitude || -46.6333]} zoom={17} style={{ height: '350px', width: '100%', borderRadius: '16px' }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <Marker position={[lead.latitude || -23.5505, lead.longitude || -46.6333]}>
                                                    <Popup>Endereço de Instalação</Popup>
                                                </Marker>
                                            </MapContainer>
                                            <div className="map-overlay-info">
                                                <MapTrifold size={16} /> <span>Latitude: {lead.latitude || '...'} | Longitude: {lead.longitude || '...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Other tabs follow same premium design */}
                    </div>
                </main>

                {renderSidePanel()}
            </div>

            <style>{`
                .lead-detail-wrapper {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
                    background: var(--bg-deep); z-index: 1000; display: flex; flex-direction: column;
                }
                .detail-header { background: var(--bg-surface); padding: 1.5rem 2.5rem; border-bottom: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header-top { display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; }
                .btn-back { background: transparent; border: none; color: #888; cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s; }
                .btn-back:hover { background: rgba(255,255,255,0.05); color: #fff; }
                
                .lead-brief h1 { margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
                .lead-badges { display: flex; gap: 8px; margin-top: 4px; }
                .badge-type { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
                .badge-type.pf { background: #10b98122; color: #10b981; }
                .badge-type.pj { background: #3b82f622; color: #3b82f6; }
                .badge-id { font-size: 10px; color: #555; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }

                .header-actions { margin-left: auto; display: flex; gap: 3rem; align-items: center; }
                .stage-navigator { display: flex; align-items: center; gap: 1rem; background: var(--bg-deep); padding: 6px 12px; border-radius: 14px; border: 1px solid var(--border); }
                .current-stage { display: flex; flex-direction: column; min-width: 140px; text-align: center; }
                .stage-label { font-size: 9px; text-transform: uppercase; color: #555; letter-spacing: 0.1em; font-weight: 700; }
                .stage-name { font-size: 0.9rem; font-weight: 700; color: var(--primary-color); }
                .btn-nav { background: transparent; border: none; color: #444; cursor: pointer; padding: 6px; border-radius: 8px; }
                .btn-nav.active { color: #fff; background: rgba(255,255,255,0.05); }

                .vendedor-select { display: flex; align-items: center; gap: 12px; }
                .vendedor-select img { width: 40px; height: 40px; border-radius: 12px; border: 2px solid var(--border); }
                .vendedor-info { display: flex; flex-direction: column; }
                .vendedor-info span { font-size: 10px; color: #666; }
                .vendedor-info strong { font-size: 0.95rem; color: #eee; }

                .funnel-progress { display: flex; gap: 12px; }
                .progress-step { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .step-bar { height: 6px; border-radius: 3px; background: rgba(0,0,0,0.2); position: relative; overflow: hidden; }
                .progress-step.active .step-bar::after { content: ''; position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: var(--primary-color); opacity: 0.6; }
                .progress-step.current .step-bar::after { opacity: 1; box-shadow: 0 0 10px var(--primary-color); }
                .step-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #444; }
                .progress-step.active .step-label { color: #888; }
                .progress-step.current .step-label { color: var(--primary-color); }

                .detail-body { display: flex; flex: 1; overflow: hidden; }
                .detail-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border); }
                .detail-tabs { display: flex; gap: 2rem; padding: 0 2.5rem; background: var(--bg-surface); border-bottom: 1px solid var(--border); }
                .detail-tabs button { 
                    background: transparent; border: none; color: #666; padding: 1.2rem 0; font-size: 0.9rem; font-weight: 600; cursor: pointer;
                    display: flex; align-items: center; gap: 10px; position: relative;
                }
                .detail-tabs button.active { color: var(--primary-color); }
                .detail-tabs button.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: var(--primary-color); }

                .tab-content { flex: 1; overflow-y: auto; padding: 2.5rem; }
                
                .registration-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2.5rem; min-height: 500px; }
                .data-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
                .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
                .card-header h2 { font-size: 1rem; margin: 0; color: #fff; }
                .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .field-item.full { grid-column: span 2; }
                .field-item label { display: block; font-size: 11px; color: #555; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
                .field-item span { color: #eee; font-weight: 500; display: flex; align-items: center; gap: 8px; }
                .editable-value { cursor: pointer; border-radius: 4px; transition: background 0.2s; }
                .editable-value:hover { background: rgba(255,255,255,0.05); }
                .editable-value input { background: var(--bg-deep); border: 1px solid var(--primary-color); color: #fff; padding: 4px 8px; border-radius: 4px; width: 100%; }
                
                .map-container-wrapper { height: 100%; min-height: 400px; border-radius: 20px; border: 1px solid var(--border); overflow: hidden; position: relative; }
                .coverage-badge { position: absolute; top: 12px; right: 12px; z-index: 1000; background: #fff; padding: 8px 12px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-size: 12px; font-weight: 700; color: #333; display: flex; align-items: center; gap: 8px; }

                .timeline-filters { display: flex; gap: 8px; margin-bottom: 2rem; }
                .timeline-filters button { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: #888; padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
                .timeline-filters button.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
                
                .timeline-list { display: flex; flex-direction: column; gap: 2rem; padding-left: 20px; }
                .timeline-item { position: relative; display: flex; gap: 2rem; }
                .timeline-connector { position: absolute; left: 16px; top: 32px; bottom: -32px; width: 1px; background: var(--border); }
                .timeline-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; z-index: 1; flex-shrink: 0; }
                .timeline-icon.call { background: #3b82f622; color: #3b82f6; }
                .timeline-icon.whatsapp { background: #10b98122; color: #10b981; }
                .timeline-icon.note { background: #8b5cf622; color: #8b5cf6; }
                .timeline-icon.stage_change { background: #f59e0b22; color: #f59e0b; }
                .timeline-icon.task { background: #10b98122; color: #10b981; }
                
                .timeline-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; flex: 1; }
                .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .timeline-header strong { font-size: 0.9rem; color: #eee; }
                .timeline-header span { font-size: 0.75rem; color: #555; }
                .timeline-body p { margin: 0; color: #aaa; font-size: 0.9rem; line-height: 1.5; }
                .msg-preview { margin-top: 10px; font-size: 0.85rem; color: #666; font-style: italic; background: rgba(0,0,0,0.1); padding: 8px 12px; border-radius: 8px; }

                .detail-sidebar { width: 340px; background: var(--bg-surface); padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; }
                .sidebar-card h3 { font-size: 11px; text-transform: uppercase; color: #555; letter-spacing: 0.1em; margin-top: 0; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 8px; }
                
                .next-task { background: #f59e0b0a; border: 1px dashed #f59e0b44; border-radius: 16px; padding: 1.2rem; }
                .task-content { display: flex; justify-content: space-between; align-items: center; }
                .task-info strong { display: block; font-size: 0.9rem; color: #eee; }
                .task-info span { font-size: 0.75rem; color: #f59e0b; font-weight: 600; }
                .task-actions { display: flex; gap: 8px; }
                .btn-task-done { background: #10b98122; border: none; color: #10b981; padding: 6px; border-radius: 8px; cursor: pointer; }
                
                .quick-log textarea { width: 100%; height: 100px; background: var(--bg-deep); border: 1px solid var(--border); border-radius: 12px; padding: 12px; color: #fff; margin-top: 1rem; resize: none; font-size: 0.9rem; }
                .quick-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .quick-actions-grid button { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #888; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
                .quick-actions-grid button:hover { background: rgba(255,255,255,0.08); color: #fff; }
                
                .btn-save-log { width: 100%; margin-top: 1rem; background: var(--primary-color); color: #fff; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
                .btn-save-log:hover { transform: translateY(-2px); }

                .mini-item { display: flex; gap: 12px; margin-bottom: 1.2rem; }
                .mini-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
                .mini-icon.call { background: #3b82f622; color: #3b82f6; }
                .mini-icon.stage { background: #f59e0b22; color: #f59e0b; }
                .mini-text strong { display: block; font-size: 0.8rem; color: #aaa; }
                .mini-text span { font-size: 0.7rem; color: #555; }

                .sidebar-shortcuts { margin-top: auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding-top: 2rem; border-top: 1px solid var(--border); }
                .shortcut { height: 50px; border-radius: 14px; border: none; cursor: pointer; transition: all 0.2s; }
                .shortcut.call { background: #3b82f6; color: #fff; }
                .shortcut.wa { background: #25D366; color: #fff; }
                .shortcut.plan { background: #8b5cf6; color: #fff; }
                .shortcut.move.locked { background: #333; color: #555; cursor: not-allowed; filter: grayscale(1); }
                .shortcut:hover:not(.locked) { transform: translateY(-4px); filter: brightness(1.2); }

                /* Estilos Qualificação */
                .tab-pane-qualificacao { display: flex; flex-direction: column; gap: 2.5rem; }
                .qual-header { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.1); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); }
                .score-widget { display: flex; align-items: center; gap: 1.5rem; }
                .score-circle { position: relative; width: 80px; height: 80px; }
                .score-circle svg { transform: rotate(-90deg); }
                .score-circle .circle-bg { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 3.8; }
                .score-circle .circle { fill: none; stroke: var(--primary-color); stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
                .score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
                .score-text strong { display: block; font-size: 1.4rem; color: #fff; line-height: 1; }
                .score-text span { font-size: 0.7rem; color: #666; text-transform: uppercase; }
                .score-label h3 { margin: 0; font-size: 1.1rem; color: #fff; }
                .score-label p { margin: 4px 0 0; font-size: 0.85rem; color: #10b981; font-weight: 600; }
                
                .qual-decision label { display: block; font-size: 11px; color: #555; text-transform: uppercase; font-weight: 700; margin-bottom: 12px; text-align: right; }
                .decision-buttons { display: flex; gap: 8px; }
                .decision-buttons button { background: var(--bg-deep); border: 1px solid var(--border); color: #666; padding: 8px 20px; border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.2s; }
                .decision-buttons button.active.green { background: #10b98122; color: #10b981; border-color: #10b98144; }
                .decision-buttons button.active.red { background: #ef444422; color: #ef4444; border-color: #ef444444; }

                .qual-layers { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .layer-title { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
                .layer-number { background: var(--primary-color); color: #fff; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
                .layer-title h4 { margin: 0; font-size: 0.95rem; color: #eee; }
                
                .bant-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .bant-item { background: var(--bg-surface); border: 1px solid var(--border); padding: 1.2rem; border-radius: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; }
                .bant-item:hover { border-color: #444; transform: translateY(-2px); }
                .bant-icon { color: var(--primary-color); background: rgba(59, 130, 246, 0.1); padding: 8px; border-radius: 10px; }
                .bant-info label { display: block; font-size: 10px; color: #555; text-transform: uppercase; font-weight: 700; }
                .bant-info strong { color: #eee; font-size: 0.9rem; }

                .business-questions { background: var(--bg-surface); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.5rem; }
                .q-item span { display: block; font-size: 0.9rem; color: #aaa; margin-bottom: 10px; }
                .q-tags { display: flex; gap: 8px; }
                .q-tags button { background: var(--bg-deep); border: 1px solid var(--border); color: #555; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
                .q-tags button.active { background: #3b82f622; color: #3b82f6; border-color: #3b82f644; }
                .q-value strong { color: var(--primary-color); font-size: 1.1rem; }

                /* Estilos Viabilidade */
                .viab-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2.5rem; }
                .viab-section { background: var(--bg-surface); padding: 1.8rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 1.5rem; }
                .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: #fff; }
                .section-header h4 { margin: 0; font-size: 1rem; }
                
                .infra-grid { display: grid; grid-template-columns: 1fr; gap: 1.2rem; }
                .infra-item label { display: block; font-size: 11px; color: #555; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
                .infra-value { display: flex; justify-content: space-between; align-items: center; }
                .badge-distance { background: #f59e0b22; color: #f59e0b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
                
                .infra-progress { display: flex; align-items: center; gap: 12px; }
                .infra-progress .bar { flex: 1; height: 6px; background: rgba(0,0,0,0.2); border-radius: 3px; overflow: hidden; }
                .infra-progress .fill { height: 100%; background: #10b981; }
                .infra-progress span { font-size: 12px; color: #555; font-weight: 600; white-space: nowrap; }
                
                .input-viab { width: 100%; background: var(--bg-deep); border: 1px solid var(--border); color: #fff; padding: 10px; border-radius: 10px; outline: none; }

                .results-list { display: flex; flex-direction: column; gap: 10px; }
                .result-option { display: flex; align-items: center; gap: 15px; padding: 1.2rem; border-radius: 16px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.02); }
                .result-option.active { border-color: #10b981; background: #10b9810a; }
                .opt-check { color: #333; }
                .result-option.active .opt-check { color: #10b981; }
                .opt-text { flex: 1; }
                .opt-text strong { display: block; color: #eee; font-size: 0.95rem; }
                .opt-text span { font-size: 0.8rem; color: #555; }
                .opt-price { font-weight: 800; color: #fff; }
                .result-option.disabled { opacity: 0.4; cursor: not-allowed; }

                .map-card { position: relative; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
                .map-overlay-info { position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 10px; color: #888; font-size: 11px; display: flex; align-items: center; gap: 8px; z-index: 1000; }

                .empty-timeline { text-align: center; color: #444; padding: 100px 0; }
            `}</style>
        </motion.div>
    );
};

export default LeadDetail;
