# Relatório de Auditoria - Titã (JMNET)

Este relatório detalha os componentes e funcionalidades que estão incompletos, utilizam dados simulados (mockados) ou não possuem integração real com o backend.

## 1. Rotas e Páginas Inexistentes
As seguintes rotas estão presentes no menu lateral (Sidebar), mas não possuem componentes associados ou páginas implementadas no `App.tsx`:
- **Gestão de Contratos** (`/crm_contratos`): Redireciona para "Página não encontrada".
- **Consulta de Clientes** (`/client_search`): Redireciona para "Página não encontrada".
- **Estoque de Rede** (`/estoque`): Redireciona para "Página não encontrada".

## 2. Componentes com Dados Simulados (Mock)
Os seguintes módulos utilizam listas estáticas de dados e simulam carregamento via `setTimeout`, sem consultar o banco de dados:
- **OSManager (Ordens de Serviço)**: Lista de OSs (`mockOS`) é estática.
- **FinanceManager (Financeiro)**: Estatísticas e faturas são estáticas.
- **NetworkManager (Infraestrutura/Rede)**: Lista de OLTs e logs são estáticos.
- **OcorrenciasManager (Ocorrências)**: Lista de chamados é estática.

## 3. Funcionalidades de Interface Sem Backend Real
No componente **ChatArea** e **InternalChat**, diversas ações apenas simulam uma resposta do sistema ou enviam uma mensagem de texto, sem realizar alterações em estados persistentes complexos ou serviços externos:
- **Chamada de Vídeo**: Apenas envia uma mensagem de "chamada iniciada".
- **Ligar (VoIP)**: Utiliza apenas o protocolo `tel:`.
- **Transferir Atendimento**: Envia mensagem de sistema, mas não altera a fila de forma lógica no backend (além do campo `assigned_to`).
- **Participantes**: Interface de simulação de colaboradores.
- **Botões de BI no Chat Interno**: Geram anexos com textos pré-definidos via `chatService` (resumos simulados).

## 4. Elementos de UI Incompletos / Sobrescritos
- **Dashboard**: Gráficos de "Volume de Atendimento" são placeholders visuais.
- **LeadDetail**: Seção de documentos e timeline possuem elementos mockados ("pdf-mock").
- **Sidebar**: O tempo online é calculado apenas localmente na sessão atual.

## 5. Necessidade de Finalização (Pendente)
- Integração real dos módulos de OS, Financeiro e Rede com as tabelas do Supabase.
- Implementação das páginas de busca de cliente e contratos.
- Adição do catálogo de emojis e funções avançadas de anexo conforme solicitado no `dados.txt`.
