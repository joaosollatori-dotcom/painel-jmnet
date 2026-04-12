import React, { useState, useEffect } from 'react';
import {
    Kanban, List, ChartBar,
    ArrowRight, Warning, CheckCircle,
    Clock, User, Funnel, Plus,
    Trash, MagnifyingGlass, DotsThreeVertical
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSalesStages, getPipelineStats, moveLead, SalesStage } from '../services/pipelineService';
import { getLeads, Lead } from '../services/leadService';
import './InternalChat.css'; // Usar estilos compartilhados

const SalesPipeline: React.FC = () => {
    const [stages, setStages] = useState<SalesStage[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showLostModal, setShowLostModal] = useState<{ leadId: string, stageId: string } | null>(null);
    const [lostReason, setLostReason] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sData, lData, statsData] = await Promise.all([
                getSalesStages(),
                getLeads(),
                getPipelineStats()
            ]);
            setStages(sData);
            setLeads(lData);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading pipeline:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async (leadId: string, stageId: string) => {
        // Se mover para 'Perdido' (assumindo id '7' ou nome), pede motivo
        const targetStage = stages.find(s => s.id === stageId);
        if (targetStage?.nome.toLowerCase().includes('perdido')) {
            setShowLostModal({ leadId, stageId });
            return;
        }

        try {
            await moveLead(leadId, stageId);
            loadData();
        } catch (err) {
            alert("Erro ao mover lead");
        }
    };

    const confirmLost = async () => {
        if (!lostReason.trim()) return alert("Por favor, descreva o motivo da perda.");
        if (!showLostModal) return;

        try {
            await moveLead(showLostModal.leadId, showLostModal.stageId, { motivoPerda: lostReason });
            setShowLostModal(null);
            setLostReason('');
            loadData();
        } catch (err) {
            alert("Erro ao salvar histórico.");
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Carregando Pipeline...</div>;

    return (
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header com Stats */}
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Módulo Comercial / Pipeline</h1>
                        <p style={{ color: '#aaa', margin: '4px 0 0 0' }}>Acompanhamento do funil de vendas em tempo real</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>Taxa de Conversão</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{stats?.conversionRate}%</div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>Tempo de Resposta</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>{stats?.avgResponseTime}</div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>SLA Funil</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{stats?.slaCompliance}%</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div style={{
                flex: 1, display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem',
                scrollbarWidth: 'thin', scrollbarColor: '#444 transparent'
            }}>
                {stages.map(stage => {
                    const stageLeads = leads.filter(l => l.stageId === stage.id || (!l.stageId && stage.ordem === 0));
                    return (
                        <div key={stage.id} style={{
                            minWidth: '280px', width: '280px', display: 'flex', flexDirection: 'column',
                            background: 'rgba(255,255,255,0.01)', borderRadius: '12px'
                        }}>
                            {/* Stage Header */}
                            <div style={{
                                padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: `2px solid ${stage.cor}`, marginBottom: '12px'
                            }}>
                                <span style={{ fontWeight: 700, color: stage.cor, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {stage.nome}
                                </span>
                                <span style={{ background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {stageLeads.length}
                                </span>
                            </div>

                            {/* Cards Area */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                                {stageLeads.map(lead => (
                                    <motion.div
                                        layoutId={lead.id}
                                        key={lead.id}
                                        style={{
                                            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px',
                                            padding: '12px', cursor: 'pointer', position: 'relative'
                                        }}
                                        whileHover={{ y: -2, borderColor: stage.cor }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{lead.nomeCompleto}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>{lead.interessePlano || 'Sem plano'}</div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {new Date(lead.createdAt).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={() => {
                                                        const next = stages.find(s => s.ordem === stage.ordem + 1);
                                                        if (next) handleMove(lead.id, next.id);
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px' }}
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* SLA Warning */}
                                        {stage.slaDias > 0 && Math.random() > 0.8 && (
                                            <div style={{ position: 'absolute', top: '-6px', right: '-6px', color: '#ef4444' }}>
                                                <Warning size={16} weight="fill" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {stageLeads.length === 0 && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#444', border: '1px dashed #444', borderRadius: '12px', fontSize: '0.8rem' }}>
                                        Vazio
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Perda */}
            <AnimatePresence>
                {showLostModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '16px', width: '400px', border: '1px solid var(--border)' }}
                        >
                            <h3>⚠️ Motivo da Perda</h3>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Explique por que este lead não avançou no funil.</p>
                            <textarea
                                autoFocus
                                value={lostReason}
                                onChange={e => setLostReason(e.target.value)}
                                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', background: '#000', border: '1px solid #444', color: '#fff', resize: 'none' }}
                                placeholder="Ex: Cliente preferiu concorrente direto (preço)."
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowLostModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: '#888' }}>Cancelar</button>
                                <button onClick={confirmLost} style={{ padding: '8px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Confirmar Perda</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalesPipeline;
