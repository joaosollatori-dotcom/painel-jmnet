import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TelefoniaService } from './telefonia.service';
import { ramalSchema, linhaMVNOSchema } from './telefonia.schema';

export async function telefoniaRoutes(server: FastifyInstance) {
    const service = new TelefoniaService(server.prisma);

    server.post<{ Body: any }>('/ramais', {
        schema: { body: ramalSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        const ramal = await service.createRamal(data as any);
        return reply.status(201).send({ data: ramal, success: true });
    });

    server.post<{ Body: any }>('/mvno/ativar', {
        schema: { body: linhaMVNOSchema }
    }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const data = request.body;
        const linha = await service.activateMVNO(data as any);
        return reply.status(201).send({ data: linha, success: true });
    });
}
