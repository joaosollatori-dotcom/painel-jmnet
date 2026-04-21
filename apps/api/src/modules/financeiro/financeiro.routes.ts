import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FinanceiroService } from './financeiro.service.js';
import { faturaSchema, pagamentoSchema } from './financeiro.schema.js';

export async function financeiroRoutes(server: FastifyInstance) {
    const service = new FinanceiroService(server.prisma);

    server.get<{ Querystring: { assinanteId?: string } }>('/faturas', async (request, _reply) => {
        const { assinanteId } = request.query;
        const faturas = await service.listFaturas(assinanteId);
        return { data: faturas, success: true };
    });

    server.post<{ Body: any }>('/faturas', {
        schema: { body: faturaSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        const fatura = await service.createFatura(data as any);
        return reply.status(201).send({ data: fatura, success: true });
    });

    server.post<{ Body: any }>('/pagamentos', {
        schema: { body: pagamentoSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        const pagamento = await service.processPagamento(data as any);
        return reply.status(201).send({ data: pagamento, success: true });
    });

    // --- Pluggy Open Finance Routes ---

    server.get('/pluggy/connect-token', async () => {
        const { getConnectToken } = await import('./pluggy.service.js');
        const token = await getConnectToken();
        return { connectToken: token.accessToken, success: true };
    });

    server.get<{ Params: { itemId: string } }>('/pluggy/accounts/:itemId', async (request) => {
        const { getAccounts } = await import('./pluggy.service.js');
        const accounts = await getAccounts(request.params.itemId);
        return { data: accounts, success: true };
    });

    server.get<{ Params: { accountId: string }, Querystring: { from?: string, to?: string } }>('/pluggy/transactions/:accountId', async (request) => {
        const { getTransactions } = await import('./pluggy.service.js');
        const { from, to } = request.query;
        const transactions = await getTransactions(request.params.accountId, from, to);
        return { data: transactions, success: true };
    });

    server.post('/pluggy/webhooks', async (request, reply) => {
        const { handleItemCreated, handleItemUpdated, handleItemError } = await import('./pluggy.service.js');
        const event = request.body as any;

        console.log('Received Pluggy webhook:', event.event);

        switch (event.event) {
            case 'item/created':
                await handleItemCreated(event.itemId);
                break;
            case 'item/updated':
                await handleItemUpdated(event.itemId);
                break;
            case 'item/error':
                await handleItemError(event.itemId, event.error);
                break;
        }

        return reply.status(200).send({ received: true });
    });
}
