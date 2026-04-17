console.log('API_BRIDGE: Loading server...');
import { server, setupServer } from '../apps/api/src/server.js';

console.log('API_BRIDGE: Starting initialization...');
const initPromise = setupServer()
    .then(() => {
        console.log('API_BRIDGE: Setup completed successfully');
        return true;
    })
    .catch(err => {
        console.error('API_BRIDGE: Setup FAILED', err);
        throw err;
    });

export default async (req: any, res: any) => {
    try {
        await initPromise;
        await server.ready();
        console.log(`API_BRIDGE: Handling request ${req.url}`);
        server.server.emit('request', req, res);
    } catch (err: any) {
        console.error('API_BRIDGE: Runtime error', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: 'Internal Server Error',
            message: err.message,
            token_present: !!process.env.WHATSAPP_VERIFY_TOKEN,
            db_present: !!process.env.DATABASE_URL
        }));
    }
};
