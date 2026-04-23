import React, { useState } from 'react';
import { Globe, HardDrives, Cpu, WifiHigh, WarningCircle, GitBranch, Desktop, CheckCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { genericFilter } from '../utils/filterUtils';
import './NetworkManager.css';

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
        <div className="nm-container">
            <header className="nm-header">
                <h1>Infraestrutura de Rede</h1>
                <p>Monitoramento de OLTs, provisionamento GPON e diagnóstico de sinal.</p>
            </header>

            <div className="nm-layout">
                {/* Sidebar com OLTs */}
                <div className="nm-sidebar">
                    <div className="nm-search-wrapper">
                        <MagnifyingGlass size={18} className="nm-search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar OLT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="nm-search-input"
                        />
                    </div>
                    <h3 className="nm-sidebar-title">OLTs CONFIGURADAS</h3>
                    {filteredOlts.map(olt => (
                        <div
                            key={olt.id}
                            onClick={() => setSelectedOlt(olt.id)}
                            className={`nm-olt-card ${selectedOlt === olt.id ? 'active' : ''}`}
                            style={{
                                border: `1px solid ${selectedOlt === olt.id ? 'var(--accent)' : 'var(--border)'}`
                            }}
                        >
                            <div className="nm-olt-card-header">
                                <HardDrives size={24} color={selectedOlt === olt.id ? 'var(--accent)' : 'var(--text-secondary)'} />
                                <span style={{ fontSize: '0.7rem', color: olt.status === 'ONLINE' ? '#10b981' : '#f59e0b', fontWeight: 800 }}>{olt.status}</span>
                            </div>
                            <strong className="nm-olt-name">{olt.nome}</strong>
                            <span className="nm-olt-info">{olt.ip} • {olt.onus} ONUs</span>
                        </div>
                    ))}
                    <button className="nm-btn-add">
                        + Adicionar OLT
                    </button>
                </div>

                {/* Painel de Detalhes da OLT */}
                <div className="nm-details-panel">
                    <div className="nm-panel-header">
                        <div>
                            <h2 className="nm-panel-title">{selectedOlt} — Detalhes da Operação</h2>
                            <p className="nm-panel-subtitle">Visualização de portas PON e estatísticas de tráfego.</p>
                        </div>
                        <div className="nm-panel-actions">
                            <button className="nm-btn-sync">Sincronizar</button>
                            <button className="nm-btn-provision">Provisionar ONU</button>
                        </div>
                    </div>

                    <div className="nm-stats-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                            <div key={p} className="nm-stat-card">
                                <div className="nm-stat-header">
                                    <span className="nm-stat-label">PON {p}</span>
                                    <WifiHigh size={16} color="#10b981" />
                                </div>
                                <div className="nm-stat-value">{Math.floor(Math.random() * 30) + 10} ONUs</div>
                                <div className="nm-stat-footer">OCUPAÇÃO: 45%</div>
                            </div>
                        ))}
                    </div>

                    <div className="nm-logs-panel">
                        <div className="nm-logs-header">
                            LOGS DE EVENTOS REAL-TIME
                        </div>
                        <div className="nm-logs-content">
                            <div>[20:56:12] ONU 48575443B8F9A5D2 — ONLINE — PON 01/2 — Sinal: -18.5dBm</div>
                            <div>[20:55:04] OLT-01 — Backup de configuração realizado com sucesso.</div>
                            <div className="nm-log-warn">[20:54:30] Link Trunk-01 — Alta latência detectada (45ms).</div>
                            <div>[20:52:10] ONU 48575443C122D0A1 — PROVISIONADA — PON 03/12</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkManager;
