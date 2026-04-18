import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFrequentlyAccessedModules } from '../services/usageService';
import {
    SquaresFour,
    Gear,
    Users,
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
    MagnifyingGlass,
    WarningCircle,
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
    open: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
    closed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { isRetracted, onToggleRetraction, theme, onToggleTheme } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setExpandedItems(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const menuGroups = useMemo(() => {
        const frequent = getFrequentlyAccessedModules();
        const baseGroups = [
            {
                label: 'MAIN',
                items: [
                    { id: '/dashboard', icon: SquaresFour, label: 'Dashboard' },
                    {
                        id: 'atendimento_module', icon: Headset, label: 'Atendimento',
                        subItems: [
                            { id: '/atendimento', label: 'Central de Chat' },
                            { id: '/agentes', label: 'Robôs Titã AI' },
                        ]
                    },
                ]
            },
            {
                label: 'ISPs OPERATIONS',
                items: [
                    {
                        id: 'crm_group', icon: TrendUp, label: 'CRM de Leads',
                        subItems: [
                            { id: '/crm', label: 'Gestão de Leads' },
                            { id: '/kanban', label: 'Funil Kanban' },
                            { id: '/crm_tasks', label: 'Agendas' },
                        ]
                    },
                    { id: '/financeiro', icon: CurrencyDollar, label: 'Financeiro' },
                    { id: '/os', icon: Wrench, label: 'Ordens de Serviço' },
                    { id: '/rede', icon: Globe, label: 'Gestão de Rede' },
                    { id: '/ocorrencias', icon: WarningCircle, label: 'Ocorrências' },
                ]
            },
            {
                label: 'SISTEMA',
                items: [
                    { id: '/relatorios', icon: ChartLine, label: 'Insights & Analytics' },
                    { id: '/ajustes', icon: Gear, label: 'Configurações' },
                ]
            }
        ];

        // Se houver módulos frequentes, coloca no topo como "INSIGHTS"
        if (frequent.length > 0) {
            const frequentItems: any[] = [];
            baseGroups.forEach(g => g.items.forEach(i => { if (frequent.includes(i.id)) frequentItems.push(i) }));
            if (frequentItems.length > 0) {
                return [{ label: 'FREQUENTES', items: frequentItems.slice(0, 3) }, ...baseGroups];
            }
        }
        return baseGroups;
    }, []);

    const isItemActive = (item: any): boolean => {
        if (item.id === location.pathname) return true;
        if (item.subItems) return item.subItems.some((s: any) => isItemActive(s));
        return false;
    };

    const renderMenuItem = (item: any, depth = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.has(item.id);
        const isActive = isItemActive(item);
        const Icon = item.icon;

        return (
            <div key={item.id} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <div
                    className="sidebar-link"
                    onClick={() => {
                        if (hasSubItems && !isRetracted) toggleExpand(item.id);
                        else if (item.id?.startsWith('/')) navigate(item.id);
                    }}
                >
                    {Icon && <Icon size={22} weight={isActive ? "fill" : "regular"} />}
                    {!isRetracted && <span>{item.label}</span>}

                    {/* Floating Menu for retracted mode */}
                    {isRetracted && hasSubItems && (
                        <div className="floating-menu">
                            <div className="sidebar-section-label" style={{ margin: '0 0 10px 0' }}>{item.label}</div>
                            {item.subItems.map((sub: any) => (
                                <div key={sub.id} className="sidebar-submenu-item" onClick={() => navigate(sub.id)}>
                                    {sub.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {!isRetracted && hasSubItems && isExpanded && (
                        <motion.div
                            className="sidebar-submenu"
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={accordionVariants}
                        >
                            {item.subItems.map((sub: any) => (
                                <div
                                    key={sub.id}
                                    className={`sidebar-submenu-item ${location.pathname === sub.id ? 'active' : ''}`}
                                    onClick={() => navigate(sub.id)}
                                >
                                    {sub.label}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <aside className={`sidebar ${isRetracted ? 'retracted' : ''}`}>
            {/* Header / Search */}
            <div className="sidebar-search-container">
                <div className="sidebar-search" onClick={onToggleRetraction}>
                    <MagnifyingGlass size={18} />
                    {!isRetracted && (
                        <>
                            <input
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="search-shortcut">⌘ S</div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuGroups.map((group, idx) => (
                    <div key={idx}>
                        {!isRetracted && <div className="sidebar-section-label">{group.label}</div>}
                        {group.items.map(item => renderMenuItem(item))}
                    </div>
                ))}
            </nav>

            {/* Bottom Actions & Profile */}
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!isRetracted && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button className="sidebar-search" style={{ padding: '8px', flex: 1 }} onClick={onToggleTheme}>
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className="sidebar-search" style={{ padding: '8px' }} onClick={onToggleRetraction}>
                            {isRetracted ? <CaretDoubleRight size={18} /> : <CaretDoubleLeft size={18} />}
                        </button>
                    </div>
                )}

                <div className="sidebar-profile" onClick={() => navigate('/ajustes')}>
                    <img
                        src="https://ui-avatars.com/api/?name=Joao+Sollatori&background=2563eb&color=fff"
                        alt="Avatar"
                        className="profile-avatar"
                    />
                    {!isRetracted && (
                        <div className="profile-info">
                            <span className="profile-name">João Sollatori</span>
                            <span className="profile-role">Administrador</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
