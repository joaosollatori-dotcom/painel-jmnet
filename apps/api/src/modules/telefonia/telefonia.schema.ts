import { z } from 'zod';

export const ramalSchema = z.object({
    numero: z.string().min(3),
    senha: z.string().min(6),
    contexto: z.string().default('default'),
    callerId: z.string().optional(),
});

export const linhaMVNOSchema = z.object({
    assinanteId: z.string().uuid(),
    iccID: z.string().min(19).max(20),
    msisdn: z.string().min(11), // numero de telefone com DDD
    planoId: z.string(),
});

export type RamalSchema = z.infer<typeof ramalSchema>;
export type LinhaMVNOSchema = z.infer<typeof linhaMVNOSchema>;
