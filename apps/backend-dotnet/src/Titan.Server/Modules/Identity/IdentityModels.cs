using Microsoft.AspNetCore.Identity;

namespace Titan.Server.Modules.Identity;

public class ApplicationUser : IdentityUser
{
    public string? TenantId { get; set; }
    public string? FullName { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ApplicationRole : IdentityRole
{
    // Adicione propriedades personalizadas aqui se necessário
}
