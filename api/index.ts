import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

export default async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');

    const diagnostics = {
        cwd: process.cwd(),
        root_files: readdirSync('.'),
        apps_exists: existsSync('./apps'),
        apps_api_exists: existsSync('./apps/api'),
        env_keys: Object.keys(process.env),
    };

    try {
        console.log('DIAGNOSTICS:', diagnostics);

        // Tenta encontrar o caminho correto do servidor (local ou Vercel)
        const serverPath = existsSync('./apps/api/src/server.js')
            ? './apps/api/src/server.js'
            : '../apps/api/src/server.js';

        // @ts-ignore
        const { server, setupServer } = await import(serverPath);

        await setupServer();
        await server.ready();

        server.server.emit('request', req, res);
    } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({
            error: 'Bridge Diagnostic',
            diagnostics,
            message: err.message,
            stack: err.stack
        }, null, 2));
    }
};
