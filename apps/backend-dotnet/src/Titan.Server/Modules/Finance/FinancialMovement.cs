using System;
using System.ComponentModel.DataAnnotations;

namespace Titan.Server.Modules.Finance;

public class FinancialMovement
{
    public long Id { get; set; }
    
    [Required]
    public string TenantId { get; set; } = default!;
    
    [Required]
    public string Description { get; set; } = default!;
    
    public decimal Amount { get; set; }
    
    public DateTime Date { get; set; }
    
    public FinancialType Type { get; set; } // Credit/Debit
    
    public string? Category { get; set; }
    
    public string? AiCategory { get; set; }
    
    public string? ExternalId { get; set; } // Pluggy ID
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum FinancialType
{
    Income,
    Expense
}
