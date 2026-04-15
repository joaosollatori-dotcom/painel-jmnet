import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, User, MapPin, CheckCircle, MagnifyingGlass, Funnel, X, Clock, UserGear, Info, ChatCircleText, WarningCircle } from '@phosphor-icons/react';
import { genericFilter } from '../utils/filterUtils';
import LoadingScreen from './LoadingScreen';
import { getServiceOrders, ServiceOrder, updateServiceOrder } from '../services/osService';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

    const handleFinishOS = async () => {
        if (!selectedOS) return;
        try {
            await updateServiceOrder(selectedOS.id, {
                status: 'FINALIZADA',
                data_conclusao: new Date().toISOString()
            });
            setOss(prev => prev.map(o => o.id === selectedOS.id ? { ...o, status: 'FINALIZADA', data_conclusao: new Date().toISOString() } : o));
            navigate('/os');
        } catch (err) {
            console.error('Erro ao finalizar OS:', err);
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
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', background: 'var(--bg-main)' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Ordens de Serviço</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerenciamento de campo e agendamento técnico.</p>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, tipo, descrição, assinante ou endereço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 44px', borderRadius: '8px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff'
                        }}
                    />
                </div>
                <button className="flex-center" style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#aaa', cursor: 'pointer' }}>
                    <Funnel size={20} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '100px 0' }}>
                        <LoadingScreen fullScreen={false} message="Sincronizando Ordens de Serviço..." />
                    </div>
                ) : filteredOSS.map(os => (
                    <div key={os.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px', background: `${getStatusColor(os.status)}20`, color: getStatusColor(os.status), fontWeight: 700 }}>{os.status}</span>
                            <span style={{ color: os.prioridade === 'URGENTE' ? '#ef4444' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>{os.prioridade}</span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem' }}>{os.tipo}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{os.descricao}</p>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <User size={16} />
                                <strong>{os.cliente_nome}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <MapPin size={16} />
                                <span>{os.cliente_endereco}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={16} />
                                <span>{os.data_agendamento ? new Date(os.data_agendamento).toLocaleDateString() : 'A definir'}</span>
                            </div>
                            <button
                                onClick={() => navigate(`/os/${os.id}`)}
                                style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}
                            >
                                Gerenciar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedOS && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => navigate('/os')}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="os-detail-card"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <header style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Wrench size={24} weight="duotone" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{selectedOS.tipo}</h2>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protocolo: {selectedOS.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/os')} style={{ color: 'var(--text-secondary)', padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                            </header>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <section>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><ChatCircleText size={18} /> Descrição do Chamado</h4>
                                        <div style={{ background: 'var(--bg-deep)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                            {selectedOS.descricao}
                                        </div>
                                    </section>

                                    <section>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Cliente / Assinante</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{selectedOS.cliente_nome.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{selectedOS.cliente_nome}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assinante VIP • Fibra 500M</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'start', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <MapPin size={18} style={{ marginTop: '2px' }} />
                                                <span>{selectedOS.cliente_endereco}</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)' }}>
                                    <section>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Status da Operação</h4>
                                        <select
                                            value={selectedOS.status}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value as any;
                                                await updateServiceOrder(selectedOS.id, { status: newStatus });
                                                setOss(prev => prev.map(o => o.id === selectedOS.id ? { ...o, status: newStatus } : o));
                                            }}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: `${getStatusColor(selectedOS.status)}20`, border: `1px solid ${getStatusColor(selectedOS.status)}`, color: getStatusColor(selectedOS.status), fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                                        >
                                            <option value="ABERTA">ABERTA</option>
                                            <option value="EM_EXECUCAO">EM EXECUÇÃO</option>
                                            <option value="FINALIZADA">FINALIZADA</option>
                                            <option value="CANCELADA">CANCELADA</option>
                                        </select>
                                    </section>

                                    <section>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Prioridade</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedOS.prioridade === 'URGENTE' ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700 }}>
                                            <WarningCircle size={20} />
                                            {selectedOS.prioridade}
                                        </div>
                                    </section>

                                    <section>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Técnico Atribuído</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <UserGear size={20} color="var(--accent)" />
                                            <span style={{ fontSize: '0.9rem' }}>A definir (Fila Local)</span>
                                        </div>
                                    </section>

                                    <section style={{ marginTop: 'auto' }}>
                                        <button
                                            onClick={handleFinishOS}
                                            className="flex-center"
                                            style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, gap: '10px', cursor: 'pointer' }}
                                        >
                                            <CheckCircle size={20} weight="bold" />
                                            Finalizar Atendimento
                                        </button>
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
