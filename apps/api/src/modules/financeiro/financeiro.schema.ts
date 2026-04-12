import { z } from 'zod';

export const faturaSchema = z.object({
    assinanteId: z.string().uuid(),
    valor: z.number().positive(),
    vencimento: z.string().datetime(),
    status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO']).default('PENDENTE'),
});

export const pagamentoSchema = z.object({
    faturaId: z.string().uuid(),
    metodo: z.enum(['PIX', 'BOLETO', 'CARTAO']),
    valor: z.number().positive(),
});

export type FaturaSchema = z.infer<typeof faturaSchema>;
export type PagamentoSchema = z.infer<typeof pagamentoSchema>;
