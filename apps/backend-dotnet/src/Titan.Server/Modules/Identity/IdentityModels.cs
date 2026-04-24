using Microsoft.AspNetCore.Identity;

namespace Titan.Server.Modules.Identity;

public class ApplicationUser : IdentityUser
{
    public string? TenantId { get; set; }
    // Adicione propriedades personalizadas aqui se necessário
}

public class ApplicationRole : IdentityRole
{
    // Adicione propriedades personalizadas aqui se necessário
}
