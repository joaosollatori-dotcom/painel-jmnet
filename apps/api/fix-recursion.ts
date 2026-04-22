import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixRecursion() {
    console.log('--- TITÃ RECURSION FIX (RLS) ---');
    try {
        const createFunction = `
        CREATE OR REPLACE FUNCTION public.check_is_super_admin()
        RETURNS boolean AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`;

        const dropPolicies = [
            `DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles`,
            `DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles`,
            `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles`,
            `DROP POLICY IF EXISTS "self_view" ON public.profiles`,
            `DROP POLICY IF EXISTS "admin_full_access" ON public.profiles`,
            `DROP POLICY IF EXISTS "self_update" ON public.profiles`
        ];

        const createPolicies = [
            `CREATE POLICY "self_view" ON public.profiles FOR SELECT USING (auth.uid() = id)`,
            `CREATE POLICY "admin_full_access" ON public.profiles FOR ALL USING (public.check_is_super_admin())`,
            `CREATE POLICY "self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id)`
        ];

        console.log('1. Criando função SECURITY DEFINER...');
        await prisma.$executeRawUnsafe(createFunction);

        console.log('2. Limpando políticas antigas...');
        for (const sql of dropPolicies) {
            await prisma.$executeRawUnsafe(sql);
        }

        console.log('3. Instalando novas políticas...');
        for (const sql of createPolicies) {
            await prisma.$executeRawUnsafe(sql);
        }

        console.log('✅ Sistema de RLS restaurado sem recursão!');

    } catch (e) {
        console.error('❌ Erro corrigindo recursão:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixRecursion();
