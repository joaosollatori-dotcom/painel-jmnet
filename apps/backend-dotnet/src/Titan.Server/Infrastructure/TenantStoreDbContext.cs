using Finbuckle.MultiTenant.EntityFrameworkCore.Stores.EFCoreStore;
using Microsoft.EntityFrameworkCore;

namespace Titan.Server.Infrastructure;

public class TenantStoreDbContext : EFCoreStoreDbContext<TitanTenantInfo>
{
    public TenantStoreDbContext(DbContextOptions<TenantStoreDbContext> options)
        : base(options)
    {
    }
}
