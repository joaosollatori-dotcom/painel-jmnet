import { z } from 'zod';

export const oltSchema = z.object({
    nome: z.string().min(2),
    ip: z.string().ip(),
    modelo: z.enum(['INTELBRAS', 'ZTE', 'HUAWEI']),
    comunidade: z.string().default('public'),
});

export const onuSchema = z.object({
    oltId: z.string().uuid(),
    serial: z.string().min(8),
    ponPort: z.number().int().min(0),
});

export type OLTSchema = z.infer<typeof oltSchema>;
export type ONUSchema = z.infer<typeof onuSchema>;
