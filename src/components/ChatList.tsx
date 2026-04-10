import React, { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import './ChatList.css';

interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    status: 'new' | 'waiting' | 'active';
    platform: 'whatsapp' | 'instagram' | 'web';
}

const ChatList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const mockChats: Chat[] = [
        { id: '1', name: 'João Silva', lastMessage: 'Preciso da segunda via do boleto', time: '10:25', unread: 2, status: 'new', platform: 'whatsapp' },
        { id: '2', name: 'Maria Souza', lastMessage: 'O sinal está oscilando muito hoje', time: '09:40', unread: 0, status: 'active', platform: 'instagram' },
        { id: '3', name: 'Carlos Antunes', lastMessage: 'Qual o valor do plano de 500mb?', time: '08:15', unread: 0, status: 'waiting', platform: 'whatsapp' },
        { id: '4', name: 'Ana Oliveira', lastMessage: 'Obrigada pelo atendimento!', time: 'Ontem', unread: 0, status: 'active', platform: 'web' },
    ];

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <div className="header-top">
                    <h2>Conversas</h2>
                    <button className="add-chat-btn flex-center" title="Novo contato ativo">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Filter size={18} className="filter-icon" />
                </div>

                <div className="status-filters">
                    <button className="filter-toggle active">Todos</button>
                    <button className="filter-toggle">Novos</button>
                    <button className="filter-toggle">Aguardando</button>
                </div>
            </div>

            <div className="chats-scroll-area">
                {mockChats.map((chat) => (
                    <div key={chat.id} className={`chat-card ${chat.unread > 0 ? 'unread' : ''}`}>
                        <div className="chat-avatar flex-center">
                            {chat.name.charAt(0)}
                            <div className={`platform-badge ${chat.platform}`}></div>
                        </div>

                        <div className="chat-content">
                            <div className="chat-name-row">
                                <span className="chat-name">{chat.name}</span>
                                <div className="chat-meta">
                                    <span className="chat-time">{chat.time}</span>
                                    {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
                                </div>
                            </div>
                            <p className="last-message">{chat.lastMessage}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatList;
