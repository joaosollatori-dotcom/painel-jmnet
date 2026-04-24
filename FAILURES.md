# Log de Falhas e Lições Aprendidas - Projeto TITÃ Backend

Este documento serve como um registro imutável de falhas de implementação, descuidos técnicos e erros de processo cometidos durante a modernização do backend.

### Registro de Falhas

1. **Falha: Execução de Seed antes de Migrações**
   - **O que aconteceu**: Tentei rodar o script `init-db.sql` logo após instalar o .NET, sem antes gerar e aplicar as migrações do Entity Framework Core.
   - **Resultado**: Erro `42P01: relation "AspNetRoles" does not exist`. As tabelas ainda não existiam no PostgreSQL.
   - **Lição**: O esquema Code-First deve ser aplicado ao banco de dados via `dotnet ef database update` antes de qualquer manipulação direta via SQL de semente.

2. **Falha: Formato de String de Conexão Incompatível**
   - **O que aconteceu**: Utilizeue o formato de URI (`postgresql://...`) diretamente no `appsettings.json`.
   - **Resultado**: Erro `Format of the initialization string does not conform to specification`. O provedor Npgsql no EF Core espera o formato `Host=...;Database=...;`.
   - **Lição**: Sempre converter strings de conexão de provedores cloud (como Supabase) para o formato de pares chave-valor do ADO.NET/Npgsql.

3. **Falha: Omissão de TenantId em Dados de Semente (Multi-tenancy)**
   - **O que aconteceu**: O script `init-db.sql` inseriu Roles e Claims sem a coluna `TenantId`.
   - **Resultado**: Erro `23502: null value in column "TenantId" violates not-null constraint`. Como as tabelas de Identidade foram configuradas como Multi-tenant, o ID do cliente é obrigatório.
   - **Lição**: Dados inseridos manualmente em sistemas multi-tenant devem sempre especificar o `TenantId` alvo, mesmo para dados administrativos iniciais.

4. **Falha: Omissão de Colunas Obrigatórias sem Default no DB**
   - **O que aconteceu**: Inseri dados na tabela `TenantInfo` sem especificar a coluna `IsActive`.
   - **Resultado**: Erro `23502: null value in column "IsActive" violates not-null constraint`. O EF Core criou a coluna como `NOT NULL` (por ser um `bool` não-anulável no C#), mas o banco não tinha um valor padrão definido via SQL.
   - **Lição**: Propriedades C# com valores padrão (ex: `bool = true`) não garantem defaults no banco de dados se não forem explicitamente configuradas via Fluent API ou passadas no `INSERT` SQL.
