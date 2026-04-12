import React, { useState, useEffect } from 'react';
import {
    Users, Plus, MagnifyingGlass, Funnel,
    IdentificationCard, Phone, MapPin,
    Suitcase, Calendar, Info,
    CheckCircle, XCircle, Clock,
    TrendUp, UserPlus, FileText,
    Buildings, User, WhatsappLogo,
    DotsThreeVertical, PencilSimple, Trash
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLeads, createLead, updateLead, deleteLead, Lead } from '../services/leadService';
import './Dashboard.css'; // Vou usar os estilos base de dashboard

const LeadsManager: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [formData, setFormData] = useState<Partial<Lead>>({
        nomeCompleto: '',
        telefonePrincipal: '',
        canalEntrada: 'WhatsApp',
        statusViabilidade: 'PENDENTE',
        tipoCliente: 'RESIDENCIAL',
        decisorIdentificado: false,
        tentativasContato: 0
    });

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await getLeads();
            setLeads(data);
        } catch (err) {
            console.error('Error loading leads:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedLead) {
                await updateLead(selectedLead.id, formData);
            } else {
                await createLead(formData);
            }
            setShowModal(false);
            setSelectedLead(null);
            loadLeads();
        } catch (err) {
            console.error('Error saving lead:', err);
            alert("Erro ao salvar lead. Certifique-se de que a tabela 'leads' existe no Supabase.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Atenção: Esta ação é irreversível. Deseja excluir este lead?")) return;
        try {
            await deleteLead(id);
            loadLeads();
        } catch (err) {
            console.error('Error deleting lead:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APROVADA': return '#10b981';
            case 'REPROVADA': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    const filteredLeads = leads.filter(l =>
        l.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.telefonePrincipal.includes(searchTerm) ||
        l.cpfCnpj?.includes(searchTerm)
    );

    return (
        <div className="manager-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendUp size={32} weight="duotone" color="var(--primary-color)" />
                        Gestão de Leads e Qualificação
                    </h1>
                    <p style={{ color: '#aaa', margin: '4px 0 0 0' }}>Qualificação comercial e viabilidade técnica</p>
                </div>
                <button
                    onClick={() => { setSelectedLead(null); setFormData({ canalEntrada: 'WhatsApp', statusViabilidade: 'PENDENTE', tipoCliente: 'RESIDENCIAL' }); setShowModal(true); }}
                    style={{
                        background: 'var(--primary-color)', color: '#fff', border: 'none',
                        padding: '12px 24px', borderRadius: '8px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}
                >
                    <UserPlus size={20} weight="bold" /> Novo Lead
                </button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou CPF..."
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
                            <th style={{ padding: '16px' }}>Lead</th>
                            <th style={{ padding: '16px' }}>Contato / Canal</th>
                            <th style={{ padding: '16px' }}>Qualificação</th>
                            <th style={{ padding: '16px' }}>Viabilidade</th>
                            <th style={{ padding: '16px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Carregando leads...</td></tr>
                        ) : filteredLeads.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Nenhum lead encontrado.</td></tr>
                        ) : filteredLeads.map(lead => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: lead.tipoCliente === 'EMPRESARIAL' ? '#3b82f633' : '#10b98133', color: lead.tipoCliente === 'EMPRESARIAL' ? '#3b82f6' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {lead.tipoCliente === 'EMPRESARIAL' ? <Buildings size={20} /> : <User size={20} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{lead.nomeCompleto}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{lead.cpfCnpj || 'CPF não inf.'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={14} /> {lead.telefonePrincipal}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 500 }}>
                                            {lead.canalEntrada}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{lead.interessePlano || 'Plano não definido'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Tentativas: {lead.tentativasContato}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: `${getStatusColor(lead.statusViabilidade)}22`,
                                        color: getStatusColor(lead.statusViabilidade),
                                        border: `1px solid ${getStatusColor(lead.statusViabilidade)}44`
                                    }}>
                                        {lead.statusViabilidade}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setSelectedLead(lead); setFormData(lead); setShowModal(true); }} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}><PencilSimple size={20} /></button>
                                        <button onClick={() => handleDelete(lead.id)} style={{ background: 'transparent', border: 'none', color: '#ef444499', cursor: 'pointer' }}><Trash size={20} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Cadastro */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h2 style={{ margin: 0 }}>{selectedLead ? 'Editar Lead' : 'Novo Lead / Qualificação'}</h2>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#666' }}><XCircle size={24} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {/* Seção Dados Pessoais */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>Dados do Contato</h3>
                                        <div className="form-group">
                                            <label>Nome Completo *</label>
                                            <input required type="text" value={formData.nomeCompleto} onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })} placeholder="Ex: João da Silva" />
                                        </div>
                                        <div className="form-group">
                                            <label>CPF / CNPJ</label>
                                            <input type="text" value={formData.cpfCnpj} onChange={e => setFormData({ ...formData, cpfCnpj: e.target.value })} placeholder="000.000.000-00" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div className="form-group">
                                                <label>Telefone 1 *</label>
                                                <input required type="text" value={formData.telefonePrincipal} onChange={e => setFormData({ ...formData, telefonePrincipal: e.target.value })} placeholder="(00) 00000-0000" />
                                            </div>
                                            <div className="form-group">
                                                <label>Telefone 2</label>
                                                <input type="text" value={formData.telefoneSecundario} onChange={e => setFormData({ ...formData, telefoneSecundario: e.target.value })} placeholder="(00) 00000-0000" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Tipo de Cliente</label>
                                            <select value={formData.tipoCliente} onChange={e => setFormData({ ...formData, tipoCliente: e.target.value as any })}>
                                                <option value="RESIDENCIAL">Residencial</option>
                                                <option value="EMPRESARIAL">Empresarial</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Seção Endereço */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>Endereço e Viabilidade</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                                            <div className="form-group">
                                                <label>CEP</label>
                                                <input type="text" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" />
                                            </div>
                                            <div className="form-group">
                                                <label>Logradouro</label>
                                                <input type="text" value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} placeholder="Rua..." />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                                            <div className="form-group">
                                                <label>Número</label>
                                                <input type="text" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} placeholder="123" />
                                            </div>
                                            <div className="form-group">
                                                <label>Bairro</label>
                                                <input type="text" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} placeholder="Bairro" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Ponto de Referência</label>
                                            <input type="text" value={formData.pontoReferencia} onChange={e => setFormData({ ...formData, pontoReferencia: e.target.value })} placeholder="Próximo ao..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Status Viabilidade</label>
                                            <select value={formData.statusViabilidade} onChange={e => setFormData({ ...formData, statusViabilidade: e.target.value as any })}>
                                                <option value="PENDENTE">Pendente de Vistoria</option>
                                                <option value="APROVADA">Viável / Aprovada</option>
                                                <option value="REPROVADA">Inviável</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Seção Qualificação */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>Qualificação Comercial</h3>
                                        <div className="form-group">
                                            <label>Canal de Entrada</label>
                                            <select value={formData.canalEntrada} onChange={e => setFormData({ ...formData, canalEntrada: e.target.value })}>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Ligação">Ligação Telefônica</option>
                                                <option value="Indicação">Indicação</option>
                                                <option value="Campanha">Campanha Marketing</option>
                                                <option value="Visita">Visita Porta a Porta</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Plano de Interesse</label>
                                            <input type="text" value={formData.interessePlano} onChange={e => setFormData({ ...formData, interessePlano: e.target.value })} placeholder="Ex: Fibra 500 Mega" />
                                        </div>
                                        <div className="form-group">
                                            <label>Renda / Porte Empresa</label>
                                            <input type="text" value={formData.perfilComercial} onChange={e => setFormData({ ...formData, perfilComercial: e.target.value })} placeholder="R$ / Tamanho" />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={formData.decisorIdentificado} onChange={e => setFormData({ ...formData, decisorIdentificado: e.target.checked })} />
                                            <span style={{ fontSize: '0.9rem' }}>Decisor identificado?</span>
                                        </label>
                                    </div>

                                    {/* Seção Observações */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>Controle</h3>
                                        <div className="form-group">
                                            <label>Vendedor Responsável</label>
                                            <select value={formData.vendedorId} onChange={e => setFormData({ ...formData, vendedorId: e.target.value })}>
                                                <option value="">A definir...</option>
                                                <option value="vendedor-1">Carlos (Vendas 1)</option>
                                                <option value="vendedor-2">Ana (Comercial)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Melhor Horário Contato</label>
                                            <input type="text" value={formData.melhorHorario} onChange={e => setFormData({ ...formData, melhorHorario: e.target.value })} placeholder="Ex: Manhã após as 10h" />
                                        </div>
                                        <div className="form-group">
                                            <label>Observações</label>
                                            <textarea rows={4} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', resize: 'none' }}></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #444', color: '#ccc', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" style={{ padding: '12px 32px', background: 'var(--primary-color)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Salvar Lead</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .form-group { display: flex; flexDirection: column; gap: 6px; text-align: left; }
                .form-group label { font-size: 0.85rem; color: #aaa; }
                .form-group input, .form-group select { 
                    padding: 10px; borderRadius: 8px; background: var(--bg-deep); 
                    border: 1px solid #444; color: #fff; outline: none; transition: border-color 0.2s;
                }
                .form-group input:focus { border-color: var(--primary-color); }
                .table-row-hover:hover { background: rgba(255,255,255,0.03); }
            `}</style>
        </div>
    );
};

export default LeadsManager;
