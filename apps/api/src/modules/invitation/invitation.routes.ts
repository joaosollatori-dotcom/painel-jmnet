import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function invitationRoutes(fastify: FastifyInstance) {
    // Rota pública para validar o convite sem estar autenticado no Supabase
    fastify.post(
        "/validate",
        {
            schema: {
                body: z.object({
                    token: z.string(),
                    ipAddress: z.string().optional(),
                    userAgent: z.string().optional(),
                }),
            },
        },
        async (request, reply) => {
            const { token, ipAddress, userAgent } = request.body as any;

            try {
                const invite = await fastify.prisma.invitations.findUnique({
                    where: { invite_token: token },
                    include: { tenants: true, User: true }
                });

                if (!invite) {
                    await fastify.prisma.auditLog.create({
                        data: {
                            action: "INVITE_INVALID_ATTEMPT",
                            resource: "INVITATIONS",
                            details: { token, userAgent, error: "Token não localizado na base" },
                            ip_address: ipAddress || request.ip,
                        }
                    });
                    return reply.send({ status: "INVALID", message: "O convite foi invalidado ou não existe." });
                }

                if (invite.used_at) {
                    return reply.send({ status: "USED", message: "Este convite já foi utilizado." });
                }

                if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
                    // Logar alerta para o admin que criou
                    await fastify.prisma.auditLog.create({
                        data: {
                            action: "INVITE_EXPIRED_ATTEMPT",
                            resource: "INVITATIONS",
                            actor_id: invite.created_by,
                            details: { token, email: invite.email, userAgent, error: "Tentativa de acesso a convite expirado" },
                            ip_address: ipAddress || request.ip,
                        }
                    });
                    return reply.send({ status: "EXPIRED", message: "O prazo de aceitação expirou. Solicite um novo link ao administrador." });
                }

                return reply.send({
                    status: "VALID",
                    data: {
                        tenant_id: invite.tenant_id,
                        role: invite.role,
                        company_name: invite.tenants?.name,
                        email: invite.email
                    }
                });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: "Erro interno validar convite" });
            }
        }
    );

    // Rota autenticada para resetar
    fastify.post(
        "/reset",
        {
            schema: {
                body: z.object({
                    inviteId: z.string(),
                }),
            },
        },
        async (request, reply) => {
            const { inviteId } = request.body as any;

            try {
                // 1. Invalidar convite anterior setando expires_at pro passado
                const oldInvite = await fastify.prisma.invitations.update({
                    where: { id: inviteId },
                    data: { expires_at: new Date(Date.now() - 1000) }
                });

                // 2. Criar novo token
                const newToken = btoa(Math.random().toString()).slice(0, 24);
                const newInvite = await fastify.prisma.invitations.create({
                    data: {
                        email: oldInvite.email,
                        invite_token: newToken,
                        role: oldInvite.role,
                        created_by: oldInvite.created_by,
                        tenant_id: oldInvite.tenant_id,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    }
                });

                return reply.send({ success: true, newInvite });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: "Erro ao resetar convite" });
            }
        }
    );
}
