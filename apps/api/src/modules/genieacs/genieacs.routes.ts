import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GenieACSService } from './genieacs.service.js';

export async function genieacsRoutes(server: FastifyInstance) {
    const service = new GenieACSService();

    // Listar todos os dispositivos
    server.get('/devices', async () => {
        return { data: await service.listDevices(), success: true };
    });

    // Detalhe de um dispositivo
    server.get<{ Params: { id: string } }>('/devices/:id', async (request) => {
        const { id } = request.params;
        return { data: await service.getDeviceDetails(id), success: true };
    });

    // Consultar sinal óptico (Endpoint otimizado para o Chat)
    server.get<{ Params: { id: string } }>('/devices/:id/signal', async (request) => {
        const { id } = request.params;
        return { data: await service.getSignalData(id), success: true };
    });

    // Ações Remotas
    server.post<{ Params: { id: string } }>('/devices/:id/reboot', async (request) => {
        const { id } = request.params;
        await service.reboot(id);
        return { success: true, message: 'Reboot enfileirado' };
    });

    server.post<{ Params: { id: string } }>('/devices/:id/refresh', async (request) => {
        const { id } = request.params;
        await service.refresh(id);
        return { success: true, message: 'Parâmetros atualizados no ACS' };
    });
}
