import {
    WarningCircle, Plus, MagnifyingGlass, Funnel,
    ChatCircleDots, User, Clock, CheckCircle,
    CaretDown, DotsThreeVertical, PencilSimple, Trash,
    Warning, X, Image as ImageIcon, VideoCamera, ChatText,
    ChartBar, Headset, Gear, Hammer, Calendar, Paperclip
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { genericFilter } from '../utils/filterUtils';
import { getOcorrencias, updateOcorrencia } from '../services/ocorrenciaService';
import { useNavigate, useParams } from 'react-router-dom';
import { getOSByOcorrencia } from '../services/osService';
import { useState, useEffect } from 'react';
import './OcorrenciasManager.css';

interface Ocorrencia {
    id: string;
    protocolo: string;
    cliente: string;
    assunto: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    status: 'ABERTA' | 'EM_ANALISE' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDA' | 'CANCELADA';
    data_abertura: string;
    ultima_atualizacao: string;
    vendedor_id?: string;
}

const OcorrenciasManager: React.FC = () => {
    const { ocoId } = useParams();
    const navigate = useNavigate();
    const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOco, setSelectedOco] = useState<Ocorrencia | null>(null);
    const [activeTab, setActiveTab] = useState<'TECNICO' | 'GESTAO' | 'ATENDIMENTO'>('ATENDIMENTO');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (ocoId && ocorrencias.length > 0) {
            const found = ocorrencias.find(o => o.id === ocoId);
            if (found) {
                setSelectedOco(found);
                setLocalStatus(found.status);
            }
        } else if (!ocoId) {
            setSelectedOco(null);
        }
    }, [ocoId, ocorrencias]);

    const fetchOco = async () => {
        setLoading(true);
        try {
            const data = await getOcorrencias();
            setOcorrencias(data);
        } catch (err) {
            console.error('Erro ao buscar ocorrencias:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOco();
    }, []);

    const [localStatus, setLocalStatus] = useState<Ocorrencia['status']>('ABERTA');
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'ERROR_PENDING_OS'>('IDLE');
    const [showPinInput, setShowPinInput] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const MASTER_PIN = 'X7R2A9';

    const handleSave = async () => {
        if (!selectedOco) return;
        setSaveStatus('SAVING');

        try {
            if (localStatus === 'RESOLVIDA') {
                // 1. Check for pending Service Orders
                const linkedOS = await getOSByOcorrencia(selectedOco.id);
                const hasPendingOS = linkedOS.some(os => os.status !== 'FINALIZADA');

                if (hasPendingOS) {
                    setSaveStatus('ERROR_PENDING_OS');
                    return;
                }

                // 2. Check for Critical Priority requiring PIN
                if (selectedOco.prioridade === 'CRITICA' && !showPinInput) {
                    setShowPinInput(true);
                    setSaveStatus('IDLE');
                    return;
                }
            }

            if (showPinInput && pin !== MASTER_PIN) {
                setPinError(true);
                setSaveStatus('IDLE');
                return;
            }

            await updateOcorrencia(selectedOco.id, { status: localStatus });
            await fetchOco();
            setSaveStatus('IDLE');
            setShowPinInput(false);
            navigate('/ocorrencias');
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setSaveStatus('IDLE');
        }
    };
    const getStatusColor = (status: Ocorrencia['status']) => {
        switch (status) {
            case 'ABERTA': return '#3b82f6';
            case 'EM_ANALISE': return '#f59e0b';
            case 'AGUARDANDO_CLIENTE': return '#8b5cf6';
            case 'RESOLVIDA': return '#10b981';
            case 'CANCELADA': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (p: Ocorrencia['prioridade']) => {
        switch (p) {
            case 'CRITICA': return '#ef4444';
            case 'ALTA': return '#f97316';
            case 'MEDIA': return '#3b82f6';
            default: return '#10b981';
        }
    };

    const filteredOco = genericFilter(ocorrencias, searchTerm);

    return (
        <div className="manager-container om-container">
            <header className="om-header">
                <div className="om-header-left">
                    <h1>
                        <WarningCircle size={32} weight="duotone" color="var(--primary-color)" />
                        Gestão de Ocorrências
                    </h1>
                    <p>Acompanhamento de chamados e suporte ao cliente</p>
                </div>
                <button
                    onClick={() => { setSelectedOco(null); setShowModal(true); }}
                    className="om-btn-new"
                >
                    <Plus size={20} weight="bold" /> Nova Ocorrência
                </button>
            </header>

            <div className="om-search-row">
                <div className="om-search-wrapper">
                    <MagnifyingGlass size={20} className="om-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por protocolo, cliente ou assunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="om-search-input"
                    />
                </div>
                <button className="flex-center om-filter-btn">
                    <Funnel size={20} />
                </button>
            </div>

            <div className="leads-table-wrapper om-table-wrapper">
                <table className="om-table">
                    <thead>
                        <tr>
                            <th>Protocolo</th>
                            <th>Cliente / Assunto</th>
                            <th>Prioridade</th>
                            <th>Status</th>
                            <th>Última Atu.</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center" style={{ padding: '40px', color: '#666' }}>Carregando ocorrências...</td></tr>
                        ) : filteredOco.length === 0 ? (
                            <tr><td colSpan={6} className="text-center" style={{ padding: '40px', color: '#666' }}>Nenhuma ocorrência encontrada.</td></tr>
                        ) : filteredOco.map(oco => (
                            <tr key={oco.id} className="table-row-hover">
                                <td>
                                    <span className="om-protocol">#{oco.protocol}</span>
                                </td>
                                <td>
                                    <div className="om-client-info">
                                        <div className="om-client-name">{oco.customer_name}</div>
                                        <div className="om-subject">{oco.subject}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="om-priority-box">
                                        <div className="om-priority-dot" style={{ background: getPriorityColor(oco.prioridade) }} />
                                        <span className="om-priority-text">{oco.prioridade}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="om-status-badge" style={{
                                        background: `${getStatusColor(oco.status)}22`,
                                        color: getStatusColor(oco.status),
                                        border: `1px solid ${getStatusColor(oco.status)}44`
                                    }}>
                                        {oco.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <div className="om-time-info">
                                        <Clock size={14} />
                                        {oco.ultima_atualizacao ? new Date(oco.ultima_atualizacao).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>
                                <td>
                                    <div className="om-actions-cell">
                                        <button
                                            onClick={() => navigate(`/ocorrencias/${oco.id}`)}
                                            className="action-btn-table"
                                        >
                                            <ChatCircleDots size={20} />
                                        </button>
                                        <button className="action-btn-table"><PencilSimple size={20} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {selectedOco && (
                    <div className="om-modal-overlay" onClick={() => navigate('/ocorrencias')}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="om-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <header className="om-modal-header">
                                <div className="om-modal-header-left">
                                    <div className="om-modal-icon-box">
                                        <Warning size={28} weight="duotone" />
                                    </div>
                                    <div className="om-modal-title">
                                        <h2>#{selectedOco.protocol} — {selectedOco.customer_name}</h2>
                                        <p>{selectedOco.subject}</p>
                                    </div>
                                </div>
                                <div className="om-modal-header-right">
                                    <div className="om-status-tag" style={{
                                        background: `${getStatusColor(selectedOco.status)}20`, color: getStatusColor(selectedOco.status)
                                    }}>
                                        {selectedOco.status}
                                    </div>
                                    <button onClick={() => navigate('/ocorrencias')} className="om-modal-close"><X size={24} /></button>
                                </div>
                            </header>

                            <div className="om-modal-body">
                                <aside className="om-modal-sidebar">
                                    <div className="om-tabs-list">
                                        <button
                                            onClick={() => setActiveTab('ATENDIMENTO')}
                                            className={`om-tab-btn ${activeTab === 'ATENDIMENTO' ? 'active' : ''}`}
                                        >
                                            <Headset size={20} weight={activeTab === 'ATENDIMENTO' ? 'fill' : 'regular'} /> Atendimento
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('TECNICO')}
                                            className={`om-tab-btn ${activeTab === 'TECNICO' ? 'active' : ''}`}
                                        >
                                            <Hammer size={20} weight={activeTab === 'TECNICO' ? 'fill' : 'regular'} /> Técnico
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('GESTAO')}
                                            className={`om-tab-btn ${activeTab === 'GESTAO' ? 'active' : ''}`}
                                        >
                                            <ChartBar size={20} weight={activeTab === 'GESTAO' ? 'fill' : 'regular'} /> Gestão
                                        </button>
                                    </div>
                                </aside>

                                <main className="om-content-area">
                                    {activeTab === 'ATENDIMENTO' && (
                                        <div className="om-content-stack">
                                            <section>
                                                <h4 className="om-section-title"><WarningCircle size={18} /> Status da Ocorrência</h4>
                                                <div className="om-card-simple">
                                                    <select
                                                        value={localStatus}
                                                        onChange={(e) => {
                                                            setLocalStatus(e.target.value as any);
                                                            setSaveStatus('IDLE');
                                                        }}
                                                        className="om-select"
                                                    >
                                                        <option value="ABERTA">Aberta</option>
                                                        <option value="EM_ANALISE">Em Análise</option>
                                                        <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                                                        <option value="RESOLVIDA">Resolvida</option>
                                                        <option value="CANCELADA">Cancelada</option>
                                                    </select>
                                                    {saveStatus === 'ERROR_PENDING_OS' && (
                                                        <div className="om-alert-danger">
                                                            <Warning size={16} /> Não é possível resolver: Existem ordens de serviço pendentes vinculadas.
                                                        </div>
                                                    )}
                                                    {showPinInput && (
                                                        <div className="om-pin-container">
                                                            <div className="om-pin-title">
                                                                <Gear size={20} /> Autenticação Crítica Requerida
                                                            </div>
                                                            <p className="om-pin-text">Esta ocorrência é crítica. Insira o PIN para autorizar a resolução.</p>
                                                            <input
                                                                type="text"
                                                                maxLength={6}
                                                                value={pin}
                                                                onChange={(e) => {
                                                                    setPin(e.target.value.toUpperCase());
                                                                    setPinError(false);
                                                                }}
                                                                className={`om-pin-input ${pinError ? 'error' : 'normal'}`}
                                                                placeholder="******"
                                                            />
                                                            {pinError && <div className="om-pin-error">PIN Incorreto</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                            <section>
                                                <h4 className="om-section-title"><Calendar size={18} /> Agendamento e Logística</h4>
                                                <div className="om-card-simple">
                                                    <p className="om-placeholder-text">Compartilhamento de informações do módulo de agendamento...</p>
                                                    <button className="om-btn-outline">Acessar Calendário</button>
                                                </div>
                                            </section>
                                            <section>
                                                <h4 className="om-section-title"><Paperclip size={18} /> Anexos e Documentos</h4>
                                                <div className="om-attachment-grid">
                                                    <div className="om-attachment-add">
                                                        <Plus size={24} /> Adicionar
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'TECNICO' && (
                                        <div className="om-content-stack">
                                            <section>
                                                <h4 className="om-section-title"><ImageIcon size={18} /> Evidências de Campo</h4>
                                                <div className="om-evidence-grid">
                                                    <div className="om-evidence-item">
                                                        <VideoCamera size={40} />
                                                    </div>
                                                    <div className="om-evidence-item">
                                                        <ImageIcon size={40} />
                                                    </div>
                                                </div>
                                            </section>
                                            <section>
                                                <h4 className="om-section-title"><ChatText size={18} /> Diário de Operação</h4>
                                                <textarea
                                                    placeholder="Registrar comentários técnicos ou pendências de campo..."
                                                    className="om-textarea"
                                                />
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'GESTAO' && (
                                        <div className="om-content-stack">
                                            <div className="om-stats-grid">
                                                <div className="om-stat-card sla">
                                                    <span>SLA DE ATENDIMENTO</span>
                                                    <h3 className="om-stat-value">94%</h3>
                                                </div>
                                                <div className="om-stat-card turnover">
                                                    <span>TURNOVER TÉCNICO</span>
                                                    <h3 className="om-stat-value">1.2d</h3>
                                                </div>
                                            </div>
                                            <section>
                                                <h4 className="om-section-title">Log Geral de Auditoria</h4>
                                                <div className="om-log-list">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="om-log-item">
                                                            <span className="om-log-msg">Alteração de status por Sistema</span>
                                                            <span className="om-log-time">12/04 - 14:3{i}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                </main>
                            </div>

                            <footer className="om-footer">
                                <button onClick={() => navigate('/ocorrencias')} className="om-btn-cancel">Fechar</button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveStatus === 'SAVING'}
                                    className="om-btn-save"
                                >
                                    {saveStatus === 'SAVING' ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OcorrenciasManager;
