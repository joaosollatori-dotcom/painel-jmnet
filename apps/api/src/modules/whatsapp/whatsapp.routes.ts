import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { WhatsappService } from "./whatsapp.service.js";

export async function whatsappRoutes(server: FastifyInstance) {
	const service = new WhatsappService(server.prisma);
	const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

	// Webhook Verification (GET)
	server.get(
		"/webhook",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const query = request.query as any;
			const mode = query["hub.mode"];
			const token = query["hub.verify_token"];
			const challenge = query["hub.challenge"];

			if (mode && token) {
				if (mode === "subscribe" && token === verifyToken) {
					console.log("WEBHOOK_VERIFIED");
					return reply.status(200).send(challenge);
				} else {
					return reply.status(403).send("Verification failed");
				}
			}
			return reply.status(400).send("Bad Request");
		},
	);

	// Webhook Message Handling (POST)
	server.post(
		"/webhook",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const body = request.body as any;

			// Check if it is a whatsapp event
			if (body.object) {
				if (
					body.entry &&
					body.entry[0].changes &&
					body.entry[0].changes[0] &&
					body.entry[0].changes[0].value.messages &&
					body.entry[0].changes[0].value.messages[0]
				) {
					// Background process to not block the response to Meta (they require 200 OK fast)
					service.handleIncomingMessage(body).catch((err) => {
						console.error("Error handling incoming message:", err);
					});
				}
				return reply.status(200).send("EVENT_RECEIVED");
			} else {
				return reply.status(404).send();
			}
		},
	);

	// Manual Send (Internal API)
	server.post<{ Body: { to: string; text: string } }>(
		"/send",
		async (request, reply) => {
			const { to, text } = request.body;

			if (!to || !text) {
				return reply.status(400).send({ message: 'Missing "to" or "text"' });
			}

			try {
				const result = await service.sendMessage(to, text);
				return { success: true, result };
			} catch (error: any) {
				return reply
					.status(500)
					.send({ success: false, message: error.message });
			}
		},
	);
}
