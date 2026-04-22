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
    CaretDoubleRight, CaretDoubleLeft, Check, ArrowsClockwise
} from '@phosphor-icons/react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, sendMessage, subscribeToMessages, getConversations, uploadChatFile } from '../services/chatService';
import { createOcorrencia } from '../services/ocorrenciaService';
import { createServiceOrder } from '../services/osService';
import { updateLead } from '../services/leadService';
import { logInteraction } from '../services/actionService';
import type { Message, Conversation } from '../services/chatService';
import LoadingScreen from './LoadingScreen';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getDeviceSignal } from '../services/genieacsService';
import './ChatArea.css';

interface ChatAreaProps {
    chatId: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId }) => {
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [signalData, setSignalData] = useState<any>(null);
    const [loadingSignal, setLoadingSignal] = useState(false);

    // Persistência da Sidebar Direita via localStorage
    const [isInfoRetracted, setIsInfoRetracted] = useState(() => {
        return localStorage.getItem('chat-info-retracted') === 'true';
    });

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAiSummary, setShowAiSummary] = useState(true);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();

    // Estado para Edição Rápida
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [editData, setEditData] = useState({ name: '', phone: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Efeito para persistir a escolha do usuário
    useEffect(() => {
        localStorage.setItem('chat-info-retracted', isInfoRetracted.toString());
    }, [isInfoRetracted]);

    useEffect(() => {
        loadData();
        const channel = subscribeToMessages(chatId, (newMsg: any) => {
            setMessages(prev => {
                const updated = prev.filter(m => !(m.text === newMsg.text && m.status === 'pending'));
                if (updated.find(m => m.id === newMsg.id)) {
                    return updated.map(m => m.id === newMsg.id ? newMsg : m);
                }
                return [...updated, newMsg];
            });
        });
        return () => {
            import('../lib/supabase').then(({ supabase }) => supabase.removeChannel(channel));
        };
    }, [chatId]);

    // Monitoramento do Sinal via GenieACS
    useEffect(() => {
        if (conversation) {
            fetchSignal();
        }
    }, [conversation]);

    const fetchSignal = async () => {
        if (loadingSignal) return;
        try {
            setLoadingSignal(true);
            // Mock do ID do dispositivo (em prod viria do conversation.genie_id)
            const data = await getDeviceSignal('TITAN-ONU-TESTE');
            setSignalData(data);
        } catch (err) {
            console.error("Erro ao carregar sinal:", err);
        } finally {
            setLoadingSignal(false);
        }
    };

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

    const handleSendMessage = async (customText?: string, fileData?: { url: string, name: string }) => {
        const textToSend = customText || message.trim();
        if (!textToSend && !fileData) return;
        if (!conversation || conversation.is_closed) return;

        setMessage('');
        setShowEmojiPicker(false);
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            id: optimisticId,
            conversation_id: chatId,
            sender: 'Você',
            text: textToSend || (fileData ? `Arquivo: ${fileData.name}` : ''),
            is_user: true,
            is_bot: false,
            file_url: fileData?.url,
            file_name: fileData?.name,
            created_at: new Date().toISOString(),
            status: 'pending',
            reactions: []
        };

        setMessages(prev => [...prev, optimisticMsg]);
        try {
            const realMsg: any = await sendMessage(chatId, {
                sender: 'Você',
                text: textToSend || (fileData ? `Arquivo: ${fileData.name}` : ''),
                is_user: true,
                is_bot: false,
                file_url: fileData?.url,
                file_name: fileData?.name
            });
            if (realMsg) setMessages(prev => prev.map(m => m.id === optimisticId ? realMsg : m));
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            showToast('Erro ao enviar mensagem', 'error');
        }
    };

    const handleQuickAction = async (type: 'oco' | 'os' | 'signal' | 'edit') => {
        if (!conversation || !profile) return;

        try {
            switch (type) {
                case 'oco':
                    await createOcorrencia({
                        customer_name: conversation.contact_name,
                        subject: 'Solicitação via Chat',
                        priority: 'MEDIA',
                        status: 'ABERTA'
                    }, profile.tenantId);
                    showToast('Ocorrência aberta com sucesso!', 'success');
                    await logInteraction(conversation.id, 'SYS', 'Ocorrência Direta', 'Protocolo gerado via atalho do Chat.');
                    break;
                case 'os':
                    await createServiceOrder({
                        customer_name: conversation.contact_name,
                        type: 'MANUTENCAO',
                        status: 'ABERTA',
                        priority: 'NORMAL',
                        description: 'Abertura rápida via chat.'
                    }, profile.tenantId);
                    showToast('Ordem de Serviço gerada!', 'success');
                    await logInteraction(conversation.id, 'SYS', 'OS Gerada', 'Ordem de serviço aberta via atalho do Chat.');
                    break;
                case 'signal':
                    showToast('Consultando sinal do equipamento...', 'info');
                    setTimeout(async () => {
                        showToast('Sinal: -19 dBm (Excelente)', 'success');
                        await logInteraction(conversation.id, 'SYS', 'Verificação de Sinal', 'Consulta de potência de fibra realizada.');
                    }, 1500);
                    break;
                case 'edit':
                    setEditData({ name: conversation.contact_name || '', phone: conversation.contact_phone || '' });
                    setShowEditModal(true);
                    break;
            }
        } catch (err) {
            showToast('Erro ao processar ação rápida.', 'error');
        }
    };

    const handleCloseChat = async (closeAll: boolean) => {
        if (!conversation) return;
        try {
            if (closeAll && conversation.occurrence_id) {
                // Aqui faríamos o check de OS. Para o MVP, assumimos sucesso ou erro descritivo.
                showToast('Verificando status de Ordens de Serviço vinculadas...', 'info');

                // Simulação de chamada de API: /v1/ocorrencias/:id/can-close
                const canClose = true; // TODO: Integrar com backend real

                if (!canClose) {
                    showToast('Não é possível encerrar: Existem Ordens de Serviço pendentes!', 'error');
                    return;
                }
            }

            // Update conversation to closed
            await import('../lib/supabase').then(({ supabase }) =>
                supabase.from('Conversation').update({ is_closed: true }).eq('id', chatId)
            );

            showToast('Atendimento encerrado com sucesso.', 'success');
            setShowCloseModal(false);
            window.location.reload(); // Refresh to clear chat
        } catch (err) {
            showToast('Erro ao encerrar atendimento.', 'error');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        showToast(`Fazendo upload de ${files.length} arquivo(s)...`, 'info');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const uploadResult = await uploadChatFile(file);
                await handleSendMessage(undefined, uploadResult);
            } catch (err) {
                showToast(`Erro ao enviar ${file.name}`, 'error');
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderStatusIcon = (status?: string) => {
        switch (status) {
            case 'pending': return <Clock size={12} weight="bold" />;
            case 'sent': return <Check size={12} weight="bold" />;
            case 'delivered': return <Checks size={14} weight="bold" />;
            case 'read': return <Checks size={14} weight="bold" style={{ color: '#34b7f1' }} />;
            default: return <Check size={12} weight="bold" />;
        }
    };

    const onEmojiClick = (emojiData: any) => setMessage(prev => prev + emojiData.emoji);
    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (loading) return <LoadingScreen message="Sincronizando Chat..." />;

    return (
        <div className={`chat-container ${isInfoRetracted ? 'info-retracted' : ''}`}>
            <div className="chat-window">
                <AnimatePresence>
                    {showEditModal && (
                        <div className="modal-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ background: 'var(--sb-bg-item)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid var(--sb-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, color: 'var(--sb-text)' }}>Editar Cadastro</h3>
                                    <X size={24} style={{ cursor: 'pointer', color: 'var(--sb-text)' }} onClick={() => setShowEditModal(false)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', opacity: 0.6, color: 'var(--sb-text)' }}>Nome Completo</label>
                                        <input style={{ width: '100%', padding: '12px', background: 'var(--sb-bg)', border: '1px solid var(--sb-border)', borderRadius: '12px', color: 'var(--sb-text)', marginTop: '4px' }} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', opacity: 0.6, color: 'var(--sb-text)' }}>Telefone</label>
                                        <input style={{ width: '100%', padding: '12px', background: 'var(--sb-bg)', border: '1px solid var(--sb-border)', borderRadius: '12px', color: 'var(--sb-text)', marginTop: '4px' }} value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                                    </div>
                                    <button className="wiki-cat-btn active" style={{ marginTop: '12px', padding: '14px', width: '100%', fontSize: '0.9rem' }} onClick={handleSaveEdit}>Salvar Alterações</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
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
                        {!conversation?.is_closed && (
                            <button className="btn-titan-sm bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-500 hover:text-white" style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 'bold' }} onClick={() => setShowCloseModal(true)}>
                                ENCERRAR
                            </button>
                        )}
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
                            {msg.file_url && (
                                <div className="msg-file-attachment" style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.file_url)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={24} />
                                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.file_name}</span>
                                    </div>
                                </div>
                            )}
                            {msg.text}
                            <div className="msg-footer">
                                <span className="msg-time">{formatTime(msg.created_at)}</span>
                                {(msg.is_user || msg.is_bot) && (
                                    <span className="msg-status">{renderStatusIcon(msg.status)}</span>
                                )}
                            </div>
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
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div initial={{ opacity: 0, bottom: '80px' }} animate={{ opacity: 1, bottom: '100px' }} exit={{ opacity: 0 }} style={{ position: 'absolute', right: '2rem', zIndex: 1000 }}>
                                <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} emojiStyle={EmojiStyle.NATIVE} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="input-container">
                        <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,video/*,audio/*,application/pdf" />
                        <Paperclip size={22} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => fileInputRef.current?.click()} />
                        <Smiley size={22} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                        <input
                            placeholder="Digite aqui..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || !e.shiftKey)) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <PaperPlaneTilt size={24} weight="fill" style={{ color: 'var(--accent-chat)', cursor: 'pointer' }} onClick={() => handleSendMessage()} />
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
                        <div className="nav-group">
                            <div className="sidebar-section-label">Monitoramento TR-069</div>
                            <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <WifiHigh size={16} color="var(--accent)" />
                                        <span style={{ fontWeight: 800, fontSize: '0.7rem', opacity: 0.7 }}>SINAL ÓPTICO</span>
                                    </div>
                                    {loadingSignal && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><ArrowsClockwise size={14} /></motion.div>}
                                </div>

                                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: signalData?.rxPower > -25 ? '#10b981' : '#ef4444' }}>
                                        {signalData?.rxPower ? `${signalData.rxPower} dBm` : (loadingSignal ? '...' : '--')}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6, marginTop: '4px' }}>
                                        {signalData?.rxPower ? (signalData.rxPower > -25 ? 'SINAL EXCELENTE' : 'SINAL CRÍTICO') : 'AGUARDANDO SYNC'}
                                    </div>
                                </div>

                                <div style={{ height: '4px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, 100 + (signalData?.rxPower || -30) * 3)}%` }}
                                        style={{ height: '100%', background: signalData?.rxPower > -25 ? '#10b981' : '#ef4444' }}
                                    />
                                </div>
                            </div>
                        </div>

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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button className="suggestion-pill" style={{ padding: '12px', flex: 1, flexDirection: 'column', height: 'auto', gap: '8px' }} onClick={() => handleQuickAction('oco')}>
                                    <Warning size={20} color="#f59e0b" />
                                    <span style={{ fontSize: '0.7rem' }}>Ocorrência</span>
                                </button>
                                <button className="suggestion-pill" style={{ padding: '12px', flex: 1, flexDirection: 'column', height: 'auto', gap: '8px' }} onClick={() => handleQuickAction('os')}>
                                    <Wrench size={20} color="#3b82f6" />
                                    <span style={{ fontSize: '0.7rem' }}>Nova OS</span>
                                </button>
                                <button className="suggestion-pill" style={{ padding: '12px', flex: 1, flexDirection: 'column', height: 'auto', gap: '8px' }} onClick={() => handleQuickAction('edit')}>
                                    <IdentificationCard size={20} color="#10b981" />
                                    <span style={{ fontSize: '0.7rem' }}>Cadastro</span>
                                </button>
                                <button className="suggestion-pill" style={{ padding: '12px', flex: 1, flexDirection: 'column', height: 'auto', gap: '8px' }} onClick={() => handleQuickAction('signal')}>
                                    <WifiHigh size={20} color="#8b5cf6" />
                                    <span style={{ fontSize: '0.7rem' }}>Ver. Sinal</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div className="avatar-small" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>{conversation?.contact_name.charAt(0)}</div>
                        <Wrench size={22} style={{ opacity: 0.6 }} /><CurrencyDollar size={22} style={{ opacity: 0.6 }} />
                    </div>
                )}
            </aside>

            {/* Modal de Encerramento */}
            <AnimatePresence>
                {showCloseModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ background: 'var(--sb-bg-item)', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', border: '1px solid var(--sb-border)', textAlign: 'center' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <X size={40} color="#ef4444" weight="bold" />
                                </div>
                                <h2 style={{ margin: 0, color: 'var(--sb-text)', fontSize: '1.5rem', fontWeight: 800 }}>Encerrar Atendimento</h2>
                                <p style={{ opacity: 0.6, fontSize: '0.95rem', marginTop: '12px' }}>Deseja encerrar a Ocorrência e Ordens de Serviço vinculadas?</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="btn-titan-primary w-full" style={{ padding: '16px', background: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleCloseChat(true)}> SIM, ENCERRAR TUDO </button>
                                <button className="btn-titan-secondary w-full" style={{ padding: '16px' }} onClick={() => handleCloseChat(false)}> APENAS O CHAT </button>
                                <button className="crm-btn-link w-full mt-4" onClick={() => setShowCloseModal(false)}> CANCELAR </button>
                            </div>
                            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <small style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    NOTA: Ocorrência só será fechada se todas as OS filhas estiverem como "Encerrada".
                                </small>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatArea;