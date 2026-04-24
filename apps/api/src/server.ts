console.log('TITÃ DEBUG: [1] Iniciando Script');
try {
	// @ts-ignore
	if (process.loadEnvFile) {
		console.log('TITÃ DEBUG: [2] Carregando .env nativo');
		process.loadEnvFile('.env');
	}
} catch (e) {
	console.log('TITÃ DEBUG: [2.1] .env não carregado (ignorando)');
}

import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { setupWorkers } from "./jobs/index";
import { assinantesRoutes } from "./modules/assinantes/assinantes.routes";
import { financeiroRoutes } from "./modules/financeiro/financeiro.routes";
import { osRoutes } from "./modules/os/os.routes";
import { redeRoutes } from "./modules/rede/rede.routes";
import { genieacsRoutes } from "./modules/genieacs/genieacs.routes";
import { telefoniaRoutes } from "./modules/telefonia/telefonia.routes";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes";
import { auditRoutes } from "./modules/audit/audit.routes";
import { assinaturaRoutes } from "./modules/assinatura/assinatura.routes";
import { invitationRoutes } from "./modules/invitation/invitation.routes";
import { bullmqPlugin } from "./plugins/bullmq.plugin";
import { prismaPlugin } from "./plugins/prisma.plugin";
import { redisPlugin } from "./plugins/redis.plugin";
import { auditPlugin } from "./plugins/audit.plugin";
import supabasePlugin from "./plugins/supabase.plugin";

console.log('TITÃ DEBUG: [3] Definindo Servidor Fastify');
export const server = Fastify({
	logger: true,
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

export async function setupServer() {
	console.log('TITÃ DEBUG: [4] setupServer() iniciado');

	await server.register(cors, { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], credentials: true });
	await server.register(jwt, { secret: process.env.JWT_SECRET || "super-secret-key" });

	await server.register(swagger, { openapi: { info: { title: "TITÃ | ISP API", version: "0.1.0" } } });
	await server.register(swaggerUi, { routePrefix: "/docs" });

	console.log('TITÃ DEBUG: [5] Registrando Prisma & Supabase');
	await server.register(prismaPlugin);
	await server.register(supabasePlugin);

	// Register Modules
	console.log('TITÃ DEBUG: [6] Registrando Módulos de Negócio');
	await server.register(assinantesRoutes, { prefix: "/v1/assinantes" });
	await server.register(financeiroRoutes, { prefix: "/v1/financeiro" });
	await server.register(redeRoutes, { prefix: "/v1/rede" });
	await server.register(genieacsRoutes, { prefix: "/v1/genieacs" });
	await server.register(osRoutes, { prefix: "/v1/os" });
	await server.register(telefoniaRoutes, { prefix: "/v1/telefonia" });
	await server.register(whatsappRoutes, { prefix: "/v1/whatsapp" });
	await server.register(auditRoutes, { prefix: "/v1/audit" });
	await server.register(assinaturaRoutes, { prefix: "/v1/assinatura" });
	await server.register(invitationRoutes, { prefix: "/v1/invitations" });

	console.log('TITÃ DEBUG: [7] Registrando Plugins de Infra');
	await server.register(redisPlugin);
	await server.register(bullmqPlugin);
	await server.register(auditPlugin);

	// Start Background Workers (Desativado temporariamente para debug)
	// if (!process.env.VERCEL) { setupWorkers(); }

	server.get("/health", async () => {
		return { status: "ok", timestamp: new Date().toISOString() };
	});

	return server;
}

if (!process.env.VERCEL) {
	console.log('TITÃ DEBUG: [8] Chamando setupServer().then()');
	setupServer().then(async (serverInstance) => {
		try {
			const port = Number(process.env.PORT) || 3001;
			console.log(`TITÃ DEBUG: [9] Tentando ouvir na porta ${port}`);
			await serverInstance.listen({ port, host: "0.0.0.0" });
			console.log(`🚀 Server ready at http://localhost:${port}`);
		} catch (err) {
			console.error('TITÃ DEBUG: [ERRO NO LISTEN]', err);
			process.exit(1);
		}
	}).catch(err => {
		console.error('TITÃ DEBUG: [ERRO NO SETUP]', err);
	});
}

export default server;
