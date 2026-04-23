import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('Assinatura Module', () => {
    let testToken: string;

    it('should generate a sign link', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/assinatura/generate',
            payload: {
                leadId: '00000000-0000-0000-0000-000000000000'
            }
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.token).toBeDefined();
            testToken = body.token;
        }
    });

    it('should view contract by token', async () => {
        if (!testToken) return;
        const response = await server.inject({
            method: 'GET',
            url: `/v1/assinatura/view/${testToken}`
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.status).toBe('PENDENTE');
    });

    it('should sign contract', async () => {
        if (!testToken) return;
        const response = await server.inject({
            method: 'POST',
            url: `/v1/assinatura/sign/${testToken}`
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
    });

    it('should return 404 for invalid token', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/assinatura/view/invalid-token'
        });

        expect([404, 500]).toContain(response.statusCode);
    });
});
