import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

const auditPluginAsync: FastifyPluginAsync = async (fastify, options) => {
    fastify.addHook("onResponse", async (request, reply) => {
        // Ignorar hooks de rota vazia ou documentação
        if (request.url.startsWith("/docs") || request.url === "/health") return;

        // Evitar logar métodos de OPTIONS (Preflight Mongoose/CORS)
        if (request.method === "OPTIONS") return;

        try {
            // Tenta inferir o UserId caso exista um token decodificado no request
            let userId = null;
            let tenantId = null;

            // Muitas rotas injetam req.user quando usam JWT
            const user = (request as any).user;
            if (user) {
                userId = user.id || user.sub;
                tenantId = user.tenant_id;
            }

            // Tenta classificar o Resource com base na URL
            let resource = "SYSTEM";
            if (request.url.includes("/assinantes")) resource = "ASSINANTE";
            else if (request.url.includes("/os")) resource = "ORDEM_SERVICO";
            else if (request.url.includes("/whatsapp")) resource = "WHATSAPP";
            else if (request.url.includes("/financeiro")) resource = "FINANCEIRO";
            else if (request.url.includes("/genieacs")) resource = "TR069";

            let action = "ACCESS";
            if (request.method === "POST") action = "CREATE";
            if (request.method === "PUT" || request.method === "PATCH") action = "UPDATE";
            if (request.method === "DELETE") action = "DELETE";

            const ipAddress = request.ip || request.headers["x-forwarded-for"]?.toString() || "127.0.0.1";
            const userAgent = request.headers["user-agent"] || "Unknown";

            // Omitir senhas ou campos muito pesados do body
            const rawBody = request.body ? JSON.parse(JSON.stringify(request.body)) : null;
            if (rawBody && rawBody.password) delete rawBody.password;

            const details: any = {
                method: request.method,
                url: request.url,
                params: request.params,
                query: request.query,
                body: rawBody,
                statusCode: reply.statusCode,
                responseTime: (reply as any).elapsedTime || 0,
                userAgent: userAgent
            };

            // Fila Passiva: Fire and Forget
            // O Prisma grava no Postgres sem travar o processamento do request
            fastify.prisma.auditLog.create({
                data: {
                    action,
                    resource,
                    ip_address: ipAddress,
                    details,
                    actor_id: userId,
                    tenant_id: tenantId
                }
            }).catch(err => {
                fastify.log.error(`Falha ao gravar AuditLog: ${err.message}`);
            });

        } catch (error) {
            fastify.log.error("Erro interno no plugin de Auditoria");
        }
    });
};

export const auditPlugin = fp(auditPluginAsync, {
    name: "audit-plugin"
});
