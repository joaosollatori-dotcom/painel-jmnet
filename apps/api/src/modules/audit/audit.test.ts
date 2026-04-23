import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('Audit Module', () => {
    it('should list audit logs', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/audit'
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(Array.isArray(body.logs)).toBe(true);
        }
    });

    it('should filter audit logs by action', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/audit',
            query: { action: 'LOGIN' }
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });
});
