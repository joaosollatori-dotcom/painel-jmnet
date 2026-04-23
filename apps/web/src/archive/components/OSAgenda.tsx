import React, { useState, useEffect, useRef } from 'react';
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
    scheduled_date: string;
    tecnico_id: string;
    tecnico_name?: string;
    address?: string;
    pos_x?: number;
    pos_y?: number;
}

const TECNICOS = [
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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOrders();
        const subscribe = supabase.channel('agenda_v2_pos')
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
                .order('scheduled_date', { ascending: true });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Erro ao carregar agenda:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (orderId: string, event: any, info: any) => {
        // Registro de Posição (Eixos X e Y apenas para layout)
        const { x, y } = info.point;
        // Ajustamos os valores para escala local do container para persistência coerente
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const relativeX = Math.round(info.offset.x);
        const relativeY = Math.round(info.offset.y);

        try {
            const { error } = await supabase
                .from('service_orders')
                .update({
                    pos_x: relativeX,
                    pos_y: relativeY
                })
                .eq('id', orderId);

            if (error) throw error;
            showToast('Posição salva visualmente', 'success');
        } catch (err) {
            console.error('Erro ao salvar posição:', err);
        }
    };

    const getOrdersForTecnico = (tecnicoId: string) => {
        return orders.filter(o => o.tecnico_id === tecnicoId);
    };

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-deep)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Agenda de Ordem de Serviço</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Registro visual de cards e posicionamento técnico (v2.05.32)</p>
                </div>
            </div>

            <div ref={containerRef} style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '150px 1fr', overflow: 'hidden', minHeight: '650px' }}>
                {/* Eixo Y: Equipe */}
                <div style={{ borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>TÉCNICOS</div>
                    {TECNICOS.map(t => (
                        <div key={t.id} style={{ height: '140px', borderBottom: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.name}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{getOrdersForTecnico(t.id).length} Ordens</div>
                        </div>
                    ))}
                </div>

                {/* Grid Visual (Eixo X Horários apenas como referência visual) */}
                <div style={{ position: 'relative', overflowX: 'auto' }}>
                    <div style={{ height: '50px', minWidth: '800px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)` }}>
                        {TIME_SLOTS.map(slot => (
                            <div key={slot} style={{ borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{slot}</div>
                        ))}
                    </div>

                    {TECNICOS.map((t) => (
                        <div key={t.id} style={{ height: '140px', minWidth: '800px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${TIME_SLOTS.length}, 1fr)`, position: 'relative' }}>
                            {TIME_SLOTS.map(slot => <div key={slot} style={{ borderRight: '1px solid var(--border)', opacity: 0.05, background: 'rgba(0,0,0,0.1)' }}></div>)}

                            {/* Renderização de Cards Baseada em Posição e Técnico Inicial */}
                            {getOrdersForTecnico(t.id).map(order => (
                                <motion.div
                                    key={order.id}
                                    drag
                                    dragConstraints={containerRef}
                                    onDragEnd={(e, info) => handleDragEnd(order.id, e, info)}
                                    // Posição inicial recuperada do banco (Registro Visual)
                                    initial={{ x: order.pos_x || 10, y: order.pos_y || 10 }}
                                    whileDrag={{ zIndex: 1000, scale: 1.05 }}
                                    style={{
                                        position: 'absolute', width: '220px', height: '110px',
                                        background: order.priority === 'High' ? '#ef4444' : 'var(--accent)',
                                        color: '#fff', borderRadius: '16px', padding: '16px',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.15)', cursor: 'grab', zIndex: 10
                                    }}
                                >
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, marginBottom: '4px', opacity: 0.8 }}>{order.protocolo || 'SEM PROT.'}</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px', lineHeight: 1.2 }}>{order.customer_name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.9 }}>
                                        <Clock size={14} /> {order.scheduled_date ? new Date(order.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'S/H'}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', opacity: 0.3 }}>
                                        <Wrench size={24} weight="fill" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OSAgenda;
