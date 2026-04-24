using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Titan.Server.Infrastructure;
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
    var context = scope.ServiceProvider.GetRequiredService<TitanDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    
    // Simplificadamente cria o usuário mestre se não existir
    var adminUser = await userManager.FindByNameAsync("admin");
    if (adminUser == null)
    {
        adminUser = new ApplicationUser 
        { 
            UserName = "admin", 
            Email = "admin@titan.com.br", 
            TenantId = "master", 
            EmailConfirmed = true 
        };
        await userManager.CreateAsync(adminUser, "Titan@Root123!");
        await userManager.AddToRoleAsync(adminUser, "admin");
    }
}

app.UseAuthentication();
app.UseAuthorization();

// Registro de Endpoints dos Módulos
app.MapIdentityEndpoints();

// Exemplo de Endpoint Protegido e com Escopo de Tenant
app.MapGet("/", (ITenantInfo tenantInfo) => 
    $"Bem-vindo ao TITÃ CLI. Tenant Atual: {tenantInfo?.Name ?? "Nenhum"}")
    .WithName("GetHome")
    .WithOpenApi();

app.Run();
