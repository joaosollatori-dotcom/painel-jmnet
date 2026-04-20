import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Funnel, CaretLeft, CaretRight, MapPin, Wrench, Warning, MagnifyingGlass } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface ServiceOrder {
    id: string;
    customer_name: string;
    protocolo: string;
    type: string;
    status: string;
    priority: string;
    scheduled_time: string;
    tecnico_id: string;
    tecnico_name?: string;
    address?: string;
}

const TECNICOS_MOCK = [
    { id: 't1', name: 'Carlos (Campo 1)' },
    { id: 't2', name: 'André (Reparos)' },
    { id: 't3', name: 'Felipe (Instalações)' },
    { id: 't4', name: 'Marcos (Fibra)' }
];

const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00', '17:00'];

const OSAgenda: React.FC = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        fetchOrders();
        const subscribe = supabase.channel('agenda_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => {
                fetchOrders();
            })
            .subscribe();
        return () => { supabase.removeChannel(subscribe); };
    }, [selectedDate]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('service_orders')
                .select('*')
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Erro ao carregar agenda:', err);
        } finally {
            setLoading(false);
        }
    };

    const getOrderAt = (tecnicoId: string, slot: string) => {
        return orders.find(o => o.tecnico_id === tecnicoId && o.scheduled_time?.includes(slot));
    };

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-deep)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Agenda Técnica de Campo</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Gestão de rotas e alocação em tempo real (v2.05.29)</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button className="wiki-cat-btn" style={{ border: 'none' }}><CaretLeft /></button>
                    <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                        {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(selectedDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <button className="wiki-cat-btn" style={{ border: 'none' }}><CaretRight /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="input-container" style={{ background: 'var(--bg-surface)' }}>
                    <Users size={18} />
                    <select style={{ background: 'none', border: 'none', color: 'inherit', width: '100%', outline: 'none' }}>
                        <option>Todos os Técnicos</option>
                        {TECNICOS_MOCK.map(t => <option key={t.id}>{t.name}</option>)}
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
                <button className="wiki-cat-btn active" onClick={fetchOrders}><Funnel /> Sincronizar Agora</button>
            </div>

            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '150px 1fr', overflow: 'hidden', minHeight: '600px' }}>
                {/* Lateral: Técnicos */}
                <div style={{ borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>EQUIPE</div>
                    {TECNICOS_MOCK.map(t => (
                        <div key={t.id} style={{ height: '120px', borderBottom: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.name}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{orders.filter(o => o.tecnico_id === t.id).length} Os Atribuídas</div>
                        </div>
                    ))}
                </div>

                {/* Grid: Horários */}
                <div style={{ position: 'relative', overflowX: 'auto' }}>
                    <div style={{ height: '50px', minWidth: '800px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)` }}>
                        {TIME_SLOTS.map(slot => (
                            <div key={slot} style={{ borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{slot}</div>
                        ))}
                    </div>

                    {TECNICOS_MOCK.map((t) => (
                        <div key={t.id} style={{ height: '120px', minWidth: '800px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)`, position: 'relative' }}>
                            {TIME_SLOTS.map(slot => {
                                const order = getOrderAt(t.id, slot);
                                return (
                                    <div key={slot} style={{ borderRight: '1px solid var(--border)', position: 'relative', background: 'rgba(0,0,0,0.01)' }}>
                                        {order && (
                                            <motion.div
                                                layoutId={order.id}
                                                whileHover={{ scale: 1.05, zIndex: 50 }}
                                                style={{
                                                    position: 'absolute', inset: '8px', zIndex: 10,
                                                    background: order.priority === 'High' ? '#ef4444' : order.type === 'Internal' ? '#10b981' : 'var(--accent)',
                                                    color: '#fff', borderRadius: '12px', padding: '10px',
                                                    fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)', cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                                    <span>{order.type.toUpperCase()}</span>
                                                    {order.priority === 'High' ? <Warning size={12} weight="fill" /> : <Wrench size={12} />}
                                                </div>
                                                <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer_name}</div>
                                                <div style={{ opacity: 0.8, fontSize: '0.6rem' }}>Prot: {order.protocolo || '---'}</div>
                                                {order.address && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', marginTop: '4px', opacity: 0.9 }}>
                                                        <MapPin size={10} /> {order.address.split(',')[0]}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OSAgenda;
