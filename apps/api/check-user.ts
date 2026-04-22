import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function check() {
    const userId = "b47210b7-55f4-493b-9fd8-0b444d6566be";

    try {
        console.log('--- DIAGNÓSTICO DE VISIBILIDADE ---');

        const profile = await prisma.profile.findUnique({
            where: { id: userId }
        });

        if (profile) {
            console.log('✅ Perfil ENCONTRADO no banco:', {
                id: profile.id,
                email: profile.email,
                tenant: profile.tenant_id,
                role: profile.role,
                active: profile.is_active
            });
        } else {
            console.log('❌ Perfil NÃO EXISTE na tabela public.profiles para este ID.');

            // Verifica se o usuário existe no Auth pelo menos
            const authUser = await prisma.$queryRawUnsafe(`SELECT id, email FROM auth.users WHERE id = '${userId}'`);
            console.log('Status no Auth.users:', authUser);
        }

    } catch (e) {
        console.error('Erro no diagnóstico:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
