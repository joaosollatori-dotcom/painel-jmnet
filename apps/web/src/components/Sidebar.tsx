import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SquaresFour,
    Gear,
    Users,
    SignOut,
    Lightning,
    CaretDoubleLeft,
    CaretDoubleRight,
    Sun,
    Moon,
    Hash,
    CurrencyDollar,
    Wrench,
    Package,
    Globe,
    Headset,
    TrendUp,
    CaretRight,
    WarningCircle,
    User,
    ChartLine,
    Palette
} from '@phosphor-icons/react';
import './Sidebar.css';

interface SidebarProps {
    isRetracted: boolean;
    onToggleRetraction: () => void;
    theme: 'light' | 'dark' | 'soft';
    finish: 'matte' | 'glossy';
    onToggleTheme: () => void;
    onToggleFinish: () => void;
}

const accordionVariants = {
    open: { height: 'auto', opacity: 1, transition: { duration: 0.22, ease: "easeInOut" } },
    closed: { height: 0, opacity: 0, transition: { duration: 0.18, ease: "easeInOut" } }
};

const Sidebar: React.FC<SidebarProps> = ({ isRetracted, onToggleRetraction, theme, finish, onToggleTheme, onToggleFinish }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [statusStartTime] = React.useState<number>(Date.now());
    const [, setTimer] = React.useState('00:00:00');
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
        new Set(['ATENDIMENTO', 'COMERCIAL & VENDAS', 'OPERAÇÕES', 'INFRAESTRUTURA', 'SUPORTE & LEGAL'])
    );

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setExpandedItems(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const menuGroups = [
        {
            label: 'ATENDIMENTO',
            items: [
                { id: '/atendimento', icon: Headset, label: 'Atendimento Central' },
                { id: '/interno', icon: Hash, label: 'Comunicação Interna' },
                { id: '/agentes', icon: Lightning, label: 'Agentes Inteligentes' },
            ]
        },
        {
            label: 'COMERCIAL & VENDAS',
            items: [
                {
                    id: 'crm_module', icon: TrendUp, label: 'CRM de Leads',
                    subItems: [
                        { id: '/crm', label: 'Gestão de Leads' },
                        { id: '/crm_tasks', label: 'Agendamentos' },
                        { id: '/crm_contratos', label: 'Contratos' },
                    ]
                },
                {
                    id: 'clientes', icon: Users, label: 'Base de Clientes',
                    subItems: [{ id: '/client_search', label: 'Consultar Cliente' }]
                },
                { id: '/kanban', icon: SquaresFour, label: 'Funil Kanban' },
                { id: '/automacoes', icon: Lightning, label: 'Automações' },
                { id: '/relatorios', icon: ChartLine, label: 'Relatórios' },
            ]
        },
        {
            label: 'OPERAÇÕES',
            items: [
                {
                    id: 'financeiro_group', icon: CurrencyDollar, label: 'Financeiro',
                    subItems: [{ id: '/financeiro', label: 'Gestão Financeira' }]
                },
                { id: '/os', icon: Wrench, label: 'Ordens de Serviço' },
                { id: '/ocorrencias', icon: WarningCircle, label: 'Ocorrências' },
                { id: '/estoque', icon: Package, label: 'Estoque de Rede' },
            ]
        },
        {
            label: 'INFRAESTRUTURA',
            items: [
                { id: '/dashboard', icon: TrendUp, label: 'Dashboard Resumo' },
                { id: '/rede', icon: Globe, label: 'Topologia de Rede' },
            ]
        },
        {
            label: 'SUPORTE & LEGAL',
            items: [
                { id: '/ajustes', icon: Gear, label: 'Ajustes de Conta' },
                { id: '/privacy', icon: WarningCircle, label: 'Privacidade' },
            ]
        }
    ];

    const isItemActive = (item: any): boolean => {
        if (item.id?.startsWith('/') && location.pathname.startsWith(item.id)) return true;
        if (item.subItems) return item.subItems.some((s: any) => isItemActive(s));
        return false;
    };

    const renderMenuItem = (item: any, depth = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.has(item.id);
        const isActive = isItemActive(item);

        return (
            <div key={item.id} className="nav-item-container">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    className={`nav-item ${isActive ? 'active' : ''} ${depth > 0 ? 'sub-item' : ''}`}
                    onClick={() => {
                        if (hasSubItems && !isRetracted) toggleExpand(item.id);
                        else if (item.id?.startsWith('/')) navigate(item.id);
                    }}
                    title={item.label}
                    style={{ paddingLeft: !isRetracted ? `${depth * 16 + 16}px` : undefined }}
                >
                    {item.icon
                        ? <item.icon size={22} weight={isActive ? 'fill' : 'regular'} className="nav-icon" />
                        : depth > 0 && !isRetracted && <div className="sub-item-bullet" />
                    }
                    {!isRetracted && (
                        <>
                            <span className="nav-label">{item.label}</span>
                            {hasSubItems && (
                                <motion.div
                                    className="expand-icon-wrapper"
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    onClick={e => { e.stopPropagation(); toggleExpand(item.id); }}
                                >
                                    <CaretRight size={13} />
                                </motion.div>
                            )}
                        </>
                    )}
                </motion.button>

                <AnimatePresence initial={false}>
                    {hasSubItems && isExpanded && !isRetracted && (
                        <motion.div
                            className="sub-items-container"
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={accordionVariants}
                            style={{ overflow: 'hidden' }}
                        >
                            {item.subItems.map((sub: any) => renderMenuItem(sub, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    React.useEffect(() => {
        const iv = setInterval(() => {
            const diff = Date.now() - statusStartTime;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimer(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(iv);
    }, [statusStartTime]);

    return (
        <aside className={`sidebar ${isRetracted ? 'retracted' : 'expanded'}`}>
            <div className="sidebar-header">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ backgroundColor: 'var(--border)' }}
                    className="toggle-btn"
                    onClick={onToggleRetraction}
                    title={isRetracted ? 'Expandir' : 'Recolher'}>
                    {isRetracted ? <CaretDoubleRight size={20} /> : <CaretDoubleLeft size={20} />}
                </motion.button>
                {!isRetracted && <span className="logo-text">TITÃ</span>}
            </div>

            <nav className="sidebar-nav ic-sidebar-scroll">
                {menuGroups.map((group, gIdx) => {
                    const isGroupExpanded = expandedItems.has(group.label);
                    return (
                        <div key={gIdx} className="nav-group">
                            {!isRetracted && (
                                <motion.div
                                    className="nav-group-header"
                                    onClick={() => toggleExpand(group.label)}
                                    whileTap={{ opacity: 0.7 }}
                                >
                                    <span className="nav-group-label">{group.label}</span>
                                    <motion.div
                                        className="group-expand-icon"
                                        animate={{ rotate: isGroupExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <CaretRight size={13} />
                                    </motion.div>
                                </motion.div>
                            )}
                            <AnimatePresence initial={false}>
                                {(isRetracted || isGroupExpanded) && (
                                    <motion.div
                                        key={group.label + '-items'}
                                        initial={isRetracted ? false : 'closed'}
                                        animate="open"
                                        exit="closed"
                                        variants={accordionVariants}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        {group.items.map(item => renderMenuItem(item))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="footer-toolbar">
                    {!isRetracted && (
                        <button className={`footer-item ${finish === 'matte' ? 'active' : ''}`} onClick={onToggleFinish}
                            title={finish === 'matte' ? 'Ativar Brilho' : 'Ativar Fosco'}>
                            <Lightning size={22} weight={finish === 'matte' ? 'fill' : 'duotone'} />
                        </button>
                    )}

                    {!isRetracted && (
                        <button className="footer-item" onClick={onToggleTheme}
                            title={theme === 'dark' ? 'Modo Claro' : theme === 'light' ? 'Modo Soft' : 'Modo Escuro'}>
                            {theme === 'dark' ? <Sun size={22} weight="duotone" /> : theme === 'light' ? <Moon size={22} weight="duotone" /> : <Palette size={22} weight="duotone" />}
                        </button>
                    )}

                    <button className="footer-item" title="Ajustes" onClick={() => navigate('/ajustes')}>
                        {isRetracted ? <User size={22} weight="duotone" /> : <Gear size={22} weight="duotone" />}
                    </button>

                    {!isRetracted && (
                        <button className="footer-item logout" title="Sair"
                            onClick={() => { if (window.confirm('Deseja sair do TITA?')) window.location.reload(); }}>
                            <SignOut size={22} weight="duotone" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
