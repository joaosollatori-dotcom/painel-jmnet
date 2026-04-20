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
        category: 'Atendimento',
        title: 'Central de Chat: Ações Rápidas e Bi-lateralidade',
        icon: Lightning,
        tags: ['atendimento', 'produtividade', 'chat'],
        content: `
            # Guia de Operações de Alta Performance no Atendimento
            
            O módulo de Atendimento do TITÃ | ISP foi projetado para transformar conversas em ações operacionais imediatas. Através do **Command Center de Ações Rápidas**, o atendente pode interagir com o CRM e o setor técnico sem sair da janela de chat.
            
            ### 1. Abertura de Ocorrências em Tempo Real
            Ao identificar um problema recorrente ou uma reclamação formal, utilize o botão **"Ocorrência"**.
            - **Ação:** O sistema captura automaticamente os dados do contato e gera um protocolo exclusivo.
            - **Resultado:** Um novo registro é criado na tabela de Ocorrências, disparando notificações para os gestores e garantindo que o SLA de resposta seja iniciado.
            
            ### 2. Geração de Ordens de Serviço (OS)
            Para problemas que exigem visita técnica ou manutenção física:
            - **Ação:** Clique em **"Nova OS"**. O sistema pré-preenche os dados de endereço e contato.
            - **Resultado:** A OS é enviada ao módulo técnico, agendando a demanda conforme a prioridade selecionada (Urgente, Alta ou Normal).
            
            ### 3. Edição Rápida de Cadastro
            Mantenha a base de dados atualizada sem fricção:
            - **Ação:** Use a função **"Cadastro"** para abrir o modal de edição rápida.
            - **Resultado:** Informações de Nome e Telefone são sincronizadas instantaneamente no CRM e no Lead Manager, evitando dados obsoletos.
        `
    },
    {
        id: '2',
        category: 'Técnico',
        title: 'Monitoramento e Verificação de Sinal (dBm)',
        icon: DeviceMobile,
        tags: ['técnico', 'sinal', 'monitoramento'],
        content: `
            # Diagnóstico Técnico Bi-lateral
            
            A função de **Verificação de Sinal** permite um diagnóstico preliminar da conexão do cliente diretamente pela interface de atendimento, reduzindo a necessidade de transferência para o suporte nível 2.
            
            ### Como realizar a verificação:
            1. **Identificação:** Dentro de uma conversa ativa, localize o painel de Ações Rápidas na barra lateral direita.
            2. **Execução:** Clique em **"Ver. Sinal"**. O TITÃ realiza uma consulta assíncrona aos concentradores e equipamentos de rede.
            3. **Leitura de Resultados:** 
               - **Sinal Verde (-16 a -25 dBm):** Conexão excelente de fibra.
               - **Sinal Amarelo (-26 a -28 dBm):** Atenção, possível dobra de fibra ou conector sujo.
               - **Sinal Vermelho (Acima de -28 dBm):** Crítico, recomendável abertura de OS para limpeza.
            
            **Vantagem Operacional:** Essa ação é registrada nos logs de auditoria, permitindo que o técnico de campo saiba que um teste já foi realizado antes da visita.
        `
    },
    {
        id: '3',
        category: 'Configurações',
        title: 'Segurança e Governança Multi-tenant',
        icon: ShieldCheck,
        tags: ['segurança', 'admin', 'tenant'],
        content: `
            # Isolamento de Dados e Conformidade SaaS
            
            O TITÃ | ISP opera sob uma arquitetura rigorosa de **Multi-tenancy**, garantindo que as operações de um provedor sejam invisíveis e inacessíveis para outros.
            
            ### Mecanismos de Proteção:
            - **Tenant Isolation:** Cada registro de Lead, OS ou Mensagem possui um ` + "`tenant_id`" + ` imutável vinculado ao perfil do usuário logado.
            - **RLS (Row Level Security):** O banco de dados Supabase aplica filtros automáticos em nível de linha. Mesmo que uma consulta tente burlar o sistema, o Postgres bloqueia qualquer dado que não pertença ao tenant do usuário.
            
            ### Resultantes de Auditoria:
            Todas as ações rápidas executadas no chat (Abertura de OS, Troca de Status, Verificação de Sinal) geram um **Audit Log** automático contendo:
            1. Identificação do Atendente (Actor ID)
            2. Timestamp da operação.
            3. Objeto alterado e Tenant afetado.
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
