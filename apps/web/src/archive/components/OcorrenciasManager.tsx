import React, { useState, useEffect } from 'react';
import {
    ListChecks, MagnifyingGlass, Funnel, CaretRight, Warning,
    CheckCircle, Info, Clock, User, HardDrive, ClipboardText,
    ChatCircleDots, FileText, Package, Wrench, X, FloppyDisk
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Interface Detalhada conforme Imagens
interface OcorrenciaCompleta {
    id: string;
    protocolo: string;
    customer_name: string;
    subject: string;
    status: string;
    priority: string;
    opening_date: string;
    classificação?: string;
    setor?: string;
    motivo?: string;
    problema_reportado?: string;
    observacao_interna?: string;
    observacao_publica?: string;
    veiculo_info?: string;
    veiculo_km?: number;
    servico_prestado?: string;
    tecnico_responsavel?: string;
    tecnico_auxiliar?: string;
}

const OcorrenciasManager: React.FC = () => {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [ocorrencias, setOcorrencias] = useState<OcorrenciaCompleta[]>([]);
    const [selectedOco, setSelectedOco] = useState<OcorrenciaCompleta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('os');

    useEffect(() => {
        fetchOcorrencias();
        const subscribe = supabase.channel('realtime_ocorrencias')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_occurrences' }, () => {
                fetchOcorrencias();
            })
            .subscribe();
        return () => { supabase.removeChannel(subscribe); };
    }, []);

    const fetchOcorrencias = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('customer_occurrences')
                .select('*')
                .order('opening_date', { ascending: false });
            if (error) throw error;
            setOcorrencias(data || []);
        } catch (err) {
            console.error('Erro ao carregar ocorrências:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Partial<OcorrenciaCompleta>) => {
        if (!selectedOco) return;
        try {
            const { error } = await supabase
                .from('customer_occurrences')
                .update(data)
                .eq('id', selectedOco.id);
            if (error) throw error;
            showToast('Dados salvos com sucesso!', 'success');
            fetchOcorrencias();
        } catch (err) {
            showToast('Erro ao salvar no Supabase.', 'error');
        }
    };

    const filtered = ocorrencias.filter(o =>
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.protocolo?.includes(search) ||
        o.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--bg-deep)', overflow: 'hidden' }}>
            {/* LISTA LATERAL (Consulta) */}
            <div style={{ width: '400px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 16px 0' }}>Consulta de Ocorrências</h2>
                    <div style={{ position: 'relative' }}>
                        <MagnifyingGlass size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            className="wiki-search-input"
                            placeholder="Buscar protocolo ou cliente..."
                            style={{ width: '100%', paddingLeft: '40px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Carregando...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Nenhuma ocorrência encontrada.</div>
                    ) : filtered.map(oco => (
                        <motion.div
                            key={oco.id}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setSelectedOco(oco)}
                            style={{
                                background: 'var(--bg-surface)', padding: '16px', borderRadius: '16px', marginBottom: '12px',
                                border: selectedOco?.id === oco.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>{oco.protocolo || 'SEM PROTOCOLO'}</span>
                                <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px' }}>{oco.status}</span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>{oco.customer_name}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '12px' }}>{oco.subject}</div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem', opacity: 0.5 }}>
                                <Clock size={14} /> {new Date(oco.opening_date).toLocaleDateString('pt-BR')}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* PAINEL DE DETALHES (Benchmark Imagens) */}
            <div style={{ flex: 1, background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="wait">
                    {!selectedOco ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3 }}
                        >
                            <Info size={64} weight="light" />
                            <p>Selecione uma ocorrência para visualizar os detalhes operacionais</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedOco.id}
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Header do Detalhe */}
                            <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '4px' }}>{selectedOco.protocolo} — {selectedOco.status}</div>
                                    <h2 style={{ margin: 0 }}>{selectedOco.customer_name}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="wiki-cat-btn" onClick={() => handleSave(selectedOco)}><FloppyDisk /> Salvar Alterações</button>
                                    <button className="wiki-cat-btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => setSelectedOco(null)}><X /> Fechar</button>
                                </div>
                            </header>

                            {/* TABS (Conforme Imagem 2) */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.02)', padding: '0 32px', borderBottom: '1px solid var(--border)' }}>
                                {[
                                    { id: 'os', label: 'Ordem de Serviço', icon: Wrench },
                                    { id: 'notes', label: 'Anotações OS', icon: ChatCircleDots },
                                    { id: 'stock', label: 'Lançamentos Estoque', icon: Package },
                                    { id: 'checklist', label: 'Checklist', icon: ListChecks }
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <div
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                padding: '16px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                                fontSize: '0.85rem', fontWeight: 700,
                                                borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                                                color: activeTab === tab.id ? 'var(--accent)' : 'inherit',
                                                opacity: activeTab === tab.id ? 1 : 0.6
                                            }}
                                        >
                                            <Icon size={18} /> {tab.label}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* CONTEÚDO DINÂMICO (Formulários) */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                                {activeTab === 'os' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                        {/* Coluna Esquerda: Dados da OS */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <h4 style={{ margin: 0, opacity: 0.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Dados da Ordem de Serviço</h4>

                                            <div className="input-group-row">
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Protocolo</label>
                                                    <input className="wiki-search-input" style={{ width: '100%' }} value={selectedOco.protocolo} disabled />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Aberto Por</label>
                                                    <input className="wiki-search-input" style={{ width: '100%' }} value={selectedOco.tecnico_responsavel || 'Sistema'} />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Motivo *</label>
                                                <select className="wiki-search-input" style={{ width: '100%', height: '42px' }}>
                                                    <option>LENTIDÃO</option>
                                                    <option>QUEDA DE CONEXÃO</option>
                                                    <option>TROCA DE EQUIPAMENTO</option>
                                                    <option>CONFIGURAÇÃO DE ROTEADOR</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Problema Reportado</label>
                                                <textarea className="wiki-search-input" style={{ width: '100%', height: '100px', padding: '12px' }} defaultValue={selectedOco.problema_reportado} />
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '12px' }}>
                                                <input type="checkbox" style={{ width: '18px', height: '18px' }} defaultChecked={selectedOco.status === 'Encerrada'} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Encerrar Ocorrência ao Salvar?</span>
                                            </div>
                                        </div>

                                        {/* Coluna Direita: Observações e Veículos */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <h4 style={{ margin: 0, opacity: 0.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Logística e Observações</h4>

                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Técnico Responsável</label>
                                                <select className="wiki-search-input" style={{ width: '100%', height: '42px' }}>
                                                    <option>Selecione um técnico...</option>
                                                    <option>Carlos (Campo 1)</option>
                                                    <option>André (Reparos)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Observação Interna</label>
                                                <textarea className="wiki-search-input" style={{ width: '100%', height: '80px', padding: '12px' }} placeholder="Não será exibida na OS impressa..." />
                                            </div>

                                            <div className="input-group-row">
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Veículo</label>
                                                    <input className="wiki-search-input" style={{ width: '100%' }} placeholder="Placa/Modelo" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>KM de Saída</label>
                                                    <input type="number" className="wiki-search-input" style={{ width: '100%' }} placeholder="0000" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notes' && (
                                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                                            <h3 style={{ marginTop: 0 }}>Timeline de Comentários</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>Sistema — 14/04/2026 11:32</div>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Ocorrência aberta e agendada automaticamente.</div>
                                                </div>
                                            </div>
                                            <textarea className="wiki-search-input" style={{ width: '100%', height: '120px', marginBottom: '16px', padding: '16px' }} placeholder="Adicionar anotação técnica..." />
                                            <button className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Adicionar Comentário</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OcorrenciasManager;
