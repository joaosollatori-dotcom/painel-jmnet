import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { prismaPlugin } from './plugins/prisma.plugin';
import { assinantesRoutes } from './modules/assinantes/assinantes.routes';
import { financeiroRoutes } from './modules/financeiro/financeiro.routes';
import { redeRoutes } from './modules/rede/rede.routes';
import { osRoutes } from './modules/os/os.routes';
import { telefoniaRoutes } from './modules/telefonia/telefonia.routes';
import { redisPlugin } from './plugins/redis.plugin';
import { bullmqPlugin } from './plugins/bullmq.plugin';
import { setupWorkers } from './jobs';

const server = Fastify({
    logger: true,
});

async function main() {
    // Register Plugins
    await server.register(cors);
    await server.register(jwt, {
        secret: process.env.JWT_SECRET || 'super-secret-key',
    });

    await server.register(swagger, {
        openapi: {
            info: {
                title: 'TITÃ | ISP API',
                description: 'CRM/ERP para Provedores de Internet',
                version: '0.1.0',
            },
        },
    });

    await server.register(swaggerUi, {
        routePrefix: '/docs',
    });

    await server.register(prismaPlugin);

    // Register Modules
    await server.register(assinantesRoutes, { prefix: '/v1/assinantes' });
    await server.register(financeiroRoutes, { prefix: '/v1/financeiro' });
    await server.register(redeRoutes, { prefix: '/v1/rede' });
    await server.register(osRoutes, { prefix: '/v1/os' });
    await server.register(telefoniaRoutes, { prefix: '/v1/telefonia' });

    await server.register(redisPlugin);
    await server.register(bullmqPlugin);

    // Start Background Workers
    setupWorkers();

    // Health Check
    server.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start Server
    try {
        const port = Number(process.env.PORT) || 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server ready at http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();
