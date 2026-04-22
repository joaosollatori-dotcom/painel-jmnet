import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function auditRoutes(fastify: FastifyInstance) {
    // Somente Super Admins conseguiriam listar, a proteção seria feita por auth hooks
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Audit"],
                summary: "Listar Logs de Auditoria",
                querystring: z.object({
                    limit: z.string().optional(),
                    offset: z.string().optional(),
                    userId: z.string().optional(),
                    entity: z.string().optional(),
                    action: z.string().optional(),
                }),
            },
        },
        async (request, reply) => {
            const { limit, offset, userId, entity, action } = request.query as any;

            try {
                const where: any = {};
                if (userId) where.userId = userId;
                if (entity) where.entity = entity;
                if (action) where.action = action;

                const [logs, total] = await Promise.all([
                    fastify.prisma.auditLog.findMany({
                        where,
                        orderBy: { createdAt: "desc" },
                        take: limit ? parseInt(limit) : 50,
                        skip: offset ? parseInt(offset) : 0,
                        include: {
                            user: { select: { id: true, email: true, full_name: true } },
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
