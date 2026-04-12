import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}

const redisPluginCallback: FastifyPluginAsync = async (fastify) => {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    fastify.decorate('redis', redis);

    fastify.addHook('onClose', async (instance) => {
        await instance.redis.quit();
    });
};

export const redisPlugin = fp(redisPluginCallback);
