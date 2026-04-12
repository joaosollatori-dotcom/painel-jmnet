import { z } from 'zod';

export const assinanteSchema = z.object({
    nome: z.string().min(3),
    cpfCnpj: z.string().min(11),
    status: z.enum(['ATIVO', 'BLOQUEADO', 'CANCELADO']).default('ATIVO'),
    contatos: z.array(z.object({
        tipo: z.string(),
        valor: z.string(),
    })).optional(),
    enderecos: z.array(z.object({
        logradouro: z.string(),
        numero: z.string(),
        bairro: z.string(),
        cidade: z.string(),
        estado: z.string(),
        cep: z.string(),
        complemento: z.string().optional(),
        tipo: z.string().default('INSTALACAO'),
    })).optional(),
});

export type AssinanteSchema = z.infer<typeof assinanteSchema>;
