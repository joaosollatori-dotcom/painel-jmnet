import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, PencilSimple, Trash, Warning, FloppyDisk, Prohibit, ListBullets, Users, Key, UserCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemSettings, saveSystemSetting, deleteSystemSetting, SystemSetting } from '../services/systemSettingsService';
import { getTenantUsers, updateUserProfile, Profile, UserRole } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import './SettingsManager.css';

const SettingsManager: React.FC = () => {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [activeTab, setActiveTab] = useState<'LOSS_REASON' | 'OS_TYPE' | 'OCCURRENCE_TYPE' | 'USERS'>('LOSS_REASON');
    const [isLoading, setIsLoading] = useState(true);

    // Edit Form State
    const [editingItem, setEditingItem] = useState<Partial<SystemSetting> | null>(null);
    const [editingUser, setEditingUser] = useState<Partial<Profile> | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const [settingsData, usersData] = await Promise.all([
                getSystemSettings(),
                getTenantUsers('system') // Placeholder for now, will use real tenantId from auth later
            ]);
            setSettings(settingsData);
            setUsers(usersData);
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

    const currentSettingsList = settings.filter(s => s.category === activeTab);

    return (
        <div className="settings-manager-pane">
            <header className="settings-header">
                <div>
                    <h1><ShieldCheck weight="fill" className="text-blue-500" /> Configurações Avançadas (Administrador)</h1>
                    <p>Controle global de variáveis, motivos de perda e tipos operacionais.</p>
                </div>
            </header>

            <div className="settings-layout">
                {/* Lateral Settings Menu */}
                <aside className="settings-sidebar">
                    <button className={`sett-tab ${activeTab === 'LOSS_REASON' ? 'active' : ''}`} onClick={() => setActiveTab('LOSS_REASON')}>
                        <Prohibit size={18} /> Motivos de Perda
                    </button>
                    <button className={`sett-tab ${activeTab === 'OS_TYPE' ? 'active' : ''}`} onClick={() => setActiveTab('OS_TYPE')}>
                        <ListBullets size={18} /> Tipos de OS
                    </button>
                    <button className={`sett-tab ${activeTab === 'OCCURRENCE_TYPE' ? 'active' : ''}`} onClick={() => setActiveTab('OCCURRENCE_TYPE')}>
                        <Warning size={18} /> Tipos de Ocorrências
                    </button>
                    <div className="sett-sidebar-divider" />
                    <button className={`sett-tab ${activeTab === 'USERS' ? 'active' : ''}`} onClick={() => setActiveTab('USERS')}>
                        <Users size={18} /> Equipe e Permissões
                    </button>
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
                                </h2>
                                <span>
                                    {activeTab === 'USERS'
                                        ? 'Configure quem pode acessar o TITÃ e quais ações podem executar.'
                                        : 'Altere, ative ou adicione novas opções que refletirão globalmente no sistema.'}
                                </span>
                            </div>
                            {activeTab !== 'USERS' && (
                                <button className="btn-titan-primary" onClick={() => setEditingItem({ label: '', value: '', isActive: true })}>
                                    <Plus weight="bold" /> NOVO ITEM
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
                                    <button className="add-user-placeholder">
                                        <Plus size={32} />
                                        <span>Convidar Membro</span>
                                    </button>
                                </div>
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
                                            <button className="icon-btn trash" title="Deletar (CUIDADO)" onClick={() => handleDelete(item.id)}><Trash size={18} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsManager;
