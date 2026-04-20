import React, { useState } from 'react';
import { ListChecks, MagnifyingGlass, Funnel, Export, CaretRight, Warning, Info, CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const MOCK_OCORRENCIAS = [
    { id: 'OCO-2026-001', customer: 'João Silva', subject: 'Lentidão fibra óptica', priority: 'ALTA', status: 'EM_ANALISE', date: '2026-04-20 08:30' },
    { id: 'OCO-2026-002', customer: 'Maria Oliveira', subject: 'Troca de roteador', priority: 'MEDIA', status: 'ABERTA', date: '2026-04-20 09:15' },
    { id: 'OCO-2026-003', customer: 'Condomínio Solar', subject: 'Vandalismo em CTO', priority: 'CRITICA', status: 'EM_ANALISE', date: '2026-04-20 07:10' },
    { id: 'OCO-2026-004', customer: 'Empresa XPTO', subject: 'Configuração IP Fixo', priority: 'BAIXA', status: 'RESOLVIDA', date: '2026-04-19 16:45' },
];

const OcorrenciasPreview: React.FC = () => {
    const [search, setSearch] = useState('');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ABERTA': return { bg: '#fef3c7', text: '#92400e', label: 'Aberta' };
            case 'EM_ANALISE': return { bg: '#dbeafe', text: '#1e40af', label: 'Em Análise' };
            case 'RESOLVIDA': return { bg: '#dcfce7', text: '#166534', label: 'Resolvida' };
            default: return { bg: '#f1f5f9', text: '#475569', label: status };
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'CRITICA': return <Warning size={16} weight="fill" color="#ef4444" />;
            case 'ALTA': return <Warning size={16} weight="fill" color="#f59e0b" />;
            default: return <Info size={16} weight="fill" color="#3b82f6" />;
        }
    };

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-deep)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Gestão de Ocorrências</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Acompanhamento em tempo real de protocolos ISP</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="wiki-cat-btn"><Export size={18} /> Exportar</button>
                    <button className="wiki-cat-btn active"><ListChecks size={18} /> Novo Protocolo</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-surface)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        className="wiki-search-input"
                        placeholder="Buscar protocolo, cliente ou assunto..."
                        style={{ width: '100%', paddingLeft: '40px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="wiki-cat-btn"><Funnel size={18} /> Filtros</button>
            </div>

            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>ID PROTOCOLO</th>
                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>CLIENTE</th>
                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>ASSUNTO</th>
                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>PRIORIDADE</th>
                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>ABERTURA</th>
                            <th style={{ padding: '16px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_OCORRENCIAS.map((oco, idx) => {
                            const st = getStatusStyle(oco.status);
                            return (
                                <motion.tr
                                    key={oco.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                    whileHover={{ background: 'rgba(0,0,0,0.01)' }}
                                >
                                    <td style={{ padding: '16px', fontWeight: 700, fontSize: '0.85rem' }}>{oco.id}</td>
                                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{oco.customer}</td>
                                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{oco.subject}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {getPriorityIcon(oco.priority)}
                                            {oco.priority}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, background: st.bg, color: st.text }}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '0.8rem', opacity: 0.6 }}>{oco.date}</td>
                                    <td style={{ padding: '16px' }}><CaretRight size={18} opacity={0.4} /></td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OcorrenciasPreview;
