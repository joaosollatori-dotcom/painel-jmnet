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
    DotsThreeVertical, ArrowSquareOut,
    Timer
} from '@phosphor-icons/react';
import { Appointment, getAppointments, updateAppointment, createAppointment } from '../services/leadService';
import { logInteraction } from '../services/actionService';
import { useToast } from '../contexts/ToastContext';
import LoadingScreen from './LoadingScreen';

type ViewMode = 'list' | 'day' | 'week' | 'month';

// --- SUB-COMPONENTE: DETALHE DO AGENDAMENTO ---
const AppointmentDetailModal: React.FC<{ apptId: string; onClose: () => void }> = ({ apptId, onClose }) => {
    const { showToast } = useToast();

    const handleOpenMaps = () => {
        window.open(`https://google.com/maps?q=Av.+Paulista,+1000+-+Bela+Vista`);
    };

    const handleFinish = async () => {
        showToast('Enviando para Supabase...', 'info');
        await logInteraction(apptId, 'SYS', 'Protocolo Finalizado', 'Ordem de serviço finalizada e protocolo TXT/PDF gerado.');
        showToast('Protocolo Gerado com Sucesso!', 'success');
        onClose();
    };

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
                        <h2>Execução de Atendimento - ID: {apptId.slice(0, 8)}</h2>
                        <div className="status-selector">
                            <span className="status-current em-andamento">Em Andamento</span>
                            <CaretDown size={14} />
                        </div>
                    </div>
                    <button className="btn-close-circle" onClick={onClose}><X /></button>
                </header>

                <div className="detail-grid">
                    <div className="detail-col main">
                        <section className="detail-section card">
                            <div className="section-title"><Timer size={18} /> Tempo em Execução</div>
                            <div className="timer-block">
                                <div className="timer-val">01:12:45</div>
                                <div className="timer-label">Tracking de produtividade em tempo real</div>
                            </div>
                        </section>

                        <section className="detail-section card">
                            <div className="section-title"><MapPin size={18} /> Destino</div>
                            <div className="address-display">
                                <p>Av. Paulista, 1000 - Bela Vista</p>
                                <p className="sub">CEP: 01310-100 - São Paulo/SP</p>
                                <div className="map-placeholder">
                                    <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400" alt="Map" />
                                    <button className="btn-open-maps" onClick={handleOpenMaps}><GoogleLogo size={20} weight="bold" /> Ver Caminho</button>
                                </div>
                            </div>
                        </section>

                        <section className="detail-section card">
                            <div className="section-title"><Checks size={18} /> Resultado</div>
                            <select className="modern-select">
                                <option>Selecione o desfecho...</option>
                                <option>SUCESSO - Ativado</option>
                                <option>FALHA - Cliente Ausente</option>
                                <option>REAGENDADO - Pedido do Cliente</option>
                            </select>
                            <textarea className="modern-textarea" placeholder="Relatório técnico de campo..."></textarea>
                            <button className="btn-confirm-action" onClick={handleFinish}>Finalizar e Gerar Protocolo</button>
                        </section>
                    </div>

                    <div className="detail-col side">
                        <section className="detail-section">
                            <div className="section-title small">Equipe Field</div>
                            <div className="resp-card">
                                <div className="resp-item">
                                    <img src="https://ui-avatars.com/api/?name=Tecnico+X&background=0284c7&color=fff" alt="" />
                                    <div><strong>João Silva</strong><span>Técnico Responsável</span></div>
                                </div>
                                <div className="resp-divider" />
                                <div className="resp-item">
                                    <img src="https://ui-avatars.com/api/?name=Vendedor+Y&background=10b981&color=fff" alt="" />
                                    <div><strong>Maria Souza</strong><span>Consultor Comercial</span></div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <style>{`
                    .detail-panel { position: fixed; top: 0; right: 0; width: 600px; height: 100vh; background: #0c0f16; border-left: 1px solid #1e2430; z-index: 3000; padding: 2.5rem; overflow-y: auto; }
                    .detail-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
                    .header-labels h2 { font-size: 1.4rem; color: #fff; margin: 8px 0; }
                    .type-pill { font-size: 0.7rem; font-weight: 900; color: #3b82f6; background: #3b82f615; padding: 4px 10px; border-radius: 6px; }
                    .status-selector { display: flex; align-items: center; gap: 8px; color: #10b981; background: #10b98115; padding: 6px 14px; border-radius: 99px; width: fit-content; font-size: 0.8rem; font-weight: 800; }
                    .detail-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
                    .detail-section.card { background: #11141d; border: 1px solid #1e2430; border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; }
                    .section-title { font-size: 0.9rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
                    .timer-val { font-size: 2.5rem; font-weight: 900; color: #fff; font-family: monospace; }
                    .modern-select, .modern-textarea { width: 100%; background: #080a0f; border: 1px solid #1e2430; color: #fff; padding: 12px; border-radius: 12px; margin-bottom: 1rem; }
                    .btn-confirm-action { width: 100%; background: #2563eb; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; }
                    .resp-card { background: #11141d; border: 1px solid #1e2430; border-radius: 16px; padding: 1rem; }
                    .resp-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
                    .resp-item img { width: 32px; height: 32px; border-radius: 8px; }
                `}</style>
            </motion.div>
        </div>
    );
};

const AppointmentManager: React.FC = () => {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [resizingAppt, setResizingAppt] = useState<{ id: string, startY: number, startDuration: number } | null>(null);
    const [runningTimes, setRunningTimes] = useState<Record<string, number>>({});

    useEffect(() => { loadAppointments(); }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAppointments();
            setAppointments(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    // --- CRONÔMETRO REAL-TIME ---
    useEffect(() => {
        const interval = setInterval(() => {
            const updates: Record<string, number> = {};
            appointments.forEach(appt => {
                if (appt.status === 'EM_ANDAMENTO' && appt.dataInicio) {
                    const elapsed = Math.floor((Date.now() - new Date(appt.dataInicio).getTime()) / 1000);
                    updates[appt.id] = elapsed > 0 ? elapsed : 0;
                }
            });
            setRunningTimes(updates);
        }, 1000);
        return () => clearInterval(interval);
    }, [appointments]);

    // --- REDIMENSIONAMENTO DE DURAÇÃO ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingAppt) return;
            const deltaY = e.clientY - resizingAppt.startY;
            const extraMins = (deltaY / 80) * 60;
            const newDuration = Math.max(15, resizingAppt.startDuration + extraMins);
            setAppointments(prev => prev.map(a => a.id === resizingAppt.id ? { ...a, duracaoEstimada: Math.round(newDuration) } : a));
        };
        const handleMouseUp = async () => {
            if (!resizingAppt) return;
            const appt = appointments.find(a => a.id === resizingAppt.id);
            if (appt) await updateAppointment(appt.id, { duracaoEstimada: appt.duracaoEstimada });
            setResizingAppt(null);
            showToast('Duração atualizada', 'success');
        };
        if (resizingAppt) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingAppt, appointments]);

    // --- CÁLCULO DE DISTÂNCIA (GEOCONFLITOS) ---
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const attentionStats = useMemo(() => {
        const now = new Date();
        const dayAppts = appointments.filter(a => new Date(a.dataInicio).toDateString() === now.toDateString());
        let geoConflicts = 0;
        let businessAlerts = 0;

        dayAppts.forEach((a1, idx) => {
            if (a1.tipo === 'INSTALACAO' && !a1.viabilidadeConfirmada) businessAlerts++;
            const next = dayAppts.slice(idx + 1).find(a2 => a2.tecnicoId === a1.tecnicoId);
            if (next && a1.latitude && next.latitude) {
                const dist = calculateDistance(a1.latitude, a1.longitude || 0, next.latitude, next.longitude || 0);
                if (dist > 15) geoConflicts++;
            }
        });

        return {
            today: dayAppts.length,
            unconfirmed: appointments.filter(a => a.status === 'AGENDADO' && !a.dataConfirmacao).length,
            unattended: appointments.filter(a => a.status === 'NAO_ATENDIDO').length,
            conflicts: geoConflicts + businessAlerts
        };
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            const matchesSearch = appt.titulo.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || appt.status === filterStatus;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
    }, [appointments, searchTerm, filterStatus]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CONFIRMADO': return { bg: '#10b98120', color: '#10b981', label: 'Confirmado' };
            case 'EM_ANDAMENTO': return { bg: '#8b5cf620', color: '#8b5cf6', label: 'Em Andamento' };
            case 'NAO_ATENDIDO': return { bg: '#ef444420', color: '#ef4444', label: 'Não Atendido' };
            default: return { bg: '#3b82f620', color: '#3b82f6', label: 'Agendado' };
        }
    };

    const calculateBlockPos = (dateStr: string, duration: number = 60) => {
        const d = new Date(dateStr);
        const top = (d.getHours() - 8) * 80 + (d.getMinutes() / 60) * 80;
        return { top, height: (duration / 60) * 80 };
    };

    const handleDragEnd = async (appt: Appointment, info: any) => {
        const deltaMins = Math.round(info.offset.y / 80 * 4) * 15;
        const newStart = new Date(new Date(appt.dataInicio).getTime() + deltaMins * 60000);
        await updateAppointment(appt.id, { dataInicio: newStart.toISOString() });
        showToast('Agendamento movido', 'success');
        loadAppointments();
    };

    const formatElapsed = (s: number) => {
        const m = Math.floor(s / 60);
        return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    };

    const lanes = Array.from(new Set(appointments.map(a => a.vendedorId || 'S/R'))).map(id => ({ id, name: id }));

    return (
        <div className="appt-dashboard">
            <header className="appt-header">
                <div className="header-left">
                    <div className="title-group">
                        <h1>Controle de Operações</h1>
                        <span className="count-badge">{filteredAppointments.length} agendamentos ativos</span>
                    </div>
                    <div className="date-nav-controls">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))} className="nav-btn"><CaretDown style={{ transform: 'rotate(90deg)' }} /></button>
                        <h2 className="current-date-label">{currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</h2>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))} className="nav-btn"><CaretDown style={{ transform: 'rotate(-90deg)' }} /></button>
                    </div>
                </div>
                <div className="view-selector">
                    {['list', 'day', 'week', 'month'].map((v) => (
                        <button key={v} className={viewMode === v ? 'active' : ''} onClick={() => setViewMode(v as any)}>
                            {v === 'list' ? <List /> : v === 'day' ? <CalendarBlank /> : <Calendar />} {v.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            <section className="attention-panel">
                <div className="stat-card">
                    <div className="stat-icon blue"><Calendar /></div>
                    <div className="stat-info"><h3>Hoje</h3><p><strong>{attentionStats.today}</strong> serviços</p></div>
                </div>
                <div className="stat-card urgent">
                    <div className="stat-icon yellow"><Bell /></div>
                    <div className="stat-info"><h3>Sem Confirmação</h3><p><strong>{attentionStats.unconfirmed}</strong> pendentes</p></div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon red"><WarningCircle /></div>
                    <div className="stat-info"><h3>Pendências</h3><p><strong>{attentionStats.unattended}</strong> falhas</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><ArrowsClockwise /></div>
                    <div className="stat-info"><h3>Inviáveis</h3><p><strong>{attentionStats.conflicts}</strong> alertas</p></div>
                </div>
            </section>

            <main className="appt-content ic-sidebar-scroll">
                {viewMode === 'day' ? (
                    <div className="calendar-view-pane">
                        <div className="lane-header">
                            <div className="time-col" />
                            {lanes.map(l => (
                                <div key={l.id} className="lane-col">
                                    <img src={`https://ui-avatars.com/api/?name=${l.name}`} alt="" />
                                    <span>{l.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="lane-grid">
                            <div className="time-labels">
                                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => <div key={h} className="time-slot-label">{h}:00</div>)}
                            </div>
                            <div className="grid-content">
                                {filteredAppointments
                                    .filter(a => new Date(a.dataInicio).toDateString() === currentDate.toDateString())
                                    .map(appt => {
                                        const laneIdx = lanes.findIndex(l => l.id === (appt.vendedorId || 'S/R'));
                                        const { top, height } = calculateBlockPos(appt.dataInicio, appt.duracaoEstimada);
                                        return (
                                            <motion.div
                                                key={appt.id} className={`appt-block ${appt.status === 'EM_ANDAMENTO' ? 'pulse-active' : ''}`}
                                                style={{ top, left: `${(100 / lanes.length) * laneIdx + 0.5}%`, width: `${(100 / lanes.length) - 1}%`, height }}
                                                drag={!resizingAppt ? "y" : false} dragMomentum={false} onDragEnd={(_, i) => handleDragEnd(appt, i)}
                                                onClick={() => setSelectedApptId(appt.id)}
                                            >
                                                <div className="block-tag" style={{ background: getStatusStyle(appt.status).color }} />
                                                <div className="block-info">
                                                    <strong>{appt.titulo}</strong>
                                                    <div className="block-meta">
                                                        <span>{new Date(appt.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {runningTimes[appt.id] && <div className="block-chrono"> <Timer size={10} /> {formatElapsed(runningTimes[appt.id])}</div>}
                                                    </div>
                                                </div>
                                                <div className="resize-handle" onMouseDown={(e) => { e.stopPropagation(); setResizingAppt({ id: appt.id, startY: e.clientY, startDuration: appt.duracaoEstimada || 60 }); }} />
                                            </motion.div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'week' ? (
                    <div className="week-view-container">
                        <div className="week-grid-header">
                            <div className="time-col" />
                            {Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date(currentDate); d.setDate(d.getDate() - d.getDay() + i);
                                return <div key={i} className="week-day-col"><span>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span><strong>{d.getDate()}</strong></div>;
                            })}
                        </div>
                        <div className="week-grid-body">
                            <div className="week-grid-content">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const d = new Date(currentDate); d.setDate(d.getDate() - d.getDay() + i);
                                    return (
                                        <div key={i} className="week-lane">
                                            {filteredAppointments.filter(a => new Date(a.dataInicio).toDateString() === d.toDateString()).map(a => {
                                                const { top, height } = calculateBlockPos(a.dataInicio, a.duracaoEstimada);
                                                return <div key={a.id} className="week-appt-mini" style={{ top, height, borderLeft: `3px solid ${getStatusStyle(a.status).color}` }} onClick={() => setSelectedApptId(a.id)}>{a.titulo}</div>;
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="appt-table">
                        <div className="table-header"><div>Identificação</div><div>Temporal</div><div>Status</div><div>Responsável</div><div>Ações</div></div>
                        {filteredAppointments.map(a => (
                            <div key={a.id} className="table-row">
                                <div><strong>{a.titulo}</strong><br /><small>{a.tipo}</small></div>
                                <div>{new Date(a.dataInicio).toLocaleDateString()} {new Date(a.dataInicio).toLocaleTimeString()}</div>
                                <div><span className="status-badge" style={{ background: getStatusStyle(a.status).bg, color: getStatusStyle(a.status).color }}>{getStatusStyle(a.status).label}</span></div>
                                <div>{a.vendedorId || 'S/R'}</div>
                                <div><button onClick={() => setSelectedApptId(a.id)}><ArrowSquareOut /></button></div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <AnimatePresence>{selectedApptId && <AppointmentDetailModal apptId={selectedApptId} onClose={() => setSelectedApptId(null)} />}</AnimatePresence>

            <style>{`
                .appt-dashboard { padding: 2.5rem; background: #080a0f; height: 100vh; display: flex; flex-direction: column; gap: 1.5rem; overflow: hidden; }
                .appt-header { display: flex; justify-content: space-between; align-items: center; }
                .date-nav-controls { display: flex; align-items: center; gap: 1rem; background: #11141d; padding: 4px 12px; border-radius: 12px; border: 1px solid #1e2430; }
                .nav-btn { background: none; border: none; color: #fff; cursor: pointer; }
                .view-selector { background: #11141d; padding: 4px; border-radius: 12px; display: flex; border: 1px solid #1e2430; }
                .view-selector button { background: none; border: none; color: #64748b; padding: 8px 16px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
                .view-selector button.active { background: #1e2430; color: #fff; }
                .attention-panel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                .stat-card { background: #11141d; border: 1px solid #1e2430; padding: 1rem; border-radius: 16px; display: flex; align-items: center; gap: 1rem; }
                .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
                .stat-icon.blue { background: #3b82f615; color: #3b82f6; }
                .calendar-view-pane { background: #11141d; border-radius: 20px; flex: 1; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #1e2430; }
                .lane-header { display: flex; background: #0c0f16; border-bottom: 1px solid #1e2430; }
                .lane-col { flex: 1; padding: 12px; text-align: center; border-right: 1px solid #ffffff05; }
                .lane-col img { width: 24px; height: 24px; border-radius: 50%; margin-bottom: 4px; }
                .lane-grid { flex: 1; display: flex; overflow-y: auto; background: repeating-linear-gradient(#1e243005, #1e243005 79px, #1e243020 80px); }
                .time-labels { width: 60px; border-right: 1px solid #1e2430; }
                .time-slot-label { height: 80px; font-size: 0.65rem; color: #475569; text-align: center; padding: 10px; }
                .grid-content { flex: 1; position: relative; min-height: 1040px; }
                .appt-block { position: absolute; background: #1e2430; border: 1px solid #3b82f640; border-radius: 8px; display: flex; overflow: hidden; cursor: pointer; }
                .block-tag { width: 4px; }
                .block-info { padding: 8px; flex: 1; }
                .block-info strong { font-size: 0.7rem; color: #fff; display: block; }
                .block-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.6rem; color: #64748b; margin-top: 4px; }
                .block-chrono { background: #10b98120; color: #10b981; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-weight: 800; }
                .resize-handle { position: absolute; bottom: 0; left: 0; right: 0; height: 8px; cursor: ns-resize; }
                .pulse-active { animation: pulse 2s infinite; border-color: #8b5cf6; }
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); } }
                .week-view-container { display: flex; flex-direction: column; background: #11141d; flex: 1; border-radius: 20px; overflow: hidden; }
                .week-grid-header { display: flex; background: #0c0f16; border-bottom: 1px solid #1e2430; }
                .week-day-col { flex: 1; padding: 12px; text-align: center; border-right: 1px solid #ffffff05; }
                .week-day-col span { display: block; font-size: 0.6rem; color: #64748b; text-transform: uppercase; }
                .week-day-col strong { color: #fff; font-size: 1rem; }
                .week-grid-content { display: flex; flex: 1; position: relative; height: 1000px; }
                .week-lane { flex: 1; position: relative; border-right: 1px solid #ffffff05; }
                .week-appt-mini { position: absolute; width: 95%; left: 2.5%; background: #1e2430; font-size: 0.6rem; color: #fff; padding: 4px; border-radius: 4px; overflow: hidden; }
                .appt-table { background: #11141d; border-radius: 20px; padding: 1rem; }
                .table-header { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 0.5fr; padding-bottom: 12px; color: #475569; font-size: 0.7rem; font-weight: 800; }
                .table-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 0.5fr; align-items: center; padding: 12px 0; border-top: 1px solid #1e2430; font-size: 0.8rem; color: #fff; }
                .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
            `}</style>
        </div>
    );
};

export default AppointmentManager;
