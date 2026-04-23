# Relatório de Testes e Auditoria de Interface - TITÃ (JMNET)

Este documento lista todos os elementos da interface frontend que estão incompletos, utilizam dados simulados, ou cujas ações não possuem uma integração real com o backend.

## 1. Rotas Incompletas (404)
As seguintes seções no menu lateral levam a uma página de erro "404 - Página não encontrada", indicando que a rota existe no código mas o componente ou a definição da rota no `App.tsx` não foi finalizada:
- **Contratos** (Submenu de CRM)
- **Consultar Cliente** (Submenu de Base de Clientes)
- **Estoque de Rede** (Menu de Operações)

## 2. Componentes com Dados Estáticos (Mockados)
Os seguintes módulos exibem interfaces completas, mas os dados mostrados são vetores estáticos definidos dentro do componente, não refletindo o estado real do banco de dados:
- **Gestão Financeira**: Faturas, MRR, Inadimplência e Gráficos são fixos (`FinanceManager.tsx`).
- **Ordens de Serviço**: Lista de OSs é mockada e simulada com `setTimeout` (`OSManager.tsx`).
- **Infraestrutura de Rede**: Lista de OLTs, ocupação de portas PON e Logs são fixos (`NetworkManager.tsx`).
- **Ocorrências**: Lista de chamados e protocolos são estáticos (`OcorrenciasManager.tsx`).
- **Relatórios**: Diversas métricas no Dashboard de Leads são calculadas sobre dados mockados ou placeholders.

## 3. Botões e Ações Sem Backend (Apenas Visual)
Estes botões executam ações visuais ou mandam mensagens "fake" no chat, mas não disparam processos reais no servidor:
- **ChatArea**:
  - **Ligar (VoIP)**: Apenas abre o discador do sistema (`tel:`).
  - **Video Chamada**: Envia uma mensagem automática informando que a chamada iniciou.
  - **Transferir Atendimento**: Mostra o modal e envia mensagem de sistema, mas não há lógica de fila real.
  - **Participantes**: Interface puramente ilustrativa.
  - **Gerenciar Cadastro**: O formulário de CRM completo permite preenchimento, mas a integração com o "Banco ERP" mencionado no botão é simulada.
  - **Abrir Ocorrência**: Gera um protocolo aleatório e manda mensagem, mas não cria um registro real na tabela de ocorrências de forma persistente.
- **Financeiro**:
  - **Gerar Boleto Avulso**: Sem função `onClick`.
  - **Prorrogar Vencimentos**: Sem função `onClick`.
  - **Importar Arquivo Remessa**: Sem função `onClick`.
- **Rede**:
  - **Adicionar OLT**: Botão estático.
  - **Sincronizar / Provisionar ONU**: Não executam comandos reais nos equipamentos.

## 4. Elementos Sobrescritos ou com Necessidade de Finalização
- **Dashboard**: O gráfico de "Volume de Atendimento por Hora" é uma série de `div` com alturas aleatórias, sem conexão com dados históricos.
- **InternalChat**: Os botões de BI (Info Equipamento, Contrato, Conexão) utilizam strings fixas retornadas pelo `chatService` (ex: "Huawei HG8245H5", "-19.5 dBm").
- **LeadsManager**: Botões de ação rápida na tabela (Telefone, Agenda, Avançar) em grande parte apenas abrem modais ou não possuem lógica de persistência para todas as variantes de clique.

## 5. Auditoria de Botões Sem Handler (Seção CRM)
Identificamos botões que não possuem o atributo `onClick` definido, o que significa que não executam nenhuma função ao serem clicados:

### Gestão de Leads (`LeadsManager.tsx`)
- Botão "Registrar Contato" (Ação inline na tabela)
- Botão "Agendar" (Ação inline na tabela)
- Botão "Avançar" (Ação inline na tabela)

### Detalhes do Lead (`LeadDetail.tsx`)
- Botão "Transferir" (`btn-transfer`)
- Botão "Avançar Etapa" (`btn-advance`)
- Botão "Concluir" (`btn-done`)
- Botão "Reagendar" (`btn-reschedule`)
- Botão "Salvar Nota" (`btn-save-note`)
- Botões de Atalho: "Ligar", "WhatsApp" e "Tarefa" (`sc-call`, `sc-whatsapp`, `sc-task`)
- Botão "Reenviar Proposta" (`btn-resend`)
- Botão "Visualizar PDF" (`btn-view-pdf`)
- Botão "Salvar Alterações" (`btn-primary`)

### Centro de Automações (`AutomationsDashboard.tsx`)
- Botão "Configurações Gerais" (`btn-secondary`)
- Botão "Nova Regra" (`btn-primary`)

### Controle de Operações (`AppointmentManager.tsx`)
- Botão "Ver Caminho" (Google Maps)
- Botão "Finalizar e Gerar Protocolo" (`btn-confirm-action`)

## 6. Resumo de Teste de Botões
- **Sidebar**: 100% dos links funcionam (navegam), mas ~20% resultam em 404.
- **Modais**: A maioria dos modais de confirmação abre e fecha corretamente, mas a "confirmação" muitas vezes apenas fecha o modal com um `alert()` ou mensagem de texto no chat.
