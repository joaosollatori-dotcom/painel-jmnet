import React, { useState, useEffect } from 'react';
import {
    Wallet, TrendUp, TrendDown,
    ArrowsClockwise, Bank, Receipt,
    Plus, DotsThreeVertical, ChartPieSlice,
    Eye, EyeSlash, CheckCircle, Clock
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
// Pluggy Connect é carregado via CDN no index.html (window.PluggyConnect)
import { getPluggyConnectToken, getFaturasSummary } from '../services/financeiroService';
import { useToast } from '../contexts/ToastContext';

const FinanceManager: React.FC = () => {
    const { showToast } = useToast();
    const [showValues, setShowValues] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'conciliation'>('overview');
    const [faturas, setFaturas] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getFaturasSummary();
            setFaturas(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleConnectBank = async () => {
        try {
            showToast('Gerando token de conexão segura...', 'info');
            const token = await getPluggyConnectToken();
            const PluggyConnect = (window as any).PluggyConnect;
            if (!PluggyConnect) {
                showToast('SDK do Pluggy não carregado', 'error');
                return;
            }
            const pluggyConnect = new PluggyConnect({
                connectToken: token,
                includeSandbox: true,
                onSuccess: (itemData: any) => {
                    showToast('Banco conectado com sucesso!', 'success');
                    console.log('Open Finance Success:', itemData);
                },
                onError: (error: any) => {
                    showToast('Falha na conexão bancária', 'error');
                    console.error('Open Finance Error:', error);
                }
            });
            pluggyConnect.init();
        } catch (err) {
            showToast('Erro ao iniciar Open Finance', 'error');
        }
    };

    return (
        <div style={{ padding: '32px', height: '100%', overflowY: 'auto', background: 'var(--bg-deep)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Wallet weight="fill" color="var(--accent)" /> Fluxo Financeiro
                    </h1>
                    <p style={{ opacity: 0.6, marginTop: '4px' }}>Gestão de recebíveis e conciliação Open Finance</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowValues(!showValues)}
                        className="wiki-cat-btn"
                    >
                        {showValues ? <EyeSlash /> : <Eye />} {showValues ? 'Ocultar' : 'Mostrar'} Valores
                    </button>
                    <button
                        onClick={handleConnectBank}
                        style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '14px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 8px 16px rgba(var(--accent-rgb), 0.3)'
                        }}
                    >
                        <Bank weight="bold" /> Conectar Banco
                    </button>
                </div>
            </header>

            {/* Widgets de Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Saldo Conciliado', value: 'R$ 124.502,30', icon: Bank, color: 'var(--accent)', trend: '+12%' },
                    { label: 'Recebimentos (Mês)', value: 'R$ 45.200,00', icon: TrendUp, color: '#10b981', trend: '+5%' },
                    { label: 'Inadimplência', value: 'R$ 3.410,00', icon: TrendDown, color: '#ef4444', trend: '-2%' },
                    { label: 'Aguardando Pagto', value: 'R$ 12.800,00', icon: Clock, color: '#f59e0b', trend: 'stable' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'var(--bg-surface)',
                                padding: '24px',
                                borderRadius: '24px',
                                border: '1px solid var(--border)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
                                    <Icon size={24} weight="fill" />
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: stat.trend.startsWith('+') ? '#10b981' : stat.trend.startsWith('-') ? '#ef4444' : 'var(--text-secondary)',
                                    background: stat.trend.startsWith('+') ? '#10b98115' : stat.trend.startsWith('-') ? '#ef444415' : '#8881',
                                    padding: '4px 8px',
                                    borderRadius: '8px',
                                    alignSelf: 'flex-start'
                                }}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6 }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px', filter: showValues ? 'none' : 'blur(8px)' }}>
                                {stat.value}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Conteúdo Principal */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div style={{ background: 'var(--bg-surface)', borderRadius: '28px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '24px' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                background: 'none', border: 'none', padding: '8px 0',
                                borderBottom: activeTab === 'overview' ? '3px solid var(--accent)' : '3px solid transparent',
                                fontWeight: 800, color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Últimas Transações
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            style={{
                                background: 'none', border: 'none', padding: '8px 0',
                                borderBottom: activeTab === 'invoices' ? '3px solid var(--accent)' : '3px solid transparent',
                                fontWeight: 800, color: activeTab === 'invoices' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Faturas Emitidas
                        </button>
                    </div>

                    <div style={{ padding: '24px' }}>
                        {activeTab === 'overview' ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', opacity: 0.4, fontSize: '0.75rem', fontWeight: 800 }}>
                                        <th style={{ padding: '12px' }}>DATA</th>
                                        <th style={{ padding: '12px' }}>DESCRIÇÃO</th>
                                        <th style={{ padding: '12px' }}>CATEGORIA</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>VALOR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { date: 'Hoje, 14:20', desc: 'Mensalidade - João Silva', cat: 'Internet', val: '+ R$ 99,90', type: 'in' },
                                        { date: 'Hoje, 10:05', desc: 'Amazon Web Services', cat: 'Infra', val: '- R$ 1.250,00', type: 'out' },
                                        { date: 'Ontem', desc: 'Instalação - Maria Souza', cat: 'Serviço', val: '+ R$ 150,00', type: 'in' },
                                        { date: 'Ontem', desc: 'Equipe Técnica - Combustível', cat: 'Operação', val: '- R$ 340,00', type: 'out' },
                                        { date: '18 Abr', desc: 'Mensalidade - Pedro Alves', cat: 'Internet', val: '+ R$ 99,90', type: 'in' },
                                    ].map((tx, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '16px 12px', fontSize: '0.85rem', fontWeight: 600 }}>{tx.date}</td>
                                            <td style={{ padding: '16px 12px', fontWeight: 800 }}>{tx.desc}</td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--bg-deep)', padding: '4px 8px', borderRadius: '6px' }}>
                                                    {tx.cat.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: '16px 12px',
                                                textAlign: 'right',
                                                fontWeight: 900,
                                                color: tx.type === 'in' ? '#10b981' : '#ef4444',
                                                filter: showValues ? 'none' : 'blur(8px)'
                                            }}>
                                                {tx.val}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                <Receipt size={48} weight="light" />
                                <p>Nenhuma fatura encontrada no período selecionado</p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Gráfico de Pizza / Categorias */}
                    <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '28px', border: '1px solid var(--border)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ChartPieSlice weight="fill" color="var(--accent)" /> Gastos por Categoria
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { name: 'Infraestrutura', val: '45%', color: 'var(--accent)' },
                                { name: 'Marketing', val: '25%', color: '#8b5cf6' },
                                { name: 'Equipe', val: '20%', color: '#3b82f6' },
                                { name: 'Outros', val: '10%', color: '#94a3b8' },
                            ].map((cat, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px' }}>
                                        <span>{cat.name}</span>
                                        <span>{cat.val}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: cat.val }} style={{ height: '100%', background: cat.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bancos Conectados */}
                    <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '28px', border: '1px solid var(--border)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bank weight="fill" color="var(--accent)" /> Contas Conectadas
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ec6b1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>IT</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Itaú Unibanco</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Atualizado há 10 min</div>
                                </div>
                                <CheckCircle weight="fill" color="#10b981" />
                            </div>
                            <button
                                onClick={handleConnectBank}
                                style={{
                                    padding: '16px', border: '2px dashed var(--border)', background: 'none',
                                    borderRadius: '16px', color: 'var(--text-secondary)', fontWeight: 800,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Plus weight="bold" /> Adicionar Conta
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget Pluggy Connect é lançado imperativamente via window.PluggyConnect.init() */}
        </div>
    );
};

export default FinanceManager;
