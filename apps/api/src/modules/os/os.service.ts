import { PrismaClient } from '@prisma/client';
import { OSSchema } from './os.schema.js';

export class OSService {
    constructor(private prisma: PrismaClient) { }

    async create(data: OSSchema) {
        return this.prisma.ordemServico.create({
            data: {
                assinanteId: data.assinanteId,
                tecnicoId: data.tecnicoId,
                tipo: data.tipo,
                status: data.status,
                descricao: data.descricao,
                prioridade: data.prioridade,
                dataAgendamento: data.dataAgendamento ? new Date(data.dataAgendamento) : null,
            },
            include: {
                assinante: {
                    include: {
                        enderecos: true,
                    }
                },
                tecnico: {
                    select: { id: true, email: true }
                }
            }
        });
    }

    async list(filters: { status?: string, tecnicoId?: string } = {}) {
        return this.prisma.ordemServico.findMany({
            where: filters,
            include: {
                assinante: {
                    include: {
                        enderecos: true
                    }
                },
                tecnico: { select: { email: true } }
            },
            orderBy: { dataAgendamento: 'asc' }
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.ordemServico.update({
            where: { id },
            data: { status }
        });
    }

    async schedule(id: string, tecnicoId: string, dataAgendamento: string) {
        return this.prisma.ordemServico.update({
            where: { id },
            data: {
                tecnicoId,
                dataAgendamento: new Date(dataAgendamento),
                status: 'ABERTA'
            }
        });
    }

    // Busca técnicos e suas OSs para o mapa
    async getTechnicalMap() {
        const tecnicos = await this.prisma.user.findMany({
            where: { role: 'TECNICO' },
            select: {
                id: true,
                email: true,
                assignedOS: {
                    where: { status: { in: ['ABERTA', 'EM_EXECUCAO'] } },
                    include: {
                        assinante: {
                            include: {
                                enderecos: {
                                    where: { tipo: 'INSTALACAO' }
                                }
                            }
                        }
                    }
                }
            }
        });
        return tecnicos;
    }
}
