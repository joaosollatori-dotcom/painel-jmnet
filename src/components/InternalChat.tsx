import React, { useState } from 'react';
import { Hash, Users, MagnifyingGlass, Plus, Bell, PushPin, Gift, Sticker, Smiley, Paperclip } from '@phosphor-icons/react';
import './InternalChat.css';

const InternalChat: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState('geral');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', user: 'Carlos Oliveira', avatar: 'C', time: 'Hoje às 10:23', text: 'Bom dia pessoal! O roteador do cliente João foi trocado.', color: '#046bed' },
        { id: '2', user: 'Titã AI', avatar: 'T', time: 'Hoje às 10:25', text: 'Sistema OLT reportou estabilidade na rede Norte.', color: '#10b981', isBot: true },
        { id: '3', user: 'Mariana Silva', avatar: 'M', time: 'Hoje às 11:42', text: 'Anotado Carlos, vou dar baixa na Ordem de Serviço.', color: '#eab308' },
        { id: '4', user: 'João Sollatori', avatar: 'J', time: 'Hoje às 14:00', text: 'Pessoal, lembrem-se de preencher o motivo detalhado ao encerrar chats!', color: '#ef4444' }
    ]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setMessages([
            ...messages,
            {
                id: Date.now().toString(),
                user: 'João Sollatori', // Mock user
                avatar: 'J',
                time: 'Hoje às 14:02', // Mock time
                text: message,
                color: '#ef4444' // Mock color
            }
        ]);
        setMessage('');
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
                            <Plus size={14} className="add-btn" />
                        </div>
                        <div className={`ic-channel ${activeChannel === 'geral' ? 'active' : ''}`} onClick={() => setActiveChannel('geral')}>
                            <Hash size={20} className="icon" /> geral
                        </div>
                        <div className={`ic-channel ${activeChannel === 'suporte-n2' ? 'active' : ''}`} onClick={() => setActiveChannel('suporte-n2')}>
                            <Hash size={20} className="icon" /> suporte-n2
                        </div>
                        <div className={`ic-channel ${activeChannel === 'avisos' ? 'active' : ''}`} onClick={() => setActiveChannel('avisos')}>
                            <Hash size={20} className="icon" /> avisos
                        </div>
                    </div>

                    <div className="ic-category">
                        <div className="ic-category-header">
                            <span>MENSAGENS DIRETAS</span>
                            <Plus size={14} className="add-btn" />
                        </div>
                        <div className="ic-user">
                            <div className="ic-avatar-small"><div className="status-dot dnd" />C</div>
                            <span className="name">Carlos Oliveira</span>
                        </div>
                        <div className="ic-user">
                            <div className="ic-avatar-small"><div className="status-dot online" />M</div>
                            <span className="name">Mariana Silva</span>
                        </div>
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
                        <span className="topic">Chat geral da empresa</span>
                    </div>
                    <div className="header-right">
                        <PushPin size={22} weight="bold" className="action-icon" />
                        <Bell size={22} weight="bold" className="action-icon" />
                        <Users size={22} weight="fill" className="action-icon active" />
                        <div className="search-box">
                            <input type="text" placeholder="Buscar" />
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

                        {messages.map((msg) => (
                            <div className={`ic-message ${msg.isBot ? 'bot-message' : ''}`} key={msg.id}>
                                <div className="ic-msg-avatar" style={{ backgroundColor: msg.color }}>
                                    {msg.avatar}
                                </div>
                                <div className="ic-msg-content">
                                    <div className="ic-msg-header">
                                        <span className="ic-msg-user" style={{ color: msg.color }}>{msg.user}</span>
                                        {msg.isBot && <span className="bot-tag">BOT</span>}
                                        <span className="ic-msg-time">{msg.time}</span>
                                    </div>
                                    <div className="ic-msg-text">
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="ic-input-container" onSubmit={handleSendMessage}>
                        <div className="ic-input-wrapper">
                            <button type="button" className="ic-action-btn"><Plus size={20} weight="bold" /></button>
                            <input
                                type="text"
                                placeholder={`Conversar em #${activeChannel}`}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <div className="ic-input-actions">
                                <button type="button" className="ic-action-btn"><Gift size={22} /></button>
                                <button type="button" className="ic-action-btn"><Sticker size={22} /></button>
                                <button type="button" className="ic-action-btn"><Smiley size={22} /></button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            {/* Members Sidebar */}
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
                    <div className="ic-avatar-small" style={{ background: '#046bed' }}>C</div>
                    <div className="name-box">
                        <span className="name">Carlos Oliveira</span>
                    </div>
                </div>
                <div className="ic-member offline">
                    <div className="ic-avatar-small" style={{ background: '#eab308' }}>M</div>
                    <div className="name-box">
                        <span className="name">Mariana Silva</span>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default InternalChat;
