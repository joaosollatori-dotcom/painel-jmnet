import { readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

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

        // Resolve o caminho absoluto para evitar erros de importação relativa na Vercel
        const serverPath = resolve(process.cwd(), 'apps/api/dist/server.js');

        if (!existsSync(serverPath)) {
            throw new Error(`Server file not found at: ${serverPath}`);
        }

        // @ts-ignore
        const { server, setupServer } = await import(`file://${serverPath}`);

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
