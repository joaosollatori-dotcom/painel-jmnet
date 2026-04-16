import React from 'react';
import { CurrencyDollar, ArrowUp, ArrowDown, Receipt, CreditCard, Bank, Calendar, WarningCircle, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { genericFilter } from '../utils/filterUtils';
import './FinanceManager.css';

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
        <div className="finance-container">
            <header className="finance-header">
                <h1>Gestão Financeira</h1>
                <p>Controle de faturas, conciliação PIX e emissão de notas fiscais.</p>
            </header>

            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                                <s.icon size={24} weight="fill" />
                            </div>
                            <span className="stat-trend" style={{ color: s.color, background: `${s.color}10` }}>
                                {s.trend}
                            </span>
                        </div>
                        <div>
                            <span className="stat-label">{s.label}</span>
                            <h2 className="stat-value">{s.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="search-filter-row">
                <div className="search-input-wrapper">
                    <MagnifyingGlass size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar em faturas, clientes, valores ou status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button className="flex-center filter-btn">
                    <Funnel size={20} />
                </button>
            </div>

            <div className="finance-main-grid">
                <div className="finance-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Últimas Faturas</h3>
                        <button className="btn-view-all">Ver tudo</button>
                    </div>
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>CLIENTE</th>
                                <th>VENCIMENTO</th>
                                <th>VALOR</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.cliente}</td>
                                    <td>{inv.vencimento}</td>
                                    <td>{inv.valor}</td>
                                    <td>
                                        <span className="status-badge" style={{
                                            background: inv.status === 'PAGO' ? '#10b98120' : inv.status === 'ATRASADO' ? '#ef444420' : '#f59e0b20',
                                            color: inv.status === 'PAGO' ? '#10b981' : inv.status === 'ATRASADO' ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="finance-panel">
                    <h3 className="panel-title" style={{ marginBottom: '1.5rem' }}>Ferramentas Rápidas</h3>
                    <div className="quick-tools">
                        <button className="tool-btn">
                            <CreditCard size={20} color="var(--accent)" />
                            <span>Gerar Boleto Avulso</span>
                        </button>
                        <button className="tool-btn">
                            <Calendar size={20} color="var(--accent)" />
                            <span>Prorrogar Vencimentos</span>
                        </button>
                        <button className="tool-btn">
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
