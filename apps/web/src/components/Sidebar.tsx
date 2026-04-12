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
    ShoppingCart
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
                { id: 'crm', icon: Users, label: 'Clientes' },
                { id: 'financeiro', icon: CurrencyDollar, label: 'Financeiro' },
                { id: 'os', icon: Wrench, label: 'Ordens de Serviço' },
                { id: 'estoque', icon: Package, label: 'Estoque' },
                { id: 'vendas', icon: ShoppingCart, label: 'Vendas' },
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
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} className="nav-group">
                        {!isRetracted && <span className="nav-group-label">{group.label}</span>}
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => onTabChange(item.id)}
                                title={item.label}
                            >
                                <item.icon size={22} weight={activeTab === item.id ? "fill" : "regular"} className="nav-icon" />
                                {!isRetracted && <span className="nav-label">{item.label}</span>}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
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
