import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function systemFix() {
    console.log('--- TITÃ SYSTEM INTEGRITY REPAIR (PROD) ---');

    try {
        // 1. Criar a Função
        const sqlFunction = `
        CREATE OR REPLACE FUNCTION public.handle_new_user_with_tenant()
        RETURNS trigger AS $FUNCTION$
        DECLARE
            target_tenant_id uuid;
            default_org_name text := 'Minha Organização';
        BEGIN
            target_tenant_id := (NEW.raw_user_meta_data ->> 'invite_tenant_id')::uuid;
            IF target_tenant_id IS NULL THEN
                SELECT id INTO target_tenant_id FROM public.tenants LIMIT 1;
                IF target_tenant_id IS NULL THEN
                    INSERT INTO public.tenants (name, slug)
                    VALUES (default_org_name, 'org-' || floor(random()*1000)::text)
                    RETURNING id INTO target_tenant_id;
                END IF;
            END IF;
            INSERT INTO public.profiles (id, email, tenant_id, role, full_name, is_active)
            VALUES (
                NEW.id, 
                NEW.email, 
                target_tenant_id, 
                COALESCE(NEW.raw_user_meta_data ->> 'role', 'VENDEDOR'), 
                COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
                true
            )
            ON CONFLICT (id) DO UPDATE SET
                updated_at = now(),
                email = EXCLUDED.email;
            RETURN NEW;
        END;
        $FUNCTION$ LANGUAGE plpgsql SECURITY DEFINER;`;

        await prisma.$executeRawUnsafe(sqlFunction);
        console.log('✅ Função handle_new_user_with_tenant atualizada.');

        // 2. Reatachar o Trigger
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
        await prisma.$executeRawUnsafe(`
            CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_tenant();
        `);
        console.log('✅ Trigger on_auth_user_created reatachado.');

        // 2. SINCRONIZAÇÃO RETROATIVA (CORREÇÃO DE DADOS EXISTENTES)
        console.log('2. Sincronizando usuários órfãos (sem perfil)...');

        // Esta query localiza usuários no Auth que não possuem entrada na tabela Profiles
        const syncSql = `
        INSERT INTO public.profiles (id, email, tenant_id, role, full_name, is_active)
        SELECT 
            u.id, 
            u.email, 
            (SELECT id FROM public.tenants LIMIT 1), 
            'ADMIN', 
            COALESCE(u.raw_user_meta_data ->> 'full_name', u.email),
            true
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE p.id IS NULL
        ON CONFLICT (id) DO NOTHING;
        `;

        const syncedCount = await prisma.$executeRawUnsafe(syncSql);
        console.log(`✅ Sincronização concluída: ${syncedCount} perfis restaurados.`);

        console.log('\n--- SISTEMA RESTAURADO ---');

    } catch (error) {
        console.error('❌ FALHA CRÍTICA NO REPARO DO SISTEMA:', error);
    } finally {
        await prisma.$disconnect();
    }
}

systemFix();
