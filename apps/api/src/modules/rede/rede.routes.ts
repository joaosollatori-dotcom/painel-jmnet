import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RedeService } from './rede.service';
import { oltSchema, onuSchema } from './rede.schema';

export async function redeRoutes(server: FastifyInstance) {
    const service = new RedeService(server.prisma);

    server.get('/olts', async () => {
        return { data: await service.listOLTs(), success: true };
    });

    server.post<{ Body: any }>('/olts', {
        schema: { body: oltSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        return reply.status(201).send({ data: await service.createOLT(data), success: true });
    });

    server.get<{ Querystring: any }>('/onus', async (request: FastifyRequest<{ Querystring: any }>) => {
        const { oltId } = request.query;
        return { data: await service.listONUs(oltId), success: true };
    });

    server.post<{ Body: any }>('/onus/provision', {
        schema: { body: onuSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        return reply.status(201).send({ data: await service.provisionONU(data), success: true });
    });
}
