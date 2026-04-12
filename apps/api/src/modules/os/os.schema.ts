import { z } from 'zod';

export const osSchema = z.object({
    assinanteId: z.string().uuid(),
    tecnicoId: z.string().uuid().optional(),
    tipo: z.enum(['INSTALACAO', 'REPARO', 'RETIRADA', 'MUDANCA_ENDERECO']),
    status: z.enum(['ABERTA', 'EM_EXECUCAO', 'FINALIZADA', 'CANCELADA']).default('ABERTA'),
    descricao: z.string().min(5),
    prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
    dataAgendamento: z.string().datetime().optional(),
});

export const locationSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

export type OSSchema = z.infer<typeof osSchema>;
