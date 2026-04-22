import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { setupWorkers } from "./jobs/index.js";
import { assinantesRoutes } from "./modules/assinantes/assinantes.routes.js";
import { financeiroRoutes } from "./modules/financeiro/financeiro.routes.js";
import { osRoutes } from "./modules/os/os.routes.js";
import { redeRoutes } from "./modules/rede/rede.routes.js";
import { genieacsRoutes } from "./modules/genieacs/genieacs.routes.js";
import { telefoniaRoutes } from "./modules/telefonia/telefonia.routes.js";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";
import { assinaturaRoutes } from "./modules/assinatura/assinatura.routes.js";
import { bullmqPlugin } from "./plugins/bullmq.plugin.js";
import { prismaPlugin } from "./plugins/prisma.plugin.js";
import { redisPlugin } from "./plugins/redis.plugin.js";
import { auditPlugin } from "./plugins/audit.plugin.js";

export const server = Fastify({
	logger: true,
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

export async function setupServer() {
	// Register Plugins
	await server.register(cors, {
		origin: true, // Em dev permite tudo, em prod podemos filtrar
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		credentials: true,
	});
	await server.register(jwt, {
		secret: process.env.JWT_SECRET || "super-secret-key",
	});

	await server.register(swagger, {
		openapi: {
			info: {
				title: "TITÃ | ISP API",
				description: "CRM/ERP para Provedores de Internet",
				version: "0.1.0",
			},
		},
	});

	await server.register(swaggerUi, {
		routePrefix: "/docs",
	});

	await server.register(prismaPlugin);

	// Register Modules
	await server.register(assinantesRoutes, { prefix: "/v1/assinantes" });
	await server.register(financeiroRoutes, { prefix: "/v1/financeiro" });
	await server.register(redeRoutes, { prefix: "/v1/rede" });
	await server.register(genieacsRoutes, { prefix: "/v1/genieacs" });
	await server.register(osRoutes, { prefix: "/v1/os" });
	await server.register(telefoniaRoutes, { prefix: "/v1/telefonia" });
	await server.register(whatsappRoutes, { prefix: "/v1/whatsapp" });
	await server.register(auditRoutes, { prefix: "/v1/audit" });
	await server.register(assinaturaRoutes, { prefix: "/v1/assinatura" });

	await server.register(redisPlugin);
	await server.register(bullmqPlugin);
	await server.register(auditPlugin);

	// Start Background Workers
	if (!process.env.VERCEL) {
		setupWorkers();
	}

	// Health Check
	server.get("/health", async () => {
		return { status: "ok", timestamp: new Date().toISOString() };
	});

	return server;
}

// Start Server locally
if (!process.env.VERCEL) {
	setupServer().then(async (server) => {
		try {
			const port = Number(process.env.PORT) || 3001;
			await server.listen({ port, host: "0.0.0.0" });
			console.log(`🚀 Server ready at http://localhost:${port}`);
		} catch (err) {
			server.log.error(err);
			process.exit(1);
		}
	});
}

export default server;
