import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Queue } from 'bullmq';

declare module 'fastify' {
    interface FastifyInstance {
        queues: {
            cobranca: Queue;
            bloqueio: Queue;
            nfse: Queue;
            sms: Queue;
        };
    }
}

const bullmqPluginCallback: FastifyPluginAsync = async (fastify) => {
    const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    };

    const queues = {
        cobranca: new Queue('cobranca-queue', { connection }),
        bloqueio: new Queue('bloqueio-queue', { connection }),
        nfse: new Queue('nfse-queue', { connection }),
        sms: new Queue('sms-queue', { connection }),
    };

    fastify.decorate('queues', queues);

    fastify.addHook('onClose', async () => {
        for (const queue of Object.values(queues)) {
            await queue.close();
        }
    });
};

export const bullmqPlugin = fp(bullmqPluginCallback);
