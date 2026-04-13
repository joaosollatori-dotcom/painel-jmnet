import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, MapPin,
    User, Users, CheckCircle,
    Plus, ArrowsClockwise,
    X, Funnel, Trash, PencilSimple,
    GoogleLogo, NavigationArrow,
    Warning, Info, Bell,
    List, CalendarBlank, ChartBar,
    MagnifyingGlass, CaretDown,
    WhatsappLogo, Phone,
    WarningCircle, Checks,
    DotsThreeVertical, ArrowSquareOut
} from '@phosphor-icons/react';
import { Appointment, getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../services/leadService';
import { useToast } from '../contexts/ToastContext';
import LoadingScreen from './LoadingScreen';

type ViewMode = 'list' | 'day' | 'week' | 'month';

const AppointmentManager: React.FC = () => {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

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

    // --- LÓGICA DE DERIVAÇÃO E FILTROS ---
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            const matchesSearch = appt.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                appt.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || appt.status === filterStatus;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
    }, [appointments, searchTerm, filterStatus]);

    const attentionStats = useMemo(() => {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        return {
            today: appointments.filter(a => new Date(a.dataInicio).toDateString() === now.toDateString()).length,
            unconfirmedUrgent: appointments.filter(a => {
                const startTime = new Date(a.dataInicio);
                return a.status === 'AGENDADO' && !a.dataConfirmacao && startTime > now && startTime <= twoHoursFromNow;
            }).length,
            unattended: appointments.filter(a => a.status === 'NAO_ATENDIDO').length,
            conflicts: appointments.reduce((count, a1, idx) => {
                const overlap = appointments.slice(idx + 1).some(a2 =>
                    a1.vendedorId === a2.vendedorId &&
                    new Date(a1.dataInicio) < new Date(a2.dataFim || a2.dataInicio) &&
                    new Date(a2.dataInicio) < new Date(a1.dataFim || a1.dataInicio)
                );
                return overlap ? count + 1 : count;
            }, 0)
        };
    }, [appointments]);

    // --- HELPERS VISUAIS ---
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CONFIRMADO': return { bg: '#10b98120', color: '#10b981', label: 'Confirmado' };
            case 'DESLOCAMENTO': return { bg: '#3b82f620', color: '#3b82f6', label: 'Em Deslocamento' };
            case 'EM_ANDAMENTO': return { bg: '#8b5cf620', color: '#8b5cf6', label: 'Em Andamento' };
            case 'CONCLUIDO': return { bg: '#64748b20', color: '#64748b', label: 'Concluído' };
            case 'NAO_ATENDIDO': return { bg: '#ef444420', color: '#ef4444', label: 'Não Atendido' };
            case 'CANCELADO': return { bg: '#1a1a1a', color: '#555', label: 'Cancelado' };
            default: return { bg: '#3b82f610', color: '#3b82f6', label: 'Agendado' };
        }
    };

    const getTimeRemaining = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        const mins = Math.floor(diff / 60000);
        if (diff < 0) return 'Iniciado';
        if (mins < 60) return `Em ${mins} min`;
        if (mins < 1440) return `Em ${Math.floor(mins / 60)}h`;
        return `${Math.floor(mins / 1440)} dias`;
    };
    // --- LÓGICA DE CALENDÁRIO ---
    const lanes = useMemo(() => {
        const uniqueResps = Array.from(new Set(appointments.map(a => a.vendedorId || 'S/R')));
        return uniqueResps.map(id => ({ id, name: id === 'S/R' ? 'Sem Resp.' : id }));
    }, [appointments]);

    const calculateBlockPos = (dateStr: string, durationMins: number = 60) => {
        const date = new Date(dateStr);
        const hour = date.getHours();
        const mins = date.getMinutes();
        const startHour = 8; // Agenda começa às 08:00

        const top = (hour - startHour) * 80 + (mins / 60) * 80;
        const height = (durationMins / 60) * 80;

        return { top, height };
    };

    const handleDragEnd = async (apptId: string, info: any) => {
        showToast('Agendamento atualizado localmente (Draft)', 'info');
    };

    return (
        <div className="appt-dashboard">
            {/* BARRA SUPERIOR E CONTROLES */}
            <header className="appt-header">
                <div className="header-left">
                    <div className="title-group">
                        <h1>Gestão de Agenda</h1>
                        <span className="count-badge">{filteredAppointments.length} agendamentos</span>
                    </div>
                    <div className="view-selector">
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List /> Lista</button>
                        <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}><CalendarBlank /> Dia</button>
                        <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Semana</button>
                        <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Mês</button>
                    </div>
                </div>

                <div className="header-right">
                    <div className="search-bar">
                        <MagnifyingGlass size={18} />
                        <input
                            placeholder="Buscar lead ou endereço..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-create" onClick={() => setShowModal(true)}>
                        <Plus weight="bold" /> Novo Agendamento
                    </button>
                </div>
            </header>

            {/* PAINEL DE ATENÇÃO */}
            <section className="attention-panel">
                <div className="stat-card">
                    <div className="stat-icon blue"><Calendar /></div>
                    <div className="stat-info">
                        <h3>Agenda de Hoje</h3>
                        <p><strong>{attentionStats.today}</strong> compromissos</p>
                    </div>
                </div>
                <div className={`stat-card ${attentionStats.unconfirmedUrgent > 0 ? 'urgent' : ''}`}>
                    <div className="stat-icon yellow"><Bell /></div>
                    <div className="stat-info">
                        <h3>Sem Confirmação</h3>
                        <p><strong>{attentionStats.unconfirmedUrgent}</strong> alertas próximos</p>
                    </div>
                </div>
                <div className={`stat-card ${attentionStats.unattended > 0 ? 'warning' : ''}`}>
                    <div className="stat-icon red"><WarningCircle /></div>
                    <div className="stat-info">
                        <h3>Não Atendidos</h3>
                        <p><strong>{attentionStats.unattended}</strong> aguardando tratativa</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><ArrowsClockwise /></div>
                    <div className="stat-info">
                        <h3>Conflitos</h3>
                        <p>Nenhum detectado</p>
                    </div>
                </div>
            </section>

            {/* FILTROS RÁPIDOS */}
            <div className="filter-chips">
                <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>Todos</button>
                <button className={filterStatus === 'AGENDADO' ? 'active' : ''} onClick={() => setFilterStatus('AGENDADO')}>Aguardando</button>
                <button className={filterStatus === 'CONFIRMADO' ? 'active' : ''} onClick={() => setFilterStatus('CONFIRMADO')}>Confirmados</button>
                <button className={filterStatus === 'DESLOCAMENTO' ? 'active' : ''} onClick={() => setFilterStatus('DESLOCAMENTO')}>Em Campo</button>
                <button className={filterStatus === 'NAO_ATENDIDO' ? 'active' : ''} onClick={() => setFilterStatus('NAO_ATENDIDO')}>Pendência</button>
                <div className="filter-divider" />
                <button className="filter-btn"><Funnel /> Região <CaretDown /></button>
                <button className="filter-btn"><User /> Responsável <CaretDown /></button>
            </div>

            {/* CONTEÚDO PRINCIPAL (ALTERNÂNCIA DE VIEWS) */}
            <main className="appt-content">
                {loading ? (
                    <LoadingScreen fullScreen={false} message="Sincronizando Fluxo de Campo..." />
                ) : filteredAppointments.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={64} weight="duotone" />
                        <h2>Nenhum agendamento encontrado</h2>
                        <p>Ajuste os filtros ou crie um novo compromisso no botão superior.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="appt-table">
                        <div className="table-header">
                            <div className="col-id">Identificação</div>
                            <div className="col-time">Temporal</div>
                            <div className="col-resp">Responsável</div>
                            <div className="col-loc">Localização</div>
                            <div className="col-status">Status</div>
                            <div className="col-confirm">Cliente</div>
                            <div className="col-actions">Ações</div>
                        </div>
                        <AnimatePresence>
                            {Object.entries(
                                filteredAppointments.reduce((groups, appt) => {
                                    const date = new Date(appt.dataInicio).toDateString();
                                    if (!groups[date]) groups[date] = [];
                                    groups[date].push(appt);
                                    return groups;
                                }, {} as Record<string, Appointment[]>)
                            ).map(([date, group]) => (
                                <React.Fragment key={date}>
                                    <div className="group-header">
                                        <Calendar size={16} />
                                        <span>{new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                                        <div className="group-line" />
                                    </div>
                                    {group.map(appt => (
                                        <motion.div
                                            className="table-row"
                                            key={appt.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <div className="col-id">
                                                <div className="lead-info">
                                                    <span className="lead-name">{appt.titulo}</span>
                                                    <span className="type-badge" data-type={appt.tipo}>{appt.tipo.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <div className="col-time">
                                                <div className="time-info">
                                                    <span className="time-val">{new Date(appt.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="remaining-badge">{getTimeRemaining(appt.dataInicio)}</span>
                                                </div>
                                            </div>
                                            <div className="col-resp">
                                                <div className="resp-info">
                                                    <div className="avatar-chip">
                                                        <img src={`https://ui-avatars.com/api/?name=${appt.vendedorId || 'U'}&background=random`} alt="" />
                                                        <span>{appt.vendedorId || 'S/R'}</span>
                                                    </div>
                                                    {appt.equipeIds && appt.equipeIds.length > 0 && <span className="team-label">Equipe Alpha</span>}
                                                </div>
                                            </div>
                                            <div className="col-loc">
                                                <div className="loc-info">
                                                    <span className="loc-text">{appt.bairro}, {appt.cidade}</span>
                                                    <button className="btn-map" onClick={() => window.open(appt.linkGoogleMaps, '_blank')}>
                                                        <NavigationArrow size={16} weight="fill" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-status">
                                                <span className="status-badge" style={{ background: getStatusStyle(appt.status).bg, color: getStatusStyle(appt.status).color }}>
                                                    {getStatusStyle(appt.status).label}
                                                </span>
                                            </div>
                                            <div className="col-confirm">
                                                {appt.dataConfirmacao ? (
                                                    <div className="confirm-indicator confirmed" title={`Confirmado em ${new Date(appt.dataConfirmacao).toLocaleString()}`}>
                                                        {appt.canalConfirmacao === 'WHATSAPP' ? <WhatsappLogo size={18} weight="fill" /> : <Checks size={18} weight="bold" />}
                                                        <span className="confirm-date">{new Date(appt.dataConfirmacao).toLocaleDateString()}</span>
                                                    </div>
                                                ) : (
                                                    <div className="confirm-indicator pending">
                                                        <Clock size={18} />
                                                        <span>Pendente</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-actions">
                                                <div className="action-pill">
                                                    {!appt.dataConfirmacao && <button title="Confirmar Presença" className="action-item ok"><Checks /></button>}
                                                    <button title="Reagendar" className="action-item"><ArrowsClockwise /></button>
                                                    <button title="Abrir Detalhe" className="action-item"><ArrowSquareOut /></button>
                                                    <div className="action-divider" />
                                                    <button className="action-more"><DotsThreeVertical weight="bold" /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="calendar-view-pane">
                        <div className="lane-header">
                            <div className="time-col" />
                            {/* Lanes por Responsável */}
                            <div className="lane-col">
                                <img src="https://ui-avatars.com/api/?name=Vendedor+Carlos" alt="" />
                                <span>Carlos (Comercial)</span>
                            </div>
                            <div className="lane-col">
                                <img src="https://ui-avatars.com/api/?name=Equipe+Alpha" alt="" />
                                <span>Equipe Alpha</span>
                            </div>
                            <div className="lane-col">
                                <img src="https://ui-avatars.com/api/?name=Equipe+Bravo" alt="" />
                                <span>Equipe Bravo</span>
                            </div>
                        </div>
                        <div className="lane-grid ic-sidebar-scroll">
                            <div className="time-labels">
                                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                                    <div key={h} className="time-slot-label">{h}:00</div>
                                ))}
                            </div>
                            <div className="grid-content">
                                {/* Linhas de grade */}
                                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                                    <div key={h} className="grid-row" />
                                ))}

                                {/* Blocos de Agendamento (Posicionamento absoluto calculado) */}
                                <motion.div
                                    className="appt-block"
                                    style={{ top: '100px', left: '10%', width: '25%', height: '80px' }}
                                    drag="y"
                                    dragConstraints={{ top: 0, bottom: 800 }}
                                    whileHover={{ scale: 1.02, zIndex: 10 }}
                                >
                                    <div className="block-tag tint-blue" />
                                    <div className="block-info">
                                        <strong>Instalação Residencial</strong>
                                        <span>João Silva</span>
                                    </div>
                                    <div className="block-warning"><Warning size={14} /> Conflito</div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {selectedApptId && (
                    <AppointmentDetailModal
                        apptId={selectedApptId}
                        onClose={() => setSelectedApptId(null)}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .appt-dashboard {
                    padding: 2.5rem;
                    background: #080a0f;
                    height: 100%;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                /* HEADER */
                .appt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .title-group h1 { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0; }
                .count-badge { font-size: 0.8rem; color: #475569; font-weight: 600; }

                .view-selector {
                    background: #11141d;
                    padding: 4px;
                    border-radius: 12px;
                    display: flex;
                    margin-top: 1rem;
                    border: 1px solid #1e2430;
                }
                .view-selector button {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .view-selector button.active {
                    background: #1e2430;
                    color: #fff;
                }

                .header-right { display: flex; gap: 1rem; align-items: center; }
                .search-bar {
                    background: #11141d;
                    border: 1px solid #1e2430;
                    border-radius: 12px;
                    padding: 0 16px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 320px;
                }
                .search-bar input { background: transparent; border: none; color: #fff; outline: none; width: 100%; }

                .btn-create {
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    padding: 0 24px;
                    height: 48px;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-create:hover { background: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }

                /* ATTENTION PANEL */
                .attention-panel {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }
                .stat-card {
                    background: #11141d;
                    border: 1px solid #1e2430;
                    padding: 1.5rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 1.2rem;
                    transition: all 0.3s;
                }
                .stat-card.urgent { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
                .stat-card.warning { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }

                .stat-icon {
                    width: 48px; height: 48px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.5rem;
                }
                .stat-icon.blue { background: #2563eb20; color: #3b82f6; }
                .stat-icon.yellow { background: #f59e0b20; color: #f59e0b; }
                .stat-icon.red { background: #ef444420; color: #ef4444; }
                .stat-icon.purple { background: #8b5cf620; color: #8b5cf6; }

                .stat-info h3 { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
                .stat-info p { font-size: 1.1rem; color: #fff; margin: 4px 0 0; }
                .stat-info strong { color: #fff; font-weight: 800; }

                /* FILTERS */
                .filter-chips { display: flex; gap: 8px; align-items: center; }
                .filter-chips button {
                    background: transparent; border: 1px solid #1e2430;
                    color: #64748b; padding: 8px 16px; border-radius: 999px;
                    font-size: 0.85rem; font-weight: 600; cursor: pointer;
                    transition: all 0.2s;
                }
                .filter-chips button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
                .filter-divider { width: 1px; height: 24px; background: #1e2430; margin: 0 8px; }
                .filter-btn { display: flex; align-items: center; gap: 8px; }

                /* TABLE */
                .appt-table {
                    display: flex; flex-direction: column; gap: 8px;
                }
                .table-header {
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1.2fr 1.2fr 1.5fr;
                    padding: 0 24px 12px;
                    color: #475569; font-size: 0.75rem; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.1em;
                }
                .table-row {
                    background: #11141d;
                    border: 1px solid #1e2430;
                    border-radius: 16px;
                    padding: 1rem 24px;
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1.2fr 1.2fr 1.5fr;
                    align-items: center;
                    transition: all 0.2s;
                }
                .table-row:hover { border-color: #3b82f640; background: #161b26; transform: translateX(4px); }

                /* GROUP HEADERS */
                .group-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 2rem 1rem 1rem;
                    color: #475569;
                    font-size: 0.85rem;
                    font-weight: 700;
                }
                .group-header span { color: #94a3b8; text-transform: capitalize; }
                .group-line { flex: 1; height: 1px; background: linear-gradient(to right, #1e2430, transparent); }

                .lead-name { display: block; color: #fff; font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
                .type-badge {
                    font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
                    padding: 2px 8px; border-radius: 4px; background: #1e2430; color: #94a3b8;
                }
                .type-badge[data-type="INSTALACAO"] { background: #3b82f620; color: #3b82f6; }

                .time-info { display: flex; flex-direction: column; gap: 2px; }
                .time-val { color: #fff; font-weight: 800; font-size: 1rem; }
                .day-val { color: #64748b; font-size: 0.8rem; }
                .remaining-badge {
                    font-size: 0.65rem; color: #3b82f6; font-weight: 800;
                    background: #3b82f615; padding: 1px 6px; border-radius: 4px; width: fit-content; margin-top: 4px;
                }

                .avatar-chip { display: flex; align-items: center; gap: 10px; color: #cbd5e1; font-weight: 600; font-size: 0.9rem; }
                .avatar-chip img { width: 28px; height: 28px; border-radius: 8px; background: #2d3748; }
                .team-label { font-size: 0.7rem; color: #64748b; margin-top: 2px; display: block; }

                .loc-info { display: flex; align-items: center; gap: 12px; }
                .loc-text { color: #94a3b8; font-size: 0.85rem; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .btn-map {
                    width: 32px; height: 32px; border-radius: 8px; border: 1px solid #1e2430;
                    background: transparent; color: #3b82f6; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
                }
                .btn-map:hover { background: #3b82f610; border-color: #3b82f6; }

                .status-badge {
                    padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800;
                    text-align: center; display: inline-block; min-width: 100px;
                }

                .confirm-indicator { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
                .confirm-indicator.confirmed { color: #10b981; }
                .confirm-indicator.pending { color: #475569; }
                .confirm-date { font-size: 0.7rem; color: #64748b; font-weight: 600; }

                .action-pill {
                    background: #080a0f; border: 1px solid #1e2430;
                    border-radius: 10px; padding: 4px; display: flex; align-items: center; gap: 4px;
                    width: fit-content;
                }
                .action-item {
                    width: 32px; height: 32px; border: none; background: transparent;
                    color: #64748b; border-radius: 6px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
                }
                .action-item:hover { background: #1e2430; color: #fff; }
                .action-item.ok { color: #10b981; background: #10b98110; }
                .action-divider { width: 1px; height: 16px; background: #1e2430; margin: 0 4px; }
                .action-more { background: transparent; border: none; color: #475569; cursor: pointer; padding: 4px; }

                .empty-state {
                    padding: 4rem; text-align: center; color: #475569;
                    display: flex; flex-direction: column; align-items: center; gap: 1rem;
                }
                .empty-state h2 { color: #fff; margin: 0; }

                /* CALENDAR VIEW PANE */
                .calendar-view-pane {
                    background: #11141d; border: 1px solid #1e2430; border-radius: 24px;
                    display: flex; flex-direction: column; overflow: hidden; height: 700px;
                }
                .lane-header {
                    display: grid; grid-template-columns: 80px 1fr 1fr 1fr;
                    border-bottom: 1px solid #1e2430; background: #0c0f16;
                }
                .time-col { border-right: 1px solid #1e2430; }
                .lane-col {
                    padding: 1rem; display: flex; align-items: center; gap: 12px;
                    border-right: 1px solid #1e2430; font-weight: 700; color: #fff; font-size: 0.9rem;
                }
                .lane-col img { width: 32px; height: 32px; border-radius: 10px; }

                .lane-grid {
                    display: grid; grid-template-columns: 80px 1fr; overflow-y: auto; flex: 1; position: relative;
                }
                .time-labels { border-right: 1px solid #1e2430; background: #0c0f16; }
                .time-slot-label {
                    height: 80px; display: flex; align-items: flex-start; justify-content: center;
                    padding-top: 10px; font-size: 0.7rem; color: #475569; font-weight: 800; border-bottom: 1px solid #1e2430;
                }
                
                .grid-content { position: relative; background: #11141d; min-height: 880px; }
                .grid-row { height: 80px; border-bottom: 1px solid #1e243020; }

                /* APPT BLOCKS */
                .appt-block {
                    position: absolute; background: #1a1e2a; border: 1px solid #1e2430;
                    border-radius: 12px; display: flex; overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3); border-left-width: 4px;
                    cursor: grab;
                }
                .appt-block:active { cursor: grabbing; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                
                .block-tag { width: 4px; height: 100%; }
                .block-tag.tint-blue { background: #3b82f6; }
                
                .block-info { padding: 10px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
                .block-info strong { font-size: 0.8rem; color: #fff; }
                .block-info span { font-size: 0.7rem; color: #64748b; }
                
                .block-warning {
                    background: #f59e0b; color: #000; font-size: 0.6rem; font-weight: 900;
                    padding: 2px 6px; position: absolute; top: 8px; right: 8px; border-radius: 4px;
                    display: flex; align-items: center; gap: 4px; text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

// --- SUB-COMPONENTE: DETALHE DO AGENDAMENTO ---
const AppointmentDetailModal: React.FC<{ apptId: string; onClose: () => void }> = ({ apptId, onClose }) => {
    return (
        <div className="modal-overlay">
            <motion.div
                className="detail-panel ic-sidebar-scroll"
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
            >
                <header className="detail-header">
                    <div className="header-labels">
                        <span className="type-pill">VISTORIA TÉCNICA</span>
                        <h2>Instalação Residencial - Prédio Solar</h2>
                        <div className="status-selector">
                            <span className="status-current em-andamento">Em Andamento</span>
                            <CaretDown size={14} />
                        </div>
                    </div>
                    <button className="btn-close-circle" onClick={onClose}><X /></button>
                </header>

                <div className="detail-grid">
                    {/* COLUNA ESQUERDA - INFOS E EXECUÇÃO */}
                    <div className="detail-col main">
                        <section className="detail-section card">
                            <div className="section-title">
                                <Clock size={18} /> Tempo de Execução
                            </div>
                            <div className="timer-block">
                                <div className="timer-val">00:42:15</div>
                                <div className="timer-label">Tempo decorrido desde o check-in</div>
                            </div>
                        </section>

                        <section className="detail-section card">
                            <div className="section-title">
                                <MapPin size={18} /> Endereço de Atendimento
                            </div>
                            <div className="address-display">
                                <p>Rua das Flores, 123 - Ap 402</p>
                                <p className="sub">Bairro Jardim - São Paulo/SP</p>
                                <div className="map-placeholder">
                                    <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400" alt="Map View" />
                                    <button className="btn-open-maps"><GoogleLogo size={20} weight="bold" /> Abrir no Google Maps</button>
                                </div>
                            </div>
                        </section>

                        <section className="detail-section card">
                            <div className="section-title">
                                <Checks size={18} /> Resultado do Agendamento
                            </div>
                            <div className="form-group-modern">
                                <label>Obrigatório para conclusão</label>
                                <select className="modern-select">
                                    <option value="">Selecione o desfecho...</option>
                                    <option value="SUCESSO">Realizado com Sucesso</option>
                                    <option value="AUSENTE">Cliente não estava no local</option>
                                    <option value="NAO_LOCALIZADO">Endereço não localizado</option>
                                    <option value="RECUSADO">Cliente desistiu na hora</option>
                                    <option value="TECNICO">Problema técnico/Viabilidade</option>
                                </select>
                            </div>
                            <textarea className="modern-textarea" placeholder="Observações adicionais da execução..."></textarea>
                            <button className="btn-confirm-action">Finalizar Atendimento</button>
                        </section>
                    </div>

                    {/* COLUNA DIREITA - RESPONSÁVEIS E HISTÓRICO */}
                    <div className="detail-col side">
                        <section className="detail-section">
                            <div className="section-title small">Responsáveis</div>
                            <div className="resp-card">
                                <div className="resp-item">
                                    <img src="https://ui-avatars.com/api/?name=Vendedor+Carlos" alt="" />
                                    <div>
                                        <strong>Carlos (Comercial)</strong>
                                        <span>Responsável Origem</span>
                                    </div>
                                </div>
                                <div className="resp-divider" />
                                <div className="resp-item">
                                    <img src="https://ui-avatars.com/api/?name=Tecnico+Andre" alt="" />
                                    <div>
                                        <strong>André (Técnico)</strong>
                                        <span>Executor designado</span>
                                    </div>
                                    <button className="btn-swap"><ArrowsClockwise /></button>
                                </div>
                            </div>
                        </section>

                        <section className="detail-section">
                            <div className="section-title small">Histórico Timeline</div>
                            <div className="timeline-container">
                                {[
                                    { t: '14:20', e: 'Check-in realizado por André via App Técnico' },
                                    { t: '11:00', e: 'Confirmado via WhatsApp (Cliente deu OK)' },
                                    { t: '09:15', e: 'Agendamento criado por Carlos' }
                                ].map((step, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="time">{step.t}</div>
                                        <div className="dot" />
                                        <div className="event">{step.e}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <style>{`
                    .detail-panel {
                        position: fixed; top: 0; right: 0; width: 600px; height: 100vh;
                        background: #0c0f16; border-left: 1px solid #1e2430;
                        z-index: 3000; box-shadow: -20px 0 50px rgba(0,0,0,0.5);
                        padding: 2.5rem; display: flex; flex-direction: column; gap: 2.5rem;
                        overflow-y: auto;
                    }
                    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
                    .header-labels h2 { font-size: 1.5rem; color: #fff; margin: 8px 0 12px; font-weight: 800; }
                    .type-pill { font-size: 0.7rem; font-weight: 900; color: #3b82f6; background: #3b82f615; padding: 4px 10px; border-radius: 6px; }
                    .status-selector {
                        display: flex; align-items: center; gap: 10px; color: #fff; background: #22c55e15; border: 1px solid #22c55e20;
                        padding: 6px 14px; border-radius: 999px; width: fit-content; cursor: pointer;
                    }
                    .status-current { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }

                    .btn-close-circle {
                        width: 40px; height: 40px; border-radius: 50%; background: #1a1e2a; border: none; color: #64748b;
                        display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
                    }
                    .btn-close-circle:hover { background: #ef444420; color: #ef4444; }

                    .detail-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
                    .detail-section.card { background: #11141d; border: 1px solid #1e2430; border-radius: 20px; padding: 1.5rem; }
                    .section-title { font-size: 0.9rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; }
                    .section-title.small { font-size: 0.75rem; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }

                    .timer-val { font-size: 2.5rem; font-weight: 900; color: #fff; font-family: monospace; letter-spacing: -2px; }
                    .timer-label { font-size: 0.75rem; color: #64748b; margin-top: 4px; }

                    .address-display p { color: #fff; font-weight: 600; margin: 0; }
                    .address-display p.sub { color: #64748b; font-size: 0.85rem; margin-top: 4px; }
                    .map-placeholder { margin-top: 1rem; border-radius: 12px; overflow: hidden; position: relative; height: 120px; }
                    .map-placeholder img { width: 100%; height: 100%; object-fit: cover; opacity: 0.4; filter: grayscale(1); }
                    .btn-open-maps {
                        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: #3b82f6; color: #fff; border: none; padding: 8px 16px; border-radius: 8px;
                        font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.8rem;
                    }

                    .modern-select, .modern-textarea {
                        width: 100%; background: #080a0f; border: 1px solid #1e2430; color: #fff;
                        padding: 12px; border-radius: 12px; outline: none; transition: all 0.2s;
                    }
                    .modern-textarea { height: 80px; resize: none; margin: 12px 0; }
                    .btn-confirm-action {
                        width: 100%; background: #2563eb; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer;
                    }

                    .resp-card { background: #11141d; border: 1px solid #1e2430; border-radius: 16px; overflow: hidden; }
                    .resp-item { padding: 1rem; display: flex; align-items: center; gap: 12px; }
                    .resp-item img { width: 36px; height: 36px; border-radius: 8px; }
                    .resp-item strong { display: block; color: #fff; font-size: 0.9rem; }
                    .resp-item span { font-size: 0.7rem; color: #64748b; }
                    .resp-divider { height: 1px; background: #1e2430; }
                    .btn-swap { margin-left: auto; background: transparent; border: none; color: #3b82f6; cursor: pointer; }

                    .timeline-container { border-left: 1px solid #1e2430; margin-left: 8px; padding-left: 20px; display: flex; flex-direction: column; gap: 1.5rem; }
                    .timeline-item { position: relative; }
                    .timeline-item .dot { position: absolute; left: -25px; top: 6px; width: 9px; height: 9px; background: #3b82f6; border-radius: 50%; border: 2px solid #0c0f16; }
                    .timeline-item .time { font-size: 0.7rem; color: #475569; font-weight: 800; margin-bottom: 4px; }
                    .timeline-item .event { color: #94a3b8; font-size: 0.85rem; line-height: 1.4; }
                `}</style>
            </motion.div>
        </div>
    );
};

export default AppointmentManager;
