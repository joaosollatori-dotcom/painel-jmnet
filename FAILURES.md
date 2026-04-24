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

11. **Falha: NullReferenceException no UserManager.CreateAsync (Contexto Multi-tenant)**
   - **O que aconteceu**: Mesmo usando `IgnoreQueryFilters()` para o check inicial, o método `CreateAsync` do Identity realiza validações internas que tentam resolver o tenant através do interceptor do Finbuckle.
   - **Resultado**: Erro de execução no startup.
   - **Lição**: Quando as entidades do Identity são multi-tenant, o `UserManager` exige um contexto de tenant resolvido no escopo da requisição (ou injetado manualmente em tarefas de background) para realizar qualquer operação de escrita ou busca.

12. **Falha: Uso de Interface Errada para Setar Contexto de Tenant (Finbuckle 9.x)**
   - **O que aconteceu**: Tentei setar o `MultiTenantContext` através da interface `IMultiTenantContextAccessor`, que é somente-leitura nas versões modernas do Finbuckle.
   - **Resultado**: Erro de compilação `CS0200: Property ... cannot be assigned to because it is read-only`.
   - **Lição**: Para persistir ou sobrescrever o contexto de tenant manualmente (tarefas de fundo), deve-se injetar `IMultiTenantContextSetter`. Em algumas versões do Finbuckle 9.x, esta interface é não-genérica e deve ser solicitada sem parâmetros de tipo ao DI.

13. **Falha: Ordem de Resolução de Serviços Incompatível com Multi-tenancy**
   - **O que aconteceu**: Resolvi o `TitanDbContext` e o `UserManager` através do `ServiceProvider` antes de configurar o `MultiTenantContext` via `IMultiTenantContextSetter`.
   - **Resultado**: O `DbContext` foi instanciado com um estado de tenant nulo em seus interceptores, ignorando o contexto setado posteriormente e causando `NullReferenceException` em consultas internas do Identity.
   - **Lição**: Em operações de semente ou tarefas de background, o contexto de tenant deve ser estabelecido no `IMultiTenantContextSetter` ANTES de qualquer serviço que dependa dele (como o DbContext) ser solicitado ao container.

14. **Falha: Omissão de Migrações após Refatoração de Modelo**
   - **O que aconteceu**: Adicionei `FullName` e `IsActive` à classe `ApplicationUser`, mas tentei rodar o sistema sem gerar e aplicar a respectiva migração do EF Core.
   - **Resultado**: Erro `42703: column a.FullName does not exist`. O SQL gerado pelo EF Core incluía as novas colunas, mas o esquema do banco estava desatualizado.
   - **Lição**: Toda alteração em entidades de domínio deve ser imediatamente seguida pela criação e aplicação de uma migração para manter a paridade entre o código e o esquema do banco.

15. **Falha: Parâmetro de Interface Inferido como Body em Minimal API**
   - **O que aconteceu**: Adicionei um endpoint `app.MapGet("/", (ITenantInfo tenantInfo) => ...)` onde o parâmetro `ITenantInfo` não foi explicitamente marcado como vindo dos serviços.
   - **Resultado**: Erro `System.InvalidOperationException: Body was inferred but the method does not allow inferred body parameters`. O ASP.NET Core tentou ler o `ITenantInfo` do corpo da requisição (que não é permitido em GET) em vez de resolvê-lo via DI.
   - **Lição**: Em Minimal APIs, parâmetros complexos ou de interface que devem ser resolvidos via Dependency Injection devem ser explicitamente marcados com `[FromServices]` para evitar inferência incorreta como `[FromBody]`.

16. **Falha: Omissão de Diretiva using para Atributos MVC/API**
   - **O que aconteceu**: Tentei usar o atributo `[FromServices]` no `Program.cs`, mas esqueci de incluir a diretiva `using Microsoft.AspNetCore.Mvc;`.
   - **Resultado**: Erro de compilação `CS0246: O nome do tipo ou do namespace "FromServices" não pode ser encontrado`.
   - **Lição**: Atributos de vinculação de parâmetros (binding) residem no namespace `Microsoft.AspNetCore.Mvc` e devem ser explicitamente importados, mesmo em arquivos de top-level statements como `Program.cs`.

4. **Falha: Omissão de Colunas Obrigatórias sem Default no DB**
   - **O que aconteceu**: Inseri dados na tabela `TenantInfo` sem especificar a coluna `IsActive`.
   - **Resultado**: Erro `23502: null value in column "IsActive" violates not-null constraint`. O EF Core criou a coluna como `NOT NULL` (por ser um `bool` não-anulável no C#), mas o banco não tinha um valor padrão definido via SQL.
   - **Lição**: Propriedades C# com valores padrão (ex: `bool = true`) não garantem defaults no banco de dados se não forem explicitamente configuradas via Fluent API ou passadas no `INSERT` SQL.

5. **Falha: Coexistência Indireta e Instabilidade de Schema Cache**
   - **O que aconteceu**: Apliquei migrações de um novo backend (.NET/PascalCase) no mesmo banco de dados do backend legado (Node/snake_case/Supabase) sem o devido isolamento ou aviso de reinicialização de cache.
   - **Resultado**: Erro `Internal Server Error (500)` em rotas legadas e erro `PGRST204` (coluna não encontrada) no PostgREST. A alteração estrutural massiva invalidou o cache de metadados do Supabase e potencialmente causou inconsistências temporárias para o Prisma.
   - **Lição**: Mudanças estruturais em bancos de dados compartilhados exigem um plano de coexistência que inclua o reload do cache de ferramentas dependentes (Supabase/PostgREST) e a verificação de integridade do ORM legado.

6. **Falha: Desalinhamento de Convenção de Nomenclatura**
   - **O que aconteceu**: Mantive o padrão PascalCase nativo do Entity Framework para as novas tabelas, ignorando o padrão snake_case já estabelecido no projeto legado.
   - **Resultado**: Criação de tabelas com nomes duplicados semanticamente (`AuditLogs` vs `audit_logs`, `TenantInfo` vs `tenants`), aumentando a carga cognitiva e dificultando a manutenção centralizada do banco.
   - **Lição**: Em projetos de migração gradual, o novo backend deve adaptar-se à convenção de nomenclatura existente no banco de dados para manter a coesão visual e funcional.

7. **Falha: Definição de Modelo Incompleta para Propriedades de Tenant**
   - **O que aconteceu**: Tentei atribuir manualmente o valor da propriedade `TenantId` no seeder do `ApplicationUser` sem ter declaro essa propriedade explicitamente na classe POCO.
   - **Resultado**: Erro de compilação `CS0117: ApplicationUser não contém uma definição para TenantId`. 
   - **Lição**: Mesmo que o Finbuckle gerencie propriedades de tenant via shadow properties, elas devem ser declaradas explicitamente no modelo C# caso precisem ser manipuladas diretamente pelo código (como em seeders ou lógica de negócio).
