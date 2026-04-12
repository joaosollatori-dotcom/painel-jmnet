import { FastifyInstance } from 'fastify';
import { RedeService } from './rede.service';
import { oltSchema, onuSchema } from './rede.schema';

export async function redeRoutes(server: FastifyInstance) {
    const service = new RedeService(server.prisma);

    server.get('/olts', async () => {
        return { data: await service.listOLTs(), success: true };
    });

    server.post('/olts', {
        schema: { body: oltSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        return reply.status(201).send({ data: await service.createOLT(data), success: true });
    });

    server.get('/onus', async (request) => {
        const { oltId } = request.query as { oltId?: string };
        return { data: await service.listONUs(oltId), success: true };
    });

    server.post('/onus/provision', {
        schema: { body: onuSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        return reply.status(201).send({ data: await service.provisionONU(data), success: true });
    });
}
