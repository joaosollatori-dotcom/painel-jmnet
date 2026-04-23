import React, { useState } from 'react';
import { Hash, Plus, Paperclip, Smiley, PaperPlaneTilt, UsersThree, Bell, MagnifyingGlass, UserCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const CHANNELS = ['geral', 'técnicos-campo', 'suporte-nível2', 'administrativo'];
const MOCK_TEAM_MSGS = [
    { id: 1, sender: 'Carlos Técnico', text: 'Chegando no cliente João Silva para a OS de reparo.', time: '10:05' },
    { id: 2, sender: 'Mariana (SAC)', text: 'Ok Carlos, ele avisou que o interfone está com defeito.', time: '10:07' },
    { id: 3, sender: 'Admin', text: 'Lembrem de anexar a foto da CTO finalizada.', time: '10:10' },
];

const InternalChatPreview: React.FC = () => {
    const [selectedChannel, setSelectedChannel] = useState('geral');

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100%', background: 'var(--bg-deep)' }}>
            {/* Sidebar de Canais */}
            <div style={{ background: 'rgba(0,0,0,0.05)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
                <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>TITÃ CONNECT</h3>
                    <Bell size={18} opacity={0.6} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ padding: '0 1.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Canais</div>
                    {CHANNELS.map(ch => (
                        <div
                            key={ch}
                            onClick={() => setSelectedChannel(ch)}
                            style={{
                                padding: '10px 1.5rem', display: 'flex', alignItems: 'center', gap: '10px',
                                cursor: 'pointer', fontSize: '0.9rem',
                                background: selectedChannel === ch ? 'var(--accent)' : 'transparent',
                                color: selectedChannel === ch ? '#fff' : 'inherit',
                                opacity: selectedChannel === ch ? 1 : 0.7
                            }}
                        >
                            <Hash size={16} /> {ch}
                        </div>
                    ))}
                    <div style={{ padding: '12px 1.5rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 }}>
                        <Plus size={16} /> Criar canal
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>JS</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>João Sollatori</div>
                </div>
            </div>

            {/* Area de Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
                <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                        <Hash size={18} /> {selectedChannel}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <MagnifyingGlass size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input className="wiki-search-input" placeholder="Buscar no canal..." style={{ width: '200px', padding: '6px 6px 6px 32px', fontSize: '0.8rem' }} />
                    </div>
                </header>

                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {MOCK_TEAM_MSGS.map(msg => (
                        <div key={msg.id} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCircle size={24} opacity={0.6} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{msg.sender}</span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{msg.time}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.9 }}>{msg.text}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid var(--border)', padding: '12px' }}>
                        <textarea
                            placeholder={`Enviar mensagem em #${selectedChannel}`}
                            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', height: '60px', fontSize: '0.9rem', color: 'inherit' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{ background: 'none', border: 'none', color: 'inherit', padding: '4px', cursor: 'pointer', opacity: 0.6 }} title="Anexar arquivo">
                                    <Paperclip size={20} />
                                </button>
                                <button style={{ background: 'none', border: 'none', color: 'inherit', padding: '4px', cursor: 'pointer', opacity: 0.6 }}>
                                    <Smiley size={20} />
                                </button>
                            </div>
                            <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '4px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PaperPlaneTilt size={18} weight="fill" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternalChatPreview;
