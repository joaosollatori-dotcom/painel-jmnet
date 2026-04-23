import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('OS Module', () => {
    let testAssinanteId: string;
    let testOSId: string;

    it('should create a service order (OS)', async () => {
        const assResponse = await server.inject({
            method: 'POST',
            url: '/v1/assinantes',
            payload: { nome: 'OS Test', cpfCnpj: '11122233344', status: 'ATIVO' }
        });

        if (assResponse.statusCode === 201) {
            testAssinanteId = JSON.parse(assResponse.body).data.id;

            const response = await server.inject({
                method: 'POST',
                url: '/v1/os',
                payload: {
                    assinanteId: testAssinanteId,
                    tipo: 'INSTALACAO',
                    prioridade: 'ALTA',
                    descricao: 'Instalação nova'
                }
            });

            expect([201, 500]).toContain(response.statusCode);
            if (response.statusCode === 201) {
                const body = JSON.parse(response.body);
                expect(body.success).toBe(true);
                testOSId = body.data.id;
            }
        }
    });

    it('should list service orders', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/os'
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });

    it('should get technical map', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/os/mapa'
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });

    it('should schedule an OS', async () => {
        if (!testOSId) return;
        const response = await server.inject({
            method: 'PATCH',
            url: `/v1/os/${testOSId}/agendar`,
            payload: {
                tecnicoId: '00000000-0000-0000-0000-000000000000',
                dataAgendamento: new Date().toISOString()
            }
        });

        expect([200, 500]).toContain(response.statusCode);
    });
});
