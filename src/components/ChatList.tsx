import React, { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import {
    PushPin, Archive, BellSlash,
    Trash, Prohibit,
    X, Warning, Info,
    Eye, EyeSlash
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatList.css';

interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    status: 'new' | 'waiting' | 'active';
    platform: 'whatsapp' | 'instagram' | 'web';
    waitingMinutes?: number;
    isPinned?: boolean;
    isArchived?: boolean;
    isMuted?: boolean;
    isBlocked?: boolean;
    lastMessageTimestamp: number;
}

const ChatList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'main' | 'archived'>('main');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string | null, sub?: 'mute' } | null>(null);
    const [modal, setModal] = useState<{ type: 'clear' | 'delete' | 'block', chatId: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const initialChats: Chat[] = [
        { id: '1', name: 'João Silva', lastMessage: 'Preciso da segunda via do boleto', time: '10:25', unread: 2, status: 'new', platform: 'whatsapp', waitingMinutes: 8, lastMessageTimestamp: Date.now() - 1000 * 60 * 10 },
        { id: '2', name: 'Maria Souza', lastMessage: 'O sinal está oscilando muito hoje', time: '09:40', unread: 5, status: 'active', platform: 'instagram', waitingMinutes: 25, lastMessageTimestamp: Date.now() - 1000 * 60 * 60 },
        { id: '3', name: 'Carlos Antunes', lastMessage: 'Qual o valor do plano de 500mb?', time: '08:15', unread: 0, status: 'waiting', platform: 'whatsapp', waitingMinutes: 45, lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 2 },
        { id: '4', name: 'Ana Oliveira', lastMessage: 'Obrigada pelo atendimento!', time: '07:30', unread: 0, status: 'active', platform: 'web', waitingMinutes: 90, lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 14 },
    ];

    const [chats, setChats] = React.useState<Chat[]>(() => {
        const saved = localStorage.getItem('tita_chats');
        return saved ? JSON.parse(saved) : initialChats;
    });

    React.useEffect(() => {
        localStorage.setItem('tita_chats', JSON.stringify(chats));
    }, [chats]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = (chatId: string, action: string) => {
        setChats(prev => {
            const chat = prev.find(c => c.id === chatId);
            if (!chat) return prev;

            switch (action) {
                case 'pin':
                    const pinnedCount = prev.filter(c => c.isPinned && !c.isArchived).length;
                    if (!chat.isPinned && pinnedCount >= 3) {
                        showToast("Limite de conversas fixadas atingido (máx. 3)");
                        return prev;
                    }
                    return prev.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c);
                case 'archive':
                    return prev.map(c => c.id === chatId ? { ...c, isArchived: !c.isArchived, isPinned: false } : c);
                case 'read':
                    return prev.map(c => c.id === chatId ? { ...c, unread: c.unread > 0 ? 0 : 1 } : c);
                case 'clear':
                    return prev.map(c => c.id === chatId ? { ...c, lastMessage: 'Mensagens limpas', unread: 0 } : c);
                case 'delete':
                    return prev.filter(c => c.id !== chatId);
                default:
                    return prev;
            }
        });
        setContextMenu(null);
    };

    const getUrgencyClass = (minutes?: number) => {
        if (!minutes) return '';
        if (minutes >= 60) return 'urgency-red';
        if (minutes >= 30) return 'urgency-orange';
        if (minutes >= 10) return 'urgency-yellow';
        if (minutes >= 5) return 'urgency-blue';
        return '';
    };

    const sortedChats = [...chats]
        .filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
            const isTargetView = view === 'archived' ? c.isArchived : !c.isArchived;
            return matchesSearch && isTargetView;
        })
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.lastMessageTimestamp - a.lastMessageTimestamp;
        });

    const archivedCount = chats.filter(c => c.isArchived).length;

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

                {view === 'main' ? (
                    <>
                        {archivedCount > 0 && (
                            <button className="archived-trigger" onClick={() => setView('archived')}>
                                <div className="trigger-left">
                                    <Archive size={20} weight="duotone" />
                                    <span>Arquivadas</span>
                                </div>
                                <span className="archived-badge">{archivedCount}</span>
                            </button>
                        )}
                    </>
                ) : (
                    <p className="archived-info">Essas conversas estão arquivadas e silenciadas. Novas mensagens irão desarquivá-las.</p>
                )}
            </div>

            <div className="chats-scroll-area">
                {sortedChats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`chat-card ${chat.unread > 0 ? 'unread' : ''} ${chat.isPinned ? 'pinned' : ''} ${chat.isBlocked ? 'blocked' : ''}`}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.pageX, y: e.pageY, chatId: chat.id });
                        }}
                    >
                        <div className={`chat-avatar flex-center ${chat.isBlocked ? 'grayed' : ''}`}>
                            {chat.name.charAt(0)}
                            <div className={`platform-badge ${chat.platform}`}></div>
                            {chat.isBlocked && <div className="blocked-overlay"><Prohibit size={14} weight="bold" /></div>}
                        </div>

                        <div className="chat-content">
                            <div className="chat-name-row">
                                <div className="chat-name-wrapper">
                                    <span className="chat-name">{chat.name}</span>
                                    {chat.isMuted && <BellSlash size={14} weight="fill" className="mute-icon" />}
                                </div>
                                <div className="chat-meta">
                                    <span className="chat-time">{chat.time}</span>
                                    <div className="meta-icons">
                                        {chat.isPinned && <PushPin size={14} weight="fill" className="pin-icon" />}
                                        {chat.unread > 0 && (
                                            <span className={`unread-badge ${getUrgencyClass(chat.waitingMinutes)}`}>
                                                {chat.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="last-message">{chat.lastMessage}</p>
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
                                            <PushPin size={18} weight={chat.isPinned ? "fill" : "duotone"} />
                                            {chat.isPinned ? 'Desafixar' : 'Fixar'}
                                        </button>

                                        {!chat.isArchived ? (
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

                                        {chat.unread > 0 ? (
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

                                        <button onClick={() => setModal({ type: 'clear', chatId: chat.id })} className="danger">
                                            <Trash size={18} weight="duotone" />
                                            Limpar conversa
                                        </button>
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
                                {modal.type === 'clear' && 'Limpar conversa?'}
                                {modal.type === 'delete' && 'Apagar conversa?'}
                            </h3>
                            <p>
                                {modal.type === 'clear' && `Deseja limpar todas as mensagens com ${chats.find(c => c.id === modal.chatId)?.name}? Esta ação não pode ser desfeita.`}
                                {modal.type === 'delete' && `Deseja apagar a conversa com ${chats.find(c => c.id === modal.chatId)?.name}? O histórico será removido permanentemente.`}
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
