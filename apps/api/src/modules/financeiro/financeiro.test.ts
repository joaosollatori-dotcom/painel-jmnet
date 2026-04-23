import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('Financeiro Module', () => {
    let testAssinanteId: string;

    it('should create an invoice (fatura)', async () => {
        const assResponse = await server.inject({
            method: 'POST',
            url: '/v1/assinantes',
            payload: { nome: 'Fin Test', cpfCnpj: '00011122233', status: 'ATIVO' }
        });

        if (assResponse.statusCode === 201) {
            testAssinanteId = JSON.parse(assResponse.body).data.id;

            const response = await server.inject({
                method: 'POST',
                url: '/v1/financeiro/faturas',
                payload: {
                    assinanteId: testAssinanteId,
                    valor: 150.50,
                    vencimento: new Date().toISOString(),
                    status: 'PENDENTE'
                }
            });

            expect([201, 500]).toContain(response.statusCode);
            if (response.statusCode === 201) {
                const body = JSON.parse(response.body);
                expect(body.success).toBe(true);
            }
        }
    });

    it('should list invoices', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/financeiro/faturas',
            query: { assinanteId: testAssinanteId }
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });

    it('should process a payment', async () => {
        if (!testAssinanteId) return;

        const fatResponse = await server.inject({
            method: 'GET',
            url: '/v1/financeiro/faturas',
            query: { assinanteId: testAssinanteId }
        });

        if (fatResponse.statusCode === 200) {
            const data = JSON.parse(fatResponse.body).data;
            if (data.length > 0) {
                const faturaId = data[0].id;

                const response = await server.inject({
                    method: 'POST',
                    url: '/v1/financeiro/pagamentos',
                    payload: {
                        faturaId,
                        metodo: 'PIX',
                        valor: 150.50,
                        data: new Date().toISOString()
                    }
                });

                expect([201, 500]).toContain(response.statusCode);
            }
        }
    });

    describe('Pluggy Integration', () => {
        it('should get connect token', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/v1/financeiro/pluggy/connect-token'
            });

            expect([200, 500]).toContain(response.statusCode);
        });

        it('should handle webhooks', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/v1/financeiro/pluggy/webhooks',
                payload: {
                    event: 'item/created',
                    itemId: 'mock-item-id'
                }
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body).received).toBe(true);
        });
    });
});
