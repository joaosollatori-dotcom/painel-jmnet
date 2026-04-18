import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, Plus } from '@phosphor-icons/react';
import { getConversations, Conversation } from '../services/chatService';
import './ChatList.css';

interface ChatListProps {
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onSelectChat }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()));
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.contact_name.toLowerCase().includes(search.toLowerCase())
    );

    const formatTime = (ts: string) => {
        const date = new Date(ts);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <aside className="chat-list">
            <div className="chat-list-header">
                <h1 className="chat-list-title">Conversas</h1>
                <div className="search-contacts">
                    <MagnifyingGlass size={18} />
                    <input
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="chat-filters">
                <span className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</span>
                <span className={`filter-chip ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Não lidas</span>
                <span className={`filter-chip ${filter === 'leads' ? 'active' : ''}`} onClick={() => setFilter('leads')}>Leads</span>
                <span className={`filter-chip ${filter === 'archived' ? 'active' : ''}`} onClick={() => setFilter('archived')}>Arquivadas</span>
            </div>

            <div className="conversations-scroll">
                {filteredConversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`conversation-item ${selectedChatId === conv.id ? 'active' : ''}`}
                        onClick={() => onSelectChat(conv.id)}
                    >
                        <div className="conv-avatar">
                            {conv.contact_name.charAt(0)}
                        </div>
                        <div className="conv-info">
                            <div className="conv-header">
                                <span className="conv-name">{conv.contact_name}</span>
                                <span className="conv-time">{conv.last_message_at ? formatTime(conv.last_message_at) : ''}</span>
                            </div>
                            <div className="conv-last-msg">
                                {conv.last_message || 'Inicie uma conversa'}
                            </div>
                            <div className="conv-tags">
                                <span className="tag-item">#WhatsApp</span>
                                {conv.ai_active && <span className="tag-item" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent)' }}>#TitãAI</span>}
                                {conv.unread_count > 0 && <span className="tag-item" style={{ background: '#991b1b', color: '#fff' }}>{conv.unread_count}</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredConversations.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        Nenhuma conversa encontrada.
                    </div>
                )}
            </div>
        </aside>
    );
};

export default ChatList;
