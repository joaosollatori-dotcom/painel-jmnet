import { server, setupServer } from '../apps/api/src/server';

let initialized = false;

export default async (req: any, res: any) => {
    if (!initialized) {
        await setupServer();
        initialized = true;
    }
    await server.ready();
    server.server.emit('request', req, res);
};
