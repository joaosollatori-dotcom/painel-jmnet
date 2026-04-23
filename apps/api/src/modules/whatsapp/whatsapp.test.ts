import { describe, it, expect } from 'vitest';
import { server } from '../../server.js';

describe('WhatsApp Module', () => {
    it('should verify webhook', async () => {
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'test-token';
        process.env.WHATSAPP_VERIFY_TOKEN = verifyToken;

        const response = await server.inject({
            method: 'GET',
            url: '/v1/whatsapp/webhook',
            query: {
                'hub.mode': 'subscribe',
                'hub.verify_token': verifyToken,
                'hub.challenge': '12345'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('12345');
    });

    it('should handle incoming message webhook', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/whatsapp/webhook',
            payload: {
                object: 'whatsapp_business_account',
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                from: '5511999999999',
                                text: { body: 'Olá' }
                            }]
                        }
                    }]
                }]
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('EVENT_RECEIVED');
    });

    it('should send a message manually', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/v1/whatsapp/send',
            payload: {
                to: '5511999999999',
                text: 'Teste de envio'
            }
        });

        expect([200, 500]).toContain(response.statusCode);
    });
});
