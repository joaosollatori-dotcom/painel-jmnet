import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Testing auditLog.findMany...');
        const logs = await prisma.auditLog.findMany({ take: 1 });
        console.log('Audit logs:', logs);
    } catch (e: any) {
        console.error('auditLog error:', e.message);
    }

    try {
        console.log('Testing invitations...');
        const inv = await prisma.invitations.findFirst();
        console.log('Invitation:', inv);
    } catch (e: any) {
        console.error('invitations error:', e.message);
    }
}
run().finally(() => prisma.$disconnect());
