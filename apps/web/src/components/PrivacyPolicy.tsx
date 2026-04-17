import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="privacy-policy-container">
            <div className="privacy-policy-content glass">
                <h1>Política de Privacidade</h1>
                <p className="last-updated">Última atualização: 16 de Abril de 2026</p>

                <section>
                    <h2>1. Introdução</h2>
                    <p>
                        Bem-vindo ao TITÃ | ISP. Valorizamos a sua privacidade e estamos comprometidos em proteger seus dados pessoais.
                        Esta política descreve como coletamos, usamos e protegemos suas informações ao utilizar nossa plataforma.
                    </p>
                </section>

                <section>
                    <h2>2. Dados que Coletamos</h2>
                    <p>Para fornecer nossos serviços de ISP e suporte ao cliente, coletamos os seguintes tipos de informações:</p>
                    <ul>
                        <li><strong>Informações de Identificação:</strong> Nome, telefone e endereço de e-mail.</li>
                        <li><strong>Dados de Atendimento:</strong> Histórico de conversas, mensagens trocadas e reações.</li>
                        <li><strong>Dados Técnicos da Conexão:</strong> Endereço IP, latência, perda de pacotes e níveis de sinal óptico.</li>
                        <li><strong>Informações de Equipamento:</strong> Modelos de roteadores/ONTs, tempo de atividade (uptime) e versões de firmware.</li>
                        <li><strong>Dados Financeiros e Contratuais:</strong> Planos de serviço, status de pagamento e valores de faturas.</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Práticas de Cookies</h2>
                    <p>
                        Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma. Caso opte por <strong>Recusar</strong>,
                        utilizaremos apenas o <code>sessionStorage</code> para manter sua sessão ativa enquanto a aba estiver aberta, removendo qualquer persistência de longo prazo.
                    </p>
                    <ul>
                        <li><strong>Cookies Essenciais:</strong> Necessários para a autenticação e sessões de segurança via Supabase.</li>
                        <li><strong>Cookies de Preferência:</strong> Armazenamos sua escolha de tema (Dark, Light ou Soft) e acabamento visual (Fosco ou Brilho) para manter a consistência da sua experiência.</li>
                        <li><strong>Tags de Performance:</strong> Coletamos dados técnicos anonimizados para monitorar a estabilidade da nossa rede.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Como Usamos Seus Dados</h2>
                    <p>Seus dados são utilizados estritamente para:</p>
                    <ul>
                        <li>Gerenciar seu atendimento e suporte técnico.</li>
                        <li>Monitorar a qualidade da sua conexão de internet.</li>
                        <li>Processar cobranças e gerenciar contratos.</li>
                        <li>Personalizar sua interface de usuário.</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Segurança e Armazenamento</h2>
                    <p>
                        Empregamos medidas de segurança técnicas e administrativas para proteger seus dados contra acesso não autorizado,
                        perda ou alteração. Seus dados são armazenados de forma segura utilizando infraestrutura baseada em nuvem com criptografia em repouso.
                    </p>
                </section>

                <section>
                    <h2>6. Seus Direitos</h2>
                    <p>
                        Você tem o direito de solicitar acesso, correção ou exclusão de seus dados pessoais a qualquer momento,
                        conforme garantido pela Lei Geral de Proteção de Dados (LGPD).
                    </p>
                </section>

                <section>
                    <h2>7. Contato</h2>
                    <p>Para dúvidas sobre nossa política de privacidade, entre em contato com nosso encarregado de dados através dos canais de suporte da JMnet Telecom.</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
