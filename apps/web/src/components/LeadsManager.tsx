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
import { genericFilter } from '../utils/filterUtils';
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
        statusQualificacao: 'PENDENTE',
        tipoCliente: 'RESIDENCIAL',
        tipoPessoa: 'PF',
        decisorIdentificado: false,
        tentativasContato: 0,
        isFrio: false
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

    const filteredLeads = genericFilter(leads, searchTerm);

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
                    onClick={() => { setSelectedLead(null); setFormData({ canalEntrada: 'WhatsApp', statusViabilidade: 'PENDENTE', tipoCliente: 'RESIDENCIAL', tipoPessoa: 'PF', statusQualificacao: 'PENDENTE', tentativasContato: 0, isFrio: false }); setShowModal(true); }}
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
                                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {lead.nomeCompleto}
                                                {lead.isFrio && <span title="Lead Frio" style={{ background: '#3b82f622', color: '#3b82f6', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>FRIO</span>}
                                            </div>
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
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Status: {lead.statusQualificacao}</div>
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
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h2 style={{ margin: 0 }}>{selectedLead ? 'Editar Lead' : 'Novo Lead / Qualificação'}</h2>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#666' }}><XCircle size={24} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                                    {/* 1. ENTIDADE LEAD (Dados Pessoais) */}
                                    <div className="modal-section">
                                        <h3><User size={18} weight="bold" /> Entidade Lead</h3>
                                        <div className="form-grid">
                                            <div className="form-group full">
                                                <label>Nome Completo *</label>
                                                <input required type="text" value={formData.nomeCompleto} onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })} placeholder="Nome completo" />
                                            </div>
                                            <div className="form-group">
                                                <label>Tipo de Pessoa</label>
                                                <select value={formData.tipoPessoa} onChange={e => setFormData({ ...formData, tipoPessoa: e.target.value as any })}>
                                                    <option value="PF">Pessoa Física</option>
                                                    <option value="PJ">Pessoa Jurídica</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>CPF / CNPJ</label>
                                                <input type="text" value={formData.cpfCnpj} onChange={e => setFormData({ ...formData, cpfCnpj: e.target.value })} placeholder="000.000.000-00" />
                                            </div>
                                            <div className="form-group">
                                                <label>RG</label>
                                                <input type="text" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} placeholder="Registro Geral" />
                                            </div>
                                            <div className="form-group">
                                                <label>Data de Nascimento</label>
                                                <input type="date" value={formData.dataNascimento ? formData.dataNascimento.split('T')[0] : ''} onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })} />
                                            </div>
                                            <div className="form-group full">
                                                <label>E-mail</label>
                                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="exemplo@email.com" />
                                            </div>
                                            <div className="form-group">
                                                <label>Telefone Principal *</label>
                                                <input required type="text" value={formData.telefonePrincipal} onChange={e => setFormData({ ...formData, telefonePrincipal: e.target.value })} placeholder="(00) 00000-0000" />
                                            </div>
                                            <div className="form-group">
                                                <label>Telefone WhatsApp</label>
                                                <input type="text" value={formData.telefoneWhatsapp} onChange={e => setFormData({ ...formData, telefoneWhatsapp: e.target.value })} placeholder="(00) 00000-0000" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. ENDEREÇO */}
                                    <div className="modal-section">
                                        <h3><MapPin size={18} weight="bold" /> Endereço</h3>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>CEP</label>
                                                <input type="text" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" />
                                            </div>
                                            <div className="form-group">
                                                <label>UF</label>
                                                <input type="text" value={formData.uf} onChange={e => setFormData({ ...formData, uf: e.target.value })} placeholder="SP" maxLength={2} />
                                            </div>
                                            <div className="form-group full">
                                                <label>Logradouro</label>
                                                <input type="text" value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} placeholder="Rua, Av..." />
                                            </div>
                                            <div className="form-group">
                                                <label>Número</label>
                                                <input type="text" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} placeholder="123" />
                                            </div>
                                            <div className="form-group">
                                                <label>Bairro</label>
                                                <input type="text" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} placeholder="Bairro" />
                                            </div>
                                            <div className="form-group full">
                                                <label>Ponto de Referência</label>
                                                <input type="text" value={formData.pontoReferencia} onChange={e => setFormData({ ...formData, pontoReferencia: e.target.value })} placeholder="Próximo a..." />
                                            </div>
                                            <div className="form-group">
                                                <label>Latitude</label>
                                                <input type="number" step="any" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} placeholder="-23.5505" />
                                            </div>
                                            <div className="form-group">
                                                <label>Longitude</label>
                                                <input type="number" step="any" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} placeholder="-46.6333" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. ORIGEM E RASTREAMENTO */}
                                    <div className="modal-section">
                                        <h3><Clock size={18} weight="bold" /> Origem e Rastreamento</h3>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Canal de Entrada</label>
                                                <select value={formData.canalEntrada} onChange={e => setFormData({ ...formData, canalEntrada: e.target.value })}>
                                                    <option value="WhatsApp">WhatsApp</option>
                                                    <option value="Ligação">Ligação</option>
                                                    <option value="Web">Web Site</option>
                                                    <option value="Indicação">Indicação</option>
                                                    <option value="Visita">Visita Presencial</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Indicador Responsável</label>
                                                <input type="text" value={formData.indicador} onChange={e => setFormData({ ...formData, indicador: e.target.value })} placeholder="Nome/Cód" />
                                            </div>
                                            <div className="form-group">
                                                <label>UTM Source</label>
                                                <input type="text" value={formData.utmSource} onChange={e => setFormData({ ...formData, utmSource: e.target.value })} placeholder="google, facebook" />
                                            </div>
                                            <div className="form-group">
                                                <label>UTM Campaign</label>
                                                <input type="text" value={formData.utmCampaign} onChange={e => setFormData({ ...formData, utmCampaign: e.target.value })} placeholder="blackfriday_2024" />
                                            </div>
                                            <div className="form-group">
                                                <label>IP de Entrada</label>
                                                <input type="text" value={formData.ipEntrada} onChange={e => setFormData({ ...formData, ipEntrada: e.target.value })} placeholder="192.168.0.1" />
                                            </div>
                                            <div className="form-group">
                                                <label>Dispositivo</label>
                                                <input type="text" value={formData.dispositivo} onChange={e => setFormData({ ...formData, dispositivo: e.target.value })} placeholder="Mobile/Desktop" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. CLASSIFICAÇÃO INICIAL */}
                                    <div className="modal-section">
                                        <h3><Suitcase size={18} weight="bold" /> Classificação Inicial</h3>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Tipo de Cliente</label>
                                                <select value={formData.tipoCliente} onChange={e => setFormData({ ...formData, tipoCliente: e.target.value as any })}>
                                                    <option value="RESIDENCIAL">Residencial</option>
                                                    <option value="EMPRESARIAL">Empresarial</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Perfil de Uso</label>
                                                <select value={formData.perfilUso} onChange={e => setFormData({ ...formData, perfilUso: e.target.value })}>
                                                    <option value="">Selecione...</option>
                                                    <option value="Basico">Residencial Básico</option>
                                                    <option value="Premium">Residencial Premium</option>
                                                    <option value="Pequeno">Empresarial Pequeno</option>
                                                    <option value="Medio">Empresarial Médio</option>
                                                </select>
                                            </div>
                                            <div className="form-group full">
                                                <label>Plano de Interesse</label>
                                                <input type="text" value={formData.interessePlano} onChange={e => setFormData({ ...formData, interessePlano: e.target.value })} placeholder="Ex: Fibra 500 Mega" />
                                            </div>
                                            <div className="form-group">
                                                <label>Operadora Atual</label>
                                                <input type="text" value={formData.operadoraAtual} onChange={e => setFormData({ ...formData, operadoraAtual: e.target.value })} placeholder="Vivo, Claro, etc" />
                                            </div>
                                            <div className="form-group">
                                                <label>Valor Pago Atual (R$)</label>
                                                <input type="number" step="0.01" value={formData.valorPagoAtual} onChange={e => setFormData({ ...formData, valorPagoAtual: parseFloat(e.target.value) })} placeholder="0,00" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. STATUS E CONTROLE */}
                                    <div className="modal-section full">
                                        <h3><CheckCircle size={18} weight="bold" /> Status e Controle</h3>
                                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                            <div className="form-group">
                                                <label>Qualificação</label>
                                                <select value={formData.statusQualificacao} onChange={e => setFormData({ ...formData, statusQualificacao: e.target.value as any })}>
                                                    <option value="PENDENTE">Pendente</option>
                                                    <option value="QUALIFICADO">Qualificado</option>
                                                    <option value="DESQUALIFICADO">Desqualificado</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Viabilidade</label>
                                                <select value={formData.statusViabilidade} onChange={e => setFormData({ ...formData, statusViabilidade: e.target.value as any })}>
                                                    <option value="PENDENTE">Pendente</option>
                                                    <option value="APROVADA">Aprovada</option>
                                                    <option value="REPROVADA">Reprovada</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Próximo Contato</label>
                                                <input type="datetime-local" value={formData.dataProximoContato ? formData.dataProximoContato.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, dataProximoContato: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label>Vendedor Responsável</label>
                                                <select value={formData.vendedorId} onChange={e => setFormData({ ...formData, vendedorId: e.target.value })}>
                                                    <option value="">Selecione...</option>
                                                    <option value="vend-1">Carlos Oliveira</option>
                                                    <option value="vend-2">Mariana Souza</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={formData.decisorIdentificado} onChange={e => setFormData({ ...formData, decisorIdentificado: e.target.checked })} />
                                                <span style={{ fontSize: '0.9rem' }}>Decisor identificado?</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={formData.isFrio} onChange={e => setFormData({ ...formData, isFrio: e.target.checked })} />
                                                <span style={{ fontSize: '0.9rem', color: formData.isFrio ? '#3b82f6' : 'inherit' }}>Marcar como Lead Frio</span>
                                            </label>
                                        </div>
                                        <div className="form-group full" style={{ marginTop: '1rem' }}>
                                            <label>Observações Adicionais</label>
                                            <textarea rows={3} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', resize: 'none' }} />
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
                .form-group { display: flex; flex-direction: column; gap: 6px; text-align: left; }
                .form-group.full { grid-column: span 2; }
                .modal-section.full { grid-column: span 2; }
                .form-group label { font-size: 0.8rem; color: #aaa; font-weight: 500; }
                .form-group input, .form-group select { 
                    padding: 10px 12px; borderRadius: 8px; background: var(--bg-deep); 
                    border: 1px solid #444; color: #fff; outline: none; transition: all 0.2s;
                    font-size: 0.9rem;
                }
                .form-group input:focus, .form-group select:focus { border-color: var(--primary-color); background: rgba(255,255,255,0.03); }
                .table-row-hover:hover { background: rgba(255,255,255,0.03); }
                
                .modal-section { 
                    display: flex; flex-direction: column; gap: 1.25rem; 
                    background: rgba(255,255,255,0.01); padding: 1.5rem; 
                    border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);
                }
                .modal-section h3 { 
                    margin: 0; font-size: 0.95rem; color: var(--primary-color); 
                    display: flex; alignItems: center; gap: 10px; text-transform: uppercase; 
                    letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding-bottom: 0.75rem;
                }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            `}</style>
        </div>
    );
};

export default LeadsManager;
