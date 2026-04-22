import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, PencilSimple, Trash, Warning, FloppyDisk, Prohibit, ListBullets, Users, Key, UserCircle, Globe, Scroll, LockKey, Fingerprint, Copy, Envelope, ArrowsClockwise } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemSettings, saveSystemSetting, deleteSystemSetting, SystemSetting } from '../services/systemSettingsService';
import { getTenantUsers, updateUserProfile, Profile, UserRole, getCurrentProfile } from '../services/userService';
import { getGlobalAuditLogs, AuditLog } from '../services/auditService';
import { createInvitation, getInvitations, resetInvitation, Invitation } from '../services/invitationService';
import { generateRemoteAccessKey, getAllowedIPs, addAllowedIP, removeAllowedIP, AllowedIP } from '../services/remoteAccessService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminBrandingSettings } from './AdminBrandingSettings';
import './SettingsManager.css';

const SettingsManager: React.FC = () => {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { section, subsection } = useParams();
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [allowedIps, setAllowedIps] = useState<AllowedIP[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mapeamento de URL para Categoria interna
    const routeToTab: Record<string, string> = {
        'crm/perda': 'LOSS_REASON',
        'os/tipos': 'OS_TYPE',
        'suporte/ocorrencias': 'OCCURRENCE_TYPE',
        'equipe': 'USERS',
        'seguranca': 'SECURITY',
        'contratos': 'CONTRACTS'
    };

    const activeTab = routeToTab[`${section}/${subsection}`] || routeToTab[section || ''] || 'LOSS_REASON';

    // Edit/Modal States
    const [editingItem, setEditingItem] = useState<Partial<SystemSetting> | null>(null);
    const [editingUser, setEditingUser] = useState<Partial<Profile> | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('VENDEDOR');
    const [generatedLink, setGeneratedLink] = useState('');
    const [remoteKey, setRemoteKey] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const [settingsData, usersData] = await Promise.all([
                getSystemSettings(),
                profile?.tenantId ? getTenantUsers(profile.tenantId) : Promise.resolve([])
            ]);
            setSettings(settingsData);
            setUsers(usersData);

            if (profile?.role === 'SUPER_ADMIN') {
                const [audit, ips, invites] = await Promise.all([
                    getGlobalAuditLogs(),
                    getAllowedIPs(),
                    getInvitations()
                ]);
                setAuditLogs(audit);
                setAllowedIps(ips);
                setInvitations(invites);
            }
        } catch (error) {
            console.error("Error loading administration data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingItem?.label || !editingItem?.value) {
            showToast('Preencha os campos obrigatórios!', 'warning');
            return;
        }

        try {
            await saveSystemSetting({ ...editingItem, category: activeTab, isActive: editingItem.isActive !== false } as SystemSetting);
            showToast('Configuração salva com sucesso!', 'success');
            setEditingItem(null);
            loadSettings();
        } catch (err) {
            showToast("Erro ao salvar! Verifique as permissões (Admin) ou se a tabela 'system_settings' existe no Supabase.", 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Atenção CUIDADO (Blindagem Admin):\nTem certeza que deseja apagar esta opção? Isso removerá a disponibilidade desse item nas próximas seleções!")) {
            return;
        }

        try {
            const success = await deleteSystemSetting(id);
            if (success) {
                showToast('Opção apagada permanentemente!', 'success');
                loadSettings();
            } else {
                throw new Error("Failed");
            }
        } catch (err) {
            showToast('Falha ao apagar ou acesso negado pelo Supabase.', 'error');
        }
    };

    const toggleActive = async (setting: SystemSetting) => {
        try {
            await saveSystemSetting({ ...setting, isActive: !setting.isActive });
            showToast(`Status atualizado`, 'success');
            loadSettings();
        } catch (err) {
            showToast('Erro ao atualizar status', 'error');
        }
    };

    const handleGenerateRemoteKey = async () => {
        try {
            const key = await generateRemoteAccessKey();
            setRemoteKey(key);
            showToast('Chave de Acesso Remoto gerada!', 'success');
        } catch (err) {
            showToast('Erro ao gerar chave', 'error');
        }
    };

    const handleCreateInvite = async () => {
        if (!inviteEmail) {
            showToast('E-mail obrigatório', 'warning');
            return;
        }
        try {
            const link = await createInvitation(inviteEmail, inviteRole);
            setGeneratedLink(link);
            showToast('Convite gerado com sucesso!', 'success');
            loadSettings();
        } catch (err) {
            showToast('Erro ao gerar convite', 'error');
        }
    };

    const handleResetInvite = async (inviteId: string) => {
        try {
            const link = await resetInvitation(inviteId);
            setGeneratedLink(link);
            setShowResetModal(true);
            showToast('Convite resetado/gerado um novo com sucesso!', 'success');
            loadSettings();
        } catch (err) {
            showToast('Erro ao resetar convite', 'error');
        }
    };

    const currentSettingsList = settings.filter(s => s.category === activeTab);

    return (
        <div className="settings-manager-pane">
            <header className="settings-header">
                <div>
                    <h1><ShieldCheck weight="fill" className="text-blue-500" /> Configurações Avançadas (Administrador) - v2.05.19</h1>
                    <p>Controle global de variáveis, motivos de perda e tipos operacionais.</p>
                </div>
            </header>

            <div className="settings-layout">
                {/* Lateral Settings Menu */}
                <aside className="settings-sidebar">
                    <button className={`sett-tab ${activeTab === 'LOSS_REASON' ? 'active' : ''}`} onClick={() => navigate('/ajustes/crm/perda')}>
                        <Prohibit size={18} /> Motivos de Perda
                    </button>
                    <button className={`sett-tab ${activeTab === 'OS_TYPE' ? 'active' : ''}`} onClick={() => navigate('/ajustes/os/tipos')}>
                        <ListBullets size={18} /> Tipos de OS
                    </button>
                    <button className={`sett-tab ${activeTab === 'OCCURRENCE_TYPE' ? 'active' : ''}`} onClick={() => navigate('/ajustes/suporte/ocorrencias')}>
                        <Warning size={18} /> Tipos de Ocorrências
                    </button>
                    <div className="sett-sidebar-divider" />
                    <button className={`sett-tab ${activeTab === 'USERS' ? 'active' : ''}`} onClick={() => navigate('/ajustes/equipe')}>
                        <Users size={18} /> Equipe e Permissões
                    </button>
                    {(profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN') && (
                        <>
                            <button className={`sett-tab ${activeTab === 'SECURITY' ? 'active' : ''}`} onClick={() => navigate('/ajustes/seguranca')}>
                                <ShieldCheck size={18} /> Auditoria e Segurança
                            </button>
                            <button className={`sett-tab ${activeTab === 'CONTRACTS' ? 'active' : ''}`} onClick={() => navigate('/ajustes/contratos')}>
                                <Scroll size={18} /> Personalização & Contratos
                            </button>
                        </>
                    )}
                </aside>

                {/* Main Content */}
                <main className="settings-content">
                    <div className="sett-panel">
                        <div className="sett-panel-header">
                            <div>
                                <h2>
                                    {activeTab === 'LOSS_REASON' && 'Gerenciar Motivos de Perda (CRM)'}
                                    {activeTab === 'OS_TYPE' && 'Tipos de Ordens de Serviço (Técnico)'}
                                    {activeTab === 'OCCURRENCE_TYPE' && 'Tipificação de Ocorrências (Suporte)'}
                                    {activeTab === 'USERS' && 'Controle de Acessos e Níveis (SaaS)'}
                                    {activeTab === 'SECURITY' && 'Segurança Avançada e Auditoria Global'}
                                    {activeTab === 'CONTRACTS' && 'Branding e Automação de Contratos'}
                                </h2>
                                <span>
                                    {activeTab === 'USERS' && 'Configure quem pode acessar o TITÃ e quais ações podem executar.'}
                                    {activeTab === 'SECURITY' && 'Histórico completo de ações, chaves remotas e IPs permitidos.'}
                                    {activeTab === 'CONTRACTS' && 'Ajuste a identidade da sua empresa, cores de e-mail e templates de contrato.'}
                                    {activeTab !== 'USERS' && activeTab !== 'SECURITY' && activeTab !== 'CONTRACTS' && 'Altere, ative ou adicione novas opções que refletirão globalmente no sistema.'}
                                </span>
                            </div>
                            {activeTab !== 'USERS' && activeTab !== 'SECURITY' && activeTab !== 'CONTRACTS' && (
                                <button className="btn-titan-primary" onClick={() => setEditingItem({ label: '', value: '', isActive: true })}>
                                    <Plus weight="bold" /> NOVO ITEM
                                </button>
                            )}
                            {activeTab === 'USERS' && (
                                <button className="btn-titan-primary" onClick={() => setShowInviteModal(true)}>
                                    <Plus weight="bold" /> CONVIDAR MEMBRO
                                </button>
                            )}
                        </div>

                        {editingItem && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sett-editor-box">
                                <div className="sett-grid">
                                    <div className="titan-field">
                                        <label>Chave do Sistema (Value)</label>
                                        <input
                                            className="titan-input"
                                            placeholder="Ex: PRECO_ALTO"
                                            value={editingItem.value}
                                            onChange={e => setEditingItem({ ...editingItem, value: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                            disabled={!!editingItem.id} // Impede alterar o Value de um já existente para não quebrar relatórios antigos
                                        />
                                    </div>
                                    <div className="titan-field">
                                        <label>Nome Visível (Label)</label>
                                        <input
                                            className="titan-input"
                                            placeholder="Ex: Preço Incompatível"
                                            value={editingItem.label}
                                            onChange={e => setEditingItem({ ...editingItem, label: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="sett-editor-actions">
                                    <button className="btn-titan-sm bg-gray-700" onClick={() => setEditingItem(null)}>CANCELAR</button>
                                    <button className="btn-titan-sm bg-green-600" onClick={handleSave}><FloppyDisk /> SALVAR NO SUPABASE</button>
                                </div>
                            </motion.div>
                        )}

                        <div className="sett-list">
                            {isLoading ? (
                                <div className="sett-loading">Sincronizando com Supabase...</div>
                            ) : activeTab === 'USERS' ? (
                                <div className="user-settings-grid">
                                    {users.map(user => (
                                        <div key={user.id} className="user-card-titan">
                                            <div className="user-card-header">
                                                <div className="user-main-info">
                                                    <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} alt="" />
                                                    <div>
                                                        <h4>{user.fullName}</h4>
                                                        <span>{user.email}</span>
                                                    </div>
                                                </div>
                                                <div className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</div>
                                            </div>
                                            <div className="user-card-actions">
                                                <button className="btn-titan-outline-sm" onClick={() => setEditingUser(user)}>
                                                    <Key size={14} /> PERMISSÕES
                                                </button>
                                                <div className="status-toggle" onClick={() => {/* status handle */ }}>
                                                    <div className={`t-knob ${user.isActive ? 'on' : 'off'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {invitations
                                        .filter(inv => !inv.usedAt) // Oculta convites já usados para não duplicar com os cards de usuário
                                        .map(inv => {
                                            const isExpired = inv.expiresAt && new Date(inv.expiresAt) < new Date();
                                            const status = isExpired ? 'EXPIRADO' : 'PENDENTE';
                                            const statusColor = isExpired ? '#ef4444' : '#f59e0b';

                                            return (
                                                <div key={inv.id} className="user-card-titan">
                                                    <div className="user-card-header">
                                                        <div className="user-main-info">
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Envelope size={20} color="var(--text-secondary)" />
                                                            </div>
                                                            <div>
                                                                <h4 style={{ color: 'var(--text-secondary)' }}>Convite {status !== 'PENDENTE' && `(${status})`}</h4>
                                                                <span>{inv.email}</span>
                                                            </div>
                                                        </div>
                                                        <div className={`role-badge ${inv.role.toLowerCase()}`}>{inv.role}</div>
                                                    </div>
                                                    <div className="user-card-actions" style={{ justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: statusColor, padding: '4px 8px', background: `${statusColor}15`, borderRadius: '6px' }}>
                                                            {status}
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                className="btn-titan-outline-sm"
                                                                onClick={() => {
                                                                    const link = `${window.location.origin}/signup?invite=${inv.token}`;
                                                                    navigator.clipboard.writeText(link);
                                                                    showToast('Link copiado!', 'success');
                                                                }}>
                                                                <Copy size={14} /> COPIAR
                                                            </button>
                                                            <button className="btn-titan-outline-sm" onClick={() => handleResetInvite(inv.id)}>
                                                                <ArrowsClockwise size={14} /> RESETAR
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    <button className="add-user-placeholder" onClick={() => setShowInviteModal(true)}>
                                        <Plus size={32} />
                                        <span>Convidar Membro</span>
                                    </button>
                                </div>
                            ) : activeTab === 'SECURITY' ? (
                                <div className="security-settings-layout">
                                    <div className="security-grid-main">
                                        <div className="security-card">
                                            <h3><LockKey size={20} /> Remote Access Key (One-Time)</h3>
                                            <p>Gere uma chave única para suporte remoto. Invalida após 1 uso.</p>
                                            <div className="remote-key-gen">
                                                {remoteKey ? (
                                                    <div className="generated-key-box">
                                                        <code>{remoteKey}</code>
                                                        <button onClick={() => { navigator.clipboard.writeText(remoteKey); showToast('Chave copiada!', 'success'); }}><Copy /></button>
                                                    </div>
                                                ) : (
                                                    <button className="btn-titan-primary" onClick={handleGenerateRemoteKey}>GERAR CHAVE SERVICE ROLE</button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="security-card">
                                            <h3><Globe size={20} /> Whitelist de IPs Administrativos</h3>
                                            <div className="ip-list">
                                                {allowedIps.map(ip => (
                                                    <div key={ip.id} className="ip-row">
                                                        <span>{ip.ipAddress} - {ip.description}</span>
                                                        <button className="trash-btn" onClick={() => removeAllowedIP(ip.id)}><Trash /></button>
                                                    </div>
                                                ))}
                                                <button className="btn-titan-sm bg-gray-800" onClick={() => {
                                                    const ip = window.prompt("Endereço IP:");
                                                    const desc = window.prompt("Descrição:");
                                                    if (ip) addAllowedIP(ip, desc || '').then(loadSettings);
                                                }}>+ ADICIONAR IP</button>
                                            </div>
                                        </div>
                                    </div>
                                    <AdminAuditLogs />
                                </div>
                            ) : activeTab === 'CONTRACTS' ? (
                                <AdminBrandingSettings />
                            ) : currentSettingsList.length === 0 ? (
                                <div className="sett-empty">Nenhum item configurado nesta categoria.</div>
                            ) : (
                                currentSettingsList.map(item => (
                                    <div key={item.id} className={`sett-item-row ${!item.isActive ? 'disabled' : ''}`}>
                                        <div className="sett-info">
                                            <strong>{item.label}</strong>
                                            <span>Cod: {item.value}</span>
                                        </div>
                                        <div className="sett-actions-row">
                                            <div className="status-toggle" onClick={() => toggleActive(item)}>
                                                <div className={`t-knob ${item.isActive ? 'on' : 'off'}`} />
                                            </div>
                                            <button className="icon-btn edit" title="Editar Label" onClick={() => setEditingItem(item)}><PencilSimple size={18} /></button>
                                            {(profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN') && (
                                                <button className="icon-btn trash" title="Deletar (CUIDADO)" onClick={() => handleDelete(item.id)}><Trash size={18} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Advanced Role/Permissions Modal (Zoho Style) */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        className="permissions-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="permissions-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <header>
                                <div>
                                    <h3>Ajustar Perfil: {editingUser.fullName}</h3>
                                    <p>Nível de acesso Zoho-Style (Granular)</p>
                                </div>
                                <button className="close-modal" onClick={() => setEditingUser(null)}>×</button>
                            </header>

                            <div className="role-selector-box">
                                <label>Nível Hierárquico</label>
                                <div className="role-options">
                                    {['ADMIN', 'VENDEDOR', 'TECNICO', 'SUPORTE'].map(r => (
                                        <button
                                            key={r}
                                            className={`role-opt ${editingUser.role === r ? 'selected' : ''}`}
                                            onClick={() => setEditingUser({ ...editingUser, role: r as UserRole })}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="permissions-matrix">
                                <div className="matrix-row header">
                                    <div className="resource-col">Módulo</div>
                                    <div>Ver</div>
                                    <div>Criar</div>
                                    <div>Editar</div>
                                    <div>Apagar</div>
                                </div>
                                {['Leads', 'Vendas', 'OS', 'Financeiro', 'Rede'].map(mod => (
                                    <div key={mod} className="matrix-row">
                                        <div className="resource-col">{mod}</div>
                                        <div><input type="checkbox" defaultChecked /></div>
                                        <div><input type="checkbox" defaultChecked /></div>
                                        <div><input type="checkbox" defaultChecked /></div>
                                        <div><input type="checkbox" /></div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <button className="btn-titan-secondary" onClick={() => setEditingUser(null)}>CANCELAR</button>
                                <button className="btn-titan-primary">ATUALIZAR ACESSOS</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invitation Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div className="permissions-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="permissions-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <header>
                                <div>
                                    <h3>Convidar Novo Membro</h3>
                                    <p>Gere um link de onboarding seguro para sua organização.</p>
                                </div>
                                <button className="close-modal" onClick={() => { setShowInviteModal(false); setGeneratedLink(''); }}>×</button>
                            </header>
                            <div className="invite-form-box">
                                <div className="titan-field">
                                    <label>E-mail do Convidado</label>
                                    <input className="titan-input" placeholder="email@exemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                </div>
                                <div className="role-selector-box" style={{ padding: '0', marginTop: '20px' }}>
                                    <label>Nível Hierárquico Inicial</label>
                                    <div className="role-options">
                                        {['ADMIN', 'VENDEDOR', 'TECNICO', 'SUPORTE'].map(r => (
                                            <button key={r} className={`role-opt ${inviteRole === r ? 'selected' : ''}`} onClick={() => setInviteRole(r as UserRole)}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                                {generatedLink && (
                                    <div className="generated-link-area">
                                        <label>Link de Convite Gerado (Uso Único):</label>
                                        <div className="link-box">
                                            <code>{generatedLink}</code>
                                            <button onClick={() => { navigator.clipboard.writeText(generatedLink); showToast('Link copiado!', 'success'); }}><Copy size={18} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn-titan-secondary" onClick={() => { setShowInviteModal(false); setGeneratedLink(''); }}>CONCLUIR</button>
                                {!generatedLink && <button className="btn-titan-primary" onClick={handleCreateInvite}>GERAR LINK DE CONVITE</button>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reset Invitation Modal */}
            <AnimatePresence>
                {showResetModal && generatedLink && (
                    <motion.div className="permissions-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="permissions-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <header>
                                <div>
                                    <h3>Novo Link Gerado</h3>
                                    <p>O link anterior foi invalidado. Copie o novo link seguro.</p>
                                </div>
                                <button className="close-modal" onClick={() => { setShowResetModal(false); setGeneratedLink(''); }}>×</button>
                            </header>
                            <div className="invite-form-box" style={{ padding: '20px 0' }}>
                                <div className="generated-link-area">
                                    <label>Link de Convite Atualizado (Uso Único):</label>
                                    <div className="link-box">
                                        <code>{generatedLink}</code>
                                        <button onClick={() => { navigator.clipboard.writeText(generatedLink); showToast('Novo link copiado!', 'success'); }}><Copy size={18} /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-titan-primary" onClick={() => { navigator.clipboard.writeText(generatedLink); showToast('Novo link copiado!', 'success'); setShowResetModal(false); setGeneratedLink(''); }}>COPIAR & FECHAR</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsManager;
