import Cerebras from '@cerebras/cerebras_cloud_sdk';

const client = new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY || 'MISSING_KEY',
});

export const cerebrasService = {
    /**
     * Resume uma conversa inicial de chat em no máximo 150 caracteres.
     */
    async summarizeChatOpening(initialMessages: { role: string, content: string }[]): Promise<string> {
        try {
            const messagesContent = initialMessages.map(m => `${m.role}: ${m.content}`).join('\n');

            const response = await client.chat.completions.create({
                model: 'llama3.1-8b', // Ou outro modelo disponível no Cerebras
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um assistente de triagem de um Provedor de Internet (ISP). Sua tarefa é resumir o problema do cliente em no máximo 150 caracteres. Seja direto e técnico.'
                    },
                    {
                        role: 'user',
                        content: `Resuma o seguinte início de atendimento:\n\n${messagesContent}`
                    }
                ],
                max_tokens: 60,
                temperature: 0.1,
            }) as any;

            return response.choices[0]?.message?.content?.slice(0, 150) || 'Sem resumo disponível.';
        } catch (error) {
            console.error('Erro ao chamar Cerebras AI:', error);
            return 'Erro ao gerar resumo automático por IA.';
        }
    }
};
