import React, { useState, useEffect } from 'react';
import {
    HardDrive, Info, WifiHigh,
    ArrowsClockwise, Power, MagnifyingGlass,
    CaretRight, Activity, Cpu, Database
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGenieDevices, rebootDevice, refreshDevice, getDeviceSignal } from '../services/genieacsService';
import { useToast } from '../contexts/ToastContext';

const EquipmentManager: React.FC = () => {
    const { showToast } = useToast();
    const [devices, setDevices] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [signal, setSignal] = useState<any>(null);

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const data = await getGenieDevices();
            setDevices(data || []);
        } catch (err) {
            showToast('Erro ao conectar com GenieACS', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (id: string) => {
        setSelectedId(id);
        setSignal(null);
        try {
            const sigData = await getDeviceSignal(id);
            setSignal(sigData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = async (action: 'reboot' | 'refresh') => {
        if (!selectedId) return;
        try {
            showToast(`Enviando comando de ${action}...`, 'info');
            if (action === 'reboot') await rebootDevice(selectedId);
            else await refreshDevice(selectedId);
            showToast('Comando aceito pelo ACS', 'success');
        } catch (err) {
            showToast('Falha ao enviar comando', 'error');
        }
    };

    const selectedDevice = devices.find(d => d._id === selectedId);

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
            {/* Listagem Lateral */}
            <div style={{ width: '380px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <HardDrive weight="fill" color="var(--accent)" /> Equipamentos
                    </h2>
                    <div style={{ position: 'relative' }}>
                        <MagnifyingGlass style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} size={18} />
                        <input
                            className="wiki-search-input"
                            placeholder="MAC, Serial ou Fabricante..."
                            style={{ width: '100%', paddingLeft: '40px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Sincronizando ACS...</div>
                    ) : devices.filter(d => d._id.includes(search)).map(device => (
                        <motion.div
                            key={device._id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleSelect(device._id)}
                            style={{
                                padding: '16px', borderRadius: '16px', marginBottom: '12px', cursor: 'pointer',
                                background: selectedId === device._id ? 'var(--bg-surface)' : 'transparent',
                                border: selectedId === device._id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                boxShadow: selectedId === device._id ? '0 8px 24px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>{device._id.slice(0, 18)}</span>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                                {device.InternetGatewayDevice?.DeviceInfo?.Manufacturer || 'CPE'} - {device.InternetGatewayDevice?.DeviceInfo?.ModelName || 'GenieSim'}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Detalhes e Ações */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <AnimatePresence mode="wait">
                    {!selectedDevice ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Cpu size={80} weight="light" />
                            <p>Selecione um equipamento para gestão em tempo real</p>
                        </motion.div>
                    ) : (
                        <motion.div key={selectedId} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h1 style={{ margin: 0 }}>{selectedDevice.InternetGatewayDevice?.DeviceInfo?.ModelName}</h1>
                                    <p style={{ opacity: 0.6 }}>Serial: {selectedDevice.InternetGatewayDevice?.DeviceInfo?.SerialNumber || 'N/A'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="wiki-cat-btn" onClick={() => handleAction('refresh')}><ArrowsClockwise /> Forçar Refresh</button>
                                    <button className="wiki-cat-btn" style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }} onClick={() => handleAction('reboot')}><Power /> Reboot</button>
                                </div>
                            </header>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                {/* Gauge de Sinal */}
                                <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', opacity: 0.6, fontSize: '0.8rem', fontWeight: 800 }}>
                                        <Activity size={18} /> STATUS DE SINAL ÓPTICO
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '3rem', fontWeight: 900, color: signal?.rxPower > -25 ? '#10b981' : '#ef4444' }}>
                                            {signal?.rxPower || '--'} <span style={{ fontSize: '1rem', opacity: 0.5 }}>dBm</span>
                                        </div>
                                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: signal?.rxPower > -25 ? '#10b981' : '#ef4444' }}>
                                            {signal?.rxPower > -25 ? 'Sinal Excelente' : 'Sinal Crítico'}
                                        </p>
                                    </div>
                                    <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', marginTop: '20px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, 100 + (signal?.rxPower || -30) * 3)}%` }} style={{ height: '100%', background: 'var(--accent)' }} />
                                    </div>
                                </div>

                                {/* Info de Rede */}
                                <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', opacity: 0.6, fontSize: '0.8rem', fontWeight: 800 }}>
                                        <Database size={18} /> INFORMAÇÕES DE REDE
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ opacity: 0.5 }}>IP WAN</span>
                                            <span style={{ fontWeight: 700 }}>{selectedDevice.InternetGatewayDevice?.WANDevice?.['1']?.WANConnectionDevice?.['1']?.WANIPConnection?.['1']?.ExternalIPAddress || 'Dinâmico'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ opacity: 0.5 }}>Uptime</span>
                                            <span style={{ fontWeight: 700 }}>2d 4h 12m</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ opacity: 0.5 }}>Último Inform</span>
                                            <span style={{ fontWeight: 700 }}>Há 1 minuto</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EquipmentManager;
