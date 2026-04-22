import type { PrismaClient } from "@prisma/client";
import { cerebrasService } from "../../services/cerebras.service.js";

export class WhatsappService {
	private accessToken: string;
	private phoneNumberId: string;
	private apiVersion: string;

	constructor(private prisma: PrismaClient) {
		this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
		this.phoneNumberId = process.env.WHATSAPP_PHONE_ID || "";
		this.apiVersion = process.env.WHATSAPP_API_VERSION || "v25.0";
	}

	async sendMessage(to: string, text: string) {
		const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.accessToken}`,
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				recipient_type: "individual",
				to,
				type: "text",
				text: { body: text },
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			console.error("WhatsApp API Error:", error);
			throw new Error(
				`Failed to send WhatsApp message: ${JSON.stringify(error)}`,
			);
		}

		return response.json();
	}

	async handleIncomingMessage(payload: any) {
		const entry = payload.entry?.[0];
		const changes = entry?.changes?.[0];
		const value = changes?.value;
		const message = value?.messages?.[0];
		const contact = value?.contacts?.[0];

		if (!message) return;

		const from = message.from; // Phone number
		const text = message.text?.body;
		const contactName = contact?.profile?.name || "Cliente WhatsApp";

		if (!text) return;

		// 1. Find or Create Conversation
		let conversation = await this.prisma.conversation.findFirst({
			where: {
				contact_phone: from,
				is_closed: false,
			},
			orderBy: {
				created_at: "desc",
			},
		});

		if (!conversation) {
			// Check if there was a previous conversation to inherit assigned_to
			const lastConv = await this.prisma.conversation.findFirst({
				where: { contact_phone: from },
				orderBy: { created_at: "desc" },
			});

			conversation = await this.prisma.conversation.create({
				data: {
					contact_name: contactName,
					contact_phone: from,
					platform: "whatsapp",
					status: "waiting",
					assigned_to: lastConv?.assigned_to || "Fila Geral",
					unread_count: 1,
					last_message: text,
					last_message_at: new Date(),
				},
			});

			// [V2.05.29] Trigger AI Summary & Occurrence Creation
			const protocol = `OC-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

			cerebrasService.summarizeChatOpening([{ role: 'user', content: text }])
				.then(async (summary) => {
					const occurrence = await this.prisma.customer_occurrences.create({
						data: {
							protocol,
							customer_name: contactName,
							subject: "Novo Atendimento WhatsApp",
							description: summary,
							status: "Aberta",
							tenant_id: conversation?.tenant_id
						}
					});

					// Update conversation with occurrence link
					await this.prisma.conversation.update({
						where: { id: conversation?.id },
						data: { occurrence_id: occurrence.id }
					});

					console.log(`[AI] Ocorrência ${protocol} criada com sucesso para ${contactName}`);
				})
				.catch(err => console.error('[AI Error] Falha ao criar ocorrência automática:', err));

		} else {
			await this.prisma.conversation.update({
				where: { id: conversation.id },
				data: {
					last_message: text,
					last_message_at: new Date(),
					unread_count: {
						increment: 1,
					},
				},
			});
		}

		// 2. Create Message
		await this.prisma.message.create({
			data: {
				conversation_id: conversation.id,
				sender: contactName,
				text: text,
				is_user: false,
				is_bot: false,
			},
		});

		// 3. Simple Auto-Reply (Processing)
		const lowText = text.toLowerCase().trim();
		if (lowText === "oi" || lowText === "olá" || lowText === "ola") {
			const reply = `Olá ${contactName}! Sou o Titã, seu assistente virtual do JMnet. Como posso te ajudar hoje?`;

			await this.sendMessage(from, reply);

			// Save our reply
			await this.prisma.message.create({
				data: {
					conversation_id: conversation.id,
					sender: "Titã AI",
					text: reply,
					is_user: false,
					is_bot: true,
				},
			});
		}

		console.log(`[WhatsApp] Message from ${from}: ${text}`);
	}
}
