import { PrismaClient } from '@prisma/client';
import { AssinanteSchema } from './assinantes.schema.js';

export class AssinantesService {
    constructor(private prisma: PrismaClient) { }

    async create(data: AssinanteSchema) {
        return this.prisma.assinante.create({
            data: {
                nome: data.nome,
                cpfCnpj: data.cpfCnpj,
                status: data.status,
                contatos: data.contatos ? {
                    create: data.contatos as any,
                } : undefined,
                enderecos: data.enderecos ? {
                    create: data.enderecos as any,
                } : undefined,
            },
            include: {
                contatos: true,
                enderecos: true,
            },
        });
    }

    async list() {
        return this.prisma.assinante.findMany({
            include: {
                contatos: true,
                enderecos: true,
            },
        });
    }

    async getById(id: string) {
        return this.prisma.assinante.findUnique({
            where: { id },
            include: {
                contatos: true,
                enderecos: true,
            },
        });
    }
}
