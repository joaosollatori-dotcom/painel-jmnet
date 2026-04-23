import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, Checks, Clock } from '@phosphor-icons/react';
import { getConversations, subscribeToConversations } from '../services/chatService';
import type { Conversation } from '../services/chatService';
import './ChatList.css';

interface ChatListProps {
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onSelectChat }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConversations();

        // Inscrição em tempo real para atualizações nas conversas
        const subscription = subscribeToConversations((updatedConv) => {
            setConversations(prev => {
                const index = prev.findIndex(c => c.id === updatedConv.id);
                if (index === -1) return [updatedConv, ...prev];
                const newConvs = [...prev];
                newConvs[index] = updatedConv;
                return newConvs.sort((a, b) =>
                    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                );
            });
        });

        return () => subscription.unsubscribe();
    }, [filter, searchTerm]); // Recarrega quando o filtro ou busca muda

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await getConversations({
                search: searchTerm,
                unreadOnly: filter === 'unread',
                status: 'active'
            });
            setConversations(data);
        } catch (err) {
            console.error('Erro ao carregar conversas:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (ts: string) => {
        const date = new Date(ts);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        return isToday
            ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <aside className="chat-list">
            <header className="chat-list-header">
                <h2 className="chat-list-title">Conversas</h2>
                <div className="search-contacts">
                    <MagnifyingGlass size={18} />
                    <input
                        placeholder="Buscar contatos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="chat-filters">
                <button
                    className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`filter-chip ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Não lidas
                </button>
            </div>

            <div className="conversations-scroll">
                {loading && conversations.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Carregando...</div>
                ) : conversations.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Nenhuma conversa encontrada</div>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${selectedChatId === conv.id ? 'active' : ''}`}
                            onClick={() => onSelectChat(conv.id)}
                        >
                            <div className="conv-avatar" style={{ background: conv.unread_count > 0 ? 'var(--accent)' : 'var(--bg-deep)', color: conv.unread_count > 0 ? '#fff' : 'inherit' }}>
                                {conv.contact_name.charAt(0)}
                            </div>
                            <div className="conv-info">
                                <div className="conv-header">
                                    <span className="conv-name">{conv.contact_name}</span>
                                    <span className="conv-time">{formatTime(conv.last_message_at)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p className="conv-last-msg">{conv.last_message || 'Inicie uma conversa'}</p>
                                    {conv.unread_count > 0 && (
                                        <div style={{
                                            background: 'var(--accent)',
                                            color: '#fff',
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            padding: '2px 6px',
                                            borderRadius: '10px'
                                        }}>
                                            {conv.unread_count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default ChatList;
