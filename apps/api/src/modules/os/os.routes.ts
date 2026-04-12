import { FastifyInstance } from 'fastify';
import { OSService } from './os.service';
import { osSchema } from './os.schema';

export async function osRoutes(server: FastifyInstance) {
    const service = new OSService(server.prisma);

    server.get('/', async (request) => {
        const filters = request.query as any;
        const data = await service.list(filters);
        return { data, success: true };
    });

    server.post('/', {
        schema: { body: osSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        const os = await service.create(data);
        return reply.status(201).send({ data: os, success: true });
    });

    server.get('/mapa', async () => {
        const data = await service.getTechnicalMap();
        return { data, success: true };
    });

    server.patch<{ Params: { id: string }; Body: { tecnicoId: string; dataAgendamento: string } }>('/:id/agendar', async (request) => {
        const { id } = request.params;
        const { tecnicoId, dataAgendamento } = request.body;
        const data = await service.schedule(id, tecnicoId, dataAgendamento);
        return { data, success: true };
    });
}
