using Finbuckle.MultiTenant;
using Finbuckle.MultiTenant.Abstractions;

namespace Titan.Server.Infrastructure;

public class TitanTenantInfo : TenantInfo, ITenantInfo
{
    // Propriedades personalizadas por tenant
    public string? AdminEmail { get; set; }
    public string? ConnectionString { get; set; }
    public bool IsActive { get; set; } = true;
}
