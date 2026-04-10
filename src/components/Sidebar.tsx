import React from 'react';
import { MessageSquare, LayoutDashboard, Settings, Users, LogOut, Zap, PanelLeftClose, PanelLeftOpen, Sun, Moon } from 'lucide-react';
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
    const menuItems = [
        { id: 'chats', icon: MessageSquare, label: 'Mensagens' },
        { id: 'dashboard', icon: LayoutDashboard, label: 'Relatórios' },
        { id: 'agents', icon: Zap, label: 'Agentes IA' },
        { id: 'crm', icon: Users, label: 'Clientes' },
    ];

    return (
        <aside className={`sidebar ${isRetracted ? 'retracted' : 'expanded'}`}>
            <div className="sidebar-header">
                <button className="toggle-btn" onClick={onToggleRetraction} title={isRetracted ? "Expandir" : "Recolher"}>
                    {isRetracted ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
                {!isRetracted && <span className="logo-text">TITÃ</span>}
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange(item.id)}
                        title={item.label}
                    >
                        <item.icon size={22} className="nav-icon" />
                        {!isRetracted && <span className="nav-label">{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={onToggleTheme} title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}>
                    {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    {!isRetracted && <span className="nav-label">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
                </button>
                <button className="nav-item" title="Configurações">
                    <Settings size={22} />
                    {!isRetracted && <span className="nav-label">Ajustes</span>}
                </button>
                <button className="nav-item logout" title="Sair">
                    <LogOut size={22} />
                    {!isRetracted && <span className="nav-label">Sair</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
