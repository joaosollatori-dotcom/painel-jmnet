import React, { useState, useRef, useEffect } from 'react';
import {
    Phone, Video, DotsThreeVertical, PaperPlaneTilt,
    Smiley, Paperclip, Checks, Lightning,
    CaretDown, ClockCounterClockwise,
    CurrencyDollar, MagicWand, Sparkle,
    Info, FileText, Image as ImageIcon, Camera, UserList,
    ShareNetwork, Users, Robot, CheckSquareOffset,
    Warning, X, PencilSimple, Copy, ChartLineUp,
    IdentificationCard, Wrench, WifiHigh, Clock, TrendUp, WarningCircle,
    CaretDoubleRight, CaretDoubleLeft
} from '@phosphor-icons/react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, sendMessage, subscribeToMessages, getConversations, uploadChatFile } from '../services/chatService';
import type { Message, Conversation } from '../services/chatService';
import LoadingScreen from './LoadingScreen';
import { useToast } from '../contexts/ToastContext';
import './ChatArea.css';

interface ChatAreaProps {
    chatId: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId }) => {
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [isInfoRetracted, setIsInfoRetracted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAiSummary, setShowAiSummary] = useState(true);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
        const subscription = subscribeToMessages(chatId, (newMsg) => {
            setMessages(prev => {
                const updated = prev.filter(m => !(m.text === newMsg.text && (m as any).pending));
                if (updated.find(m => m.id === newMsg.id)) return updated;
                return [...updated, newMsg];
            });
        });
        return () => subscription.unsubscribe();
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
            if (current) setConversation(current);
            setMessages(msgs);
        } catch (err) {
            console.error('Error loading chat:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (customText?: string) => {
        const textToSend = customText || message.trim();
        if (!textToSend || !conversation || conversation.is_closed) return;

        setMessage('');
        setShowEmojiPicker(false);
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMsg: any = {
            id: optimisticId,
            conversation_id: chatId,
            sender: 'Você',
            text: textToSend,
            is_user: true,
            is_bot: false,
            created_at: new Date().toISOString(),
            pending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        try {
            const realMsg = await sendMessage(chatId, {
                sender: 'Você',
                text: textToSend,
                is_user: true,
                is_bot: false
            });
            if (realMsg) setMessages(prev => prev.map(m => m.id === optimisticId ? realMsg : m));
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            showToast('Erro ao enviar mensagem', 'error');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        showToast(`Enviando ${files.length} arquivo(s)...`, 'info');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // Simulação/Placeholder de upload para UI ágil
                const mockUrl = URL.createObjectURL(file);
                const optimisticId = `upload-${Date.now()}-${i}`;

                setMessages(prev => [...prev, {
                    id: optimisticId,
                    conversation_id: chatId,
                    sender: 'Você',
                    text: `📎 Enviando: ${file.name}`,
                    is_user: true,
                    is_bot: false,
                    created_at: new Date().toISOString()
                }]);

                // Chamada real ao serviço (deve suportar FormData no backend)
                await uploadChatFile(chatId, file);
                showToast('Arquivo enviado!', 'success');
            } catch (err) {
                showToast(`Erro ao enviar ${file.name}`, 'error');
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onEmojiClick = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji);
    };

    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (loading) return <LoadingScreen message="Sincronizando Chat..." />;

    return (
        <div className={`chat-container ${isInfoRetracted ? 'info-retracted' : ''}`}>
            {/* Coluna Central: Janela de Chat */}
            <div className="chat-window">
                <header className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div className="avatar-small" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {conversation?.contact_name.charAt(0)}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>{conversation?.contact_name}</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>WhatsApp • Online</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="suggestion-pill" style={{ padding: '6px' }}><Phone size={20} /></button>
                        <button className="suggestion-pill" style={{ padding: '6px' }}><Video size={20} /></button>
                        <button className="suggestion-pill" style={{ padding: '6px' }} onClick={() => setIsInfoRetracted(!isInfoRetracted)}>
                            {isInfoRetracted ? <CaretDoubleLeft size={18} /> : <CaretDoubleRight size={18} />}
                        </button>
                    </div>
                </header>

                <div className="messages-list">
                    <AnimatePresence>
                        {showAiSummary && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="ai-summary-box" style={{ position: 'relative' }}>
                                <button onClick={() => { setShowAiSummary(false); showToast('Resumo ocultado', 'info'); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6 }}>
                                    <X size={18} weight="bold" />
                                </button>
                                <div className="summary-header">
                                    <Sparkle size={16} weight="fill" />
                                    <span>Resumo TITÃ AI</span>
                                </div>
                                <p className="summary-content">Solicitação de suporte técnico por lentidão. Reinício de roteador já realizado sem sucesso.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {messages.map((msg) => (
                        <div key={msg.id} className={`msg-bubble ${msg.is_user || msg.is_bot ? 'msg-outbound' : 'msg-inbound'}`}>
                            {msg.text}
                            <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-suggestions">
                    <button className="suggestion-pill" onClick={() => handleSendMessage("Como posso te ajudar com sua conexão?")}>
                        <MagicWand size={16} /> Como posso ajudar?
                    </button>
                    <button className="suggestion-pill" onClick={() => handleSendMessage("Vou abrir uma ordem de reparo agora mesmo.")}>
                        <MagicWand size={16} /> Abrir reparo
                    </button>
                </div>

                <footer className="chat-input-area">
                    {/* Emoji Picker Popover */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div initial={{ opacity: 0, bottom: '80px' }} animate={{ opacity: 1, bottom: '100px' }} exit={{ opacity: 0 }} style={{ position: 'absolute', right: '2rem', zIndex: 1000 }}>
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.AUTO}
                                    emojiStyle={EmojiStyle.NATIVE}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="input-container">
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            accept="image/*,video/*,audio/*,application/pdf"
                        />
                        <Paperclip
                            size={22}
                            style={{ cursor: 'pointer', opacity: 0.6 }}
                            onClick={() => fileInputRef.current?.click()}
                        />
                        <Smiley
                            size={22}
                            style={{ cursor: 'pointer', opacity: 0.6 }}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        />
                        <input
                            placeholder="Digite aqui..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <PaperPlaneTilt
                            size={24}
                            weight="fill"
                            style={{ color: 'var(--accent)', cursor: 'pointer' }}
                            onClick={() => handleSendMessage()}
                        />
                    </div>
                </footer>
            </div>

            <aside className={`chat-info-column ${isInfoRetracted ? 'retracted' : ''}`}>
                {!isInfoRetracted ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--bg-surface)', borderRadius: '24px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border)' }}>
                                {conversation?.contact_name.charAt(0)}
                            </div>
                            <h4 style={{ margin: 0 }}>{conversation?.contact_name}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{conversation?.contact_phone}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="nav-group">
                                <div className="sidebar-section-label">Informações</div>
                                <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Status ISP</span>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Online</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Plano</span>
                                        <span>Giga Fibra 500M</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div className="avatar-small" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            {conversation?.contact_name.charAt(0)}
                        </div>
                        <Wrench size={22} style={{ opacity: 0.6 }} />
                        <CurrencyDollar size={22} style={{ opacity: 0.6 }} />
                    </div>
                )}
            </aside>
        </div>
    );
};

export default ChatArea;