import React, { useState } from 'react';
import {
    Phone, Video, DotsThreeVertical, PaperPlaneTilt,
    Smiley, Paperclip, Checks, Lightning,
    CaretDown, ClockCounterClockwise, Note, Tag,
    WarningCircle, CurrencyDollar, Devices, WifiHigh,
    Info, FileText, Image as ImageIcon, Camera, UserList,
    ArchiveHistory, ShareNetwork, Users, Robot, CheckSquareOffset
} from '@phosphor-icons/react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatArea.css';

const ChatArea: React.FC = () => {
    const [message, setMessage] = useState('');
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>('timeline');

    // New interaction states
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false);

    const [messages, setMessages] = useState([
        { id: '1', sender: 'João Silva', text: 'Bom dia, gostaria de solicitar a 2ª via do boleto de abril.', time: '10:20', isUser: false, reactions: ['👍'] },
        { id: '2', sender: 'AI Bot', text: 'Olá João! Sou o Titã AI. Vou te ajudar com isso agora mesmo.', time: '10:21', isBot: true, reactions: [] as string[] },
        { id: '3', sender: 'AI Bot', text: 'Verifiquei aqui que seu boleto venceu no dia 05/04. Deseja que eu gere o PDF ou apenas a linha digitável?', time: '10:21', isBot: true, reactions: [] as string[] },
        { id: '4', sender: 'João Silva', text: 'Pode ser a linha digitável, por favor.', time: '10:23', isUser: false, reactions: [] as string[] },
        { id: '5', sender: 'AI Bot', text: 'Com certeza! Aqui está sua linha digitável para o mês de Abril: \n\n00190.00009 02707.123456 78901.234567 8 96780000015000', time: '10:24', isBot: true, reactions: [] as string[] },
        { id: '6', sender: 'João Silva', text: 'Obrigado!', time: '10:25', isUser: false, reactions: ['❤️'] },
    ]);

    const handleReaction = (emojiData: any) => {
        if (!activeMessageId) return;

        setMessages(prev => prev.map(msg => {
            if (msg.id === activeMessageId) {
                const reactions = [...msg.reactions];
                if (!reactions.includes(emojiData.emoji)) {
                    reactions.push(emojiData.emoji);
                }
                return { ...msg, reactions };
            }
            return msg;
        }));
        setActiveMessageId(null);
    };

    const handleInputEmoji = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji);
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    return (
        <div className="chat-area">
            <header className="chat-header">
                <div className="chat-user-info">
                    <div className="avatar-small flex-center">J</div>
                    <div className="user-details">
                        <h3>João Silva</h3>
                        <span className="user-status">Online • WhatsApp</span>
                    </div>
                </div>

                <div className="chat-actions">
                    <button className="action-btn end-chat-btn" title="Encerrar Chat">
                        <CheckSquareOffset size={20} weight="bold" />
                        <span>Encerrar</span>
                    </button>
                    <div className="divider"></div>
                    <button className="action-btn" title="Ligar (VoIP)">
                        <Phone size={20} weight="duotone" />
                    </button>
                    <button className="action-btn" title="Video Chamada">
                        <Video size={20} weight="duotone" />
                    </button>
                    <div className="divider"></div>
                    <button className={`action-btn ${isInfoOpen ? 'active' : ''}`} onClick={() => setIsInfoOpen(!isInfoOpen)} title="Informações do Cliente">
                        <Info size={20} weight="bold" />
                    </button>
                    <div className="relative-container">
                        <button className={`action-btn ${isHeaderMenuOpen ? 'active' : ''}`} onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}>
                            <DotsThreeVertical size={20} weight="bold" />
                        </button>
                        <AnimatePresence>
                            {isHeaderMenuOpen && (
                                <>
                                    <div className="menu-backdrop" onClick={() => setIsHeaderMenuOpen(false)}></div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="dropdown-menu header-menu"
                                    >
                                        <button className="menu-item">
                                            <ArchiveHistory size={18} />
                                            Histórico
                                        </button>
                                        <button className="menu-item">
                                            <ShareNetwork size={18} />
                                            Transferir
                                        </button>
                                        <button className="menu-item">
                                            <Users size={18} />
                                            Participantes
                                        </button>
                                        <div className="menu-divider"></div>
                                        <button className="menu-item highlight">
                                            <Robot size={18} />
                                            Ativar AI
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
                                            <button
                                                className="add-reaction-btn"
                                                onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                                            >
                                                <Smiley size={14} weight="bold" />
                                            </button>
                                        </div>

                                        {activeMessageId === msg.id && (
                                            <div className="emoji-picker-container">
                                                <EmojiPicker
                                                    onEmojiClick={handleReaction}
                                                    emojiStyle={EmojiStyle.GOOGLE}
                                                    theme={Theme.DARK}
                                                    lazyLoadEmojis={true}
                                                    searchDisabled={false}
                                                    skinTonesDisabled={true}
                                                    height={350}
                                                    width={300}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {msg.isBot && <span className="bot-label">Titã AI Orchestrator</span>}
                                </div>
                            </div>
                        ))}

                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                            <p>João Silva está digitando...</p>
                        </div>
                    </div>

                    <footer className="chat-input-area">
                        <div className="input-actions">
                            {/* Emoji Button */}
                            <div className="relative-container">
                                <button
                                    className={`input-action-btn ${isInputEmojiOpen ? 'active' : ''}`}
                                    onClick={() => { setIsInputEmojiOpen(!isInputEmojiOpen); setIsAttachmentMenuOpen(false); }}
                                    title="Emoji"
                                >
                                    <Smiley size={22} weight="duotone" />
                                </button>
                                {isInputEmojiOpen && (
                                    <>
                                        <div className="menu-backdrop" onClick={() => setIsInputEmojiOpen(false)}></div>
                                        <div className="input-emoji-picker">
                                            <EmojiPicker
                                                onEmojiClick={handleInputEmoji}
                                                emojiStyle={EmojiStyle.GOOGLE}
                                                theme={Theme.DARK}
                                                lazyLoadEmojis={true}
                                                searchDisabled={false}
                                                skinTonesDisabled={true}
                                                height={380}
                                                width={320}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Attachment Button */}
                            <div className="relative-container">
                                <button
                                    className={`input-action-btn ${isAttachmentMenuOpen ? 'active' : ''}`}
                                    onClick={() => { setIsAttachmentMenuOpen(!isAttachmentMenuOpen); setIsInputEmojiOpen(false); }}
                                    title="Anexar"
                                >
                                    <Paperclip size={22} weight="duotone" />
                                </button>
                                <AnimatePresence>
                                    {isAttachmentMenuOpen && (
                                        <>
                                            <div className="menu-backdrop" onClick={() => setIsAttachmentMenuOpen(false)}></div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="dropdown-menu attachment-menu"
                                            >
                                                <button className="menu-item">
                                                    <ImageIcon size={18} />
                                                    Imagem / Vídeo
                                                </button>
                                                <button className="menu-item">
                                                    <FileText size={18} />
                                                    Documento
                                                </button>
                                                <button className="menu-item">
                                                    <Camera size={18} />
                                                    Câmera
                                                </button>
                                                <button className="menu-item">
                                                    <UserList size={18} />
                                                    Contato
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="message-input-container">
                            <textarea
                                placeholder="Digite sua mensagem aqui..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={1}
                            />
                        </div>

                        <button className="send-btn flex-center" disabled={!message.trim()}>
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
                            <div className={`accordion-item ${openAccordion === 'timeline' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('timeline')}>
                                    <div className="header-left">
                                        <ClockCounterClockwise size={18} weight="duotone" />
                                        <span>Timeline</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <p>Última interação: Hoje às 10:25</p>
                                    <p>Canal principal: WhatsApp</p>
                                </div>
                            </div>

                            <div className={`accordion-item ${openAccordion === 'motivo' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('motivo')}>
                                    <div className="header-left">
                                        <Note size={18} weight="duotone" />
                                        <span>Motivo do Atendimento</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <p>Financeiro - Segunda via de boleto</p>
                                </div>
                            </div>

                            <div className={`accordion-item ${openAccordion === 'etiqueta' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('etiqueta')}>
                                    <div className="header-left">
                                        <Tag size={18} weight="duotone" />
                                        <span>Etiqueta</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <div className="tag-list">
                                        <span className="tag-item">Vencido</span>
                                        <span className="tag-item">VIP</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`accordion-item ${openAccordion === 'queixa' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('queixa')}>
                                    <div className="header-left">
                                        <WarningCircle size={18} weight="duotone" />
                                        <span>Última Queixa</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <p>Sinal oscilando (há 3 dias)</p>
                                </div>
                            </div>

                            <div className={`accordion-item ${openAccordion === 'financeiro' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('financeiro')}>
                                    <div className="header-left">
                                        <CurrencyDollar size={18} weight="duotone" />
                                        <span>Situação Financeira</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <p className="status-danger">Débito: R$ 149,90</p>
                                    <p>Plano: 500MB Fibra</p>
                                </div>
                            </div>

                            <div className={`accordion-item ${openAccordion === 'aparelho' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('aparelho')}>
                                    <div className="header-left">
                                        <Devices size={18} weight="duotone" />
                                        <span>Status do Aparelho</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <p>ONU: Huawei HG8245H</p>
                                    <p>Status: Online (23h 14m)</p>
                                </div>
                            </div>

                            <div className={`accordion-item ${openAccordion === 'optico' ? 'open' : ''}`}>
                                <button className="accordion-header" onClick={() => toggleAccordion('optico')}>
                                    <div className="header-left">
                                        <WifiHigh size={18} weight="duotone" />
                                        <span>Sinal Óptico</span>
                                    </div>
                                    <CaretDown size={14} className="caret" />
                                </button>
                                <div className="accordion-content">
                                    <p>RX Power: -21.4 dBm</p>
                                    <p className="status-success">Nível: Excelente</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default ChatArea;