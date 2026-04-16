import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, User, MapPin, CheckCircle, MagnifyingGlass, Funnel, X, Clock, UserGear, Info, ChatCircleText, WarningCircle, Warning, ChatText, Gear } from '@phosphor-icons/react';
import { genericFilter } from '../utils/filterUtils';
import LoadingScreen from './LoadingScreen';
import { getServiceOrders, ServiceOrder, updateServiceOrder } from '../services/osService';
import { updateOcorrencia } from '../services/ocorrenciaService';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './OSManager.css';

interface OS {
    id: string;
    tipo: string;
    status: string;
    descricao: string;
    prioridade: string;
    dataAgendamento?: string;
    assinante: {
        nome: string;
        enderecos: Array<{
            logradouro: string;
            numero: string;
        }>
    };
}

const OSManager: React.FC = () => {
    const { osId } = useParams();
    const navigate = useNavigate();
    const [oss, setOss] = useState<ServiceOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

    useEffect(() => {
        if (osId && oss.length > 0) {
            const found = oss.find(o => o.id === osId);
            if (found) setSelectedOS(found);
        } else if (!osId) {
            setSelectedOS(null);
        }
    }, [osId, oss]);

    useEffect(() => {
        const fetchOS = async () => {
            setLoading(true);
            try {
                const data = await getServiceOrders();
                setOss(data);
            } catch (err) {
                console.error('Erro ao buscar OS:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOS();
    }, []);

    const [showOcoReminder, setShowOcoReminder] = useState(false);
    const [wizardStep, setWizardStep] = useState<'PROMPT' | 'SUMMARY' | 'VERIFICATION'>('PROMPT');
    const [conclusionSummary, setConclusionSummary] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const userRole = 'atendente';
    const MASTER_PIN = 'X7R2A9';
    const isCritical = selectedOS?.priority === 'URGENTE';

    const handleFinishOS = async () => {
        if (!selectedOS) return;
        try {
            await updateServiceOrder(selectedOS.id, {
                status: 'FINALIZADA',
                completion_date: new Date().toISOString()
            });
            setOss(prev => prev.map(o => o.id === selectedOS.id ? { ...o, status: 'FINALIZADA', completion_date: new Date().toISOString() } : o));

            if (selectedOS.occurrence_id) {
                setShowOcoReminder(true);
                setWizardStep('PROMPT');
            } else {
                navigate('/os');
            }
        } catch (err) {
            console.error('Erro ao finalizar OS:', err);
        }
    };

    const handleResolveLinkedOco = async () => {
        if (!selectedOS?.occurrence_id) return;

        // Only validate PIN if the OS is marked as URGENTE (Mapping to "Crítica")
        if (isCritical && pin !== MASTER_PIN) {
            setPinError(true);
            return;
        }

        try {
            await updateOcorrencia(selectedOS.occurrence_id, {
                status: 'RESOLVIDA',
                description: selectedOS.description + (conclusionSummary ? `\n\nRESUMO DA CONCLUSÃO: ${conclusionSummary}` : '')
            });
            navigate('/os');
        } catch (err) {
            console.error('Erro ao resolver ocorrência:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ABERTA': return '#3b82f6';
            case 'EM_EXECUCAO': return '#f59e0b';
            case 'FINALIZADA': return '#10b981';
            case 'CANCELADA': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const filteredOSS = genericFilter(oss, searchTerm);

    return (
        <div className="os-container">
            <header className="os-header">
                <h1>Ordens de Serviço</h1>
                <p>Gerenciamento de campo e agendamento técnico.</p>
            </header>

            <div className="search-filter-row">
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, tipo, descrição, assinante ou endereço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button className="flex-center filter-btn">
                    <Funnel size={20} />
                </button>
            </div>

            <div className="os-grid">
                {loading ? (
                    <div className="os-loading-wrap">
                        <LoadingScreen fullScreen={false} message="Sincronizando Ordens de Serviço..." />
                    </div>
                ) : filteredOSS.map(os => (
                    <div key={os.id} className="os-card">
                        <div className="os-id">#{os.id.slice(0, 8)} • {os.order_type}</div>
                        <div className="os-customer">{os.customer_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`os-priority-badge ${os.priority === 'URGENTE' ? 'urgente' : 'normal'}`}>
                                {os.priority}
                            </span>
                            <button
                                onClick={() => navigate(`/os/${os.id}`)}
                                className="os-manage-btn"
                            >
                                Gerenciar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedOS && (
                    <div className="os-modal-overlay" onClick={() => navigate('/os')}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="os-detail-card-styled"
                            onClick={e => e.stopPropagation()}
                        >
                            <header className="os-modal-header">
                                <div className="os-modal-header-left">
                                    <div className="os-modal-icon">
                                        <Wrench size={24} weight="duotone" />
                                    </div>
                                    <div>
                                        <div className="header-type">{selectedOS.order_type}</div>
                                        <h2 className="header-title">#{selectedOS.id.slice(0, 8)}</h2>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/os')} className="os-modal-close-btn"><X size={24} /></button>
                            </header>

                            <div className="os-modal-body">
                                <div className="os-col">
                                    <section>
                                        <h4 className="os-section-title"><ChatCircleText size={18} /> Descrição do Chamado</h4>
                                        <div className="os-desc-box">
                                            {selectedOS.description}
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="os-section-title"><User size={18} /> Cliente / Assinante</h4>
                                        <div className="os-info-col">
                                            <div className="info-item">
                                                <User size={16} />
                                                <div>
                                                    <div className="label">Cliente</div>
                                                    <div className="value">{selectedOS.customer_name}</div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <MapPin size={16} />
                                                <div>
                                                    <div className="label">Endereço</div>
                                                    <div className="value">{selectedOS.customer_address}</div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <Clock size={16} />
                                                <div>
                                                    <div className="label">Agendado para</div>
                                                    <div className="value">{selectedOS.scheduled_date ? new Date(selectedOS.scheduled_date).toLocaleString() : 'Não definido'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="os-col-right">
                                    <section>
                                        <h4 className="os-section-title-sm">Status da Operação</h4>
                                        <select
                                            value={selectedOS.status}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value as any;
                                                await updateServiceOrder(selectedOS.id, { status: newStatus });
                                                setOss(prev => prev.map(o => o.id === selectedOS.id ? { ...o, status: newStatus } : o));
                                            }}
                                            style={{ background: `${getStatusColor(selectedOS.status)}20`, border: `1px solid ${getStatusColor(selectedOS.status)}`, color: getStatusColor(selectedOS.status) }}
                                        >
                                            <option value="ABERTA">ABERTA</option>
                                            <option value="EM_EXECUCAO">EM EXECUÇÃO</option>
                                            <option value="FINALIZADA">FINALIZADA</option>
                                            <option value="CANCELADA">CANCELADA</option>
                                        </select>
                                    </section>

                                    <section className="os-section-bottom">
                                        <AnimatePresence mode="wait">
                                            {!showOcoReminder ? (
                                                <motion.button
                                                    key="finish-btn"
                                                    disabled={selectedOS.status === 'FINALIZADA'}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={handleFinishOS}
                                                    className="flex-center os-btn-finish"
                                                    style={{ background: selectedOS.status === 'FINALIZADA' ? '#333' : '#10b981', cursor: selectedOS.status === 'FINALIZADA' ? 'not-allowed' : 'pointer' }}
                                                >
                                                    <CheckCircle size={20} weight="bold" />
                                                    {selectedOS.status === 'FINALIZADA' ? 'Atendimento Finalizado' : 'Finalizar Atendimento'}
                                                </motion.button>
                                            ) : (
                                                <motion.div
                                                    key="oco-reminder"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="os-oco-reminder-card"
                                                >
                                                    {wizardStep === 'PROMPT' && (
                                                        <>
                                                            <div className="oco-alert-title warn">
                                                                <Warning size={24} /> Ocorrência Aberta
                                                            </div>
                                                            <p className="oco-alert-text">
                                                                {userRole === 'atendente'
                                                                    ? 'Como atendente, você deve encerrar a ocorrência vinculada para poder finalizar este atendimento.'
                                                                    : 'Identificamos uma ocorrência em aberto vinculada a esta OS. Deseja encerrá-la agora?'}
                                                            </p>
                                                            <div className={`os-flex-gap ${userRole === 'atendente' ? 'flex-column' : ''}`}>
                                                                <button
                                                                    onClick={() => setWizardStep('SUMMARY')}
                                                                    className="oco-btn-primary accent"
                                                                >
                                                                    Sim, Encerrar Ocorrência
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}

                                                    {wizardStep === 'SUMMARY' && (
                                                        <>
                                                            <div className="oco-alert-title success">
                                                                <ChatText size={24} /> Resumo da Conclusão
                                                            </div>
                                                            <textarea
                                                                value={conclusionSummary}
                                                                onChange={(e) => setConclusionSummary(e.target.value)}
                                                                placeholder="Descreva a solução técnica aqui..."
                                                                className="oco-textarea"
                                                            />
                                                            <button
                                                                onClick={() => isCritical ? setWizardStep('VERIFICATION') : handleResolveLinkedOco()}
                                                                disabled={!conclusionSummary}
                                                                className={`oco-btn-primary ${isCritical ? 'accent' : 'success'}`}
                                                                style={{ opacity: conclusionSummary ? 1 : 0.5 }}
                                                            >
                                                                {isCritical ? 'Próximo: Segurança' : 'Finalizar Atendimento'}
                                                            </button>
                                                        </>
                                                    )}

                                                    {wizardStep === 'VERIFICATION' && (
                                                        <>
                                                            <div className="oco-alert-title danger">
                                                                <Gear size={24} /> Autenticação Requerida
                                                            </div>
                                                            <p className="oco-alert-text">Insira o PIN de 6 dígitos (Service Key) para autorizar o encerramento do protocolo.</p>
                                                            <input
                                                                type="text"
                                                                maxLength={6}
                                                                value={pin}
                                                                onChange={(e) => {
                                                                    setPin(e.target.value.toUpperCase());
                                                                    setPinError(false);
                                                                }}
                                                                className={`os-pin-input ${pinError ? 'error' : 'normal'}`}
                                                                placeholder="******"
                                                            />
                                                            {pinError && <span className="os-pin-error">PIN inválido ou incorreto. Repita a operação.</span>}
                                                            <div className="os-flex-gap">
                                                                <button
                                                                    onClick={handleResolveLinkedOco}
                                                                    className="oco-btn-primary success"
                                                                >
                                                                    Confirmar Encerramento
                                                                </button>
                                                                <button onClick={() => setWizardStep('SUMMARY')} className="oco-btn-secondary">Voltar</button>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OSManager;
