import React from 'react';
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
    activeTab: string;
    onTabChange: (tab: string) => void;
    isRetracted: boolean;
    onToggleRetraction: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    isRetracted,
    onToggleRetraction,
    theme,
    onToggleTheme
}) => {
    const [status, setStatus] = React.useState<'Online' | 'Banheiro' | 'Almoço' | 'Offline'>('Online');
    const [statusStartTime, setStatusStartTime] = React.useState<number>(Date.now());
    const [isStatusMenuOpen, setIsStatusMenuOpen] = React.useState(false);
    const [timer, setTimer] = React.useState('00:00:00');
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set(['GESTÃO']));

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
                { id: 'chats', icon: Headset, label: 'Atendimento' },
                { id: 'internal_chat', icon: Hash, label: 'Chat Interno' },
                { id: 'agents', icon: Lightning, label: 'Agentes IA' },
            ]
        },
        {
            label: 'GESTÃO',
            items: [
                {
                    id: 'crm_module',
                    icon: TrendUp,
                    label: 'Leads e Vendas',
                    subItems: [
                        {
                            id: 'crm',
                            label: 'CRM',
                            subItems: [
                                { id: 'crm_leads', label: 'Gestão de Leads' },
                                { id: 'crm_tasks', label: 'Tarefas e Lembretes' },
                                { id: 'crm_contratos', label: 'Contratos' },
                                { id: 'crm_consultas', label: 'Consultas' },
                            ]
                        },
                        {
                            id: 'analytics',
                            label: 'Analytics',
                            subItems: [
                                { id: 'ana_conversa', label: 'Taxa de Conversão' },
                                { id: 'ana_performance', label: 'Performance Editorial' },
                            ]
                        },
                        {
                            id: 'clientes',
                            label: 'Clientes',
                            subItems: [
                                { id: 'client_new', label: 'Novo cliente' },
                                { id: 'client_search', label: 'Consultar cliente' },
                                { id: 'client_delete', label: 'Apagar cliente' },
                            ]
                        },
                        {
                            id: 'kanban',
                            label: 'Kanban',
                            subItems: [
                                { id: 'kanban_view', label: 'Visualizar Funil' },
                                { id: 'kanban_config', label: 'Configurar Etapas' },
                            ]
                        },
                    ]
                },
                {
                    id: 'financeiro',
                    icon: CurrencyDollar,
                    label: 'Financeiro',
                    subItems: [
                        { id: 'fin_analytics', label: 'Analytics' },
                        { id: 'fin_nfs', label: 'Nfs' },
                        { id: 'fin_recebiveis', label: 'Recebíveis' },
                        { id: 'fin_cobrancas', label: 'Cobranças' },
                    ]
                },
                { id: 'os', icon: Wrench, label: 'Ordens de Serviço' },
                { id: 'ocorrencias', icon: WarningCircle, label: 'Ocorrências' },
                { id: 'estoque', icon: Package, label: 'Estoque' },
            ]
        },
        {
            label: 'INFRA & BI',
            items: [
                { id: 'rede', icon: Globe, label: 'Rede ISP' },
                { id: 'mapa', icon: MapTrifold, label: 'Mapa de Rede' },
                { id: 'dashboard', icon: SquaresFour, label: 'Dashboard BI' },
            ]
        }
    ];

    const isItemActive = (item: any): boolean => {
        if (activeTab === item.id) return true;
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
                        } else {
                            onTabChange(item.id);
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

    const handleStatusChange = (newStatus: typeof status) => {
        setStatus(newStatus);
        setStatusStartTime(Date.now());
        setIsStatusMenuOpen(false);
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'Online': return '#10b981';
            case 'Banheiro': return '#f59e0b';
            case 'Almoço': return '#3b82f6';
            default: return '#6b7280';
        }
    };

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
                <div className="last-access-container">
                    <Clock size={18} weight="bold" className="footer-icon" />
                    {!isRetracted && (
                        <div className="last-access-info">
                            <span className="last-access-label">Último Acesso</span>
                            <span className="last-access-time">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                </div>
                <div className="user-status-container">
                    <button
                        className={`status-indicator-btn ${isStatusMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                    >
                        <div className="status-dot" style={{ backgroundColor: getStatusColor(status) }} />
                        {!isRetracted && (
                            <div className="status-info">
                                <span className="status-label">{status}</span>
                                <span className="timer-text">{timer}</span>
                            </div>
                        )}
                    </button>
                    {isStatusMenuOpen && (
                        <div className="status-menu">
                            {(['Online', 'Banheiro', 'Almoço', 'Offline'] as const).map(s => (
                                <button key={s} onClick={() => handleStatusChange(s)} className={status === s ? 'active' : ''}>
                                    <div className="status-dot" style={{ backgroundColor: getStatusColor(s) }} />
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sidebar-divider" />

                <button className="nav-item" onClick={onToggleTheme} title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}>
                    {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    {!isRetracted && <span className="nav-label">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
                </button>
                <button className="nav-item" title="Configurações" onClick={() => onTabChange('settings')}>
                    <Gear size={22} />
                    {!isRetracted && <span className="nav-label">Ajustes</span>}
                </button>
                <button className="nav-item logout" title="Sair" onClick={() => { if (window.confirm('Deseja sair do TITA?')) window.location.reload(); }}>
                    <SignOut size={22} />
                    {!isRetracted && <span className="nav-label">Sair</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
