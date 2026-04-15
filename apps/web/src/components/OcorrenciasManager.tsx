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

interface Ocorrencia {
    id: string;
    protocolo: string;
    cliente: string;
    assunto: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    status: 'ABERTA' | 'EM_ANALISE' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDA' | 'CANCELADA';
    dataAbertura: string;
    ultimaAtualizacao: string;
    vendedorId?: string;
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

    const handleSave = async () => {
        if (!selectedOco) return;
        setSaveStatus('SAVING');

        try {
            if (localStatus === 'RESOLVIDA') {
                const linkedOS = await getOSByOcorrencia(selectedOco.id);
                const hasPendingOS = linkedOS.some(os => os.status !== 'FINALIZADA');

                if (hasPendingOS) {
                    setSaveStatus('ERROR_PENDING_OS');
                    return;
                }
            }

            await updateOcorrencia(selectedOco.id, { status: localStatus });
            await fetchOco();
            setSaveStatus('IDLE');
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
        <div className="manager-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <WarningCircle size={32} weight="duotone" color="var(--primary-color)" />
                        Gestão de Ocorrências
                    </h1>
                    <p style={{ color: '#aaa', margin: '4px 0 0 0' }}>Acompanhamento de chamados e suporte ao cliente</p>
                </div>
                <button
                    onClick={() => { setSelectedOco(null); setShowModal(true); }}
                    style={{
                        background: 'var(--primary-color)', color: '#fff', border: 'none',
                        padding: '12px 24px', borderRadius: '8px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}
                >
                    <Plus size={20} weight="bold" /> Nova Ocorrência
                </button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Buscar por protocolo, cliente ou assunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 44px', borderRadius: '8px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff'
                        }}
                    />
                </div>
                <button className="flex-center" style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#aaa' }}>
                    <Funnel size={20} />
                </button>
            </div>

            <div className="leads-table-wrapper" style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '16px' }}>Protocolo</th>
                            <th style={{ padding: '16px' }}>Cliente / Assunto</th>
                            <th style={{ padding: '16px' }}>Prioridade</th>
                            <th style={{ padding: '16px' }}>Status</th>
                            <th style={{ padding: '16px' }}>Última Atu.</th>
                            <th style={{ padding: '16px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Carregando ocorrências...</td></tr>
                        ) : filteredOco.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Nenhuma ocorrência encontrada.</td></tr>
                        ) : filteredOco.map(oco => (
                            <tr key={oco.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '16px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>#{oco.protocolo}</span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontWeight: 600 }}>{oco.cliente}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{oco.assunto}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityColor(oco.prioridade) }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{oco.prioridade}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: `${getStatusColor(oco.status)}22`,
                                        color: getStatusColor(oco.status),
                                        border: `1px solid ${getStatusColor(oco.status)}44`
                                    }}>
                                        {oco.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#666' }}>
                                        <Clock size={14} />
                                        {new Date(oco.ultimaAtualizacao).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
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
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => navigate('/ocorrencias')}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="oco-modal"
                            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Warning size={28} weight="duotone" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>#{selectedOco.protocolo} — {selectedOco.cliente}</h2>
                                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0 0 0' }}>{selectedOco.assunto}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{
                                        padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                                        background: `${getStatusColor(selectedOco.status)}20`, color: getStatusColor(selectedOco.status)
                                    }}>
                                        {selectedOco.status}
                                    </div>
                                    <button onClick={() => navigate('/ocorrencias')} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                                </div>
                            </header>

                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                {/* Sidebar Tabs */}
                                <aside style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', padding: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            onClick={() => setActiveTab('ATENDIMENTO')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px',
                                                background: activeTab === 'ATENDIMENTO' ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                color: activeTab === 'ATENDIMENTO' ? '#fff' : '#666', transition: 'all 0.2s', border: 'none', cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            <Headset size={20} weight={activeTab === 'ATENDIMENTO' ? 'fill' : 'regular'} /> Atendimento
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('TECNICO')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px',
                                                background: activeTab === 'TECNICO' ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                color: activeTab === 'TECNICO' ? '#fff' : '#666', transition: 'all 0.2s', border: 'none', cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            <Hammer size={20} weight={activeTab === 'TECNICO' ? 'fill' : 'regular'} /> Técnico
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('GESTAO')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px',
                                                background: activeTab === 'GESTAO' ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                color: activeTab === 'GESTAO' ? '#fff' : '#666', transition: 'all 0.2s', border: 'none', cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            <ChartBar size={20} weight={activeTab === 'GESTAO' ? 'fill' : 'regular'} /> Gestão
                                        </button>
                                    </div>
                                </aside>

                                {/* Content Area */}
                                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                                    {activeTab === 'ATENDIMENTO' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <section>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}><WarningCircle size={18} /> Status da Ocorrência</h4>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem' }}>
                                                    <select
                                                        value={localStatus}
                                                        onChange={(e) => {
                                                            setLocalStatus(e.target.value as any);
                                                            setSaveStatus('IDLE');
                                                        }}
                                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#222', border: '1px solid #333', color: '#fff', outline: 'none', cursor: 'pointer' }}
                                                    >
                                                        <option value="ABERTA">Aberta</option>
                                                        <option value="EM_ANALISE">Em Análise</option>
                                                        <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                                                        <option value="RESOLVIDA">Resolvida</option>
                                                        <option value="CANCELADA">Cancelada</option>
                                                    </select>
                                                    {saveStatus === 'ERROR_PENDING_OS' && (
                                                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Warning size={16} /> Não é possível resolver: Existem ordens de serviço pendentes vinculadas.
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                            <section>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}><Calendar size={18} /> Agendamento e Logística</h4>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem' }}>
                                                    <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Compartilhamento de informações do módulo de agendamento...</p>
                                                    <button style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', marginTop: '12px', cursor: 'pointer' }}>Acessar Calendário</button>
                                                </div>
                                            </section>
                                            <section>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}><Paperclip size={18} /> Anexos e Documentos</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                                    <div style={{ aspectRatio: '1', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#666', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                        <Plus size={24} /> Adicionar
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'TECNICO' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <section>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}><ImageIcon size={18} /> Evidências de Campo</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                                    <div style={{ width: '100%', height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                                        <VideoCamera size={40} />
                                                    </div>
                                                    <div style={{ width: '100%', height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                                        <ImageIcon size={40} />
                                                    </div>
                                                </div>
                                            </section>
                                            <section>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}><ChatText size={18} /> Diário de Operação</h4>
                                                <textarea
                                                    placeholder="Registrar comentários técnicos ou pendências de campo..."
                                                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', resize: 'none', height: '120px', outline: 'none' }}
                                                />
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'GESTAO' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '20px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>SLA DE ATENDIMENTO</span>
                                                    <h3 style={{ fontSize: '1.8rem', margin: '8px 0 0 0' }}>94%</h3>
                                                </div>
                                                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '20px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>TURNOVER TÉCNICO</span>
                                                    <h3 style={{ fontSize: '1.8rem', margin: '8px 0 0 0' }}>1.2d</h3>
                                                </div>
                                            </div>
                                            <section>
                                                <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>Log Geral de Auditoria</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                            <span style={{ color: '#aaa' }}>Alteração de status por Sistema</span>
                                                            <span style={{ color: '#666' }}>12/04 - 14:3{i}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                </main>
                            </div>

                            <footer style={{ padding: '1.25rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => navigate('/ocorrencias')} style={{ padding: '10px 20px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', cursor: 'pointer' }}>Fechar</button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveStatus === 'SAVING'}
                                    style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--primary-color)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: saveStatus === 'SAVING' ? 0.5 : 1 }}
                                >
                                    {saveStatus === 'SAVING' ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .action-btn-table { background: transparent; border: none; color: #666; cursor: pointer; transition: color 0.2s; }
                .action-btn-table:hover { color: var(--primary-color); }
                .table-row-hover:hover { background: rgba(255,255,255,0.03); }
            `}</style>
        </div>
    );
};

export default OcorrenciasManager;
