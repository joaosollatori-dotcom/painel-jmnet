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
import './SalesPipeline.css';

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

    if (loading) return <div className="p-32">Carregando Pipeline...</div>;

    return (
        <div className="sp-container">
            {/* Header com Stats */}
            <header className="sp-header">
                <div className="sp-header-row">
                    <div>
                        <h1 className="sp-title">Módulo Comercial / Pipeline</h1>
                        <p className="sp-subtitle">Acompanhamento do funil de vendas em tempo real</p>
                    </div>
                    <div className="sp-stats-row">
                        <div className="sp-stat-item">
                            <div className="sp-stat-label">Taxa de Conversão</div>
                            <div className="sp-stat-value sp-stat-value-success">{stats?.conversionRate}%</div>
                        </div>
                        <div className="sp-stat-item">
                            <div className="sp-stat-label">Tempo de Resposta</div>
                            <div className="sp-stat-value sp-stat-value-primary">{stats?.avgResponseTime}</div>
                        </div>
                        <div className="sp-stat-item">
                            <div className="sp-stat-label">SLA Funil</div>
                            <div className="sp-stat-value sp-stat-value-warning">{stats?.slaCompliance}%</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="sp-kanban-board">
                {stages.map(stage => {
                    const stageLeads = leads.filter(l => l.stageId === stage.id || (!l.stageId && stage.ordem === 0));
                    return (
                        <div key={stage.id} className="sp-stage-col">
                            {/* Stage Header */}
                            <div className="sp-stage-header" style={{ borderBottom: `2px solid ${stage.cor}` }}>
                                <span className="sp-stage-name" style={{ color: stage.cor }}>
                                    {stage.nome}
                                </span>
                                <span className="sp-stage-count">
                                    {stageLeads.length}
                                </span>
                            </div>

                            {/* Cards Area */}
                            <div className="sp-cards-area">
                                {stageLeads.map(lead => (
                                    <motion.div
                                        layoutId={lead.id}
                                        key={lead.id}
                                        className="sp-lead-card"
                                        whileHover={{ y: -2, borderColor: stage.cor }}
                                    >
                                        <div className="sp-lead-name">{lead.nomeCompleto}</div>
                                        <div className="sp-lead-plan">{lead.interessePlano || 'Sem plano'}</div>

                                        <div className="sp-lead-footer">
                                            <div className="sp-lead-date">
                                                <Clock size={12} /> {new Date(lead.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="sp-lead-actions">
                                                <button
                                                    onClick={() => {
                                                        const next = stages.find(s => s.ordem === stage.ordem + 1);
                                                        if (next) handleMove(lead.id, next.id);
                                                    }}
                                                    className="sp-lead-action-btn"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* SLA Warning */}
                                        {stage.slaDias > 0 && Math.random() > 0.8 && (
                                            <div className="sp-sla-warning">
                                                <Warning size={16} weight="fill" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {stageLeads.length === 0 && (
                                    <div className="sp-empty-stage">
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
                    <div className="sp-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="sp-modal"
                        >
                            <h3>⚠️ Motivo da Perda</h3>
                            <p className="sp-modal-desc">Explique por que este lead não avançou no funil.</p>
                            <textarea
                                autoFocus
                                value={lostReason}
                                onChange={e => setLostReason(e.target.value)}
                                className="sp-modal-textarea"
                                placeholder="Ex: Cliente preferiu concorrente direto (preço)."
                            />
                            <div className="sp-modal-actions">
                                <button onClick={() => setShowLostModal(null)} className="sp-btn-cancel">Cancelar</button>
                                <button onClick={confirmLost} className="sp-btn-danger">Confirmar Perda</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalesPipeline;
