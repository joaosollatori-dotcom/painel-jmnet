import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function audit() {
    const targetEmail = 'joaosollatori@gmail.com';

    try {
        console.log('--- AUDITORIA DE USUÁRIOS ---');

        // 1. Localizar o usuário alvo
        const profiles = await prisma.profile.findMany({
            where: { email: targetEmail }
        });

        if (profiles.length > 0) {
            for (const p of profiles) {
                console.log(`Encontrado: ${p.email} | ID: ${p.id} | Cargo Atual: ${p.role}`);

                // Se for o cargo que eu alterei erroneamente, voltamos para VENDEDOR
                if (p.role === 'SUPER_ADMIN' || p.role === 'ADMIN') {
                    await prisma.profile.update({
                        where: { id: p.id },
                        data: { role: 'VENDEDOR' }
                    });
                    console.log(`✅ Cargo de ${p.email} restaurado para VENDEDOR.`);
                }
            }
        } else {
            console.log(`❌ Nenhum perfil encontrado para ${targetEmail}`);
        }

        // 2. Verificar se esse e-mail tem um convite
        const invite = await prisma.invitations.findUnique({
            where: { email: targetEmail }
        });

        if (invite) {
            console.log(`Info do Convite encontrado: Email: ${invite.email} | Cargo Original: ${invite.role}`);
        }

    } catch (e) {
        console.error('Erro na auditoria:', e);
    } finally {
        await prisma.$disconnect();
    }
}

audit();
