import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixRLS() {
    console.log('--- TITÃ SECURITY REPAIR (RLS) ---');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`);

        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;`);
        await prisma.$executeRawUnsafe(`CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);`);

        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;`);
        await prisma.$executeRawUnsafe(`
            CREATE POLICY "Super admins can view all profiles" 
            ON public.profiles FOR ALL USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
            );
        `);

        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;`);
        await prisma.$executeRawUnsafe(`CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`);

        console.log('✅ Políticas de RLS normalizadas individualmente!');

    } catch (e) {
        console.error('❌ Erro ajustando RLS:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixRLS();
