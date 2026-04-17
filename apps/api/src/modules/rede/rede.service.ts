import { PrismaClient } from '@prisma/client';
import { OLTSchema, ONUSchema } from './rede.schema.js';

export class RedeService {
    constructor(private prisma: PrismaClient) { }

    async createOLT(data: OLTSchema) {
        return this.prisma.oLT.create({
            data: data as any,
        });
    }

    async listOLTs() {
        return this.prisma.oLT.findMany({
            include: { _count: { select: { onus: true } } },
        });
    }

    async provisionONU(data: ONUSchema) {
        // Aqui entraria a lógica de SNMP/TR-069 futuramente
        return this.prisma.oNU.create({
            data: {
                ...data,
                status: 'ONLINE', // Mock de provisionamento bem sucedido
            } as any,
        });
    }

    async listONUs(oltId?: string) {
        return this.prisma.oNU.findMany({
            where: oltId ? { oltId } : {},
            include: { olt: { select: { nome: true } } },
        });
    }
}
