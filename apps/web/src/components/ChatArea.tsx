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
import { useToast } from '../contexts/ToastContext';
import './ChatArea.css';

interface ChatAreaProps {
    chatId: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId }) => {
    const { showToast } = useToast();
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
    const [osWizardStep, setOsWizardStep] = useState<'OS_FIELDS' | 'OCO_FIELDS' | 'CONFIRMATION'>('OS_FIELDS');
    const [osFormData, setOsFormData] = useState({
        order_type: 'Instalação',
        priority: 'NORMAL',
        description: '',
        customer_address: 'Consultar histórico'
    });
    const [ocoFormData, setOcoFormData] = useState({
        subject: 'Manutenção / Suporte Técnico',
        priority: 'MEDIA',
        description: ''
    });
    const [generatedOcoId, setGeneratedOcoId] = useState<string | null>(null);

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
        } catch (err: any) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));

            // Detailed feedback for timeout or failed fetch
            if (err.message === 'Failed to fetch' || err.code === 'ETIMEDOUT') {
                showToast('Erro de conexão: Tente novamente em alguns instantes.', 'error');
            } else {
                showToast('Não foi possível enviar a mensagem.', 'error');
            }
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
            text: `📊 Mensagem registrada no BI / Compliance:\n"${msg.text.substring(0, 80)}..."`,
            is_user: false,
            is_bot: false
        });
    };

    const handleCameraCapture = async (file: File) => {
        if (!conversation || conversation.is_closed) return;
        try {
            const { url, name } = await uploadChatFile(file);
            await sendMessage(chatId, {
                sender: 'Você',
                text: `📷 Captura de Câmera: ${file.name}`,
                is_user: true,
                is_bot: false,
                file_url: url,
                file_name: name
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
                text: `🚀 Cliente qualificado como novo LEAD no funil de vendas.`,
                is_user: false,
                is_bot: false
            });
            setIsHeaderMenuOpen(false);
            alert("Lead criado com sucesso!");
        } catch (err) {
            console.error('Error converting to lead:', err);
            alert("Erro ao criar lead.");
        }
    };

    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const toggleAccordion = (id: string) => setOpenAccordion(openAccordion === id ? null : id);

    if (loading) {
        return (
            <div className="chat-area loading-state">
                <LoadingScreen fullScreen={false} message="Sincronizando Transmissão TITÃ..." />
            </div>
        );
    }

    return (
        <div className="chat-area">
            <input ref={fileInputRef} type="file" className="hidden-input" onChange={handleFileChange} />

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
                    <button className="action-btn" title="Video Chamada" onClick={async () => { await sendMessage(chatId, { sender: 'Sistema', text: '📹 Chamada de vídeo iniciada...', is_user: false, is_bot: false }); }}><Video size={20} weight="duotone" /></button>
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
                                                            <Clock size={14} className="status-icon pending" weight="regular" /> :
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

                        <div className="contact-quick-edit">
                            {isEditingContact ? (
                                <div className="edit-form-col">
                                    <input type="text" value={editContactData.name} onChange={e => setEditContactData({ ...editContactData, name: e.target.value })} placeholder="Nome" className="edit-input" />
                                    <input type="text" value={editContactData.phone} onChange={e => setEditContactData({ ...editContactData, phone: e.target.value })} placeholder="Telefone" className="edit-input" />
                                    <input type="email" value={editContactData.email} onChange={e => setEditContactData({ ...editContactData, email: e.target.value })} placeholder="E-mail" className="edit-input" />
                                    <div className="edit-actions-row">
                                        <button onClick={() => setIsEditingContact(false)} className="edit-btn-cancel">Cancelar</button>
                                        <button onClick={handleSaveContact} className="edit-btn-save">Salvar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="edit-form-col">
                                    <div className="flex-between-center">
                                        <strong className="contact-name-large">{conversation?.contact_name}</strong>
                                        <button onClick={handleEditClick} className="btn-edit-contact" title="Editar Contato"><PencilSimple size={18} /></button>
                                    </div>
                                    {conversation?.contact_phone && (
                                        <div className="contact-phone-row">
                                            <span>{conversation.contact_phone}</span>
                                            <button onClick={() => handleCopyPhone(conversation.contact_phone!)} className="btn-copy-phone" title="Copiar Telefone"><Copy size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="accordion-list">
                            {[
                                { id: 'timeline', icon: <ClockCounterClockwise size={18} weight="duotone" />, label: 'Timeline', content: <><p>Criado em: {new Date(conversation?.created_at || '').toLocaleDateString()}</p><p>Canal: {conversation?.platform}</p></> },
                                { id: 'financeiro', icon: <CurrencyDollar size={18} weight="duotone" />, label: 'Financeiro', content: <p>Sem pendências.</p> },
                                {
                                    id: 'conexao', icon: <WifiHigh size={18} weight="duotone" />, label: 'Status ISP', content: (
                                        <div className="isp-status-col">
                                            <div className="isp-status-row"><span>PPPoE</span><span className="status-green">Conectado</span></div>
                                            <div className="isp-status-row"><span>Sinal</span><span className="status-green">-19.2 dBm</span></div>
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
                            <p>O cliente não poderá mais responder antes de triagem.</p>
                            <textarea
                                placeholder="Motivo do encerramento..."
                                value={endReason}
                                onChange={(e) => setEndReason(e.target.value)}
                                rows={3}
                                className="modal-textarea-mt"
                            ></textarea>
                            <div className="ca-modal-actions mt-16">
                                <button className="ca-cancel" onClick={() => setShowEndModal(false)}>Cancelar</button>
                                <button className="ca-confirm danger" onClick={handleEndChat}>Encerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showTransferModal && (
                    <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowTransferModal(false)}><X size={18} /></button>
                            <h3>Transferir Atendimento</h3>
                            <div className="modal-form-col">
                                <select className="modal-select">
                                    <option>Suporte Técnico</option>
                                    <option>Comercial</option>
                                    <option>Financeiro</option>
                                </select>
                            </div>
                            <div className="ca-modal-actions mt-20">
                                <button className="ca-cancel" onClick={() => setShowTransferModal(false)}>Cancelar</button>
                                <button className="ca-confirm" onClick={() => setShowTransferModal(false)}>Transferir</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showParticipantsModal && (
                    <div className="modal-overlay" onClick={() => setShowParticipantsModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowParticipantsModal(false)}><X size={18} /></button>
                            <h3>Participantes Internos</h3>
                            <div className="ca-modal-actions mt-20">
                                <button className="ca-confirm" onClick={() => setShowParticipantsModal(false)}>Fechar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showOSModal && (
                    <div className="modal-overlay" onClick={() => { setShowOSModal(false); setOsWizardStep('OS_FIELDS'); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="ca-modal w-480" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => { setShowOSModal(false); setOsWizardStep('OS_FIELDS'); }}><X size={18} /></button>

                            <AnimatePresence mode="wait">
                                {osWizardStep === 'OS_FIELDS' && (
                                    <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                        <div className="ca-modal-icon primary"><Wrench size={32} weight="duotone" /></div>
                                        <h3>Abertura de OS</h3>
                                        <div className="modal-form-col-mt16">
                                            <select value={osFormData.order_type} onChange={e => setOsFormData({ ...osFormData, order_type: e.target.value })} className="modal-select">
                                                <option>Instalação</option>
                                                <option>Reparo</option>
                                                <option>Troca Equipamento</option>
                                            </select>
                                            <textarea placeholder="Descrição..." value={osFormData.description} onChange={e => setOsFormData({ ...osFormData, description: e.target.value })} rows={3} className="modal-textarea" />
                                        </div>
                                        <div className="ca-modal-actions mt-24">
                                            <button className="ca-cancel" onClick={() => setShowOSModal(false)}>Cancelar</button>
                                            <button className="ca-confirm" onClick={() => setOsWizardStep('OCO_FIELDS')}>Próximo</button>
                                        </div>
                                    </motion.div>
                                )}

                                {osWizardStep === 'OCO_FIELDS' && (
                                    <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                        <div className="ca-modal-icon danger"><Warning size={32} weight="duotone" /></div>
                                        <h3>Vincular Ocorrência</h3>
                                        <div className="modal-form-col-mt16">
                                            <input type="text" placeholder="Assunto..." value={ocoFormData.subject} onChange={e => setOcoFormData({ ...ocoFormData, subject: e.target.value })} className="modal-input" />
                                            <select value={ocoFormData.priority} onChange={e => setOcoFormData({ ...ocoFormData, priority: e.target.value as any })} className="modal-select">
                                                <option value="BAIXA">BAIXA</option>
                                                <option value="MEDIA">MEDIA</option>
                                                <option value="ALTA">ALTA</option>
                                                <option value="CRITICA">CRÍTICA (PIN)</option>
                                            </select>
                                        </div>
                                        <div className="ca-modal-actions mt-24">
                                            <button className="ca-cancel" onClick={() => setOsWizardStep('OS_FIELDS')}>Voltar</button>
                                            <button className="ca-confirm" onClick={async () => {
                                                try {
                                                    const oco = await createOcorrencia({ protocol: `OC-${Date.now()}`, customer_name: conversation?.contact_name || '', subject: ocoFormData.subject, status: 'ABERTA', priority: ocoFormData.priority as any });
                                                    setGeneratedOcoId(oco.id);
                                                    setOsWizardStep('CONFIRMATION');
                                                } catch (err) { alert('Erro ao criar ocorrência'); }
                                            }}>Gerar Ocorrência</button>
                                        </div>
                                    </motion.div>
                                )}

                                {osWizardStep === 'CONFIRMATION' && (
                                    <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                        <div className="ca-modal-icon success">✅</div>
                                        <h3>Quase lá!</h3>
                                        <p>Ocorrência gerada. Clique abaixo para finalizar a OS.</p>
                                        <div className="ca-modal-actions mt-24">
                                            <button className="ca-confirm" onClick={async () => {
                                                if (!generatedOcoId) return;
                                                try {
                                                    await createServiceOrder({ ...osFormData, customer_name: conversation?.contact_name || '', conversation_id: chatId, occurrence_id: generatedOcoId });
                                                    await sendMessage(chatId, { sender: 'Sistema', text: `🛠️ OS gerada e vinculada à Ocorrência.`, is_user: false, is_bot: false });
                                                    setShowOSModal(false);
                                                    setOsWizardStep('OS_FIELDS');
                                                } catch (err) { alert('Erro ao finalizar OS'); }
                                            }}>Finalizar Emissão</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}

                {showOcorrenciaModal && (
                    <div className="modal-overlay" onClick={() => setShowOcorrenciaModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="ca-modal w-450" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowOcorrenciaModal(false)}><X size={18} /></button>
                            <h3>Nova Ocorrência</h3>
                            <div className="ca-modal-actions mt-2rem">
                                <button className="ca-cancel" onClick={() => setShowOcorrenciaModal(false)}>Cancelar</button>
                                <button className="ca-confirm warn" onClick={() => setShowOcorrenciaModal(false)}>Abrir Chamado</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showCadastroModal && (
                    <div className="modal-overlay" onClick={() => setShowCadastroModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal w-500" onClick={e => e.stopPropagation()}>
                            <button className="ca-modal-close" onClick={() => setShowCadastroModal(false)}><X size={18} /></button>
                            <h3>Gerenciar Cadastro</h3>
                            <div className="ca-modal-actions mt-20">
                                <button className="ca-cancel" onClick={() => setShowCadastroModal(false)}>Fechar</button>
                                <button className="ca-confirm" onClick={() => setShowCadastroModal(false)}>Salvar</button>
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