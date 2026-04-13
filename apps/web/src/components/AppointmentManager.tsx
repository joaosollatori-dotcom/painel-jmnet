import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, MapPin,
    User, Users, CheckCircle,
    Plus, ArrowsClockwise,
    X, Funnel, Trash, PencilSimple,
    GoogleLogo, NavigationArrow,
    Warning, Info, Bell
} from '@phosphor-icons/react';
import { Appointment, getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../services/leadService';
import { useToast } from '../contexts/ToastContext';
import LoadingScreen from './LoadingScreen';

const AppointmentManager: React.FC = () => {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAppointments();
            setAppointments(data);
        } catch (err) {
            console.error('Error loading appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CONCLUIDO': return { bg: '#10b98122', color: '#10b981', label: 'Concluído' };
            case 'EM_ANDAMENTO': return { bg: '#3b82f622', color: '#3b82f6', label: 'Em Andamento' };
            case 'CANCELADO': return { bg: '#ef444422', color: '#ef4444', label: 'Cancelado' };
            case 'REAGENDADO': return { bg: '#f59e0b22', color: '#f59e0b', label: 'Reagendado' };
            default: return { bg: '#6b728022', color: '#9ca3af', label: 'Agendado' };
        }
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'VISITA_COMERCIAL': 'Visita Comercial',
            'INSTALACAO': 'Instalação',
            'DEMONSTRACAO': 'Demonstração',
            'LIGACAO': 'Ligação Agendada',
            'RETORNO_PROPOSTA': 'Retorno de Proposta',
            'VISTORIA_TECNICA': 'Vistoria Técnica'
        };
        return types[type] || type;
    };

    return (
        <div className="appointment-container">
            <header className="page-header">
                <div>
                    <h1>Gestão de Agendamentos</h1>
                    <p>Controle de visitas, instalações e compromissos comerciais</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary"><Calendar size={20} /> Ver Calendário</button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} weight="bold" /> Novo Agendamento
                    </button>
                </div>
            </header>

            <div className="filters-bar">
                <div className="search-box">
                    <Calendar size={18} />
                    <input type="text" placeholder="Filtrar por data, cliente ou responsável..." />
                </div>
                <div className="chip-filters">
                    <span className="chip active">Todos</span>
                    <span className="chip">Hoje</span>
                    <span className="chip">Esta Semana</span>
                    <span className="chip">Pendentes de Entrega</span>
                </div>
            </div>

            <div className="appointment-grid">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '100px 0' }}>
                        <LoadingScreen fullScreen={false} message="Sincronizando Agenda Jurídica..." />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={64} weight="duotone" />
                        <h2>Nenhum compromisso agendado</h2>
                        <p>Sua agenda está limpa para hoje. Que tal marcar um novo contato?</p>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>Agendar agora</button>
                    </div>
                ) : (
                    appointments.map(appt => (
                        <motion.div
                            key={appt.id}
                            className="appt-card"
                            whileHover={{ y: -4 }}
                        >
                            <div className="card-header">
                                <span className="appt-type">{getTypeLabel(appt.tipo)}</span>
                                <div className="status-badge" style={{ backgroundColor: getStatusStyle(appt.status).bg, color: getStatusStyle(appt.status).color }}>
                                    {getStatusStyle(appt.status).label}
                                </div>
                            </div>

                            <div className="card-body">
                                <h3>{appt.titulo}</h3>
                                <div className="info-row">
                                    <Clock size={16} />
                                    <span>{new Date(appt.dataInicio).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="info-row">
                                    <MapPin size={16} />
                                    <span className="truncated">{appt.logradouro}, {appt.numero} - {appt.bairro}</span>
                                </div>
                                <div className="info-row">
                                    <User size={16} />
                                    <span>Resp: <strong>{appt.vendedorId || 'N/A'}</strong></span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button className="btn-icon" title="Ver no Maps"><NavigationArrow size={18} weight="fill" /></button>
                                <button className="btn-action">Gerenciar</button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal de Agendamento (Resumo dos campos solicitados) */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="appt-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <header className="modal-header">
                                <h2><Plus size={24} color="var(--primary-color)" /> Novo Agendamento</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                            </header>

                            <div className="modal-content ic-sidebar-scroll">
                                <div className="modal-section">
                                    <h3><Info size={18} /> Identificação Básica</h3>
                                    <div className="form-grid">
                                        <div className="form-group full">
                                            <label>Título do Agendamento</label>
                                            <input type="text" placeholder="Ex: Vistoria Técnica Residencial - João Silva" />
                                        </div>
                                        <div className="form-group">
                                            <label>Tipo de Compromisso</label>
                                            <select>
                                                <option value="VISITA_COMERCIAL">Visita Comercial</option>
                                                <option value="INSTALACAO">Instalação</option>
                                                <option value="DEMONSTRACAO">Demonstração</option>
                                                <option value="LIGACAO">Ligação Agendada</option>
                                                <option value="RETORNO_PROPOSTA">Retorno de Proposta</option>
                                                <option value="VISTORIA_TECNICA">Vistoria Técnica</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Vincular Lead/Cliente</label>
                                            <input type="text" placeholder="Pesquisar nome ou ID..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3><Clock size={18} /> Planejamento Temporal</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Data e Hora de Início</label>
                                            <input type="datetime-local" />
                                        </div>
                                        <div className="form-group">
                                            <label>Duração Estimada (minutos)</label>
                                            <input type="number" placeholder="Ex: 60" />
                                        </div>
                                        <div className="form-group full">
                                            <label className="checkbox-label">
                                                <input type="checkbox" /> Dia inteiro (sem horário definido)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3><MapPin size={18} /> Localização da Execução</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>CEP</label>
                                            <input type="text" placeholder="00000-000" />
                                        </div>
                                        <div className="form-group">
                                            <label>Bairro</label>
                                            <input type="text" placeholder="Nome do bairro" />
                                        </div>
                                        <div className="form-group full">
                                            <label>Logradouro e Número</label>
                                            <input type="text" placeholder="Rua, Avenida, etc." />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3><Users size={18} /> Responsáveis e Equipe</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Vendedor/Atendente</label>
                                            <input type="text" placeholder="Selecione o responsável" />
                                        </div>
                                        <div className="form-group">
                                            <label>Técnico (se aplicável)</label>
                                            <input type="text" placeholder="Selecione o técnico" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={() => {
                                    showToast('Agendamento criado com sucesso!', 'success');
                                    setShowModal(false);
                                }}>Confirmar e Agendar</button>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .appointment-container { padding: var(--space-lg); height: 100%; overflow-y: auto; background: var(--bg-deep); }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .page-header h1 { font-size: 2rem; font-weight: 800; color: #fff; margin:0; }
                .page-header p { color: #666; margin-top: 4px; }

                .filters-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 2rem; }
                .search-box { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 0 16px; display: flex; align-items: center; gap: 12px; flex: 1; height: 48px; }
                .search-box input { background: transparent; border: none; color: #fff; width: 100%; outline: none; }
                
                .chip-filters { display: flex; gap: 8px; }
                .chip { background: transparent; border: 1px solid var(--border); padding: 8px 16px; border-radius: 10px; color: #666; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .chip:hover { border-color: #444; color: #aaa; }
                .chip.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }

                .appointment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .appt-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .appt-type { font-size: 0.7rem; text-transform: uppercase; font-weight: 800; color: #555; letter-spacing: 0.1em; }
                .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 800; }
                
                .card-body h3 { margin: 0 0 1rem 0; font-size: 1.1rem; color: #fff; }
                .info-row { display: flex; align-items: center; gap: 10px; color: #666; font-size: 0.85rem; margin-bottom: 8px; }
                .info-row strong { color: #aaa; }
                .truncated { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid #1a1a1a; }
                .btn-action { background: rgba(255,255,255,0.03); border: 1px solid #333; color: #aaa; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.8rem; }
                .btn-action:hover { background: #333; color: #fff; }
                
                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .appt-modal { background: #111; border: 1px solid #222; border-radius: 28px; width: 90%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
                .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; }
                .modal-content { padding: 2rem; overflow-y: auto; flex: 1; }
                .modal-section { margin-bottom: 2rem; }
                .modal-section h3 { font-size: 0.8rem; text-transform: uppercase; color: #444; margin-bottom: 1.5rem; letter-spacing: 0.1em; font-weight: 900; display: flex; align-items: center; gap: 10px; }
                
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .form-group.full { grid-column: span 2; }
                .form-group label { display: block; font-size: 11px; color: #666; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
                .form-group input, .form-group select { width: 100%; background: #000; border: 1px solid #222; color: #fff; padding: 12px 14px; border-radius: 12px; outline: none; font-size: 0.95rem; }
                .form-group input:focus { border-color: var(--primary-color); }

                .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; color: #888; text-transform: none !important; font-size: 0.9rem !important; }

                .modal-footer { padding: 1.5rem 2rem; background: #0a0a0a; border-top: 1px solid #222; display: flex; justify-content: flex-end; gap: 1rem; }
                
                .btn-icon { background: rgba(59, 130, 246, 0.1); border: none; color: #3b82f6; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .btn-icon:hover { background: #3b82f6; color: #fff; }

                /* Loading Elite */
                .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 1.5rem; color: #444; }
                .spinner-elite { width: 40px; height: 40px; border: 3px solid rgba(59, 130, 246, 0.1); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AppointmentManager;
