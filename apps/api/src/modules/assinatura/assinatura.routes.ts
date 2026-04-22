import { FastifyInstance } from "fastify";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export async function assinaturaRoutes(fastify: FastifyInstance) {
    // Rota pública para visualizar contrato e assinar
    fastify.get(
        "/view/:token",
        {
            schema: {
                tags: ["Assinatura"],
                summary: "Visualizar Contrato para Assinatura",
                params: z.object({
                    token: z.string(),
                }),
            },
        },
        async (request, reply) => {
            const { token } = request.params as any;

            const assinatura = await fastify.prisma.contratoAssinatura.findUnique({
                where: { token },
            });

            if (!assinatura) {
                return reply.status(404).send({ error: "Link de assinatura inválido ou expirado." });
            }

            if (assinatura.status === "ASSINADO") {
                return reply.send({ status: "ASSINADO", dataAssinatura: assinatura.dataAssinatura });
            }

            // Aqui retornaria os dados para o frontend renderizar o contrato
            // Pode ser o ID do Lead ou Assinante para buscar os detalhes
            return {
                id: assinatura.id,
                status: assinatura.status,
                leadId: assinatura.leadId,
                assinanteId: assinatura.assinanteId,
            };
        }
    );

    // Rota pública para EFETIVAR a assinatura
    fastify.post(
        "/sign/:token",
        {
            schema: {
                tags: ["Assinatura"],
                summary: "Efetivar Assinatura Digital",
                params: z.object({
                    token: z.string(),
                }),
            },
        },
        async (request, reply) => {
            const { token } = request.params as any;
            const ipAddress = (request.headers["x-forwarded-for"] as string) || request.ip;
            const userAgent = request.headers["user-agent"];

            const assinatura = await fastify.prisma.contratoAssinatura.findUnique({
                where: { token },
            });

            if (!assinatura || assinatura.status === "ASSINADO") {
                return reply.status(400).send({ error: "Assinatura já realizada ou link inválido." });
            }

            // Atualiza o registro de assinatura
            const updated = await fastify.prisma.contratoAssinatura.update({
                where: { token },
                data: {
                    status: "ASSINADO",
                    ipAssinatura: ipAddress,
                    userAgent: userAgent,
                    dataAssinatura: new Date(),
                },
            });

            // Se houver um Lead vinculado, podemos atualizar o status do lead
            if (assinatura.leadId) {
                await fastify.prisma.lead.update({
                    where: { id: assinatura.leadId },
                    data: {
                        statusProposta: "CONTRATO_ASSINADO",
                        dataAceite: new Date(),
                    },
                });
            }

            return { success: true, signedAt: updated.dataAssinatura };
        }
    );

    // Rota protegida para GERAR um link de assinatura (Admin)
    fastify.post(
        "/generate",
        {
            schema: {
                tags: ["Assinatura"],
                summary: "Gerar Link de Assinatura",
                body: z.object({
                    leadId: z.string().uuid().optional(),
                    assinanteId: z.string().uuid().optional(),
                }),
            },
        },
        async (request, reply) => {
            const { leadId, assinanteId } = request.body as any;
            const token = uuidv4();

            const newAssinatura = await fastify.prisma.contratoAssinatura.create({
                data: {
                    leadId,
                    assinanteId,
                    token,
                    status: "PENDENTE",
                },
            });

            // URL base do frontend (deve vir de env ou config)
            const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const signLink = `${baseUrl}/assinar/${token}`;

            return {
                success: true,
                token,
                link: signLink,
            };
        }
    );
}
