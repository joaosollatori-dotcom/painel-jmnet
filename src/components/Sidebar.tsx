import React from 'react';
import { MessageSquare, LayoutDashboard, Settings, Users, LogOut, Zap } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const menuItems = [
        { id: 'chats', icon: MessageSquare, label: 'Mensagens' },
        { id: 'dashboard', icon: LayoutDashboard, label: 'Relatórios' },
        { id: 'agents', icon: Zap, label: 'Agentes IA' },
        { id: 'crm', icon: Users, label: 'Clientes' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon flex-center">T</div>
                    <span className="logo-text">TITÃ</span>
                </div>
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
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" title="Configurações">
                    <Settings size={22} />
                    <span className="nav-label">Ajustes</span>
                </button>
                <button className="nav-item logout" title="Sair">
                    <LogOut size={22} />
                    <span className="nav-label">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
