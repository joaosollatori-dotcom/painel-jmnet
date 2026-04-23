import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixTrigger() {
    console.log('--- REPAIRING AUTH TRIGGER (V2.07.17) ---');
    try {
        const sql = `
        CREATE OR REPLACE FUNCTION public.handle_new_user_with_tenant()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = public
        AS $function$
        DECLARE
          v_tenant_id uuid;
          v_company_name text;
          v_slug text;
          v_role text;
        BEGIN
          -- 1. Extrair metadados com segurança (Fallback para evitar 500)
          v_company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'TITÃ ISP');
          v_role := COALESCE(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'invite_role', 'VENDEDOR');
          v_tenant_id := (new.raw_user_meta_data->>'invite_tenant_id')::uuid;

          -- 2. Se não tem tenant_id (Fluxo de Fundador)
          IF v_tenant_id IS NULL THEN
            -- Gerar slug se não existir
            v_slug := LOWER(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9]', '-', 'g'));
            
            -- Tenta localizar se já existe um tenant com esse slug para evitar erro de UNIQUE
            SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_slug LIMIT 1;
            
            IF v_tenant_id IS NULL THEN
              INSERT INTO public.tenants (name, slug, is_active)
              VALUES (v_company_name, v_slug, true)
              RETURNING id INTO v_tenant_id;
            END IF;

            -- Garante que o criador de uma nova organização seja SUPER_ADMIN
            v_role := 'SUPER_ADMIN';
          END IF;

          -- 3. Criar o Perfil vinculado
          INSERT INTO public.profiles (id, full_name, email, role, tenant_id, is_active)
          VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
            new.email,
            v_role,
            v_tenant_id,
            true
          )
          ON CONFLICT (id) DO UPDATE SET
            tenant_id = EXCLUDED.tenant_id,
            role = EXCLUDED.role;

          RETURN new;
        EXCEPTION WHEN OTHERS THEN
          -- Captura erro e não trava o signup (Melhor ter user sem perfil do que erro 500)
          -- Logar o erro se possível em uma tabela de auditoria
          INSERT INTO public.audit_logs (action, resource, details)
          VALUES ('DB_TRIGGER_ERROR', 'AUTH_SIGNUP', jsonb_build_object('error', SQLERRM, 'user_id', new.id));
          RETURN new;
        END;
        $function$;
        `;

        await prisma.$executeRawUnsafe(sql);
        console.log('✅ Trigger robusto reinstalado!');

    } catch (e) {
        console.error('❌ Erro ao reinstalar trigger:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixTrigger();
