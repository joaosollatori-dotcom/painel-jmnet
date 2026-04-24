using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Titan.Server.Infrastructure;
using Titan.Server.Modules.Audit;
using Titan.Server.Modules.Finance;
using Titan.Server.Modules.Identity;
using Finbuckle.MultiTenant;
using Finbuckle.MultiTenant.Abstractions;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração do Banco de Dados
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<TitanDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.UseOpenIddict();
});

// DbContext separado para o Store de Tenants
builder.Services.AddDbContext<TenantStoreDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Configuração do Multi-tenancy (Finbuckle)
builder.Services.AddMultiTenant<TitanTenantInfo>()
    .WithHeaderStrategy("X-Tenant-Id")
    .WithHostStrategy()
    .WithEFCoreStore<TenantStoreDbContext, TitanTenantInfo>();

// 3. Configuração do Identity
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<TitanDbContext>()
    .AddDefaultTokenProviders();

// 4. Configuração do OpenIddict (Servidor de Identidade)
builder.Services.AddHttpClient<CerebrasService>();
builder.Services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
               .UseDbContext<TitanDbContext>();
    })
    .AddServer(options =>
    {
        options.SetTokenEndpointUris("/connect/token");
        options.AllowPasswordFlow();
        options.AllowRefreshTokenFlow();
        options.AcceptAnonymousClients(); // Para desenvolvimento inicial
        
        options.AddDevelopmentEncryptionCertificate()
               .AddDevelopmentSigningCertificate();
               
        options.UseAspNetCore()
               .EnableTokenEndpointPassthrough();
    })
    .AddValidation(options =>
    {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Importante: UseMultiTenant deve vir antes de UseAuthentication/UseAuthorization
app.UseMultiTenant(); 
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TitanDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    
    // Injeta manualmente o contexto de Tenant para o Seeder (visto que não há HttpContext aqui)
    var tenantInfo = new TitanTenantInfo { Id = "master", Identifier = "master", Name = "Master Tenant" };
    var accessor = scope.ServiceProvider.GetRequiredService<IMultiTenantContextAccessor<TitanTenantInfo>>();
    accessor.MultiTenantContext = new MultiTenantContext<TitanTenantInfo> { TenantInfo = tenantInfo };

    // 1. Admin User
    if (!dbContext.Users.IgnoreQueryFilters().Any())
    {
        var adminUser = new ApplicationUser
        {
            UserName = "admin@titan.com.br",
            Email = "admin@titan.com.br",
            EmailConfirmed = true,
            TenantId = "master",
            FullName = "Administrador Mestre",
            IsActive = true
        };
        await userManager.CreateAsync(adminUser, "Admin123!");
    }

    // 2. Dados de Teste Financeiro (Nano/Micro Validação)
    if (!dbContext.FinancialMovements.IgnoreQueryFilters().Any())
    {
        dbContext.FinancialMovements.AddRange(
            new FinancialMovement { Description = "Assinatura Internet - João", Amount = 150.00m, Type = FinancialType.Income, Date = DateTime.UtcNow.AddDays(-1), TenantId = "master", Category = "Receita" },
            new FinancialMovement { Description = "Manutenção Fibra Óptica", Amount = 1200.00m, Type = FinancialType.Expense, Date = DateTime.UtcNow.AddDays(-2), TenantId = "master", Category = "Infraestrutura" },
            new FinancialMovement { Description = "Link Dedicado Transit", Amount = 5000.00m, Type = FinancialType.Expense, Date = DateTime.UtcNow.AddDays(-3), TenantId = "master", Category = "Link" }
        );
    }

    await dbContext.SaveChangesAsync();
    Console.WriteLine("TITÃ: Banco de Dados Semeado com Sucesso!");
}

app.UseAuthentication();
app.UseAuthorization();

// Registro de Endpoints dos Módulos
app.MapIdentityEndpoints();
app.MapFinanceEndpoints();

// Exemplo de Endpoint Protegido e com Escopo de Tenant
app.MapGet("/", (ITenantInfo tenantInfo) => 
    $"Bem-vindo ao TITÃ CLI. Tenant Atual: {tenantInfo?.Name ?? "Nenhum"}")
    .WithName("GetHome")
    .WithOpenApi();

app.Run();
