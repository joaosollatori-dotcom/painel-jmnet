import React, { useState, useRef, useEffect } from 'react';
import {
    Phone, Video, DotsThreeVertical, PaperPlaneTilt,
    Smiley, Paperclip, Checks, Lightning,
    CaretDown, ClockCounterClockwise,
    CurrencyDollar, MagicWand, Sparkle,
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
    const [isInfoOpen, setIsInfoOpen] = useState(true); // Aberto por padrão na nova UI
    const [openAccordion, setOpenAccordion] = useState<string | null>('timeline');
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const [showEndModal, setShowEndModal] = useState(false);
    const [showOSModal, setShowOSModal] = useState(false);
    const [generatedOcoId, setGeneratedOcoId] = useState<string | null>(null);

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

    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (loading) return <LoadingScreen message="Sincronizando Chat..." />;

    return (
        <div className="chat-container">
            {/* O ChatList estaria na coluna 1 (gerenciado pelo Atendimento.tsx) */}

            {/* Coluna 2: Janela de Chat Principal */}
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
                        <button className="suggestion-pill" style={{ padding: '6px' }} onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}><DotsThreeVertical size={20} /></button>
                    </div>
                </header>

                {/* AI Summary Section */}
                <div className="ai-summary-box">
                    <div className="summary-header">
                        <Sparkle size={16} weight="fill" />
                        <span>Resumo da Conversa (Titã AI)</span>
                    </div>
                    <p className="summary-content">
                        O cliente está solicitando suporte técnico devido a lentidão na conexão PPPoE.
                        Ele já tentou reiniciar o roteador e solicita um reparo físico no sinal.
                    </p>
                </div>

                <div className="messages-list">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`msg-bubble ${msg.is_user || msg.is_bot ? 'msg-outbound' : 'msg-inbound'}`}>
                            {msg.text}
                            <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* AI Suggestions Toolbar */}
                <div className="ai-suggestions">
                    <button className="suggestion-pill" onClick={() => handleSendMessage("Como posso te ajudar com sua conexão?")}>
                        <MagicWand size={16} /> Como posso ajudar?
                    </button>
                    <button className="suggestion-pill" onClick={() => handleSendMessage("Vou abrir uma ordem de reparo agora mesmo.")}>
                        <MagicWand size={16} /> Abrir reparo
                    </button>
                    <button className="suggestion-pill" onClick={() => handleSendMessage("Pode me confirmar seu endereço?")}>
                        <MagicWand size={16} /> Confirmar Endereço
                    </button>
                </div>

                <footer className="chat-input-area">
                    <div className="input-container">
                        <Paperclip size={22} style={{ cursor: 'pointer', opacity: 0.6 }} />
                        <input
                            placeholder="Digite aqui..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Smiley size={22} style={{ cursor: 'pointer', opacity: 0.6 }} />
                        <PaperPlaneTilt
                            size={24}
                            weight="fill"
                            style={{ color: 'var(--accent)', cursor: 'pointer' }}
                            onClick={() => handleSendMessage()}
                        />
                    </div>
                </footer>
            </div>

            {/* Coluna 3: Detalhes do Contato */}
            <aside style={{ background: 'var(--bg-deep)', borderLeft: '1px solid var(--border)', padding: '1.5rem', overflowY: 'auto' }}>
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

                    <div className="nav-group">
                        <div className="sidebar-section-label">Ações Rápidas</div>
                        <button className="filter-pill" style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start' }}><Wrench size={16} /> Abrir Ocorrência</button>
                        <button className="filter-pill" style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start' }}><TrendUp size={16} /> Gerar Lead</button>
                        <button className="filter-pill" style={{ width: '100%', justifyContent: 'flex-start' }}><CurrencyDollar size={16} /> Segunda Via</button>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default ChatArea;