using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Titan.Server.Modules.Audit;

public class AuditLog
{
    [Key]
    public long Id { get; set; }
    
    public string? TenantId { get; set; }
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public string? Action { get; set; } // Create, Update, Delete, Login, etc.
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
