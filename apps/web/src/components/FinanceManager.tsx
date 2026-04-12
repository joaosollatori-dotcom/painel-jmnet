import React from 'react';
import { CurrencyDollar, ArrowUp, ArrowDown, Receipt, CreditCard, Bank, Calendar, WarningCircle, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { genericFilter } from '../utils/filterUtils';

const FinanceManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const invoices = [
        { id: 1, cliente: 'Assinante Exemplo 1', vencimento: '15/04/2026', valor: 'R$ 109,90', status: 'PAGO' },
        { id: 2, cliente: 'Assinante Exemplo 2', vencimento: '16/04/2026', valor: 'R$ 159,90', status: 'PENDENTE' },
        { id: 3, cliente: 'Empresa Alpha', vencimento: '20/04/2026', valor: 'R$ 450,00', status: 'PAGO' },
        { id: 4, cliente: 'Condomínio Solar', vencimento: '22/04/2026', valor: 'R$ 2.100,00', status: 'ATRASADO' },
        { id: 5, cliente: 'João Silva', vencimento: '25/04/2026', valor: 'R$ 89,90', status: 'PAGO' },
    ];

    const filteredInvoices = genericFilter(invoices, searchTerm);

    const stats = [
        { label: 'MRR (Mensalidade)', value: 'R$ 142.500,00', icon: CurrencyDollar, trend: '+8%', color: '#10b981' },
        { label: 'Inadimplência', value: '4.2%', icon: WarningCircle, trend: '-0.5%', color: '#ef4444' },
        { label: 'Recebido (Hoje)', value: 'R$ 12.430,00', icon: Bank, trend: '+15%', color: '#3b82f6' },
        { label: 'NFSe Emitidas', value: '1.240', icon: Receipt, trend: '+2%', color: 'var(--accent)' },
    ];

    return (
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Gestão Financeira</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Controle de faturas, conciliação PIX e emissão de notas fiscais.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '3rem' }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ background: `${s.color}15`, color: s.color, padding: '10px', borderRadius: 'var(--radius-md)' }}>
                                <s.icon size={24} weight="fill" />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: s.color, fontWeight: 700, padding: '4px 8px', borderRadius: '999px', background: `${s.color}10` }}>
                                {s.trend}
                            </span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.label}</span>
                            <h2 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{s.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        placeholder="Buscar em faturas, clientes, valores ou status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 44px', borderRadius: '8px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff'
                        }}
                    />
                </div>
                <button className="flex-center" style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#aaa', cursor: 'pointer' }}>
                    <Funnel size={20} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>Últimas Faturas</h3>
                        <button style={{ color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Ver tudo</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '12px 0' }}>CLIENTE</th>
                                <th style={{ padding: '12px 0' }}>VENCIMENTO</th>
                                <th style={{ padding: '12px 0' }}>VALOR</th>
                                <th style={{ padding: '12px 0' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.9rem' }}>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px 0' }}>{inv.cliente}</td>
                                    <td style={{ padding: '16px 0' }}>{inv.vencimento}</td>
                                    <td style={{ padding: '16px 0' }}>{inv.valor}</td>
                                    <td style={{ padding: '16px 0' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '999px',
                                            background: inv.status === 'PAGO' ? '#10b98120' : inv.status === 'ATRASADO' ? '#ef444420' : '#f59e0b20',
                                            color: inv.status === 'PAGO' ? '#10b981' : inv.status === 'ATRASADO' ? '#ef4444' : '#f59e0b',
                                            fontSize: '0.75rem', fontWeight: 700
                                        }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Ferramentas Rápidas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button style={{ padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <CreditCard size={20} color="var(--accent)" />
                            <span>Gerar Boleto Avulso</span>
                        </button>
                        <button style={{ padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <Calendar size={20} color="var(--accent)" />
                            <span>Prorrogar Vencimentos</span>
                        </button>
                        <button style={{ padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <Receipt size={20} color="var(--accent)" />
                            <span>Importar Arquivo Remessa</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceManager;
