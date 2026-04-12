import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, User, MapPin, CheckCircle } from '@phosphor-icons/react';

interface OS {
    id: string;
    tipo: string;
    status: string;
    descricao: string;
    prioridade: string;
    dataAgendamento?: string;
    assinante: {
        nome: string;
        enderecos: Array<{
            logradouro: string;
            numero: string;
        }>
    };
}

const OSManager: React.FC = () => {
    const [oss, setOss] = useState<OS[]>([]);

    useEffect(() => {
        const mockOS: OS[] = [
            {
                id: '1',
                tipo: 'INSTALACAO',
                status: 'ABERTA',
                descricao: 'Instalação de fibra 500mb',
                prioridade: 'ALTA',
                assinante: {
                    nome: 'Marcos Oliveira',
                    enderecos: [{ logradouro: 'Rua das Flores', numero: '123' }]
                }
            },
            {
                id: '2',
                tipo: 'REPARO',
                status: 'EM_EXECUCAO',
                descricao: 'Sem sinal de internet',
                prioridade: 'URGENTE',
                dataAgendamento: new Date().toISOString(),
                assinante: {
                    nome: 'Ana Paula',
                    enderecos: [{ logradouro: 'Av Central', numero: '500' }]
                }
            }
        ];
        setOss(mockOS);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ABERTA': return '#3b82f6';
            case 'EM_EXECUCAO': return '#f59e0b';
            case 'FINALIZADA': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', background: 'var(--bg-main)' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Ordens de Serviço</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerenciamento de campo e agendamento técnico.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {oss.map(os => (
                    <div key={os.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px', background: `${getStatusColor(os.status)}20`, color: getStatusColor(os.status), fontWeight: 700 }}>{os.status}</span>
                            <span style={{ color: os.prioridade === 'URGENTE' ? '#ef4444' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>{os.prioridade}</span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem' }}>{os.tipo}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{os.descricao}</p>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <User size={16} />
                                <strong>{os.assinante.nome}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <MapPin size={16} />
                                <span>{os.assinante.enderecos[0].logradouro}, {os.assinante.enderecos[0].numero}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={16} />
                                <span>{os.dataAgendamento ? new Date(os.dataAgendamento).toLocaleDateString() : 'Não agendado'}</span>
                            </div>
                            <button style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>Gerenciar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OSManager;
