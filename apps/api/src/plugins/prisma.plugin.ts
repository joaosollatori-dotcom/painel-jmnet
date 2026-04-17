import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

const prismaPluginCallback: FastifyPluginAsync = async (fastify) => {
    const prisma = new PrismaClient({
        log: ['error', 'warn'],
    });

    // Tenta conectar mas não trava a inicialização do Fastify se falhar (importante para o Webhook da Meta carregar mesmo sem DB)
    prisma.$connect()
        .then(() => {
            fastify.log.info('Prisma connected successfully');
        })
        .catch((err) => {
            fastify.log.error(`Prisma connection failed: ${err.message}`);
        });

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async (instance) => {
        await instance.prisma.$disconnect();
    });
};

export const prismaPlugin = fp(prismaPluginCallback);
