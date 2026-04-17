import { server, setupServer } from '../apps/api/src/server';

export default async (req: any, res: any) => {
    await setupServer();
    await server.ready();
    server.server.emit('request', req, res);
};
