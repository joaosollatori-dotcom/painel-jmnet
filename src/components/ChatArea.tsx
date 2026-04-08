import React, { useState } from 'react';
import {
    Phone, Video, DotsThreeVertical, PaperPlaneTilt,
    Smiley, Paperclip, Checks, Lightning
} from '@phosphor-icons/react';
import './ChatArea.css';

const ChatArea: React.FC = () => {
    const [message, setMessage] = useState('');

    const mockMessages = [
        { id: '1', sender: ' João Silva', text: 'Bom dia, gostaria de solicitar a 2ª via do boleto de abril.', time: '10:20', isUser: false },
        { id: '2', sender: 'AI Bot', text: 'Olá João! Sou o Titã AI. Vou te ajudar com isso agora mesmo.', time: '10:21', isBot: true },
        { id: '3', sender: 'AI Bot', text: 'Verifiquei aqui que seu boleto venceu no dia 05/04. Deseja que eu gere o PDF ou apenas a linha digitável?', time: '10:21', isBot: true },
        { id: '4', sender: ' João Silva', text: 'Pode ser a linha digitável, por favor.', time: '10:23', isUser: false },
        { id: '5', sender: 'AI Bot', text: 'Com certeza! Aqui está sua linha digitável para o mês de Abril: \n\n00190.00009 02707.123456 78901.234567 8 96780000015000', time: '10:24', isBot: true },
        { id: '6', sender: ' João Silva', text: 'Obrigado!', time: '10:25', isUser: false },
    ];

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
                    <button className="action-btn" title="Ligar (VoIP)">
                        <Phone size={20} weight="duotone" />
                    </button>
                    <button className="action-btn" title="Video Chamada">
                        <Video size={20} weight="duotone" />
                    </button>
                    <div className="divider"></div>
                    <button className="action-btn">
                        <DotsThreeVertical size={20} weight="bold" />
                    </button>
                </div>
            </header>

            <div className="messages-container">
                <div className="chat-day-separator">Hoje</div>

                {mockMessages.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.isUser ? 'received' : 'sent'} ${msg.isBot ? 'bot' : ''}`}>
                        {!msg.isUser && !msg.isBot && <div className="msg-avatar">J</div>}
                        {msg.isBot && <div className="msg-avatar bot"><Lightning size={14} weight="fill" /></div>}

                        <div className="message-content">
                            <div className="message-bubble">
                                <p>{msg.text}</p>
                                <div className="message-footer">
                                    <span className="message-time">{msg.time}</span>
                                    {msg.isUser && <Checks size={14} className="status-icon" weight="bold" />}
                                </div>

                                <div className="message-reactions">
                                    <button className="reaction">👍</button>
                                </div>
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
                    <button className="input-action-btn"><Smiley size={22} weight="duotone" /></button>
                    <button className="input-action-btn"><Paperclip size={22} weight="duotone" /></button>
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
    );
};

export default ChatArea;