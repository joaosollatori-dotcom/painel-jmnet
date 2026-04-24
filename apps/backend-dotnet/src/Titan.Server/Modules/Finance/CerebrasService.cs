using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Titan.Server.Modules.Finance;

public class CerebrasService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public CerebrasService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Cerebras:ApiKey"];
    }

    public async Task<string?> CategorizeTransactionAsync(string description, decimal amount)
    {
        if (string.IsNullOrEmpty(_apiKey)) return "Uncategorized";

        var prompt = $"Categorize a seguinte transação financeira: '{description}' de valor {amount:C}. " +
                     "Responda apenas com UMA palavra que descreva a categoria (ex: Aluguel, Alimentação, Salário, Software).";

        var requestBody = new
        {
            model = "llama3-70b", // Exemplo de modelo suportado pela Cerebras
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            temperature = 0.1
        };

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        
        var response = await _httpClient.PostAsJsonAsync("https://api.cerebras.ai/v1/chat/completions", requestBody);
        
        if (!response.IsSuccessStatusCode) return "AI Failure";

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
    }
}
