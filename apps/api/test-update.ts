import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        const inv = await prisma.invitations.findFirst();
        if (!inv) {
            console.log('No invitations found.');
            return;
        }

        console.log('Testing invitation update...');
        const newToken = 'testtoken123';
        const updated = await prisma.invitations.update({
            where: { id: inv.id },
            data: {
                invite_token: newToken,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                used_at: null // Reseta caso já tivesse sido usado por acidente
            }
        });
        console.log('Update succeeded:', updated.invite_token);

        // revert back
        await prisma.invitations.update({
            where: { id: inv.id },
            data: { invite_token: inv.invite_token, used_at: inv.used_at, expires_at: inv.expires_at }
        });
    } catch (e: any) {
        console.error('Failed exact query:', e);
    }
}
run().finally(() => prisma.$disconnect());
