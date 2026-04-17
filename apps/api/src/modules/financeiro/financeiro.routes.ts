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
}
