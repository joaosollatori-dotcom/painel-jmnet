import React, { useState, useRef, useEffect } from 'react';
import {
    Phone, Video, DotsThreeVertical, PaperPlaneTilt,
    Smiley, Paperclip, Checks, Lightning,
    CaretDown, ClockCounterClockwise, Note, Tag,
    WarningCircle, CurrencyDollar, Devices, WifiHigh,
    Info, FileText, Image as ImageIcon, Camera, UserList,
    ShareNetwork, Users, Robot, CheckSquareOffset,
    Warning, X
} from '@phosphor-icons/react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, sendMessage, addReaction, subscribeToMessages, updateConversation, getConversations, Message, Conversation } from '../services/chatService';
import './ChatArea.css';

interface ChatAreaProps {
    chatId: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId }) => {
    const [message, setMessage] = useState('');
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>('timeline');
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const [showEndModal, setShowEndModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
        const subscription = subscribeToMessages(chatId, (newMsg) => {
            setMessages(prev => {
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [convs, msgs] = await Promise.all([
                getConversations(),
                getMessages(chatId)
            ]);
            const current = convs.find(c => c.id === chatId);
            if (current) {
                setConversation(current);
                // Mark as read when opening
                if (current.unread_count > 0) {
                    await updateConversation(chatId, { unread_count: 0 });
                }
            }
            setMessages(msgs);
        } catch (err) {
            console.error('Error loading chat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !conversation || conversation.is_closed) return;
        try {
            const text = message.trim();
            setMessage('');
            await sendMessage(chatId, {
                sender: 'Você',
                text,
                is_user: true,
                is_bot: false
            });
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleReaction = async (emojiData: any) => {
        if (!activeMessageId) return;
        try {
            await addReaction(activeMessageId, emojiData.emoji);
            setMessages(prev => prev.map(m => {
                if (m.id === activeMessageId) {
                    const reactions = m.reactions || [];
                    if (!reactions.includes(emojiData.emoji)) {
                        return { ...m, reactions: [...reactions, emojiData.emoji] };
                    }
                }
                return m;
            }));
        } catch (err) {
            console.error('Error adding reaction:', err);
        }
        setActiveMessageId(null);
    };

    const handleInputEmoji = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji);
        setIsInputEmojiOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, upload to Supabase Storage first
            // For now, we'll just send a message with the filename
            const icon = file.type.startsWith('image/') ? '📷' : file.type.startsWith('video/') ? '🎥' : '📎';
            await sendMessage(chatId, {
                sender: 'Você',
                text: `${icon} ${file.name}`,
                is_user: true,
                is_bot: false
            });
        }
        e.target.value = '';
        setIsAttachmentMenuOpen(false);
    };

    const openFilePicker = (accept: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    const toggleAI = async () => {
        if (!conversation) return;
        try {
            const newState = !conversation.ai_active;
            await updateConversation(chatId, { ai_active: newState });
            setConversation({ ...conversation, ai_active: newState });
            setIsHeaderMenuOpen(false);
        } catch (err) {
            console.error('Error toggling AI:', err);
        }
    };

    const handleEndChat = async () => {
        try {
            await updateConversation(chatId, { is_closed: true });
            await sendMessage(chatId, {
                sender: 'Sistema',
                text: '🔒 Atendimento encerrado.',
                is_user: false,
                is_bot: false
            });
            setConversation(prev => prev ? { ...prev, is_closed: true } : null);
            setShowEndModal(false);
        } catch (err) {
            console.error('Error ending chat:', err);
        }
    };

    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const toggleAccordion = (id: string) => setOpenAccordion(openAccordion === id ? null : id);

    if (loading) return <div className="chat-area loading">Carregando conversa...</div>;

    return (
        <div className="chat-area">
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

            <header className="chat-header">
                <div className="chat-user-info">
                    <div className="avatar-small flex-center">{conversation?.contact_name.charAt(0)}</div>
                    <div className="user-details">
                        <h3>{conversation?.contact_name}</h3>
                        <span className="user-status">Online • {conversation?.platform}</span>
                    </div>
                </div>

                <div className="chat-actions">
                    {!conversation?.is_closed ? (
                        <button className="action-btn end-chat-btn" onClick={() => setShowEndModal(true)}>
                            <CheckSquareOffset size={20} weight="bold" />
                            <span>Encerrar</span>
                        </button>
                    ) : (
                        <span className="chat-ended-badge">Encerrado</span>
                    )}
                    <div className="divider"></div>
                    <button className="action-btn" title="Ligar (VoIP)"><Phone size={20} weight="duotone" /></button>
                    <button className="action-btn" title="Video Chamada"><Video size={20} weight="duotone" /></button>
                    <div className="divider"></div>
                    <button className={`action-btn ${isInfoOpen ? 'active' : ''}`} onClick={() => setIsInfoOpen(!isInfoOpen)} title="Informações">
                        <Info size={20} weight="bold" />
                    </button>
                    <div className="relative-container">
                        <button className={`action-btn ${isHeaderMenuOpen ? 'active' : ''}`} onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}>
                            <DotsThreeVertical size={20} weight="bold" />
                        </button>
                        <AnimatePresence>
                            {isHeaderMenuOpen && (
                                <>
                                    <div className="menu-backdrop" onClick={() => setIsHeaderMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="dropdown-menu header-menu"
                                    >
                                        <button className="menu-item" onClick={() => { setShowHistoryModal(true); setIsHeaderMenuOpen(false); }}>
                                            <ClockCounterClockwise size={18} /> Histórico
                                        </button>
                                        <button className="menu-item" onClick={() => { setShowTransferModal(true); setIsHeaderMenuOpen(false); }}>
                                            <ShareNetwork size={18} /> Transferir
                                        </button>
                                        <button className="menu-item" onClick={() => { setShowParticipantsModal(true); setIsHeaderMenuOpen(false); }}>
                                            <Users size={18} /> Participantes
                                        </button>
                                        <div className="menu-divider" />
                                        <button
                                            className={`menu-item ${conversation?.ai_active ? 'ai-active' : 'highlight'}`}
                                            onClick={toggleAI}
                                        >
                                            <Robot size={18} /> {conversation?.ai_active ? '✓ IA Ativa' : 'Ativar AI'}
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <div className="chat-main-content">
                <div className="chat-conversation">
                    <div className="messages-container">
                        <div className="chat-day-separator">Hoje</div>

                        {messages.map((msg) => (
                            <div key={msg.id} className={`message-wrapper ${msg.is_user || msg.is_bot ? 'sent' : 'received'} ${msg.is_bot ? 'bot' : ''}`}>
                                {!msg.is_user && !msg.is_bot && <div className="msg-avatar">{msg.sender.charAt(0)}</div>}
                                {msg.is_bot && <div className="msg-avatar bot"><Lightning size={14} weight="fill" /></div>}

                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>{msg.text}</p>
                                        <div className="message-footer">
                                            <span className="message-time">{formatTime(msg.created_at)}</span>
                                            {(msg.is_user || msg.is_bot) && <Checks size={14} className="status-icon" weight="bold" />}
                                        </div>

                                        <div className="message-reactions">
                                            {(msg.reactions || []).map((r, i) => (
                                                <span key={i} className="reaction-badge">{r}</span>
                                            ))}
                                            <button className="add-reaction-btn" onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}>
                                                <Smiley size={14} weight="bold" />
                                            </button>
                                        </div>

                                        {activeMessageId === msg.id && (
                                            <div className="emoji-picker-container">
                                                <EmojiPicker onEmojiClick={handleReaction} emojiStyle={EmojiStyle.GOOGLE} theme={Theme.DARK} lazyLoadEmojis height={350} width={300} skinTonesDisabled />
                                            </div>
                                        )}
                                    </div>
                                    {msg.is_bot && <span className="bot-label">{conversation?.ai_active ? '🤖 Titã AI — Ativo' : 'Titã AI Orchestrator'}</span>}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <footer className="chat-input-area">
                        <div className="input-actions">
                            <div className="relative-container">
                                <button className={`input-action-btn ${isInputEmojiOpen ? 'active' : ''}`} onClick={() => { setIsInputEmojiOpen(!isInputEmojiOpen); setIsAttachmentMenuOpen(false); }} disabled={conversation?.is_closed}>
                                    <Smiley size={22} weight="duotone" />
                                </button>
                                <AnimatePresence>
                                    {isInputEmojiOpen && (
                                        <>
                                            <div className="menu-backdrop" onClick={() => setIsInputEmojiOpen(false)} />
                                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="input-emoji-picker">
                                                <EmojiPicker onEmojiClick={handleInputEmoji} emojiStyle={EmojiStyle.GOOGLE} theme={Theme.DARK} lazyLoadEmojis height={380} width={320} skinTonesDisabled />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative-container">
                                <button className={`input-action-btn ${isAttachmentMenuOpen ? 'active' : ''}`} onClick={() => { setIsAttachmentMenuOpen(!isAttachmentMenuOpen); setIsInputEmojiOpen(false); }} disabled={conversation?.is_closed}>
                                    <Paperclip size={22} weight="duotone" />
                                </button>
                                <AnimatePresence>
                                    {isAttachmentMenuOpen && (
                                        <>
                                            <div className="menu-backdrop" onClick={() => setIsAttachmentMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                className="dropdown-menu attachment-menu"
                                            >
                                                <button className="menu-item" onClick={() => openFilePicker('image/*,video/*')}>
                                                    <ImageIcon size={18} /> Imagem / Vídeo
                                                </button>
                                                <button className="menu-item" onClick={() => openFilePicker('.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv')}>
                                                    <FileText size={18} /> Documento
                                                </button>
                                                <button className="menu-item" onClick={() => openFilePicker('image/*')}>
                                                    <Camera size={18} /> Câmera / Foto
                                                </button>
                                                <button className="menu-item" onClick={() => openFilePicker('.vcf')}>
                                                    <UserList size={18} /> Contato (.vcf)
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="message-input-container">
                            <textarea
                                placeholder={conversation?.is_closed ? 'Atendimento encerrado.' : 'Digite sua mensagem aqui...'}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                rows={1}
                                disabled={conversation?.is_closed}
                            />
                        </div>

                        <button className="send-btn flex-center" disabled={!message.trim() || conversation?.is_closed} onClick={handleSendMessage}>
                            <PaperPlaneTilt size={20} weight="duotone" />
                        </button>
                    </footer>
                </div>

                {isInfoOpen && (
                    <aside className="chat-info-sidebar">
                        <div className="sidebar-header-info"><h4>Detalhes do Cliente</h4></div>
                        <div className="accordion-list">
                            {[
                                { id: 'timeline', icon: <ClockCounterClockwise size={18} weight="duotone" />, label: 'Timeline', content: <><p>Criado em: {new Date(conversation?.created_at || '').toLocaleDateString()}</p><p>Canal: {conversation?.platform}</p></> },
                                { id: 'financeiro', icon: <CurrencyDollar size={18} weight="duotone" />, label: 'Financeiro', content: <p>Nenhum débito encontrado.</p> },
                            ].map(({ id, icon, label, content }) => (
                                <div key={id} className={`accordion-item ${openAccordion === id ? 'open' : ''}`}>
                                    <button className="accordion-header" onClick={() => toggleAccordion(id)}>
                                        <div className="header-left">{icon}<span>{label}</span></div>
                                        <CaretDown size={14} className="caret" />
                                    </button>
                                    <div className="accordion-content">{content}</div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>

            {/* ======= MODALS ======= */}
            <AnimatePresence>
                {showEndModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal">
                            <div className="ca-modal-icon warning"><Warning size={28} weight="duotone" /></div>
                            <h3>Encerrar atendimento?</h3>
                            <p>O cliente não poderá mais enviar mensagens nesta sessão.</p>
                            <div className="ca-modal-actions">
                                <button className="ca-cancel" onClick={() => setShowEndModal(false)}>Cancelar</button>
                                <button className="ca-confirm danger" onClick={handleEndChat}>Encerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showHistoryModal && (
                    <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
                            <h3>Histórico de Conversas</h3>
                            <div className="history-list">
                                <div className="history-item"><span className="history-date">{new Date().toLocaleDateString()}</span><span>Atendimento atual</span></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatArea;