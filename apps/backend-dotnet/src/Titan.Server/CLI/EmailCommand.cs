using System;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;

namespace Titan.Server.CLI;

public interface ICliCommand
{
    string Name { get; }
    Task ExecuteAsync(string[] args);
}

public class EmailCommand : ICliCommand
{
    public string Name => "email";

    public async Task ExecuteAsync(string[] args)
    {
        if (args.Length > 0 && args[0] == "config")
        {
            await HandleConfigFlow();
        }
        else
        {
            Console.WriteLine("Uso: email config");
        }
    }

    private async Task HandleConfigFlow()
    {
        Console.WriteLine("--- Configuração de E-mail ---");
        Console.WriteLine("Use as setas para selecionar uma opção:");
        
        var options = new[] { "add", "delete", "update" };
        int selectedIndex = 0;
        
        // Simulação de navegação por setas (requer loop de leitura de tecla)
        bool selecting = true;
        while (selecting)
        {
            for (int i = 0; i < options.Length; i++)
            {
                if (i == selectedIndex)
                    Console.Write("> ");
                else
                    Console.Write("  ");
                Console.WriteLine(options[i]);
            }

            var key = Console.ReadKey(true).Key;
            if (key == ConsoleKey.UpArrow) selectedIndex = Math.Max(0, selectedIndex - 1);
            else if (key == ConsoleKey.DownArrow) selectedIndex = Math.Min(options.Length - 1, selectedIndex + 1);
            else if (key == ConsoleKey.Enter) selecting = false;
            
            // Limpa as linhas anteriores para o efeito visual
            Console.SetCursorPosition(0, Console.CursorTop - options.Length);
        }

        string action = options[selectedIndex];
        Console.WriteLine($"Selecionado: {action}");

        if (action == "add")
        {
            Console.Write("Digite o e-mail: ");
            string? email = Console.ReadLine();
            
            Console.WriteLine("Selecione 'enable' para prosseguir:");
            if (Console.ReadLine()?.ToLower() == "enable")
            {
                Console.Write("Solicita a senha/token de aplicativo: ");
                // No mundo real, ocultaríamos a entrada
                string? token = Console.ReadLine();
                
                Console.WriteLine("Selecione a categoria:");
                var categories = new[] { "Financeiro", "RH", "Processos", "Gestão", "Comercial" };
                // ... lógica similar de seleção por setas ...
                
                Console.WriteLine($"E-mail {email} configurado com sucesso para a categoria.");
                // Aqui salvaríamos na base de dados/configuração do sistema
            }
        }
    }
}
