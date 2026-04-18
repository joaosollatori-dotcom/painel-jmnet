import React, { useState, useEffect } from 'react';
import {
    ArrowRight, Warning, Clock,
    User, Funnel, Plus, Export,
    Calendar, Users, Buildings
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
    const [activeTab, setActiveTab] = useState('all');

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

    if (loading) return <div className="p-32">Carregando CRM TITÃ...</div>;

    return (
        <div className="pipeline-container">
            {/* Top Toolbar */}
            <div className="pipeline-header">
                <div>
                    <h1 className="pipeline-title">Deals</h1>
                    <div className="pipeline-tabs">
                        <span
                            className={`pipeline-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            Todos os leads
                        </span>
                        <span
                            className={`pipeline-tab ${activeTab === 'my' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my')}
                        >
                            Meus leads
                        </span>
                        <span className="pipeline-tab">+ Adicionar visualização</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="filter-pill" style={{ background: 'var(--bg-surface-light)' }}>
                        <Export size={18} /> Exportar
                    </button>
                    <button className="filter-pill" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                        <Plus size={18} weight="bold" /> Novo Lead
                    </button>
                </div>
            </div>

            {/* Filter Row */}
            <div className="pipeline-toolbar">
                <button className="filter-pill"><Funnel size={16} /> Funil de Vendas</button>
                <button className="filter-pill"><User size={16} /> Responsável</button>
                <button className="filter-pill"><Calendar size={16} /> Data de Criação</button>
                <button className="filter-pill"><Clock size={16} /> Última Atividade</button>
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {stages.map((stage, idx) => {
                    const stageLeads = leads.filter(l => l.stageId === stage.id || (!l.stageId && stage.ordem === 0));
                    const probability = Math.min(100, Math.round((idx + 1) * (100 / stages.length)));

                    return (
                        <div key={stage.id} className="kanban-column">
                            <div className="column-header">
                                <span className="column-title">{stage.nome}</span>
                                <span className="column-count">{stageLeads.length}</span>
                            </div>

                            <div className="kanban-list">
                                {stageLeads.map(lead => (
                                    <motion.div
                                        layoutId={lead.id}
                                        key={lead.id}
                                        className="lead-card"
                                    >
                                        <span className="lead-card-title">{lead.nomeCompleto}</span>

                                        <div className="lead-card-meta">
                                            <div className="meta-item">
                                                <Buildings size={14} />
                                                <span>{lead.provedor || 'Provedor Local'}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Users size={14} />
                                                <span>{lead.interessePlano || 'Plano não definido'}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Calendar size={14} />
                                                <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>

                                        <div className="lead-card-footer">
                                            <div className="probability-container">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    <span>Probabilidade</span>
                                                    <span>{probability}%</span>
                                                </div>
                                                <div className="probability-bar">
                                                    <div className="probability-fill" style={{ width: `${probability}%`, background: stage.cor }}></div>
                                                </div>
                                            </div>
                                            <div className="lead-value">R$ {Math.floor(Math.random() * 500) + 99},00</div>
                                        </div>

                                        {/* Status floating action */}
                                        <button
                                            className="filter-pill"
                                            style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px' }}
                                            onClick={() => {
                                                const next = stages.find(s => s.ordem === stage.ordem + 1);
                                                if (next) handleMove(lead.id, next.id);
                                            }}
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Perda */}
            <AnimatePresence>
                {showLostModal && (
                    <div className="sp-modal-overlay">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="sp-modal">
                            <h3>⚠️ Motivo da Perda</h3>
                            <p className="sp-modal-desc">Explique por que este lead não avançou no funil.</p>
                            <textarea
                                autoFocus
                                value={lostReason}
                                onChange={e => setLostReason(e.target.value)}
                                className="sp-modal-textarea"
                                placeholder="Motivo da perda..."
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
