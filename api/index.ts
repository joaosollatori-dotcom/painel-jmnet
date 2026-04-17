import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

export default async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');

    const diagnostics = {
        cwd: process.cwd(),
        root_files: readdirSync('.'),
        apps_exists: existsSync('../apps'),
        apps_api_exists: existsSync('../apps/api'),
        env_keys: Object.keys(process.env).filter(k => k.includes('WHATSAPP') || k.includes('DATABASE')),
    };

    try {
        console.log('DIAGNOSTICS:', diagnostics);

        // Tentativa de importação dinâmica para não quebrar no load
        // @ts-ignore
        const { server, setupServer } = await import('../apps/api/src/server.js');

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
