import React, { useState, useRef } from 'react';
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
import './ChatArea.css';

const ChatArea: React.FC = () => {
    const [message, setMessage] = useState('');
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>('timeline');
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false);
    const [isAIActive, setIsAIActive] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [chatEnded, setChatEnded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileAcceptRef = useRef<string>('*');

    const [messages, setMessages] = useState([
        { id: '1', sender: 'João Silva', text: 'Bom dia, gostaria de solicitar a 2ª via do boleto de abril.', time: '10:20', isUser: false, isBot: false, reactions: ['👍'] },
        { id: '2', sender: 'AI Bot', text: 'Olá João! Sou o Titã AI. Vou te ajudar com isso agora mesmo.', time: '10:21', isUser: false, isBot: true, reactions: [] as string[] },
        { id: '3', sender: 'AI Bot', text: 'Verifiquei aqui que seu boleto venceu no dia 05/04. Deseja que eu gere o PDF ou apenas a linha digitável?', time: '10:21', isUser: false, isBot: true, reactions: [] as string[] },
        { id: '4', sender: 'João Silva', text: 'Pode ser a linha digitável, por favor.', time: '10:23', isUser: false, isBot: false, reactions: [] as string[] },
        { id: '5', sender: 'AI Bot', text: 'Com certeza! Aqui está sua linha digitável para o mês de Abril:\n\n00190.00009 02707.123456 78901.234567 8 96780000015000', time: '10:24', isUser: false, isBot: true, reactions: [] as string[] },
        { id: '6', sender: 'João Silva', text: 'Obrigado!', time: '10:25', isUser: false, isBot: false, reactions: ['❤️'] },
    ]);

    const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const sendMessage = () => {
        if (!message.trim() || chatEnded) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Você', text: message.trim(), time: now(), isUser: true, isBot: false, reactions: [] }]);
        setMessage('');
    };

    const handleReaction = (emojiData: any) => {
        if (!activeMessageId) return;
        setMessages(prev => prev.map(msg => {
            if (msg.id === activeMessageId) {
                const reactions = [...msg.reactions];
                if (!reactions.includes(emojiData.emoji)) reactions.push(emojiData.emoji);
                return { ...msg, reactions };
            }
            return msg;
        }));
        setActiveMessageId(null);
    };

    const handleInputEmoji = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji);
        setIsInputEmojiOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const icon = file.type.startsWith('image/') ? '📷' : file.type.startsWith('video/') ? '🎥' : '📎';
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Você', text: `${icon} ${file.name}`, time: now(), isUser: true, isBot: false, reactions: [] }]);
        }
        e.target.value = '';
        setIsAttachmentMenuOpen(false);
    };

    const openFilePicker = (accept: string) => {
        fileAcceptRef.current = accept;
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    const handleEndChat = () => {
        setChatEnded(true);
        setShowEndModal(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Sistema', text: '🔒 Atendimento encerrado.', time: now(), isUser: true, isBot: false, reactions: [] }]);
    };

    const toggleAccordion = (id: string) => setOpenAccordion(openAccordion === id ? null : id);

    return (
        <div className="chat-area">
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

            <header className="chat-header">
                <div className="chat-user-info">
                    <div className="avatar-small flex-center">J</div>
                    <div className="user-details">
                        <h3>João Silva</h3>
                        <span className="user-status">Online • WhatsApp</span>
                    </div>
                </div>

                <div className="chat-actions">
                    {!chatEnded ? (
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
                                            className={`menu-item ${isAIActive ? 'ai-active' : 'highlight'}`}
                                            onClick={() => { setIsAIActive(!isAIActive); setIsHeaderMenuOpen(false); }}
                                        >
                                            <Robot size={18} /> {isAIActive ? '✓ IA Ativa' : 'Ativar AI'}
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
                            <div key={msg.id} className={`message-wrapper ${msg.isUser || msg.isBot ? 'sent' : 'received'} ${msg.isBot ? 'bot' : ''}`}>
                                {!msg.isUser && !msg.isBot && <div className="msg-avatar">{msg.sender.charAt(0)}</div>}
                                {msg.isBot && <div className="msg-avatar bot"><Lightning size={14} weight="fill" /></div>}

                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>{msg.text}</p>
                                        <div className="message-footer">
                                            <span className="message-time">{msg.time}</span>
                                            {(msg.isUser || msg.isBot) && <Checks size={14} className="status-icon" weight="bold" />}
                                        </div>

                                        <div className="message-reactions">
                                            {msg.reactions.map((r, i) => (
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
                                    {msg.isBot && <span className="bot-label">{isAIActive ? '🤖 Titã AI — Ativo' : 'Titã AI Orchestrator'}</span>}
                                </div>
                            </div>
                        ))}

                        {!chatEnded && (
                            <div className="typing-indicator">
                                <span /><span /><span />
                                <p>João Silva está digitando...</p>
                            </div>
                        )}
                    </div>

                    <footer className="chat-input-area">
                        <div className="input-actions">
                            {/* Emoji */}
                            <div className="relative-container">
                                <button className={`input-action-btn ${isInputEmojiOpen ? 'active' : ''}`} onClick={() => { setIsInputEmojiOpen(!isInputEmojiOpen); setIsAttachmentMenuOpen(false); }} disabled={chatEnded}>
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

                            {/* Attachment */}
                            <div className="relative-container">
                                <button className={`input-action-btn ${isAttachmentMenuOpen ? 'active' : ''}`} onClick={() => { setIsAttachmentMenuOpen(!isAttachmentMenuOpen); setIsInputEmojiOpen(false); }} disabled={chatEnded}>
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
                                placeholder={chatEnded ? 'Atendimento encerrado.' : 'Digite sua mensagem aqui...'}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                rows={1}
                                disabled={chatEnded}
                            />
                        </div>

                        <button className="send-btn flex-center" disabled={!message.trim() || chatEnded} onClick={sendMessage}>
                            <PaperPlaneTilt size={20} weight="duotone" />
                        </button>
                    </footer>
                </div>

                {isInfoOpen && (
                    <aside className="chat-info-sidebar">
                        <div className="sidebar-header-info">
                            <h4>Detalhes do Cliente</h4>
                        </div>

                        <div className="accordion-list">
                            {[
                                { id: 'timeline', icon: <ClockCounterClockwise size={18} weight="duotone" />, label: 'Timeline', content: <><p>Última interação: Hoje às 10:25</p><p>Canal principal: WhatsApp</p></> },
                                { id: 'motivo', icon: <Note size={18} weight="duotone" />, label: 'Motivo do Atendimento', content: <p>Financeiro - Segunda via de boleto</p> },
                                { id: 'etiqueta', icon: <Tag size={18} weight="duotone" />, label: 'Etiqueta', content: <div className="tag-list"><span className="tag-item">Vencido</span><span className="tag-item">VIP</span></div> },
                                { id: 'queixa', icon: <WarningCircle size={18} weight="duotone" />, label: 'Última Queixa', content: <p>Sinal oscilando (há 3 dias)</p> },
                                { id: 'financeiro', icon: <CurrencyDollar size={18} weight="duotone" />, label: 'Situação Financeira', content: <><p className="status-danger">Débito: R$ 149,90</p><p>Plano: 500MB Fibra</p></> },
                                { id: 'aparelho', icon: <Devices size={18} weight="duotone" />, label: 'Status do Aparelho', content: <><p>ONU: Huawei HG8245H</p><p>Status: Online (23h 14m)</p></> },
                                { id: 'optico', icon: <WifiHigh size={18} weight="duotone" />, label: 'Sinal Óptico', content: <><p>RX Power: -21.4 dBm</p><p className="status-success">Nível: Excelente</p></> },
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
                            <p>O cliente não poderá mais enviar mensagens nesta sessão. Esta ação não pode ser desfeita.</p>
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
                                <div className="history-item"><span className="history-date">08/04/2026</span><span>Solicitação de suporte técnico</span></div>
                                <div className="history-item"><span className="history-date">02/04/2026</span><span>Segunda via de boleto março</span></div>
                                <div className="history-item"><span className="history-date">15/03/2026</span><span>Reclamação de oscilação</span></div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showTransferModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal">
                            <h3>Transferir Atendimento</h3>
                            <p>Selecione o agente ou setor para transferir esta conversa:</p>
                            <div className="transfer-list">
                                {['Suporte Técnico', 'Financeiro', 'Comercial', 'Agente: Carlos M.', 'Agente: Priya S.'].map(dest => (
                                    <button key={dest} className="transfer-option" onClick={() => { setShowTransferModal(false); }}>
                                        <ShareNetwork size={16} /> {dest}
                                    </button>
                                ))}
                            </div>
                            <div className="ca-modal-actions">
                                <button className="ca-cancel" onClick={() => setShowTransferModal(false)}>Cancelar</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showParticipantsModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="ca-modal">
                            <h3>Participantes</h3>
                            <div className="participants-list">
                                <div className="participant-item"><div className="p-avatar">V</div><div><strong>Você</strong><span>Agente ativo</span></div></div>
                                <div className="participant-item"><div className="p-avatar bot"><Lightning size={12} weight="fill" /></div><div><strong>Titã AI</strong><span>{isAIActive ? 'Assistindo' : 'Em espera'}</span></div></div>
                            </div>
                            <div className="ca-modal-actions">
                                <button className="ca-cancel" onClick={() => setShowParticipantsModal(false)}>Fechar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatArea;