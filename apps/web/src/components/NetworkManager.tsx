import React, { useState } from 'react';
import { Globe, HardDrives, Cpu, WifiHigh, WarningCircle, GitBranch, Desktop, CheckCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { genericFilter } from '../utils/filterUtils';

const NetworkManager: React.FC = () => {
    const [selectedOlt, setSelectedOlt] = useState<string | null>('OLT-01');
    const [searchTerm, setSearchTerm] = useState('');

    const olts = [
        { id: 'OLT-01', nome: 'OLT Central Matriz', ip: '10.0.0.50', modelo: 'Nokia 7360 FX-4', status: 'ONLINE', onus: 124 },
        { id: 'OLT-02', nome: 'OLT Filial Norte', ip: '10.0.1.50', modelo: 'Huawei MA5800-X7', status: 'ONLINE', onus: 86 },
        { id: 'OLT-03', nome: 'OLT POP Sul', ip: '10.0.2.50', modelo: 'Intelbras OLT 8820 G', status: 'WARNING', onus: 42 },
    ];

    const filteredOlts = genericFilter(olts, searchTerm);

    return (
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Infraestrutura de Rede</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Monitoramento de OLTs, provisionamento GPON e diagnóstico de sinal.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', flex: 1 }}>
                {/* Sidebar com OLTs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <MagnifyingGlass size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            placeholder="Buscar OLT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff', fontSize: '0.85rem'
                            }}
                        />
                    </div>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>OLTs CONFIGURADAS</h3>
                    {filteredOlts.map(olt => (
                        <div
                            key={olt.id}
                            onClick={() => setSelectedOlt(olt.id)}
                            style={{
                                padding: '1.25rem',
                                background: selectedOlt === olt.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                                border: `1px solid ${selectedOlt === olt.id ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                <HardDrives size={24} color={selectedOlt === olt.id ? 'var(--accent)' : 'var(--text-secondary)'} />
                                <span style={{ fontSize: '0.7rem', color: olt.status === 'ONLINE' ? '#10b981' : '#f59e0b', fontWeight: 800 }}>{olt.status}</span>
                            </div>
                            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>{olt.nome}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{olt.ip} • {olt.onus} ONUs</span>
                        </div>
                    ))}
                    <button style={{ marginTop: '12px', padding: '12px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                        + Adicionar OLT
                    </button>
                </div>

                {/* Painel de Detalhes da OLT */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem' }}>{selectedOlt} — Detalhes da Operação</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Visualização de portas PON e estatísticas de tráfego.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-primary)', cursor: 'pointer' }}>Sincronizar</button>
                            <button style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Provisionar ONU</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                            <div key={p} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PON {p}</span>
                                    <WifiHigh size={16} color="#10b981" />
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{Math.floor(Math.random() * 30) + 10} ONUs</div>
                                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px' }}>OCUPAÇÃO: 45%</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '12px 20px', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                            LOGS DE EVENTOS REAL-TIME
                        </div>
                        <div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10b981', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>[20:56:12] ONU 48575443B8F9A5D2 — ONLINE — PON 01/2 — Sinal: -18.5dBm</div>
                            <div>[20:55:04] OLT-01 — Backup de configuração realizado com sucesso.</div>
                            <div style={{ color: '#f59e0b' }}>[20:54:30] Link Trunk-01 — Alta latência detectada (45ms).</div>
                            <div>[20:52:10] ONU 48575443C122D0A1 — PROVISIONADA — PON 03/12</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkManager;
