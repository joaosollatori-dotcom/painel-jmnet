import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function auditRoutes(fastify: FastifyInstance) {
    // Somente Super Admins conseguiriam listar, a proteção seria feita por auth hooks
    fastify.get(
        "/",
        async (request, reply) => {
            const { limit, offset, userId, entity, action } = request.query as any;

            try {
                const where: any = {};
                if (userId) where.actor_id = userId;
                if (entity) where.resource = entity;
                if (action) where.action = action;

                const [logs, total] = await Promise.all([
                    fastify.prisma.auditLog.findMany({
                        where,
                        orderBy: { created_at: "desc" },
                        take: limit ? parseInt(limit) : 50,
                        skip: offset ? parseInt(offset) : 0,
                        include: {
                            User: { select: { id: true, email: true, raw_user_meta_data: true } },
                        },
                    }),
                    fastify.prisma.auditLog.count({ where }),
                ]);

                return { success: true, total, logs };
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: "Failed to fetch audit logs" });
            }
        }
    );

    // OBS: Não há rota de POST (feito via middleware interno), nem PUT, nem DELETE. (IMUTÁVEL)
}
