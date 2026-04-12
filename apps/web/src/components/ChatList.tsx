import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import {
    PushPin, Archive, BellSlash,
    Trash, Prohibit,
    X, Warning, Info,
    Eye, EyeSlash
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConversations, updateConversation, deleteConversation, subscribeToConversations, createConversation } from '../services/chatService';
import { CheckSquareOffset } from '@phosphor-icons/react';
import type { Conversation } from '../services/chatService';
import './ChatList.css';

interface ChatListProps {
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onSelectChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'main' | 'archived' | 'ended'>('main');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string | null } | null>(null);
    const [modal, setModal] = useState<{ type: 'clear' | 'delete' | 'block', chatId: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [chats, setChats] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatData, setNewChatData] = useState({ name: '', phone: '', email: '', platform: 'whatsapp', ai_active: false });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadChats();
        const subscription = subscribeToConversations((updatedChat) => {
            setChats(prev => {
                const index = prev.findIndex(c => c.id === updatedChat.id);
                if (index > -1) {
                    const newChats = [...prev];
                    newChats[index] = updatedChat;
                    return newChats;
                }
                return [updatedChat, ...prev];
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadChats = async () => {
        try {
            setLoading(true);
            const data = await getConversations();
            setChats(data);
        } catch (err) {
            console.error('Error loading chats:', err);
            showToast("Erro ao carregar conversas");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatData.name.trim()) {
            showToast("O nome é obrigatório");
            return;
        }
        try {
            setIsCreating(true);
            const newConv = await createConversation({
                contact_name: newChatData.name.trim(),
                contact_phone: newChatData.phone.trim(),
                contact_email: newChatData.email.trim(),
                platform: newChatData.platform as 'whatsapp' | 'instagram' | 'web',
                status: 'active',
                is_pinned: false,
                is_archived: false,
                is_muted: false,
                is_blocked: false,
                unread_count: 0,
                last_message: 'Conversa iniciada',
                last_message_at: new Date().toISOString(),
                ai_active: newChatData.ai_active,
                is_closed: false
            });
            setShowNewChatModal(false);
            setNewChatData({ name: '', phone: '', email: '', platform: 'whatsapp', ai_active: false });
            onSelectChat(newConv.id);
            showToast("Conversa criada com sucesso");
        } catch (err) {
            console.error('Error creating chat:', err);
            showToast("Erro ao criar conversa");
        } finally {
            setIsCreating(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = async (chatId: string, action: string) => {
        try {
            const chat = chats.find(c => c.id === chatId);
            if (!chat) return;

            switch (action) {
                case 'pin':
                    const pinnedCount = chats.filter(c => c.is_pinned && !c.is_archived).length;
                    if (!chat.is_pinned && pinnedCount >= 3) {
                        showToast("Limite de conversas fixadas atingido (máx. 3)");
                        return;
                    }
                    await updateConversation(chatId, { is_pinned: !chat.is_pinned });
                    break;
                case 'archive':
                    await updateConversation(chatId, { is_archived: !chat.is_archived, is_pinned: false });
                    break;
                case 'read':
                    await updateConversation(chatId, { unread_count: chat.unread_count > 0 ? 0 : 1 });
                    break;
                case 'delete':
                    await deleteConversation(chatId);
                    setChats(prev => prev.filter(c => c.id !== chatId));
                    if (selectedChatId === chatId) onSelectChat('');
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error('Action error:', err);
            showToast("Erro ao realizar ação");
        }
        setContextMenu(null);
    };

    const getUrgencyClass = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes >= 60) return 'urgency-red';
        if (minutes >= 30) return 'urgency-orange';
        if (minutes >= 10) return 'urgency-yellow';
        if (minutes >= 5) return 'urgency-blue';
        return '';
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const sortedChats = [...chats]
        .filter(c => {
            const matchesSearch = c.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
            let isTargetView = false;
            if (view === 'main') {
                isTargetView = !c.is_archived && !c.is_closed;
            } else if (view === 'archived') {
                isTargetView = c.is_archived && !c.is_closed;
            } else if (view === 'ended') {
                isTargetView = c.is_closed;
            }
            return matchesSearch && isTargetView;
        })
        .sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

    const archivedCount = chats.filter(c => c.is_archived && !c.is_closed).length;
    const endedCount = chats.filter(c => c.is_closed).length;

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <div className="header-top">
                    {view === 'main' ? (
                        <>
                            <h2>Conversas</h2>
                            <button className="add-chat-btn flex-center" title="Nova conversa..." onClick={() => setShowNewChatModal(true)}>
                                <Plus size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex-center gap-sm">
                                <button className="back-btn" onClick={() => setView('main')}>
                                    <X size={20} />
                                </button>
                                <h2>{view === 'archived' ? 'Arquivadas' : 'Encerradas (Gestão)'}</h2>
                            </div>
                        </>
                    )}
                </div>

                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Filter size={18} className="filter-icon" />
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '0 1rem 1rem 1rem' }}>
                    {view === 'main' && archivedCount > 0 && (
                        <button className="archived-trigger" onClick={() => setView('archived')} style={{ flex: 1, margin: 0 }}>
                            <div className="trigger-left">
                                <Archive size={18} weight="duotone" />
                                <span style={{ fontSize: '0.9rem' }}>Arquivadas</span>
                            </div>
                            <span className="archived-badge">{archivedCount}</span>
                        </button>
                    )}

                    {view === 'main' && endedCount > 0 && (
                        <button className="archived-trigger" onClick={() => setView('ended')} style={{ flex: 1, margin: 0, backgroundColor: '#2a1a1a', border: '1px solid #ff4d4f40' }}>
                            <div className="trigger-left" style={{ color: '#ff4d4f' }}>
                                <CheckSquareOffset size={18} weight="duotone" />
                                <span style={{ fontSize: '0.9rem' }}>Encerradas</span>
                            </div>
                            <span className="archived-badge" style={{ backgroundColor: '#ff4d4f33', color: '#ff4d4f' }}>{endedCount}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="chats-scroll-area">
                {loading ? (
                    <div className="chats-skeleton-list">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="chat-card skeleton-pulse" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', padding: '12px 16px', gap: '16px', cursor: 'default', pointerEvents: 'none' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--bg-deep)' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                                    <div style={{ width: '50%', height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-deep)' }}></div>
                                    <div style={{ width: '85%', height: '12px', borderRadius: '4px', backgroundColor: 'var(--bg-deep)', opacity: 0.7 }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedChats.length === 0 ? (
                    <div className="empty-state">Nenhuma conversa encontrada.</div>
                ) : sortedChats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`chat-card ${selectedChatId === chat.id ? 'active' : ''} ${chat.unread_count > 0 ? 'unread' : ''} ${chat.is_pinned ? 'pinned' : ''} ${chat.is_blocked ? 'blocked' : ''}`}
                        onClick={() => onSelectChat(chat.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.pageX, y: e.pageY, chatId: chat.id });
                        }}
                    >
                        <div className={`chat-avatar flex-center ${chat.is_blocked ? 'grayed' : ''}`}>
                            {chat.contact_name.charAt(0)}
                            <div className={`platform-badge ${chat.platform}`}></div>
                            {chat.is_blocked && <div className="blocked-overlay"><Prohibit size={14} weight="bold" /></div>}
                        </div>

                        <div className="chat-content">
                            <div className="chat-name-row">
                                <div className="chat-name-wrapper">
                                    <span className="chat-name">{chat.contact_name}</span>
                                    {chat.is_muted && <BellSlash size={14} weight="fill" className="mute-icon" />}
                                </div>
                                <div className="chat-meta">
                                    <span className="chat-time">{formatTime(chat.last_message_at)}</span>
                                    <div className="meta-icons">
                                        {chat.is_pinned && <PushPin size={14} weight="fill" className="pin-icon" />}
                                        {chat.unread_count > 0 && (
                                            <span className={`unread-badge ${getUrgencyClass(chat.last_message_at)}`}>
                                                {chat.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="last-message">{chat.last_message || 'Inicie uma conversa'}</p>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {contextMenu && (
                    <div className="context-menu-overlay" onClick={() => setContextMenu(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="context-menu"
                            style={{
                                top: contextMenu.y,
                                left: Math.min(contextMenu.x, window.innerWidth - 200)
                            }}
                        >
                            {(() => {
                                const chat = chats.find(c => c.id === contextMenu.chatId);
                                if (!chat) return null;
                                return (
                                    <>
                                        <button onClick={() => handleAction(chat.id, 'pin')}>
                                            <PushPin size={18} weight={chat.is_pinned ? "fill" : "duotone"} />
                                            {chat.is_pinned ? 'Desafixar' : 'Fixar'}
                                        </button>

                                        {!chat.is_archived ? (
                                            <button onClick={() => handleAction(chat.id, 'archive')}>
                                                <Archive size={18} weight="duotone" />
                                                Arquivar
                                            </button>
                                        ) : (
                                            <button onClick={() => handleAction(chat.id, 'archive')}>
                                                <Archive size={18} weight="fill" />
                                                Desarquivar
                                            </button>
                                        )}

                                        <div className="menu-divider"></div>

                                        {chat.unread_count > 0 ? (
                                            <button onClick={() => handleAction(chat.id, 'read')}>
                                                <Eye size={18} weight="duotone" />
                                                Marcar como lida
                                            </button>
                                        ) : (
                                            <button onClick={() => handleAction(chat.id, 'read')}>
                                                <EyeSlash size={18} weight="duotone" />
                                                Marcar como não lida
                                            </button>
                                        )}

                                        <div className="menu-divider"></div>

                                        <button onClick={() => setModal({ type: 'delete', chatId: chat.id })} className="danger">
                                            <Trash size={18} weight="fill" />
                                            Apagar conversa
                                        </button>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}

                {modal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="confirmation-modal"
                        >
                            <div className="modal-icon">
                                <Warning size={32} weight="duotone" />
                            </div>
                            <h3>
                                {modal.type === 'delete' && 'Apagar conversa?'}
                            </h3>
                            <p>
                                {modal.type === 'delete' && `Deseja apagar a conversa com ${chats.find(c => c.id === modal.chatId)?.contact_name}? O histórico será removido permanentemente.`}
                            </p>
                            <div className="modal-actions">
                                <button className="cancel-btn" onClick={() => setModal(null)}>Cancelar</button>
                                <button className="confirm-btn red" onClick={() => {
                                    handleAction(modal.chatId, modal.type);
                                    setModal(null);
                                }}>Confirmar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showNewChatModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="confirmation-modal"
                            style={{ minWidth: '350px' }}
                        >
                            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Nova Conversa</h3>
                                <button className="back-btn flex-center" onClick={() => setShowNewChatModal(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateChat} className="new-chat-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Nome do Contato</label>
                                    <input
                                        type="text"
                                        value={newChatData.name}
                                        onChange={e => setNewChatData({ ...newChatData, name: e.target.value })}
                                        placeholder="Ex: João Silva"
                                        required
                                        style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Telefone / ID</label>
                                    <input
                                        type="text"
                                        value={newChatData.phone}
                                        onChange={e => setNewChatData({ ...newChatData, phone: e.target.value })}
                                        placeholder="Ex: +55 11 99999-9999"
                                        style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#ccc' }}>E-mail</label>
                                    <input
                                        type="email"
                                        value={newChatData.email}
                                        onChange={e => setNewChatData({ ...newChatData, email: e.target.value })}
                                        placeholder="Ex: joao@email.com"
                                        style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Canal Origem</label>
                                    <select
                                        value={newChatData.platform}
                                        onChange={e => setNewChatData({ ...newChatData, platform: e.target.value })}
                                        style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }}
                                    >
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="web">Web</option>
                                    </select>
                                </div>
                                <div className="form-group checkbox-group" style={{ textAlign: 'left', marginTop: '10px', background: 'var(--bg-tertiary, #222)', padding: '12px', borderRadius: '8px', border: '1px solid #444' }}>
                                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={newChatData.ai_active}
                                            onChange={e => setNewChatData({ ...newChatData, ai_active: e.target.checked })}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color, #007bff)' }}
                                        />
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>🤖 Iniciar com o Bot (IA) ativo</span>
                                    </label>
                                </div>
                                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                    <button type="button" className="cancel-btn" onClick={() => setShowNewChatModal(false)}>Cancelar</button>
                                    <button type="submit" className="confirm-btn primary" disabled={isCreating} style={{ background: 'var(--primary-color, #007bff)', color: '#fff', border: 'none' }}>
                                        {isCreating ? 'Criando...' : 'Criar Conversa'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="toast-message"
                    >
                        <Info size={18} weight="fill" />
                        <span>{toast}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatList;
