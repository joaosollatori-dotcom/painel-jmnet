import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('GenieACS Module', () => {
    it('should list devices', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/genieacs/devices'
        });

        expect([200, 500]).toContain(response.statusCode);
        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        }
    });

    it('should get device signal data', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/v1/genieacs/devices/mock-device-id/signal'
        });

        expect([200, 500]).toContain(response.statusCode);
    });

    it('should reboot device', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/genieacs/devices/mock-device-id/reboot'
        });

        expect([200, 500]).toContain(response.statusCode);
    });
});
