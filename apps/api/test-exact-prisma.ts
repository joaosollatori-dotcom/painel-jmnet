import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Testing exact auditLog.findMany...');
        const logs = await prisma.auditLog.findMany({
            orderBy: { created_at: "desc" },
            take: 50,
            skip: 0,
            include: {
                User: { select: { id: true, email: true, raw_user_meta_data: true } },
            },
        });
        console.log('Query succeeded!');
    } catch (e: any) {
        console.error('Failed exact query:', e);
    }
}
run().finally(() => prisma.$disconnect());
