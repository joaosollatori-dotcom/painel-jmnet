import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Clock, Funnel, CaretLeft, CaretRight, MapPin, Wrench, Warning, MagnifyingGlass } from '@phosphor-icons/react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
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

const TECNICOS = [
    { id: 't1', name: 'Carlos (Campo 1)' },
    { id: 't2', name: 'André (Reparos)' },
    { id: 't3', name: 'Felipe (Instalações)' },
    { id: 't4', name: 'Marcos (Fibra)' }
];

const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00', '17:00'];
const SLOT_WIDTH = 160; // Largura aproximada de cada coluna de tempo
const ROW_HEIGHT = 120; // Altura aproximada de cada linha de técnico

const OSAgenda: React.FC = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOrders();
        const subscribe = supabase.channel('agenda_realtime_drag')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => {
                fetchOrders();
            })
            .subscribe();
        return () => { supabase.removeChannel(subscribe); };
    }, []);

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

    const handleDragEnd = async (orderId: string, event: any, info: any) => {
        // Motor de cálculo de Coordenadas (X, Y)
        // X = Tempo, Y = Técnico
        const { x, y } = info.offset;

        // Calcular deslocamento em slots
        const slotsX = Math.round(x / (containerRef.current?.offsetWidth || 800) * TIME_SLOTS.length);
        const slotsY = Math.round(y / ROW_HEIGHT);

        const currentOrder = orders.find(o => o.id === orderId);
        if (!currentOrder) return;

        // Encontrar novo técnico e novo horário (Lógica simplificada de motor)
        const currentTecIdx = TECNICOS.findIndex(t => t.id === currentOrder.tecnico_id);
        const currentTimeIdx = TIME_SLOTS.findIndex(s => currentOrder.scheduled_time?.includes(s));

        let nextTecIdx = currentTecIdx + slotsY;
        let nextTimeIdx = currentTimeIdx + slotsX;

        // Bounds check
        nextTecIdx = Math.max(0, Math.min(nextTecIdx, TECNICOS.length - 1));
        nextTimeIdx = Math.max(0, Math.min(nextTimeIdx, TIME_SLOTS.length - 1));

        const nextTec = TECNICOS[nextTecIdx];
        const nextTime = TIME_SLOTS[nextTimeIdx];

        if (nextTec.id === currentOrder.tecnico_id && nextTime === currentOrder.scheduled_time) return;

        try {
            // Persistência Automática (Auto-Save)
            const { error } = await supabase
                .from('service_orders')
                .update({
                    tecnico_id: nextTec.id,
                    tecnico_name: nextTec.name,
                    scheduled_time: `2026-04-20 ${nextTime}:00`
                })
                .eq('id', orderId);

            if (error) throw error;
            showToast(`OS Movida para ${nextTec.name} às ${nextTime}`, 'success');
            fetchOrders();
        } catch (err) {
            showToast('Erro ao atualizar posição no Supabase', 'error');
            fetchOrders(); // Reset visual
        }
    };

    const getOrderAt = (tecnicoId: string, slot: string) => {
        return orders.find(o => o.tecnico_id === tecnicoId && o.scheduled_time?.includes(slot));
    };

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-deep)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Agenda: Motor Drag-and-Drop</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Clique e arraste os cards para reagendar em tempo real (Auto-Save)</p>
                </div>
            </div>

            <div ref={containerRef} style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '150px 1fr', overflow: 'hidden', minHeight: '600px' }}>
                {/* Linha de Técnicos */}
                <div style={{ borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>TÉCNICOS (EIXO Y)</div>
                    {TECNICOS.map(t => (
                        <div key={t.id} style={{ height: '120px', borderBottom: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{t.name}</div>
                        </div>
                    ))}
                </div>

                {/* Grid de Horários */}
                <div style={{ position: 'relative', overflowX: 'auto' }}>
                    <div style={{ height: '50px', minWidth: '800px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)` }}>
                        {TIME_SLOTS.map(slot => (
                            <div key={slot} style={{ borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{slot} (EIXO X)</div>
                        ))}
                    </div>

                    {TECNICOS.map((t) => (
                        <div key={t.id} style={{ height: '120px', minWidth: '800px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)`, position: 'relative' }}>
                            {TIME_SLOTS.map(slot => {
                                const order = getOrderAt(t.id, slot);
                                return (
                                    <div key={slot} style={{ borderRight: '1px solid var(--border)', position: 'relative', background: 'rgba(0,0,0,0.01)' }}>
                                        {order && (
                                            <motion.div
                                                drag
                                                dragConstraints={containerRef}
                                                dragElastic={0.1}
                                                onDragEnd={(e, info) => handleDragEnd(order.id, e, info)}
                                                whileDrag={{
                                                    scale: 1.1,
                                                    zIndex: 1000,
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                                    cursor: 'grabbing'
                                                }}
                                                style={{
                                                    position: 'absolute', inset: '8px', zIndex: 10,
                                                    background: order.priority === 'High' ? '#ef4444' : order.type === 'Internal' ? '#10b981' : 'var(--accent)',
                                                    color: '#fff', borderRadius: '12px', padding: '10px',
                                                    fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px',
                                                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)', cursor: 'grab'
                                                }}
                                            >
                                                <div style={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                                    <span>{order.type.toUpperCase()}</span>
                                                    <Wrench size={12} weight="fill" />
                                                </div>
                                                <div style={{ fontWeight: 800 }}>{order.customer_name}</div>
                                                <div style={{ opacity: 0.8, fontSize: '0.6rem' }}>Arraste para Mudar</div>
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
