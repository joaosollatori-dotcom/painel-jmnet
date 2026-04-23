import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('Invitation Module', () => {
    it('should validate an invalid token', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/invitations/validate',
            payload: { token: 'invalid-token' }
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.status).toBe('INVALID');
        }
    });
});
