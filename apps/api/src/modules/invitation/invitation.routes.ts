import { FastifyInstance } from "fastify";
import { btoa } from "buffer";

export async function invitationRoutes(fastify: FastifyInstance) {
    /**
     * Rota de Produção Real: Criação de Usuário + Prisma de Vinculação
     * O anfitrião cria a conta e o convite simultaneamente.
     */
    fastify.post(
        "/create",
        async (request, reply) => {
            const { email, password, role, tenantId } = request.body as any;

            try {
                if (!email || !password || !tenantId) {
                    return reply.status(400).send({ error: "E-mail, Senha e Tenant são obrigatórios." });
                }

                // 1. Criação Real no Supabase Auth (Via Admin API)
                const { data: authUser, error: authError } = await fastify.supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true, // Confirmado automaticamente para produção
                    user_metadata: { role, tenant_id: tenantId }
                });

                if (authError) {
                    return reply.status(400).send({ error: `Erro no Auth: ${authError.message}` });
                }

                const userId = authUser.user.id;

                // 2. Criação do Profile vinculado ao Tenant
                await fastify.prisma.profile.create({
                    data: {
                        id: userId,
                        email,
                        role: role || "VENDEDOR",
                        tenant_id: tenantId,
                        is_active: true
                    }
                });

                // 3. Criação do Convite (Prisma de Vinculação)
                const token = btoa(email + Date.now().toString()).slice(0, 32);
                const invitation = await fastify.prisma.invitations.create({
                    data: {
                        email,
                        invite_token: token,
                        role: role || "VENDEDOR",
                        tenant_id: tenantId,
                        target_user_id: userId,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                });

                return reply.send({
                    success: true,
                    userId,
                    invitationId: invitation.id,
                    link: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/signup?invite=${token}`
                });

            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: "Falha na criação de prisma de vinculação" });
            }
        }
    );

    /**
     * Rota de Reset: Invalida e re-gera o vínculo
     */
    fastify.post(
        "/reset",
        async (request, reply) => {
            const { inviteId } = request.body as any;

            try {
                if (!inviteId || inviteId.length < 20) {
                    return reply.status(400).send({ error: "ID de convite inválido." });
                }

                const invite = await fastify.prisma.invitations.findUnique({ where: { id: inviteId } });
                if (!invite) return reply.status(404).send({ error: "Convite não localizado." });

                const newToken = btoa(invite.email + Date.now().toString()).slice(0, 32);

                const updatedInvite = await fastify.prisma.invitations.update({
                    where: { id: inviteId },
                    data: {
                        invite_token: newToken,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        used_at: null
                    }
                });

                return reply.send({ success: true, newInvite: updatedInvite });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: "Erro no reset de convite" });
            }
        }
    );

    /**
     * Listagem Real para o Dashboard Técnico
     */
    fastify.get(
        "/",
        async (request, reply) => {
            try {
                const invites = await fastify.prisma.invitations.findMany({
                    orderBy: { created_at: 'desc' },
                    take: 50
                });
                return reply.send(invites);
            } catch (error) {
                return reply.status(500).send({ error: "Erro ao listar convites" });
            }
        }
    );
}
