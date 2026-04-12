import { PrismaClient } from '@prisma/client';
import { FaturaSchema, PagamentoSchema } from './financeiro.schema';

export class FinanceiroService {
    constructor(private prisma: PrismaClient) { }

    async createFatura(data: FaturaSchema) {
        return this.prisma.fatura.create({
            data: {
                assinanteId: data.assinanteId,
                valor: data.valor,
                vencimento: new Date(data.vencimento),
                status: data.status,
            },
        });
    }

    async listFaturas(assinanteId?: string) {
        return this.prisma.fatura.findMany({
            where: assinanteId ? { assinanteId } : {},
            include: {
                assinante: { select: { nome: true } },
                pagamento: true,
            },
            orderBy: { vencimento: 'desc' },
        });
    }

    async processPagamento(data: PagamentoSchema) {
        return this.prisma.$transaction(async (tx) => {
            const pagamento = await tx.pagamento.create({
                data: {
                    faturaId: data.faturaId,
                    metodo: data.metodo,
                    valor: data.valor,
                },
            });

            await tx.fatura.update({
                where: { id: data.faturaId },
                data: { status: 'PAGO' },
            });

            return pagamento;
        });
    }
}
