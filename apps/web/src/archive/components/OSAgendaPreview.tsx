import React, { useState } from 'react';
import { Calendar, Users, Clock, Funnel, CaretLeft, CaretRight, MapPin, Wrench, Warning } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const TECNICOS = ['Carlos (Campo 1)', 'André (Reparos)', 'Felipe (Instalações)', 'Marcos (Fibra)'];
const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00', '17:00'];

const OSAgendaPreview: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-deep)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Agenda Técnica de Campo</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Alocação e roteirização de ordens de serviço</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button className="wiki-cat-btn" style={{ border: 'none' }}><CaretLeft /></button>
                    <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>20 Abr - 26 Abr, 2026</div>
                    <button className="wiki-cat-btn" style={{ border: 'none' }}><CaretRight /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="input-container" style={{ background: 'var(--bg-surface)' }}>
                    <Users size={18} />
                    <select style={{ background: 'none', border: 'none', color: 'inherit', width: '100%', outline: 'none' }}>
                        <option>Todos os Técnicos</option>
                        {TECNICOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div className="input-container" style={{ background: 'var(--bg-surface)' }}>
                    <Clock size={18} />
                    <select style={{ background: 'none', border: 'none', color: 'inherit', width: '100%', outline: 'none' }}>
                        <option>Turno: Todos</option>
                        <option>Manhã</option>
                        <option>Tarde</option>
                    </select>
                </div>
                <button className="wiki-cat-btn active"><Funnel /> Aplicar Filtros</button>
            </div>

            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '150px 1fr', overflow: 'hidden' }}>
                {/* Lateral: Técnicos */}
                <div style={{ borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>EQUIPE</div>
                    {TECNICOS.map(t => (
                        <div key={t} style={{ height: '120px', borderBottom: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>3 Atendimentos</div>
                        </div>
                    ))}
                </div>

                {/* Grid: Horários */}
                <div style={{ position: 'relative', overflowX: 'hidden' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)` }}>
                        {TIME_SLOTS.map(slot => (
                            <div key={slot} style={{ borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{slot}</div>
                        ))}
                    </div>

                    {TECNICOS.map((t, tIdx) => (
                        <div key={t} style={{ height: '120px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)`, position: 'relative' }}>
                            {/* Slots de Tempo */}
                            {TIME_SLOTS.map(slot => <div key={slot} style={{ borderRight: '1px solid var(--border)', opacity: 0.1, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)' }}></div>)}

                            {/* Card de OS (Posicionado) */}
                            {tIdx === 0 && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        position: 'absolute', left: '10%', top: '15%', width: '35%', height: '70%',
                                        background: 'var(--accent)', color: '#fff', borderRadius: '12px', padding: '12px',
                                        fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 10
                                    }}
                                >
                                    <div style={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                        <span>INSTALAÇÃO</span>
                                        <Wrench size={14} />
                                    </div>
                                    <div style={{ opacity: 0.9 }}>Residencial Liberty</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                        <MapPin size={12} /> Rua das Flores, 123
                                    </div>
                                </motion.div>
                            )}

                            {tIdx === 1 && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        position: 'absolute', left: '60%', top: '15%', width: '35%', height: '70%',
                                        background: '#f59e0b', color: '#fff', borderRadius: '12px', padding: '12px',
                                        fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 10
                                    }}
                                >
                                    <div style={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                        <span>REPARO URGENTE</span>
                                        <Warning size={14} />
                                    </div>
                                    <div style={{ opacity: 0.9 }}>Prédio Comercial Sky</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                        <MapPin size={12} /> Av. Central, 500
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OSAgendaPreview;
