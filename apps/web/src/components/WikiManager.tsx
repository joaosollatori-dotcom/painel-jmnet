import React, { useState } from 'react';
import {
    BookOpen,
    MagnifyingGlass,
    CaretRight,
    Lightning,
    ShieldCheck,
    Users,
    DeviceMobile,
    CloudArrowUp,
    FileText,
    Question
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import './WikiManager.css';

interface WikiArticle {
    id: string;
    category: string;
    title: string;
    content: string;
    icon: any;
    tags: string[];
}

const WIKI_ARTICLES: WikiArticle[] = [
    {
        id: '1',
        category: 'Início Rápido',
        title: 'Primeiros Passos no TITÃ | ISP',
        icon: Lightning,
        tags: ['onboarding', 'tutorial'],
        content: `
            # Bem-vindo ao TITÃ | ISP
            
            O TITÃ é um Command Center completo projetado especificamente para Provedores de Internet. 
            Nesta Wiki, você encontrará tudo o que precisa para dominar a plataforma.
            
            ### O que você pode fazer:
            1. **Gestão de Leads:** Acompanhe o funil de vendas desde o primeiro contato.
            2. **Atendimento:** Centralize chats de WhatsApp e Instagram em um só lugar.
            3. **Ordens de Serviço:** Gerencie instalações e reparos técnicos com precisão.
            4. **Financeiro:** Controle faturamento e cobranças de forma integrada.
        `
    },
    {
        id: '2',
        category: 'Operações',
        title: 'Gestão de CRM e Funil de Vendas',
        icon: Users,
        tags: ['vendas', 'crm', 'leads'],
        content: `
            # Gestão de Leads ISP
            
            O módulo CRM permite o acompanhamento detalhado de cada prospecto.
            
            ### Estágios do Funil:
            - **Qualificação:** Identificação do perfil do cliente.
            - **Viabilidade:** Verificação técnica de disponibilidade de rede.
            - **Proposta:** Envio e negociação de planos.
            - **Fechamento:** Finalização da venda e criação do contrato.
        `
    },
    {
        id: '3',
        category: 'Configurações',
        title: 'Segurança e Multi-tenant',
        icon: ShieldCheck,
        tags: ['segurança', 'admin', 'tenant'],
        content: `
            # Segurança e Isolamento de Dados
            
            O TITÃ utiliza arquitetura Multi-tenant, garantindo que os dados de cada provedor sejam isolados e seguros.
            
            ### Níveis de Acesso:
            - **SUPER_ADMIN:** Acesso total a todas as configurações e logs.
            - **ADMIN:** Gestão total de um tenant específico.
            - **VENDEDOR:** Acesso limitado a leads e atendimentos.
            - **TECNICO:** Foco em ordens de serviço e status de rede.
        `
    },
    {
        id: '4',
        category: 'Rede',
        title: 'Integração com Equipamentos',
        icon: DeviceMobile,
        tags: ['rede', 'hardware', 'monitoramento'],
        content: `
            # Monitoramento de Rede
            
            Acesse relatórios em tempo real de ONUs e concentradores.
            
            ### Funcionalidades:
            - **Status de Conexão:** Verifique se o cliente está online/offline.
            - **Sinal Óptico:** Monitore a atenuação da fibra em dBm.
            - **Uptime:** Acompanhe o tempo de atividade dos equipamentos.
        `
    }
];

const WikiManager: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(WIKI_ARTICLES[0]);
    const [activeCategory, setActiveCategory] = useState<string>('Todas');

    const categories = ['Todas', ...Array.from(new Set(WIKI_ARTICLES.map(a => a.category)))];

    const filteredArticles = WIKI_ARTICLES.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags.some(t => t.includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'Todas' || article.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="wiki-container">
            <header className="wiki-header">
                <div className="wiki-header-title">
                    <BookOpen size={32} weight="fill" color="var(--sb-primary)" />
                    <div>
                        <h1>Central de Ajuda & Wiki</h1>
                        <p>Documentação oficial e guias do sistema TITÃ | ISP</p>
                    </div>
                </div>
                <div className="wiki-search">
                    <MagnifyingGlass size={20} />
                    <input
                        placeholder="Busque por artigos, tutoriais ou palavras-chave..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="wiki-content">
                <aside className="wiki-sidebar">
                    <div className="wiki-categories">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`wiki-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="wiki-article-list">
                        {filteredArticles.map(article => (
                            <button
                                key={article.id}
                                className={`wiki-article-item ${selectedArticle?.id === article.id ? 'active' : ''}`}
                                onClick={() => setSelectedArticle(article)}
                            >
                                <article.icon size={20} weight={selectedArticle?.id === article.id ? "fill" : "regular"} />
                                <span>{article.title}</span>
                                <CaretRight size={14} />
                            </button>
                        ))}
                    </div>

                    <div className="wiki-support-card">
                        <Question size={24} weight="duotone" />
                        <h3>Ainda com dúvidas?</h3>
                        <p>Fale com nosso suporte especializado ISP.</p>
                        <button className="btn-secondary">Abrir Ticket</button>
                    </div>
                </aside>

                <main className="wiki-article-view">
                    <AnimatePresence mode="wait">
                        {selectedArticle ? (
                            <motion.div
                                key={selectedArticle.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="article-body"
                            >
                                <div className="article-header">
                                    <span className="article-category">{selectedArticle.category}</span>
                                    <h2>{selectedArticle.title}</h2>
                                    <div className="article-tags">
                                        {selectedArticle.tags.map(tag => (
                                            <span key={tag} className="tag">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="article-content">
                                    {selectedArticle.content.split('\n').map((line, i) => {
                                        if (line.trim().startsWith('# ')) return <h1 key={i}>{line.replace('# ', '')}</h1>;
                                        if (line.trim().startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
                                        if (line.trim().startsWith('1. ') || line.trim().startsWith('- ')) {
                                            return <li key={i}>{line.replace(/^[0-9]\. |^- /, '')}</li>;
                                        }
                                        return <p key={i}>{line}</p>;
                                    })}
                                </div>
                                <footer className="article-footer">
                                    <span>Este artigo foi útil?</span>
                                    <div className="footer-actions">
                                        <button className="btn-ghost">Sim, ajudou!</button>
                                        <button className="btn-ghost">Não muito...</button>
                                    </div>
                                </footer>
                            </motion.div>
                        ) : (
                            <div className="article-empty">
                                <FileText size={48} weight="thin" />
                                <p>Selecione um artigo para visualizar o conteúdo</p>
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default WikiManager;
