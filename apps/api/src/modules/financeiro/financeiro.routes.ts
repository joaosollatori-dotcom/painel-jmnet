import { FastifyInstance } from 'fastify';
import { FinanceiroService } from './financeiro.service';
import { faturaSchema, pagamentoSchema } from './financeiro.schema';

export async function financeiroRoutes(server: FastifyInstance) {
    const service = new FinanceiroService(server.prisma);

    server.get<{ Querystring: { assinanteId?: string } }>('/faturas', async (request, _reply) => {
        const { assinanteId } = request.query;
        const faturas = await service.listFaturas(assinanteId);
        return { data: faturas, success: true };
    });

    server.post('/faturas', {
        schema: { body: faturaSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        const fatura = await service.createFatura(data);
        return reply.status(201).send({ data: fatura, success: true });
    });

    server.post('/pagamentos', {
        schema: { body: pagamentoSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        const pagamento = await service.processPagamento(data);
        return reply.status(201).send({ data: pagamento, success: true });
    });
}
