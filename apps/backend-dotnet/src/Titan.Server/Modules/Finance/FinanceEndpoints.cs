using Microsoft.AspNetCore.Mvc;
using Titan.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Titan.Server.Modules.Finance;

namespace Titan.Server.Modules.Finance;

public static class FinanceEndpoints
{
    public static void MapFinanceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/finance")
            .WithTags("Finance")
            .RequireAuthorization();

        group.MapGet("/movements", async (TitanDbContext db) =>
        {
            return await db.FinancialMovements.OrderByDescending(m => m.Date).ToListAsync();
        });

        group.MapPost("/movements", async (FinancialMovement movement, TitanDbContext db) =>
        {
            db.FinancialMovements.Add(movement);
            await db.SaveChangesAsync();
            return Results.Created($"/api/finance/movements/{movement.Id}", movement);
        });
        
        group.MapPost("/sync-pluggy", async ([FromBody] string externalId, TitanDbContext db) => {
            // Placeholder: Lógica de sincronização com Pluggy
            return Results.Ok(new { message = "Sincronização iniciada com sucesso" });
        });
    }
}
