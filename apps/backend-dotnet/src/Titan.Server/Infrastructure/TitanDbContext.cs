using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Titan.Server.Modules.Identity;
using Finbuckle.MultiTenant;
using Finbuckle.MultiTenant.Abstractions;
using Finbuckle.MultiTenant.EntityFrameworkCore;

namespace Titan.Server.Infrastructure;

public class TitanDbContext : MultiTenantIdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public TitanDbContext(IMultiTenantContextAccessor accessor, DbContextOptions<TitanDbContext> options)
        : base(accessor, options)
    {
    }

    public DbSet<Titan.Server.Modules.Audit.AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Configura as tabelas do Identity para serem multi-tenant
        builder.Entity<ApplicationUser>().IsMultiTenant();
        builder.Entity<ApplicationRole>().IsMultiTenant();
        // Claims, Logins, etc. já podem estar habilitados por estarmos usando MultiTenantIdentityDbContext,
        // mas forçar garante a consistência.
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        this.EnforceMultiTenant();
        
        var auditEntries = OnBeforeSaveChanges();
        var result = await base.SaveChangesAsync(cancellationToken);
        await OnAfterSaveChanges(auditEntries);
        
        return result;
    }

    private List<AuditEntry> OnBeforeSaveChanges()
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Titan.Server.Modules.Audit.AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditEntry(entry)
            {
                EntityName = entry.Entity.GetType().Name,
                TenantId = TenantInfo?.Id
            };
            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                string propertyName = property.Metadata.Name;
                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue!;
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.NewValues[propertyName] = property.CurrentValue!;
                        break;

                    case EntityState.Deleted:
                        auditEntry.OldValues[propertyName] = property.OriginalValue!;
                        break;

                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.OldValues[propertyName] = property.OriginalValue!;
                            auditEntry.NewValues[propertyName] = property.CurrentValue!;
                        }
                        break;
                }
            }
        }

        return auditEntries;
    }

    private Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
    {
        if (auditEntries == null || auditEntries.Count == 0)
            return Task.CompletedTask;

        foreach (var auditEntry in auditEntries)
        {
            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        return base.SaveChangesAsync();
    }
}

internal class AuditEntry
{
    public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        Entry = entry;
    }

    public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
    public string? TenantId { get; set; }
    public string? EntityName { get; set; }
    public Dictionary<string, object> KeyValues { get; } = new();
    public Dictionary<string, object> OldValues { get; } = new();
    public Dictionary<string, object> NewValues { get; } = new();

    public Titan.Server.Modules.Audit.AuditLog ToAuditLog()
    {
        var log = new Titan.Server.Modules.Audit.AuditLog
        {
            TenantId = TenantId,
            EntityName = EntityName,
            Timestamp = DateTime.UtcNow,
            Action = Entry.State.ToString(),
            OldValues = System.Text.Json.JsonSerializer.Serialize(OldValues),
            NewValues = System.Text.Json.JsonSerializer.Serialize(NewValues),
            EntityId = System.Text.Json.JsonSerializer.Serialize(KeyValues)
        };
        return log;
    }
}
