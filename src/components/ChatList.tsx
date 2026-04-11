import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import {
    PushPin, Archive, BellSlash,
    Trash, Prohibit,
    X, Warning, Info,
    Eye, EyeSlash
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConversations, updateConversation, deleteConversation, subscribeToConversations, Conversation } from '../services/chatService';
import './ChatList.css';

interface ChatListProps {
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onSelectChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'main' | 'archived'>('main');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string | null } | null>(null);
    const [modal, setModal] = useState<{ type: 'clear' | 'delete' | 'block', chatId: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [chats, setChats] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

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
            const isTargetView = view === 'archived' ? c.is_archived : !c.is_archived;
            return matchesSearch && isTargetView;
        })
        .sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

    const archivedCount = chats.filter(c => c.is_archived).length;

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <div className="header-top">
                    {view === 'main' ? (
                        <>
                            <h2>Conversas</h2>
                            <button className="add-chat-btn flex-center" title="Novo contato ativo">
                                <Plus size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex-center gap-sm">
                                <button className="back-btn" onClick={() => setView('main')}>
                                    <X size={20} />
                                </button>
                                <h2>Arquivadas</h2>
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

                {view === 'main' && archivedCount > 0 && (
                    <button className="archived-trigger" onClick={() => setView('archived')}>
                        <div className="trigger-left">
                            <Archive size={20} weight="duotone" />
                            <span>Arquivadas</span>
                        </div>
                        <span className="archived-badge">{archivedCount}</span>
                    </button>
                )}
            </div>

            <div className="chats-scroll-area">
                {loading ? (
                    <div className="loading-state">Carregando...</div>
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
