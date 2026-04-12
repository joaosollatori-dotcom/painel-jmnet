import { PrismaClient } from '@prisma/client';
import { AssinanteSchema } from './assinantes.schema';

export class AssinantesService {
    constructor(private prisma: PrismaClient) { }

    async create(data: AssinanteSchema) {
        return this.prisma.assinante.create({
            data: {
                nome: data.nome,
                cpfCnpj: data.cpfCnpj,
                status: data.status,
                contatos: {
                    create: data.contatos,
                },
                enderecos: {
                    create: data.enderecos,
                },
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
