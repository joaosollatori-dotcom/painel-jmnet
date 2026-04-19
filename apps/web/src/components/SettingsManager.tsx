import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, PencilSimple, Trash, Warning, FloppyDisk, Prohibit, ListBullets } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { getSystemSettings, saveSystemSetting, deleteSystemSetting, SystemSetting } from '../services/systemSettingsService';
import { useToast } from '../contexts/ToastContext';
import './SettingsManager.css';

const SettingsManager: React.FC = () => {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [activeTab, setActiveTab] = useState<'LOSS_REASON' | 'OS_TYPE' | 'OCCURRENCE_TYPE'>('LOSS_REASON');
    const [isLoading, setIsLoading] = useState(true);

    // Edit Form State
    const [editingItem, setEditingItem] = useState<Partial<SystemSetting> | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const data = await getSystemSettings();
        setSettings(data);
        setIsLoading(false);
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
                                </h2>
                                <span>Altere, ative ou adicione novas opções que refletirão globalmente no sistema.</span>
                            </div>
                            <button className="btn-titan-primary" onClick={() => setEditingItem({ label: '', value: '', isActive: true })}>
                                <Plus weight="bold" /> NOVO ITEM
                            </button>
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsManager;
