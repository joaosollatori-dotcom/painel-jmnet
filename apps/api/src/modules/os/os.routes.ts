import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OSService } from './os.service.js';
import { osSchema } from './os.schema.js';

export async function osRoutes(server: FastifyInstance) {
    const service = new OSService(server.prisma);

    server.get<{ Querystring: any }>('/', async (request: FastifyRequest<{ Querystring: any }>) => {
        const filters = request.query;
        const data = await service.list(filters as any);
        return { data, success: true };
    });

    server.post<{ Body: any }>('/', {
        schema: { body: osSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        const os = await service.create(data as any);
        return reply.status(201).send({ data: os, success: true });
    });

    server.get('/mapa', async () => {
        const data = await service.getTechnicalMap();
        return { data, success: true };
    });

    server.patch<{ Params: { id: string }; Body: { tecnicoId: string; dataAgendamento: string } }>('/:id/agendar', async (request: FastifyRequest<{ Params: { id: string }; Body: { tecnicoId: string; dataAgendamento: string } }>) => {
        const { id } = request.params;
        const { tecnicoId, dataAgendamento } = request.body;
        const data = await service.schedule(id, tecnicoId, dataAgendamento);
        return { data, success: true };
    });
}
