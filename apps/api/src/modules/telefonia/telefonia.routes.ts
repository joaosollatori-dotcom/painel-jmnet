import { FastifyInstance } from 'fastify';
import { TelefoniaService } from './telefonia.service';
import { ramalSchema, linhaMVNOSchema } from './telefonia.schema';

export async function telefoniaRoutes(server: FastifyInstance) {
    const service = new TelefoniaService(server.prisma);

    server.post('/ramais', {
        schema: { body: ramalSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        const ramal = await service.createRamal(data);
        return reply.status(201).send({ data: ramal, success: true });
    });

    server.post('/mvno/ativar', {
        schema: { body: linhaMVNOSchema }
    }, async (request, reply) => {
        const data = request.body as any;
        const linha = await service.activateMVNO(data);
        return reply.status(201).send({ data: linha, success: true });
    });
}
