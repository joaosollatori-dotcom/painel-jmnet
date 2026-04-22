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
    Question,
    Scroll
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
        category: 'Operação',
        title: 'Como Adicionar um Novo Lead manually',
        icon: Users,
        tags: ['crm', 'lead', 'vendas'],
        content: `
            # Guia Passo-a-Passo: Adicionar Novo Lead
            
            Este é o ponto de partida para qualquer venda no TITÃ. Siga estes passos para garantir a integridade dos dados:
            
            ### Passo 1: Acesso ao CRM
            No menu lateral, clique em **"Leads/CRM"**. No canto superior direito, localize o botão **"NOVO LEAD"**.
            
            ### Passo 2: Preenchimento de Dados Básicos
            - **Nome Completo:** Crucial para o contrato posterior.
            - **WhatsApp:** Use o formato DDI + DDD + Numero (ex: 5511999999999).
            - **CPF/CNPJ:** Necessário para consulta de crédito automática via Pluggy.
            
            ### Passo 3: Localização e Viabilidade
            - Insira o CEP para que o sistema geolocalize o lead no mapa.
            - O sistema mostrará a distância para a **CTO** (Caixa de Atendimento) mais próxima.
            
            ### Passo 4: Qualificação
            Defina o interesse (Plano) e o canal de entrada (Google, Facebook, Ativo). Clique em **"SALVAR"**.
            
            **Dica:** Leads com endereço verificado ganham prioridade no pipeline comercial.
        `
    },
    {
        id: '2',
        category: 'Inteligência',
        title: 'Como funciona o Cerebras AI no Atendimento',
        icon: Lightning,
        tags: ['ai', 'atendimento', 'cerebras'],
        content: `
            # Automação de Resumo: Cerebras AI
            
            O TITÃ utiliza a infraestrutura de ponta do **Cerebras AI** para garantir que nenhum detalhe do atendimento seja perdido, mesmo em dias de alta demanda.
            
            ### O Ciclo de Vida da Inteligência:
            1. **Captura Inicial:** Quando um novo cliente manda mensagem no WhatsApp, o sistema aguarda as primeiras interações.
            2. **Processamento:** O TITÃ envia o contexto para o cluster Cerebras, que processa a linguagem natural em milissegundos.
            3. **Resumo Executivo:** Um resumo de até 150 caracteres é gerado e fixado no topo do chat.
            4. **Ocorrência Automática:** Simultaneamente, o sistema abre uma **Ocorrência** com o status "Aberta", usando o resumo como descrição inicial.
            
            **Benefício:** Isso economiza até 3 minutos por atendimento, pois o operador já inicia sabendo exatamente o que o cliente deseja.
        `
    },
    {
        id: '3',
        category: 'Contratos',
        title: 'Ciclo de Assinatura Digital por E-mail',
        icon: Scroll,
        tags: ['contrato', 'assinatura', 'juridico'],
        content: `
            # Gestão de Contratos e Assinatura Digital
            
            Esqueça papel e caneta. O TITÃ gerencia o ciclo jurídico completo de forma digital e auditável.
            
            ### 1. Geração do Contrato
            No perfil do Lead, vá na aba **"Contratos"**. Selecione o modelo desejado e clique em **"Gerar"**. O sistema usará os placeholders (Nome, CPF, Valor) para montar o documento.
            
            ### 2. Envio para Assinatura
            Clique no botão **"ENVIAR P/ ASSINATURA DIGITAL"**. O cliente receberá um e-mail personalizado com as cores e logo da sua empresa (configurado em Ajustes > Branding).
            
            ### 3. Captura Forense
            Quando o cliente clica no link e aceita os termos:
            - O sistema registra o **Endereço IP**.
            - Captura o **User-Agent** (dispositivo usado).
            - Grava o **Timestamp** exato da operação.
            
            ### 4. Validação
            Assim que assinado, o Lead é movido automaticamente para o estágio **"Contrato Assinado"** e uma tarefa de instalação é gerada para o setor técnico.
        `
    },
    {
        id: '4',
        category: 'Integrações',
        title: 'Open Finance: Integração Pluggy',
        icon: CloudArrowUp,
        tags: ['pluggy', 'financeiro', 'score'],
        content: `
            # Análise de Crédito com Pluggy
            
            O TITÃ integra-se ao **Pluggy** para oferecer uma análise de crédito moderna baseada em Open Finance e histórico bancário, indo além do simples Score de crédito tradicional.
            
            ### Como Ativar:
            1. No Lead, clique no ícone de **"Análise Pluggy"**.
            2. Gere o link de conexão segura e envie ao cliente.
            3. O cliente autoriza o acesso temporário (apenas leitura).
            
            ### O Que o TITÃ Analisa:
            - **Capacidade de Pagamento:** Média de entradas mensais.
            - **Risco de Churn:** Histórico de pagamentos de contas de utilidade (luz, água).
            - **Selo de Confiança:** Leads aprovados pelo Pluggy podem ter a taxa de instalação isenta automaticamente pelo sistema.
        `
    },
    {
        id: '5',
        category: 'Segurança',
        title: 'Auditoria Imutável e Segurança Global',
        icon: ShieldCheck,
        tags: ['auditoria', 'admin', 'logs'],
        content: `
            # Sistema de Auditoria Forense
            
            A segurança dos dados é levada a sério no TITÃ. Todas as ações cruciais são registradas em logs imutáveis que não podem ser apagados, nem por administradores.
            
            ### O Que é Monitorado?
            - **Acessos:** Downloads de listas de leads, exportações de relatórios.
            - **Alterações:** Mudança de valores de planos, troca de vendedor, alteração de status de OS.
            - **Comunicações:** Reenvio de e-mails de contrato, mensagens de WhatsApp.
            
            ### Como Consultar:
            Apenas Super-Admin e Admin podem acessar o painel em **Ajustes > Auditoria e Segurança**.
            O log exibe o payload JSON original da ação, permitindo rastrear exatamente qual dado foi modificado e por quem.
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
                        {filteredArticles.map(article => {
                            const Icon = article.icon;
                            return (
                                <button
                                    key={article.id}
                                    className={`wiki-article-item ${selectedArticle?.id === article.id ? 'active' : ''}`}
                                    onClick={() => setSelectedArticle(article)}
                                >
                                    <Icon size={20} weight={selectedArticle?.id === article.id ? "fill" : "regular"} />
                                    <span>{article.title}</span>
                                    <CaretRight size={14} />
                                </button>
                            );
                        })}
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
