import { FastifyInstance, FastifyRequest } from 'fastify';
import { AssinantesService } from './assinantes.service.js';
import { assinanteSchema } from './assinantes.schema.js';

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

    server.post<{ Body: any }>('/', {
        schema: {
            body: assinanteSchema,
        }
    }, async (request: FastifyRequest<{ Body: any }>, reply) => {
        const data = request.body;
        const assinante = await service.create(data as any);
        return reply.status(201).send({ data: assinante, success: true });
    });
}
