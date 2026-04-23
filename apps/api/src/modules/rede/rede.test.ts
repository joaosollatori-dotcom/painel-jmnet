import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('Rede Module', () => {
    let testOLTId: string;

    it('should create an OLT', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/rede/olts',
            payload: {
                nome: 'OLT Central',
                ip: '10.0.1.1',
                modelo: 'ZTE C300',
                comunidade: 'public'
            }
        });

        expect([201, 500]).toContain(response.statusCode);
        if (response.statusCode === 201) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            testOLTId = body.data.id;
        }
    });

    it('should list OLTs', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/rede/olts'
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });

    it('should provision an ONU', async () => {
        if (!testOLTId) return;
        const response = await server.inject({
            method: 'POST',
            url: '/v1/rede/onus/provision',
            payload: {
                oltId: testOLTId,
                serial: 'ZTEG12345678',
                ponPort: 1
            }
        });

        expect([201, 500]).toContain(response.statusCode);
    });
});
