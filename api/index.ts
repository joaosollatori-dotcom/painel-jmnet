import { server, setupServer } from '../apps/api/src/server';

let initialized = false;

export default async (req: any, res: any) => {
    try {
        if (!initialized) {
            await setupServer();
            initialized = true;
        }
        await server.ready();
        server.server.emit('request', req, res);
    } catch (err: any) {
        console.error('SERVERLESS_FUNCTION_CRASH:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({
            error: 'Internal Server Error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }));
    }
};
