import React, { useState, useEffect, useRef } from 'react';
import {
    Hash, Users, MagnifyingGlass, Plus, Bell, PushPin, Gift,
    Sticker, Smiley, Paperclip, FileText, UserCircle,
    ChartBar, Broadcast, Receipt, WifiHigh, X
} from '@phosphor-icons/react';
import {
    getInternalMessages, sendInternalMessage, subscribeToInternalMessages,
    getConversations, getClientSummary, getEquipmentReport,
    getContractReport, getConnectionStatus
} from '../services/chatService';
import type { InternalMessage, Conversation } from '../services/chatService';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import './InternalChat.css';

const CHANNEL_TOPICS: Record<string, string> = {
    'geral': 'Chat geral da empresa',
    'suporte-n2': 'Escalações técnicas e debug avançado',
    'avisos': 'Comunicados oficiais e avisos da gestão'
};

const InternalChat: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState('geral');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<InternalMessage[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showClientPicker, setShowClientPicker] = useState<{ mode: 'summary' | 'equip' | 'contract' | 'conn' | 'mention' } | null>(null);
    const [clients, setClients] = useState<Conversation[]>([]);
    const [searchClient, setSearchClient] = useState('');
    const [channels, setChannels] = useState(['geral', 'suporte-n2', 'avisos']);
    const [showNewChannelInput, setShowNewChannelInput] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMembersSidebar, setShowMembersSidebar] = useState(true);
    const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const [attachment, setAttachment] = useState<{ title: string; content: string; icon: string; clientName: string } | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState<{ label: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadMessages();
        const sub = subscribeToInternalMessages(activeChannel, (newMsg) => {
            setMessages(prev => {
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        });
        return () => sub.unsubscribe();
    }, [activeChannel]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        const data = await getInternalMessages(activeChannel);
        setMessages(data);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() && !attachment) return;

        let textToSend = message.trim();
        if (attachment) {
            textToSend = `📎 ${attachment.icon} ${attachment.title} — ${attachment.clientName}\n${'━'.repeat(36)}\n${attachment.content}${textToSend ? `\n\n💬 ${textToSend}` : ''}`;
        }

        const optimisticId = `temp-${Date.now()}`;
        const newMsg: InternalMessage = {
            id: optimisticId,
            channel: activeChannel,
            user: 'João Sollatori',
            avatar: 'J',
            text: textToSend,
            color: '#ef4444',
            isBot: false,
            created_at: new Date().toISOString()
        };

        // Adição otimista para feedback imediato
        setMessages(prev => [...prev, newMsg]);
        setMessage('');
        setAttachment(null);

        try {
            await sendInternalMessage(activeChannel, {
                user: 'João Sollatori',
                avatar: 'J',
                text: textToSend,
                color: '#ef4444',
                isBot: false
            });
        } catch (err) {
            console.error('Error sending internal message:', err);
            showToastMsg("Erro ao enviar mensagem");
            // Remove a mensagem otimista em caso de erro real
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        }
    };

    const triggerClientAction = async (client: Conversation) => {
        if (!showClientPicker) return;
        const mode = showClientPicker.mode;
        setShowClientPicker(null);
        setIsMenuOpen(false);

        const MODE_LABELS: Record<string, string> = {
            mention: 'Mencionando cliente',
            summary: 'Gerando resumo IA',
            equip: 'Buscando Info Equipamento',
            contract: 'Buscando Info Contrato',
            conn: 'Buscando Status Conexão'
        };
        const MODE_ICONS: Record<string, string> = {
            mention: '👤', summary: '🤖', equip: '📡', contract: '📜', conn: '🌐'
        };
        const MODE_TITLES: Record<string, string> = {
            mention: 'Menção de Cliente',
            summary: 'Resumo IA do Atendimento',
            equip: 'Relatório de Equipamento',
            contract: 'Relatório de Contrato',
            conn: 'Status de Conexão'
        };

        setIsLoadingReport({ label: MODE_LABELS[mode] || 'Carregando...' });

        // Simular tempo de busca real
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

        const reportText = await (async () => {
            try {
                if (mode === 'mention') {
                    return `Cliente: ${client.contact_name}\nTelefone: ${client.contact_phone || 'N/A'}\nE-mail: ${client.contact_email || 'N/A'}\nPlataforma: ${client.platform}\nStatus: ${client.is_closed ? 'Encerrado' : 'Ativo'}`;
                } else if (mode === 'summary') {
                    return await getClientSummary(client.id);
                } else if (mode === 'equip') {
                    return await getEquipmentReport(client.contact_phone || '');
                } else if (mode === 'contract') {
                    return await getContractReport(client.contact_phone || '');
                } else if (mode === 'conn') {
                    return await getConnectionStatus(client.contact_phone || '');
                }
                return '';
            } catch (err) {
                console.error('Error generating report:', err);
                return 'Erro ao gerar relatório. Tente novamente.';
            }
        })();

        setIsLoadingReport(null);

        if (reportText) {
            setAttachment({
                title: MODE_TITLES[mode] || 'Relatório',
                content: reportText,
                icon: MODE_ICONS[mode] || '📎',
                clientName: client.contact_name
            });
            showToastMsg("Anexo gerado com sucesso!");
            // Focus no input para o usuário digitar mensagem
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const openClientPicker = async (mode: any) => {
        try {
            // Fecha o menu de plus imediatamente
            setIsMenuOpen(false);
            // Abre o modal de seleção com lista vazia (ou anterior) mas indica carregamento
            setShowClientPicker({ mode });

            const data = await getConversations();
            setClients(data);
        } catch (err) {
            console.error('Error opening client picker:', err);
            showToastMsg("Erro ao carregar lista de clientes");
            setShowClientPicker(null);
        }
    };

    const filteredClients = clients.filter(c =>
        c.contact_name.toLowerCase().includes(searchClient.toLowerCase()) ||
        c.contact_phone?.includes(searchClient)
    );

    const showToastMsg = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateChannel = () => {
        const name = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!name || channels.includes(name)) return;
        setChannels(prev => [...prev, name]);
        CHANNEL_TOPICS[name] = `Canal ${name}`;
        setNewChannelName('');
        setShowNewChannelInput(false);
        setActiveChannel(name);
        showToastMsg(`Canal #${name} criado!`);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const icon = file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('video/') ? '🎥' : '📎';
        await sendInternalMessage(activeChannel, {
            user: 'João Sollatori',
            avatar: 'J',
            text: `${icon} Arquivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
            color: '#ef4444',
            isBot: false
        });
        e.target.value = '';
        setIsMenuOpen(false);
    };

    const handlePinMessage = () => {
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (pinnedMessages.includes(lastMsg.id)) {
            showToastMsg('Última mensagem já está fixada.');
            return;
        }
        setPinnedMessages(prev => [...prev, lastMsg.id]);
        showToastMsg(`Mensagem fixada! (${pinnedMessages.length + 1} fixadas)`);
    };

    const handleInputEmoji = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const filteredMessages = searchTerm ? messages.filter(m => m.text.toLowerCase().includes(searchTerm.toLowerCase())) : messages;

    const handleDMClick = (name: string) => {
        const dmChannel = `dm-${name.toLowerCase().replace(/\s+/g, '-')}`;
        if (!channels.includes(dmChannel)) {
            setChannels(prev => [...prev, dmChannel]);
            CHANNEL_TOPICS[dmChannel] = `Mensagem direta com ${name}`;
        }
        setActiveChannel(dmChannel);
    };

    return (
        <div className="internal-chat-wrapper">
            {/* Servers / Workspaces bar (Optional Discord logic, skipping for pure internal chat, focusing on Channels sidebar) */}

            {/* Sidebar (Channels and DMs) */}
            <aside className="ic-sidebar">
                <header className="ic-sidebar-header">
                    <h2>JMnet Telecom</h2>
                    <Hash size={20} />
                </header>

                <div className="ic-sidebar-scroll">
                    <div className="ic-category">
                        <div className="ic-category-header">
                            <span>CANAIS DE TEXTO</span>
                            <Plus size={14} className="add-btn" onClick={() => setShowNewChannelInput(!showNewChannelInput)} style={{ cursor: 'pointer' }} />
                        </div>
                        {showNewChannelInput && (
                            <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', marginBottom: '4px' }}>
                                <input
                                    type="text"
                                    value={newChannelName}
                                    onChange={e => setNewChannelName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateChannel()}
                                    placeholder="nome-do-canal"
                                    autoFocus
                                    style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', background: 'var(--bg-deep)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                        )}
                        {channels.filter(ch => !ch.startsWith('dm-')).map(ch => (
                            <div key={ch} className={`ic-channel ${activeChannel === ch ? 'active' : ''}`} onClick={() => setActiveChannel(ch)}>
                                <Hash size={20} className="icon" /> {ch}
                            </div>
                        ))}
                    </div>

                    <div className="ic-category">
                        <div className="ic-category-header">
                            <span>MENSAGENS DIRETAS</span>
                        </div>
                        <div className="ic-user" onClick={() => handleDMClick('Roberto Técnico')}>
                            <div className="ic-avatar-small" style={{ background: '#046bed' }}><div className="status-dot dnd" />R</div>
                            <span className="name">Roberto Técnico</span>
                        </div>
                        <div className="ic-user" onClick={() => handleDMClick('Mariana Comercial')}>
                            <div className="ic-avatar-small" style={{ background: '#eab308' }}><div className="status-dot online" />M</div>
                            <span className="name">Mariana Comercial</span>
                        </div>

                        {/* DMs que foram abertas dinamicamente e não estão na lista fixa acima */}
                        {channels.filter(ch => ch.startsWith('dm-')).map(dmId => {
                            const name = dmId.replace('dm-', '').replace(/-/g, ' ');
                            return (
                                <div key={dmId} className={`ic-user ${activeChannel === dmId ? 'active' : ''}`} onClick={() => setActiveChannel(dmId)}>
                                    <div className="ic-avatar-small" style={{ background: '#6366f1' }}>{name.charAt(0).toUpperCase()}</div>
                                    <span className="name">{name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="ic-user-controls">
                    <div className="user-profile">
                        <div className="ic-avatar-small" style={{ background: '#ef4444' }}><div className="status-dot online" />J</div>
                        <div className="user-info">
                            <strong>João S.</strong>
                            <span>#0001</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="ic-main">
                <header className="ic-main-header">
                    <div className="header-left">
                        <Hash size={24} weight="bold" color="#aaa" />
                        <h3>{activeChannel}</h3>
                        <div className="divider"></div>
                        <span className="topic">{CHANNEL_TOPICS[activeChannel] || `Canal ${activeChannel}`}</span>
                    </div>
                    <div className="header-right">
                        <PushPin size={22} weight="bold" className="action-icon" onClick={handlePinMessage} style={{ cursor: 'pointer' }} title={`Fixar última mensagem (${pinnedMessages.length} fixadas)`} />
                        <Bell size={22} weight="bold" className="action-icon" onClick={() => showToastMsg('Notificações do canal ativadas ✓')} style={{ cursor: 'pointer' }} title="Ativar notificações" />
                        <Users size={22} weight="fill" className={`action-icon ${showMembersSidebar ? 'active' : ''}`} onClick={() => setShowMembersSidebar(!showMembersSidebar)} style={{ cursor: 'pointer' }} title="Membros" />
                        <div className="search-box">
                            <input type="text" placeholder="Buscar" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <MagnifyingGlass size={16} />
                        </div>
                    </div>
                </header>

                <div className="ic-messages-area">
                    <div className="ic-messages-scroll">
                        <div className="ic-welcome">
                            <div className="welcome-icon"><Hash size={48} /></div>
                            <h2>Bem-vindo a #{activeChannel}!</h2>
                            <p>Este é o início do canal #{activeChannel}.</p>
                        </div>

                        <div className="ic-divider">
                            <span>Hoje</span>
                        </div>

                        {filteredMessages.map((msg) => (
                            <div className={`ic-message ${msg.isBot ? 'bot-message' : ''}`} key={msg.id}>
                                <div className="ic-msg-avatar" style={{ backgroundColor: msg.color }}>
                                    {msg.avatar}
                                </div>
                                <div className="ic-msg-content">
                                    <div className="ic-msg-header">
                                        <span className="ic-msg-user" style={{ color: msg.color }}>{msg.user}</span>
                                        {msg.isBot && <span className="bot-tag">BOT</span>}
                                        {pinnedMessages.includes(msg.id) && <span className="bot-tag" style={{ background: '#f59e0b' }}>📌</span>}
                                        <span className="ic-msg-time">{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="ic-msg-text" style={{ whiteSpace: 'pre-wrap' }}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="ic-input-container" onSubmit={handleSendMessage}>
                        {/* Attachment Card (Claude-style) */}
                        <AnimatePresence>
                            {attachment && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 12, height: 0 }}
                                    className="ic-attachment-card"
                                >
                                    <div className="ic-attach-header">
                                        <div className="ic-attach-icon">{attachment.icon}</div>
                                        <div className="ic-attach-meta">
                                            <strong>{attachment.title}</strong>
                                            <span>{attachment.clientName} • {attachment.content.split('\n').length} linhas</span>
                                        </div>
                                        <button type="button" className="ic-attach-close" onClick={() => setAttachment(null)}>
                                            <X size={16} weight="bold" />
                                        </button>
                                    </div>
                                    <pre className="ic-attach-body">{attachment.content}</pre>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="ic-input-wrapper">
                            <div className="ic-plus-container">
                                <button type="button" className={`ic-action-btn ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                    <Plus size={20} weight="bold" />
                                </button>
                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                            className="ic-plus-menu"
                                        >
                                            <button type="button" onClick={() => openClientPicker('mention')}><UserCircle size={18} /> Mencionar Cliente</button>
                                            <button type="button" onClick={() => openClientPicker('summary')}><FileText size={18} /> Pedir Resumo IA</button>
                                            <div className="ic-menu-divider" />
                                            <span className="ic-menu-label">RELATÓRIOS BI</span>
                                            <button type="button" onClick={() => openClientPicker('equip')}><Broadcast size={18} /> Info Equipamento</button>
                                            <button type="button" onClick={() => openClientPicker('contract')}><Receipt size={18} /> Info Contrato</button>
                                            <button type="button" onClick={() => openClientPicker('conn')}><WifiHigh size={18} /> Info Conexão</button>
                                            <div className="ic-menu-divider" />
                                            <button type="button" onClick={() => { fileInputRef.current?.click(); }}><Paperclip size={18} /> Enviar Arquivo</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={attachment ? 'Adicione uma mensagem (opcional)...' : `Conversar em #${activeChannel}`}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <div className="ic-input-actions">
                                <button type="button" className="ic-action-btn" onClick={() => showToastMsg('🎁 Função de presentes em breve!')} title="Presente"><Gift size={22} /></button>
                                <button type="button" className="ic-action-btn" onClick={() => { setMessage(prev => prev + '😀'); }} title="Sticker rápido"><Sticker size={22} /></button>
                                <div className="relative-container" style={{ position: 'relative' }}>
                                    <button type="button" className={`ic-action-btn ${showEmojiPicker ? 'active' : ''}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji"><Smiley size={22} /></button>
                                    {showEmojiPicker && (
                                        <div style={{ position: 'absolute', bottom: '40px', right: 0, zIndex: 200 }}>
                                            <EmojiPicker onEmojiClick={handleInputEmoji} emojiStyle={EmojiStyle.GOOGLE} theme={Theme.DARK} lazyLoadEmojis height={350} width={300} skinTonesDisabled />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />

            {/* Members Sidebar */}
            {showMembersSidebar && (
                <aside className="ic-members-sidebar">
                    <div className="ic-members-category">ONLINE — 2</div>

                    <div className="ic-member">
                        <div className="ic-avatar-small" style={{ background: '#ef4444' }}>
                            <div className="status-dot online" />J
                        </div>
                        <div className="name-box">
                            <span className="name" style={{ color: '#ef4444' }}>João Sollatori</span>
                            <span className="sub">Liderança</span>
                        </div>
                    </div>

                    <div className="ic-member">
                        <div className="ic-avatar-small" style={{ background: '#10b981' }}>
                            <div className="status-dot online" />T
                        </div>
                        <div className="name-box">
                            <span className="name" style={{ color: '#10b981' }}>Titã AI</span>
                            <span className="bot-tag">BOT</span>
                        </div>
                    </div>

                    <div className="ic-members-category" style={{ marginTop: '20px' }}>OFFLINE — 2</div>

                    <div className="ic-member offline">
                        <div className="ic-avatar-small" style={{ background: '#046bed' }}>R</div>
                        <div className="name-box">
                            <span className="name">Roberto Técnico</span>
                        </div>
                    </div>
                    <div className="ic-member offline">
                        <div className="ic-avatar-small" style={{ background: '#eab308' }}>M</div>
                        <div className="name-box">
                            <span className="name">Mariana Comercial</span>
                        </div>
                    </div>
                </aside>
            )}

            <AnimatePresence>
                {showClientPicker && (
                    <div className="ic-modal-overlay" onClick={() => setShowClientPicker(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="ic-client-picker-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <header>
                                <h3>Selecione o Cliente</h3>
                                <button onClick={() => setShowClientPicker(null)}><X size={20} /></button>
                            </header>
                            <div className="picker-search">
                                <MagnifyingGlass size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome ou telefone..."
                                    value={searchClient}
                                    onChange={e => setSearchClient(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="picker-list ic-sidebar-scroll">
                                {filteredClients.map(client => (
                                    <button key={client.id} onClick={() => triggerClientAction(client)} className="picker-item">
                                        <div className="avatar">{client.contact_name.charAt(0)}</div>
                                        <div className="info">
                                            <strong>{client.contact_name}</strong>
                                            <span>{client.contact_phone || 'Sem telefone'}</span>
                                        </div>
                                    </button>
                                ))}
                                {filteredClients.length === 0 && <div className="picker-empty">Nenhum cliente encontrado.</div>}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Loading Report Modal */}
            <AnimatePresence>
                {isLoadingReport && (
                    <div className="ic-modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            className="ic-loading-modal"
                        >
                            <div className="ic-loading-spinner" />
                            <strong>{isLoadingReport.label}</strong>
                            <span>Consultando base de dados...</span>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InternalChat;
