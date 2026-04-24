using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Titan.Server.Modules.Identity;
using System.Security.Claims;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.Authentication;
using OpenIddict.Server.AspNetCore;
using Microsoft.AspNetCore;

namespace Titan.Server.Modules.Identity;

public static class IdentityEndpoints
{
    public static void MapIdentityEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/connect/token", async (
            HttpContext httpContext,
            [FromServices] UserManager<ApplicationUser> userManager,
            [FromServices] SignInManager<ApplicationUser> signInManager) =>
        {
            var request = httpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("O pedido OpenID Connect não pôde ser recuperado.");

            if (request.IsPasswordGrantType())
            {
                var user = await userManager.FindByNameAsync(request.Username!);
                if (user == null)
                {
                    return Results.BadRequest(new OpenIddictResponse
                    {
                        Error = OpenIddictConstants.Errors.InvalidGrant,
                        ErrorDescription = "O nome de usuário ou senha está incorreto."
                    });
                }

                var result = await signInManager.CheckPasswordSignInAsync(user, request.Password!, lockoutOnFailure: true);
                if (!result.Succeeded)
                {
                    return Results.BadRequest(new OpenIddictResponse
                    {
                        Error = OpenIddictConstants.Errors.InvalidGrant,
                        ErrorDescription = "O nome de usuário ou senha está incorreto."
                    });
                }

                // Cria o principal de autenticação
                var principal = await signInManager.CreateUserPrincipalAsync(user);

                // Define os escopos permitidos
                principal.SetScopes(new[]
                {
                    OpenIddictConstants.Scopes.OpenId,
                    OpenIddictConstants.Scopes.Email,
                    OpenIddictConstants.Scopes.Profile,
                    OpenIddictConstants.Scopes.OfflineAccess
                }.Intersect(request.GetScopes()));

                foreach (var claim in principal.Claims)
                {
                    claim.SetDestinations(OpenIddictConstants.Destinations.AccessToken);
                }

                return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            return Results.BadRequest(new OpenIddictResponse
            {
                Error = OpenIddictConstants.Errors.UnsupportedGrantType,
                ErrorDescription = "O tipo de concessão especificado não é suportado."
            });
        });
    }
}
