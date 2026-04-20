import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFrequentlyAccessedModules } from '../services/usageService';
import { globalSearch, SearchResult } from '../services/searchService';
import {
    SquaresFour,
    Gear,
    Lightning,
    CaretDoubleLeft,
    CaretDoubleRight,
    Sun,
    Moon,
    Feather,
    Hash,
    CurrencyDollar,
    Wrench,
    Globe,
    Headset,
    TrendUp,
    MagnifyingGlass,
    WarningCircle,
    ChartLine,
    SignOut,
    BookOpen,
    ChatCircleDots,
    Calendar,
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
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
    const { profile, signOut } = useAuth();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<{ id: string, top: number } | null>(null);
    const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Motor de Busca
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                const results = await globalSearch(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleResultClick = (result: SearchResult) => {
        setSearchQuery('');
        setSearchResults([]);
        if (result.type === 'lead') navigate(`/crm/lead/${result.id}`);
        else if (result.type === 'os') navigate(`/os/${result.id}`);
        else if (result.type === 'assinante') navigate(`/rede`);
    };

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
                label: 'OPERAÇÕES',
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
                    { id: '/agenda', icon: Calendar, label: 'Agenda Técnica' },
                    { id: '/rede', icon: Globe, label: 'Gestão de Rede' },
                    { id: '/ocorrencias', icon: WarningCircle, label: 'Ocorrências' },
                ]
            },
            {
                label: 'COMUNICAÇÃO',
                items: [
                    { id: '/connect', icon: ChatCircleDots, label: 'TITÃ Connect' },
                ]
            },
            {
                label: 'SISTEMA',
                items: [
                    { id: '/relatorios', icon: ChartLine, label: 'Analytics' },
                    { id: '/wiki', icon: BookOpen, label: 'Central Wiki' },
                    { id: '/ajustes', icon: Gear, label: 'Ajustes' },
                ]
            }
        ];

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

    const handleMouseEnter = (item: any, e: React.MouseEvent) => {
        if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        if (isRetracted && item.subItems) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredItem({ id: item.id, top: rect.top });
        }
    };

    const handleMouseLeave = () => {
        leaveTimerRef.current = setTimeout(() => {
            setHoveredItem(null);
        }, 150);
    };

    const renderMenuItem = (item: any) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.has(item.id);
        const isActive = isItemActive(item);
        const Icon = item.icon;

        return (
            <div
                key={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onMouseEnter={(e) => handleMouseEnter(item, e)}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className="sidebar-link"
                    onClick={() => {
                        if (hasSubItems && !isRetracted) toggleExpand(item.id);
                        else if (item.id?.startsWith('/')) navigate(item.id);
                    }}
                >
                    {Icon && <Icon size={22} weight={isActive ? "fill" : "regular"} />}
                    {!isRetracted && <span>{item.label}</span>}
                </div>

                {isRetracted && hasSubItems && hoveredItem?.id === item.id && (
                    <div
                        className="floating-menu"
                        style={{ top: hoveredItem.top, left: '78px' }}
                        onMouseEnter={() => { if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current); }}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="sidebar-section-label" style={{ margin: '0 0 10px 0' }}>{item.label}</div>
                        {item.subItems.map((sub: any) => (
                            <div key={sub.id} className="sidebar-submenu-item" onClick={() => navigate(sub.id)}>
                                {sub.label}
                            </div>
                        ))}
                    </div>
                )}

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
            {/* Header: Toggle and Theme Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                <button
                    onClick={onToggleRetraction}
                    style={{ background: 'none', border: 'none', color: 'var(--sb-text)', cursor: 'pointer' }}
                >
                    {isRetracted ? <CaretDoubleRight size={24} /> : <CaretDoubleLeft size={24} />}
                </button>

                {!isRetracted && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onToggleTheme}
                            title="Trocar Tema"
                            style={{ background: 'var(--sb-bg-item)', border: '1px solid var(--sb-border)', borderRadius: '10px', padding: '6px', color: 'var(--sb-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : theme === 'light' ? <Moon size={18} /> : <Feather size={18} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Global Search */}
            <div className="sidebar-search-container">
                <div
                    className="sidebar-search"
                    onClick={() => { if (isRetracted) onToggleRetraction(); }}
                >
                    <MagnifyingGlass size={18} />
                    {!isRetracted && (
                        <>
                            <input
                                placeholder="Busca global..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </>
                    )}
                </div>

                {!isRetracted && (searchResults.length > 0 || isSearching) && (
                    <div className="search-results-dropdown">
                        {isSearching ? (
                            <div className="search-loading">Buscando...</div>
                        ) : (
                            searchResults.map(result => (
                                <div key={result.id + result.type} className="search-result-item" onClick={() => handleResultClick(result)}>
                                    <span className="result-title">{result.title}</span>
                                    <span className="result-subtitle">{result.subtitle}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuGroups.map((group, idx) => (
                    <div key={idx} className="nav-group">
                        {!isRetracted && <div className="sidebar-section-label">{group.label}</div>}
                        {group.items.map(item => renderMenuItem(item))}
                    </div>
                ))}
            </nav>

            {/* Profile Footer */}
            <div className="sidebar-profile">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => navigate('/ajustes')}>
                    <img
                        src={`https://ui-avatars.com/api/?name=${profile?.fullName || 'User'}&background=${theme === 'dark' ? '2563eb' : '0f172a'}&color=fff`}
                        alt="Avatar"
                        className="profile-avatar"
                    />
                    {!isRetracted && (
                        <div className="profile-info">
                            <span className="profile-name">{profile?.fullName || 'Conectando...'}</span>
                            <span className="profile-role">{profile?.role || 'Usuário'}</span>
                        </div>
                    )}
                </div>
                {!isRetracted && (
                    <button
                        onClick={() => { if (window.confirm('Encerrar sessão?')) signOut(); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                        title="Sair"
                    >
                        <SignOut size={20} weight="bold" />
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
