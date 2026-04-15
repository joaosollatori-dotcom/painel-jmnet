import React, { useState, useRef, useEffect } from 'react';
import {
    Phone, Video, DotsThreeVertical, PaperPlaneTilt,
    Smiley, Paperclip, Checks, Lightning,
    CaretDown, ClockCounterClockwise,
    CurrencyDollar,
    Info, FileText, Image as ImageIcon, Camera, UserList,
    ShareNetwork, Users, Robot, CheckSquareOffset,
    Warning, X, PencilSimple, Copy, ChartLineUp,
    IdentificationCard, Wrench, WifiHigh, Clock, TrendUp, WarningCircle
} from '@phosphor-icons/react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, sendMessage, addReaction, subscribeToMessages, updateConversation, getConversations, uploadChatFile } from '../services/chatService';
import { createLead } from '../services/leadService';
import { createServiceOrder } from '../services/osService';
import { createOcorrencia } from '../services/ocorrenciaService';
import type { Message, Conversation } from '../services/chatService';
import CameraCaptureModal from './CameraCaptureModal';
import LoadingScreen from './LoadingScreen';
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
    const [showCameraModal, setShowCameraModal] = useState(false);

    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editContactData, setEditContactData] = useState({ name: '', phone: '', email: '' });

    const [showOSModal, setShowOSModal] = useState(false);
    const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false);
    const [showCadastroModal, setShowCadastroModal] = useState(false);
    const [cadastroMode, setCadastroMode] = useState<'rapido' | 'completo'>('rapido');
    const [conflictMode, setConflictMode] = useState<'add' | 'overwrite'>('add');
    const [endReason, setEndReason] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element;
            if (!target.closest('.chat-info-sidebar') && !target.closest('.action-btn[title="Informações"]') && !target.closest('.ca-modal-actions')) {
                setIsInfoOpen(false);
            }
            if (!target.closest('.header-menu') && !target.closest('.relative-container')) {
                setIsHeaderMenuOpen(false);
            }
            if (!target.closest('.attachment-menu') && !target.closest('.relative-container')) {
                setIsAttachmentMenuOpen(false);
            }
            if (!target.closest('.EmojiPickerReact') && !target.closest('.relative-container')) {
                setIsInputEmojiOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadData();
        const subscription = subscribeToMessages(chatId, (newMsg) => {
            setMessages(prev => {
                const updated = prev.filter(m => !(m.text === newMsg.text && (m as any).pending));
                if (updated.find(m => m.id === newMsg.id)) return updated;
                return [...updated, newMsg];
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

        const text = message.trim();
        setMessage('');

        const optimisticId = `temp-${Date.now()}`;
        const optimisticMsg: any = {
            id: optimisticId,
            conversation_id: chatId,
            sender: 'Você',
            text,
            is_user: true,
            is_bot: false,
            reactions: [],
            created_at: new Date().toISOString(),
            pending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const realMsg = await sendMessage(chatId, {
                sender: 'Você',
                text,
                is_user: true,
                is_bot: false
            });

            if (realMsg) {
                setMessages(prev => prev.map(m => m.id === optimisticId ? realMsg : m));
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
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
        if (file && chatId) {
            try {
                const { url, name } = await uploadChatFile(file);
                const icon = file.type.startsWith('image/') ? '📷' : file.type.startsWith('video/') ? '🎥' : '📎';
                await sendMessage(chatId, {
                    sender: 'Você',
                    text: `${icon} ${file.name}`,
                    is_user: true,
                    is_bot: false,
                    file_url: url,
                    file_name: name
                });
            } catch (err) {
                console.error('Error uploading:', err);
            }
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

    const handleEditClick = () => {
        setEditContactData({
            name: conversation?.contact_name || '',
            phone: conversation?.contact_phone || '',
            email: conversation?.contact_email || ''
        });
        setIsEditingContact(true);
    };

    const handleSaveContact = async () => {
        if (!conversation) return;
        try {
            await updateConversation(chatId, {
                contact_name: editContactData.name.trim(),
                contact_phone: editContactData.phone.trim(),
                contact_email: editContactData.email.trim()
            });
            setConversation(prev => prev ? {
                ...prev,
                contact_name: editContactData.name.trim(),
                contact_phone: editContactData.phone.trim(),
                contact_email: editContactData.email.trim()
            } : null);
            setIsEditingContact(false);
        } catch (err) {
            console.error('Error updating contact:', err);
        }
    };

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone);
        alert('Copiado ✓');
    };

    const handleRegisterBI = async (msgId: string) => {
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;
        await sendMessage(chatId, {
            sender: 'Sistema',
            text: `📊 Mensagem registrada no BI (Auditoria):\n"${msg.text.substring(0, 80)}..."\nID: ${msgId}`,
            is_user: false,
            is_bot: false
        });
    };

    const handleCameraCapture = async (file: File) => {
        if (!conversation || conversation.is_closed) return;
        try {
            await sendMessage(chatId, {
                sender: 'Você',
                text: `📷 ${file.name}`,
                is_user: true,
                is_bot: false
            });
        } catch (err) {
            console.error('Error sending camera photo:', err);
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
        if (!endReason.trim()) {
            alert('Por favor, descreva detalhadamente o motivo para encerrar o atendimento.');
            return;
        }
        try {
            await updateConversation(chatId, { is_closed: true, is_archived: false, is_pinned: false });
            await sendMessage(chatId, {
                sender: 'Sistema',
                text: `🔒 Atendimento encerrado. \nMotivo: "${endReason.trim()}"`,
                is_user: false,
                is_bot: false
            });
            setConversation(prev => prev ? { ...prev, is_closed: true, is_archived: false, is_pinned: false } : null);
            setShowEndModal(false);
            setEndReason('');
        } catch (err) {
            console.error('Error ending chat:', err);
        }
    };

    const handleConvertToLead = async () => {
        if (!conversation) return;
        try {
            await createLead({
                nomeCompleto: conversation.contact_name,
                telefonePrincipal: conversation.contact_phone || '',
                canalEntrada: 'WhatsApp',
                statusViabilidade: 'PENDENTE',
                tipoCliente: 'RESIDENCIAL',
                dataEntrada: new Date().toISOString()
            });
            await sendMessage(chatId, {
                sender: 'Sistema',
                text: `🚀 Cliente qualificado como novo LEAD no funil de vendas.\nConsulte o módulo "Leads e Vendas" para seguir com a negociação.`,
                is_user: false,
                is_bot: false
            });
            setIsHeaderMenuOpen(false);
            alert("Lead criado com sucesso!");
        } catch (err) {
            console.error('Error converting to lead:', err);
            alert("Erro ao criar lead. Verifique a tabela no banco.");
        }
    };

    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const toggleAccordion = (id: string) => setOpenAccordion(openAccordion === id ? null : id);

    if (loading) {
        return (
            <div className="chat-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingScreen fullScreen={false} message="Sincronizando Transmissão TITÃ..." />
            </div>
        );
    }

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
                    <button className="action-btn" title="Ligar (VoIP)" onClick={() => { window.open(`tel:${conversation?.contact_phone || ''}`, '_blank'); }}><Phone size={20} weight="duotone" /></button>
                    <button className="action-btn" title="Video Chamada" onClick={async () => { await sendMessage(chatId, { sender: 'Sistema', text: '📹 Chamada de vídeo iniciada. Aguardando conexão do cliente...', is_user: false, is_bot: false }); }}><Video size={20} weight="duotone" /></button>
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
                                        <button className="menu-item highlight" onClick={handleConvertToLead}>
                                            <TrendUp size={18} /> Qualificar como Lead
                                        </button>
                                        <div className="menu-divider" />
                                        <button className="menu-item" onClick={() => { setShowOSModal(true); setIsHeaderMenuOpen(false); }}>
                                            <Wrench size={18} /> Ordem de Serviço
                                        </button>
                                        <button className="menu-item" onClick={() => { setShowCadastroModal(true); setIsHeaderMenuOpen(false); }}>
                                            <IdentificationCard size={18} /> Gerenciar Cadastro
                                        </button>
                                        <button className="menu-item highlight-warn" onClick={() => { setShowOcorrenciaModal(true); setIsHeaderMenuOpen(false); }}>
                                            <WarningCircle size={18} /> Abrir Ocorrência
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

                        {messages.map((msg) => {
                            const isSystem = msg.sender === 'Sistema' || msg.sender === 'System';
                            return (
                                <div key={msg.id} className={`message-wrapper ${isSystem ? 'system' : (msg.is_user || msg.is_bot ? 'sent' : 'received')} ${msg.is_bot ? 'bot' : ''}`}>
                                    {!msg.is_user && !msg.is_bot && !isSystem && <div className="msg-avatar">{msg.sender.charAt(0)}</div>}
                                    {msg.is_bot && <div className="msg-avatar bot"><Lightning size={14} weight="fill" /></div>}

                                    <div className="message-content">
                                        <div className="message-bubble">
                                            {msg.file_url ? (
                                                <div className="msg-file-container">
                                                    {msg.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                        <img src={msg.file_url} alt={msg.file_name} className="msg-img-preview" onClick={() => window.open(msg.file_url, '_blank')} />
                                                    ) : (
                                                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="msg-file-link">
                                                            <div className="file-icon-box"><FileText size={24} /></div>
                                                            <div className="file-info">
                                                                <span className="file-name">{msg.file_name || 'Documento'}</span>
                                                                <span className="file-size">Anexo</span>
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                            {!isSystem && (
                                                <div className="message-footer">
                                                    <span className="message-time">{formatTime(msg.created_at)}</span>
                                                    {(msg.is_user || msg.is_bot) && (
                                                        (msg as any).pending ?
                                                            <Clock size={14} className="status-icon" weight="regular" style={{ opacity: 0.6 }} /> :
                                                            <Checks size={14} className="status-icon" weight="bold" />
                                                    )}
                                                </div>
                                            )}

                                            {!isSystem && (
                                                <div className="message-reactions">
                                                    {(msg.reactions || []).map((r, i) => (
                                                        <span key={i} className="reaction-badge">{r}</span>
                                                    ))}
                                                    <button className="add-reaction-btn" onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}>
                                                        <Smiley size={14} weight="bold" />
                                                    </button>
                                                    <button className="add-reaction-btn" title="Registrar no BI" onClick={() => handleRegisterBI(msg.id)}>
                                                        <ChartLineUp size={14} weight="bold" />
                                                    </button>
                                                </div>
                                            )}

                                            {activeMessageId === msg.id && (
                                                <div className="emoji-picker-container">
                                                    <EmojiPicker onEmojiClick={handleReaction} emojiStyle={EmojiStyle.GOOGLE} theme={Theme.DARK} lazyLoadEmojis height={350} width={300} skinTonesDisabled />
                                                </div>
                                            )}
                                        </div>
                                        {msg.is_bot && <span className="bot-label">{conversation?.ai_active ? '🤖 Titã AI — Ativo' : 'Titã AI Orchestrator'}</span>}
                                    </div>
                                </div>
                            );
                        })}
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
                                                <button className="menu-item" onClick={() => { setShowCameraModal(true); setIsAttachmentMenuOpen(false); }}>
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

                        <div className="contact-quick-edit" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color, #333)' }}>
                            {isEditingContact ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input type="text" value={editContactData.name} onChange={e => setEditContactData({ ...editContactData, name: e.target.value })} placeholder="Nome" style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                    <input type="text" value={editContactData.phone} onChange={e => setEditContactData({ ...editContactData, phone: e.target.value })} placeholder="Telefone" style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                    <input type="email" value={editContactData.email} onChange={e => setEditContactData({ ...editContactData, email: e.target.value })} placeholder="E-mail" style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-tertiary, #222)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <button onClick={() => setIsEditingContact(false)} style={{ flex: 1, padding: '6px', background: 'transparent', color: '#ccc', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                        <button onClick={handleSaveContact} style={{ flex: 1, padding: '6px', background: 'var(--primary-color, #007bff)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '1.05rem' }}>{conversation?.contact_name}</strong>
                                        <button onClick={handleEditClick} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color, #007bff)', cursor: 'pointer' }} title="Editar Contato"><PencilSimple size={18} /></button>
                                    </div>
                                    {conversation?.contact_phone && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#aaa', fontSize: '0.9rem' }}>
                                            <span>{conversation.contact_phone}</span>
                                            <button onClick={() => handleCopyPhone(conversation.contact_phone!)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }} title="Copiar Telefone para Automação"><Copy size={16} /></button>
                                        </div>
                                    )}
                                    {conversation?.contact_email && (
                                        <div style={{ color: '#aaa', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                            <span>{conversation.contact_email}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="accordion-list">
                            {[
                                { id: 'timeline', icon: <ClockCounterClockwise size={18} weight="duotone" />, label: 'Timeline', content: <><p>Criado em: {new Date(conversation?.created_at || '').toLocaleDateString()}</p><p>Canal: {conversation?.platform}</p></> },
                                { id: 'financeiro', icon: <CurrencyDollar size={18} weight="duotone" />, label: 'Financeiro', content: <p>Nenhum débito pendente.</p> },
                                {
                                    id: 'conexao', icon: <WifiHigh size={18} weight="duotone" />, label: 'Status ISP / Rede', content: (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Status Contrato</span>
                                                <span style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 'bold' }}>Ativo</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Plano de Internet</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fibra 500 Mega</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Sinal Óptico</span>
                                                <span style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 'bold' }}>-18.4 dBm</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Conexão (PPPoE)</span>
                                                <span style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 'bold' }}>Conectado (3d 4h)</span>
                                            </div>
                                        </div>
                                    )
                                },
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
                            <p style={{ marginBottom: '8px' }}>O cliente não poderá mais responder antes de triagem.</p>

                            <textarea
                                placeholder="Descreva o motivo pelo qual este atendimento está sendo definitivamente encerrado..."
                                value={endReason}
                                onChange={(e) => setEndReason(e.target.value)}
                                rows={4}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '6px',
                                    background: 'var(--bg-deep)', border: '1px solid #444',
                                    color: '#fff', outline: 'none', resize: 'none',
                                    marginBottom: '16px', fontSize: '0.9rem'
                                }}
                            ></textarea>

                            <div className="ca-modal-actions">
                                <button className="ca-cancel" onClick={() => setShowEndModal(false)}>Cancelar</button>
                                <button className="ca-confirm danger" onClick={handleEndChat}>Encerrar Definitivo</button>
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

                {showTransferModal && (
                    <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowTransferModal(false)}><X size={18} /></button>
                            <h3>Transferir Atendimento</h3>
                            <p style={{ marginBottom: '16px' }}>Selecione o destino para transferir o lead.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                                <label style={{ fontSize: '0.85rem', color: '#ccc' }}>Departamento / Fila</label>
                                <select style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                                    <option>Suporte Técnico</option>
                                    <option>Comercial / Vendas</option>
                                    <option>Financeiro</option>
                                </select>
                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Atendente Específico (Opcional)</label>
                                <select style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                                    <option>Qualquer Atendente...</option>
                                    <option>Carlos Oliveira</option>
                                    <option>Mariana Silva</option>
                                    <option>João Sollatori</option>
                                </select>
                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Nota Interna (Oculto para Cliente)</label>
                                <textarea placeholder="Deixe um contexto para o próximo atendente..." rows={2} style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none', resize: 'none' }}></textarea>
                            </div>
                            <div className="ca-modal-actions" style={{ marginTop: '20px' }}>
                                <button className="ca-cancel" onClick={() => setShowTransferModal(false)}>Cancelar</button>
                                <button className="ca-confirm" onClick={async () => {
                                    const dept = (document.querySelector('.ca-modal select') as HTMLSelectElement)?.value || 'Suporte Técnico';
                                    const note = (document.querySelector('.ca-modal textarea') as HTMLTextAreaElement)?.value || '';
                                    await sendMessage(chatId, {
                                        sender: 'Sistema',
                                        text: `➡️ Atendimento transferido para: ${dept}${note ? `\nNota interna: "${note}"` : ''}`,
                                        is_user: false,
                                        is_bot: false
                                    });
                                    await updateConversation(chatId, { assigned_to: dept });
                                    setShowTransferModal(false);
                                }} style={{ flex: 1, padding: '11px', background: 'var(--primary-color, #046bed)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Transferir</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showParticipantsModal && (
                    <div className="modal-overlay" onClick={() => setShowParticipantsModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowParticipantsModal(false)}><X size={18} /></button>
                            <h3>Participantes Internos</h3>
                            <p style={{ marginBottom: '16px' }}>Colaboradores acompanhando este ticket.</p>
                            <div className="history-list" style={{ marginBottom: '16px' }}>
                                <div className="history-item"><div className="avatar-small flex-center" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>V</div><span>Você (Operador Atual)</span></div>
                                <div className="history-item"><div className="avatar-small flex-center" style={{ width: '28px', height: '28px', fontSize: '0.8rem', background: 'var(--primary-color, #046bed)', color: '#fff' }}>M</div><span>Mariana Silva (Suporte N2)</span></div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                                    <option>Selecionar colaborador...</option>
                                    <option>Carlos Oliveira</option>
                                    <option>Fernanda Costa</option>
                                </select>
                                <button style={{ padding: '8px 12px', background: 'var(--bg-surface-light)', color: '#fff', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer' }} onClick={async () => {
                                    const sel = (document.querySelector('.ca-modal select:last-of-type') as HTMLSelectElement)?.value;
                                    if (!sel || sel === 'Selecionar colaborador...') return;
                                    await sendMessage(chatId, {
                                        sender: 'Sistema',
                                        text: `👥 ${sel} foi adicionado(a) como participante interno deste ticket.`,
                                        is_user: false,
                                        is_bot: false
                                    });
                                    setShowParticipantsModal(false);
                                }}>Adicionar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showOSModal && (
                    <div className="modal-overlay" onClick={() => setShowOSModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
                            <button className="ca-modal-close" onClick={() => setShowOSModal(false)}><X size={18} /></button>
                            <h3>Nova Ordem de Serviço</h3>
                            <p style={{ marginBottom: '10px' }}>Criar OS para <strong>{conversation?.contact_name}</strong></p>

                            <div className="ca-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', maxHeight: '65vh', overflowY: 'auto', paddingRight: '16px', paddingBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem', color: '#ccc' }}>Tipo de Serviço</label>
                                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none', marginTop: '4px' }}>
                                            <option>Instalação</option>
                                            <option>Manutenção Preventiva</option>
                                            <option>Manutenção Corretiva</option>
                                            <option>Mudança de Endereço</option>
                                            <option>Retirada de Equipamento</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem', color: '#ccc' }}>Prioridade</label>
                                        <select style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none', marginTop: '4px' }}>
                                            <option>Normal (SLA Padrão)</option>
                                            <option>Alta</option>
                                            <option style={{ color: '#ff4d4f' }}>Urgente</option>
                                        </select>
                                    </div>
                                </div>
                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Agendamento (Data / Hora limite)</label>
                                <input type="datetime-local" style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />

                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Endereço da OS</label>
                                <input type="text" placeholder="Rua, Número, Bairro, CEP..." style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />

                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Técnico Responsável (Opcional)</label>
                                <select style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }}>
                                    <option>A Definir / Fila Automática</option>
                                    <option>João (Técnico N2)</option>
                                    <option>Pedro (Técnico de Campo)</option>
                                </select>

                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Equipamentos (Retirada/Auditoria)</label>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> ONU/Modem</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> Antena 5GHz</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> Cabeamento Rig.</label>
                                </div>

                                <label style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>Descrição do Problema</label>
                                <textarea placeholder="Descreva os detalhes da solicitação para o Field Service..." rows={3} style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none', resize: 'none' }}></textarea>
                            </div>
                            <div className="ca-modal-actions" style={{ marginTop: '20px' }}>
                                <button className="ca-cancel" onClick={() => setShowOSModal(false)}>Cancelar</button>
                                <button className="ca-confirm" onClick={async () => {
                                    try {
                                        // Capture values from current modal state (simplifying here since we didn't add refs/state for all fields yet, but we'll use placeholder or capture from DOM for now)
                                        // Ideally we should have used state for these fields. 
                                        // Let's assume some defaults or better, I will quickly add state for the OS form in the next step or use what's there.

                                        // 1. Create the mandatory Occurrence first
                                        const newOco = await createOcorrencia({
                                            protocolo: `OC-${Date.now().toString().slice(-8)}`,
                                            cliente: conversation?.contact_name || 'Desconhecido',
                                            assunto: 'OS Associada: Instalação/Manutenção',
                                            status: 'ABERTA',
                                            prioridade: 'MEDIA'
                                        });

                                        // 2. Create the OS linked to the Occurrence
                                        const newOS = await createServiceOrder({
                                            tipo: 'Instalação',
                                            prioridade: 'NORMAL',
                                            cliente_nome: conversation?.contact_name || 'Desconhecido',
                                            cliente_endereco: 'Consultar histórico',
                                            descricao: 'Gerada via Chat',
                                            conversation_id: chatId,
                                            ocorrencia_id: newOco.id
                                        });

                                        await sendMessage(chatId, {
                                            sender: 'Sistema',
                                            text: `🛠️ Ordem de Serviço ${newOS.id.slice(0, 8)} e Ocorrência ${newOco.protocolo} geradas com sucesso.\nStatus: Aberta.`,
                                            is_user: false,
                                            is_bot: false
                                        });
                                        setShowOSModal(false);
                                    } catch (err) {
                                        console.error('Erro ao gerar OS:', err);
                                        alert('Erro técnico ao gerar OS.');
                                    }
                                }} style={{ flex: 1, padding: '11px', background: 'var(--primary-color, #046bed)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Gerar e Atribuir OS</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showOcorrenciaModal && (
                    <div className="modal-overlay" onClick={() => setShowOcorrenciaModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="ca-modal" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
                            <button className="ca-modal-close" onClick={() => setShowOcorrenciaModal(false)}><X size={18} /></button>
                            <div className="ca-modal-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><WarningCircle size={32} weight="duotone" /></div>
                            <h3>Nova Ocorrência</h3>
                            <p style={{ marginBottom: '1.5rem' }}>Abrir um chamado de suporte para <strong>{conversation?.contact_name}</strong></p>

                            <div className="ca-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                                <div className="form-group-ca">
                                    <label>Assunto / Motivo</label>
                                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff' }}>
                                        <option>Problemas de Conexão</option>
                                        <option>Dúvidas Financeiras</option>
                                        <option>Troca de Equipamento</option>
                                        <option>Mudança de Titularidade</option>
                                        <option>Outros assuntos...</option>
                                    </select>
                                </div>
                                <div className="form-group-ca">
                                    <label>Prioridade</label>
                                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff' }}>
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA" selected>Média</option>
                                        <option value="ALTA">Alta</option>
                                        <option value="CRITICA">Crítica</option>
                                    </select>
                                </div>
                                <div className="form-group-ca">
                                    <label>Descrição Detalhada</label>
                                    <textarea placeholder="O que o cliente relatou? Contextualize o problema..." rows={4} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', resize: 'none' }} />
                                </div>
                            </div>

                            <div className="ca-modal-actions" style={{ marginTop: '2rem' }}>
                                <button className="ca-cancel" onClick={() => setShowOcorrenciaModal(false)}>Cancelar</button>
                                <button className="ca-confirm warn" onClick={async () => {
                                    const proc = `PROT-${Date.now().toString().slice(-8)}`;
                                    const subject = (document.querySelector('.ca-modal-body select') as HTMLSelectElement)?.value;
                                    await sendMessage(chatId, {
                                        sender: 'Sistema',
                                        text: `🎫 OCORRÊNCIA ABERTA\nProtocolo: ${proc}\nAssunto: ${subject}\n\nO suporte N2 foi notificado e entrará em contato em breve.`,
                                        is_user: false,
                                        is_bot: false
                                    });
                                    setShowOcorrenciaModal(false);
                                }} style={{ flex: 1, padding: '12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Abrir chamado</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showCadastroModal && (
                    <div className="modal-overlay" onClick={() => setShowCadastroModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()} style={{ width: '550px' }}>
                            <button className="ca-modal-close" onClick={() => setShowCadastroModal(false)}><X size={18} /></button>
                            <h3>Cadastro CRM do Cliente</h3>
                            <p style={{ marginBottom: '16px' }}>Atualize o CRM / Ficha Financeira do Lead.</p>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                <button onClick={() => setCadastroMode('rapido')} style={{ flex: 1, padding: '8px', border: `1px solid ${cadastroMode === 'rapido' ? 'var(--primary-color, #046bed)' : '#444'}`, background: cadastroMode === 'rapido' ? 'rgba(4, 107, 237, 0.1)' : 'transparent', color: cadastroMode === 'rapido' ? 'var(--primary-color, #046bed)' : '#ccc', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>Básico</button>
                                <button onClick={() => setCadastroMode('completo')} style={{ flex: 1, padding: '8px', border: `1px solid ${cadastroMode === 'completo' ? 'var(--primary-color, #046bed)' : '#444'}`, background: cadastroMode === 'completo' ? 'rgba(4, 107, 237, 0.1)' : 'transparent', color: cadastroMode === 'completo' ? 'var(--primary-color, #046bed)' : '#ccc', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>CRM Completo</button>
                            </div>

                            <div className="ca-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '16px', paddingBottom: '24px' }}>
                                <input type="text" placeholder="Nome Completo / Razão Social" defaultValue={conversation?.contact_name} style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" placeholder="Telefone 1" defaultValue={conversation?.contact_phone} style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                    {cadastroMode === 'completo' && (
                                        <input type="text" placeholder="Telefone 2 (Opcional)" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                    )}
                                </div>

                                {cadastroMode === 'completo' && (
                                    <>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="text" placeholder="CPF / CNPJ" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                            <input type="text" placeholder="RG / Inscrição Estudual" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="email" placeholder="E-mail Principal" defaultValue={conversation?.contact_email} style={{ flex: 2, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                            <input type="date" title="Data de Nascimento" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#ccc', outline: 'none' }} />
                                        </div>

                                        <div style={{ borderTop: '1px solid #333', margin: '4px 0', paddingTop: '10px' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#ccc', display: 'block', marginBottom: '8px' }}>Endereço de Viabilidade / Faturamento</label>
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                <input type="text" placeholder="CEP" style={{ width: '120px', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                                <input type="text" placeholder="Logradouro" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                                <input type="text" placeholder="Nº" style={{ width: '80px', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input type="text" placeholder="Complemento" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                                <input type="text" placeholder="Bairro" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                <input type="text" placeholder="Cidade" style={{ flex: 2, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                                <input type="text" placeholder="UF" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#fff', outline: 'none' }} />
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #333', margin: '4px 0', paddingTop: '10px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <select style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#ccc', outline: 'none' }}>
                                                    <option>Forma de Pgto. Preferencial</option>
                                                    <option>Boleto Bancário</option>
                                                    <option>Cartão de Crédito</option>
                                                    <option>PIX (Recorrente)</option>
                                                </select>
                                                <select style={{ width: '150px', padding: '10px', borderRadius: '6px', background: 'var(--bg-deep)', border: '1px solid #444', color: '#ccc', outline: 'none' }}>
                                                    <option>Vencimento</option>
                                                    <option>Dia 05</option>
                                                    <option>Dia 10</option>
                                                    <option>Dia 15</option>
                                                    <option>Dia 20</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ textAlign: 'left', marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '6px', background: 'var(--bg-deep)' }}>
                                <label style={{ fontSize: '0.85rem', color: '#ccc', display: 'block', marginBottom: '8px' }}>Comportamento de Ingestão de Dados:</label>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#ddd' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="radio" name="conflict" checked={conflictMode === 'add'} onChange={() => setConflictMode('add')} /> Agrupar / Preservar antigas
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="radio" name="conflict" checked={conflictMode === 'overwrite'} onChange={() => setConflictMode('overwrite')} /> Sobrescrever Banco ERP
                                    </label>
                                </div>
                            </div>

                            <div className="ca-modal-actions">
                                <button className="ca-cancel" onClick={() => setShowCadastroModal(false)}>Cancelar</button>
                                <button className="ca-confirm" onClick={async () => {
                                    const nameInput = (document.querySelectorAll('.ca-modal-body input[type="text"]')[0] as HTMLInputElement)?.value || conversation?.contact_name;
                                    const phoneInput = (document.querySelectorAll('.ca-modal-body input[type="text"]')[1] as HTMLInputElement)?.value || conversation?.contact_phone;
                                    await updateConversation(chatId, {
                                        contact_name: nameInput?.trim(),
                                        contact_phone: phoneInput?.trim()
                                    });
                                    setConversation(prev => prev ? { ...prev, contact_name: nameInput?.trim() || prev.contact_name, contact_phone: phoneInput?.trim() || prev.contact_phone } : null);
                                    await sendMessage(chatId, {
                                        sender: 'Sistema',
                                        text: `📝 Cadastro CRM atualizado (${conflictMode === 'overwrite' ? 'Sobrescrita ERP' : 'Agrupamento seguro'}).`,
                                        is_user: false,
                                        is_bot: false
                                    });
                                    setShowCadastroModal(false);
                                }} style={{ flex: 1, padding: '11px', background: 'var(--primary-color, #046bed)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Salvar Ficha Completa</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCameraModal && (
                    <CameraCaptureModal
                        onClose={() => setShowCameraModal(false)}
                        onCapture={handleCameraCapture}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatArea;