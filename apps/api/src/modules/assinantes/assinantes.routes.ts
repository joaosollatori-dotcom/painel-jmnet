import { FastifyInstance } from 'fastify';
import { AssinantesService } from './assinantes.service';
import { assinanteSchema } from './assinantes.schema';

export async function assinantesRoutes(server: FastifyInstance) {
    const service = new AssinantesService(server.prisma);

    server.get('/', async (_request, _reply) => {
        const assinantes = await service.list();
        return { data: assinantes, success: true };
    });

    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const { id } = request.params;
        const assinante = await service.getById(id);
        if (!assinante) {
            return reply.status(404).send({ message: 'Assinante não encontrado', success: false });
        }
        return { data: assinante, success: true };
    });

    server.post('/', {
        schema: {
            body: assinanteSchema,
        }
    }, async (request, reply) => {
        const data = request.body as any;
        const assinante = await service.create(data);
        return reply.status(201).send({ data: assinante, success: true });
    });
}
