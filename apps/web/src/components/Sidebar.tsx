import React from 'react';
import { useLocation, useNavigate, useMatch } from 'react-router-dom';
import {
    ChatCircleDots,
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
    MapTrifold,
    Headset,
    ShoppingCart,
    TrendUp,
    CaretDown,
    CaretRight,
    Clock,
    WarningCircle
} from '@phosphor-icons/react';
import './Sidebar.css';

interface SidebarProps {
    isRetracted: boolean;
    onToggleRetraction: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isRetracted,
    onToggleRetraction,
    theme,
    onToggleTheme
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [status, setStatus] = React.useState<'Online' | 'Banheiro' | 'Almoço' | 'Offline'>('Online');
    const [statusStartTime, setStatusStartTime] = React.useState<number>(Date.now());
    const [timer, setTimer] = React.useState('00:00:00');
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set(['GESTÃO', 'COMERCIAL & VENDAS', 'ATENDIMENTO']));

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
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
                    id: 'crm_module',
                    icon: TrendUp,
                    label: 'CRM de Leads',
                    subItems: [
                        { id: '/crm', label: 'Gestão de Leads' },
                        { id: '/crm_tasks', label: 'Agendamentos' }, // Placeholder
                        { id: '/crm_contratos', label: 'Contratos' }, // Placeholder
                    ]
                },
                {
                    id: 'clientes',
                    icon: Users,
                    label: 'Base de Clientes',
                    subItems: [
                        { id: '/client_search', label: 'Consultar Cliente' },
                    ]
                },
                { id: '/kanban', icon: SquaresFour, label: 'Funil Kanban' },
            ]
        },
        {
            label: 'OPERAÇÕES',
            items: [
                {
                    id: 'financeiro_group',
                    icon: CurrencyDollar,
                    label: 'Financeiro',
                    subItems: [
                        { id: '/financeiro', label: 'Gestão Financeira' },
                    ]
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
        }
    ];

    const isItemActive = (item: any): boolean => {
        if (location.pathname.startsWith(item.id)) return true;
        if (item.subItems) {
            return item.subItems.some((subItem: any) => isItemActive(subItem));
        }
        return false;
    };

    const renderMenuItem = (item: any, depth = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.has(item.id);
        const isActive = isItemActive(item);

        return (
            <div key={item.id} className="nav-item-container">
                <button
                    className={`nav-item ${isActive ? 'active' : ''} ${depth > 0 ? 'sub-item' : ''}`}
                    onClick={() => {
                        if (hasSubItems && !isRetracted) {
                            toggleExpand(item.id, { stopPropagation: () => { } } as any);
                        } else if (item.id.startsWith('/')) {
                            navigate(item.id);
                        }
                    }}
                    title={item.label}
                    style={{ paddingLeft: !isRetracted ? `${depth * 16 + 16}px` : undefined }}
                >
                    {item.icon ? (
                        <item.icon size={22} weight={isActive ? "fill" : "regular"} className="nav-icon" />
                    ) : (
                        depth > 0 && !isRetracted && <div className="sub-item-bullet" />
                    )}
                    {!isRetracted && (
                        <>
                            <span className="nav-label">{item.label}</span>
                            {hasSubItems && (
                                <div className="expand-icon-wrapper" onClick={(e) => toggleExpand(item.id, e)}>
                                    {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                                </div>
                            )}
                        </>
                    )}
                </button>
                {hasSubItems && isExpanded && !isRetracted && (
                    <div className="sub-items-container">
                        {item.subItems.map((subItem: any) => renderMenuItem(subItem, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            const diff = Date.now() - statusStartTime;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimer(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [statusStartTime]);

    return (
        <aside className={`sidebar ${isRetracted ? 'retracted' : 'expanded'}`}>
            <div className="sidebar-header">
                <button className="toggle-btn" onClick={onToggleRetraction} title={isRetracted ? "Expandir" : "Recolher"}>
                    {isRetracted ? <CaretDoubleRight size={20} /> : <CaretDoubleLeft size={20} />}
                </button>
                {!isRetracted && <span className="logo-text">TITÃ</span>}
            </div>

            <nav className="sidebar-nav ic-sidebar-scroll">
                {menuGroups.map((group, gIdx) => {
                    const isGroupExpanded = expandedItems.has(group.label);
                    return (
                        <div key={gIdx} className="nav-group">
                            {!isRetracted && (
                                <div
                                    className="nav-group-header"
                                    onClick={(e) => toggleExpand(group.label, e)}
                                >
                                    <span className="nav-group-label">{group.label}</span>
                                    <div className="group-expand-icon">
                                        {isGroupExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                                    </div>
                                </div>
                            )}
                            {(!isRetracted ? isGroupExpanded : true) && (
                                group.items.map((item) => renderMenuItem(item))
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="footer-toolbar">
                    <button className="footer-item" onClick={onToggleTheme} title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}>
                        {theme === 'dark' ? <Sun size={22} weight="duotone" /> : <Moon size={22} weight="duotone" />}
                    </button>
                    <button className="footer-item" title="Ajustes" onClick={() => navigate('/ajustes')}>
                        <Gear size={22} weight="duotone" />
                    </button>
                    <button className="footer-item logout" title="Sair" onClick={() => { if (window.confirm('Deseja sair do TITA?')) window.location.reload(); }}>
                        <SignOut size={22} weight="duotone" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
