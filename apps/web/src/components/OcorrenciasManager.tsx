import React, { useState, useEffect } from 'react';
import {
    WarningCircle, Plus, MagnifyingGlass, Funnel,
    ChatCircleDots, User, Clock, CheckCircle,
    CaretDown, DotsThreeVertical, PencilSimple, Trash,
    Warning
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { genericFilter } from '../utils/filterUtils';

interface Ocorrencia {
    id: string;
    protocolo: string;
    cliente: string;
    assunto: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    status: 'ABERTA' | 'EM_ANALISE' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDA' | 'CANCELADA';
    dataAbertura: string;
    ultimaAtualizacao: string;
    vendedorId?: string;
}

const OcorrenciasManager: React.FC = () => {
    const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedOco, setSelectedOco] = useState<Ocorrencia | null>(null);

    useEffect(() => {
        // Mock data
        const mock: Ocorrencia[] = [
            {
                id: '1',
                protocolo: '20260412001',
                cliente: 'Marcos Oliveira',
                assunto: 'Internet Lenta / Oscilação',
                prioridade: 'ALTA',
                status: 'ABERTA',
                dataAbertura: new Date().toISOString(),
                ultimaAtualizacao: new Date().toISOString(),
            },
            {
                id: '2',
                protocolo: '20260412002',
                cliente: 'Ana Paula',
                assunto: 'Dúvida sobre Fatura',
                prioridade: 'MEDIA',
                status: 'EM_ANALISE',
                dataAbertura: new Date().toISOString(),
                ultimaAtualizacao: new Date().toISOString(),
            },
            {
                id: '3',
                protocolo: '20260412003',
                cliente: 'Empresa Alpha',
                assunto: 'Upgrade de Plano',
                prioridade: 'MEDIA',
                status: 'RESOLVIDA',
                dataAbertura: new Date().toISOString(),
                ultimaAtualizacao: new Date().toISOString(),
            }
        ];
        setTimeout(() => {
            setOcorrencias(mock);
            setLoading(false);
        }, 800);
    }, []);

    const getStatusColor = (status: Ocorrencia['status']) => {
        switch (status) {
            case 'ABERTA': return '#3b82f6';
            case 'EM_ANALISE': return '#f59e0b';
            case 'AGUARDANDO_CLIENTE': return '#8b5cf6';
            case 'RESOLVIDA': return '#10b981';
            case 'CANCELADA': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (p: Ocorrencia['prioridade']) => {
        switch (p) {
            case 'CRITICA': return '#ef4444';
            case 'ALTA': return '#f97316';
            case 'MEDIA': return '#3b82f6';
            default: return '#10b981';
        }
    };

    const filteredOco = genericFilter(ocorrencias, searchTerm);

    return (
        <div className="manager-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <WarningCircle size={32} weight="duotone" color="var(--primary-color)" />
                        Gestão de Ocorrências
                    </h1>
                    <p style={{ color: '#aaa', margin: '4px 0 0 0' }}>Acompanhamento de chamados e suporte ao cliente</p>
                </div>
                <button
                    onClick={() => { setSelectedOco(null); setShowModal(true); }}
                    style={{
                        background: 'var(--primary-color)', color: '#fff', border: 'none',
                        padding: '12px 24px', borderRadius: '8px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}
                >
                    <Plus size={20} weight="bold" /> Nova Ocorrência
                </button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Buscar por protocolo, cliente ou assunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 44px', borderRadius: '8px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff'
                        }}
                    />
                </div>
                <button className="flex-center" style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#aaa' }}>
                    <Funnel size={20} />
                </button>
            </div>

            <div className="leads-table-wrapper" style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '16px' }}>Protocolo</th>
                            <th style={{ padding: '16px' }}>Cliente / Assunto</th>
                            <th style={{ padding: '16px' }}>Prioridade</th>
                            <th style={{ padding: '16px' }}>Status</th>
                            <th style={{ padding: '16px' }}>Última Atu.</th>
                            <th style={{ padding: '16px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Carregando ocorrências...</td></tr>
                        ) : filteredOco.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Nenhuma ocorrência encontrada.</td></tr>
                        ) : filteredOco.map(oco => (
                            <tr key={oco.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '16px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>#{oco.protocolo}</span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontWeight: 600 }}>{oco.cliente}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{oco.assunto}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityColor(oco.prioridade) }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{oco.prioridade}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: `${getStatusColor(oco.status)}22`,
                                        color: getStatusColor(oco.status),
                                        border: `1px solid ${getStatusColor(oco.status)}44`
                                    }}>
                                        {oco.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#666' }}>
                                        <Clock size={14} />
                                        {new Date(oco.ultimaAtualizacao).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="action-btn-table"><ChatCircleDots size={20} /></button>
                                        <button className="action-btn-table"><PencilSimple size={20} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .action-btn-table { background: transparent; border: none; color: #666; cursor: pointer; transition: color 0.2s; }
                .action-btn-table:hover { color: var(--primary-color); }
                .table-row-hover:hover { background: rgba(255,255,255,0.03); }
            `}</style>
        </div>
    );
};

export default OcorrenciasManager;
