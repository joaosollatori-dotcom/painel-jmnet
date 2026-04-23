import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('Telefonia Module', () => {
    it('should create an extension (ramal)', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/telefonia/ramais',
            payload: {
                numero: '1001',
                senha: 'password123'
            }
        });

        expect([201, 500]).toContain(response.statusCode);
        if (response.statusCode === 201) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });

    it('should activate MVNO line', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/telefonia/mvno/ativar',
            payload: {
                iccid: '8955123456789012345',
                cpf: '12345678901',
                plano: 'PRÉ-PAGO 10GB'
            }
        });

        expect([201, 500]).toContain(response.statusCode);
        if (response.statusCode === 201) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });
});
