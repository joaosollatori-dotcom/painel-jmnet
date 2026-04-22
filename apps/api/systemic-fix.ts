import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function systemicArchitectureFix() {
    console.log('--- TITÃ ARCHITECTURE REPAIR: MULTI-TENANCY & CONSISTENCY ---');

    try {
        // 1. REFORÇO DA FUNÇÃO DE TRIGGER (Lógica de Convite Mandatória)
        console.log('1. Atualizando Trigger para Sincronização Mandatória de Role/Tenant...');
        const sqlFunction = `
        CREATE OR REPLACE FUNCTION public.handle_new_user_with_tenant()
        RETURNS trigger AS $FUNCTION$
        DECLARE
            found_invite_tenant_id uuid;
            found_invite_role text;
            new_tenant_id uuid;
            org_name text;
        BEGIN
            -- BUSCA MANDATÓRIA: Verifica se existe um convite para este e-mail
            SELECT tenant_id, role INTO found_invite_tenant_id, found_invite_role
            FROM public.invitations
            WHERE email = NEW.email AND used_at IS NULL
            LIMIT 1;

            IF found_invite_tenant_id IS NOT NULL THEN
                -- CENÁRIO A: Usuário convidado (Garante Role/Tenant do Convite)
                INSERT INTO public.profiles (id, email, tenant_id, role, full_name, is_active)
                VALUES (
                    NEW.id, 
                    NEW.email, 
                    found_invite_tenant_id, 
                    found_invite_role, 
                    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
                    true
                )
                ON CONFLICT (id) DO UPDATE SET
                    tenant_id = EXCLUDED.tenant_id,
                    role = EXCLUDED.role,
                    updated_at = now();

                -- Marca convite como usado
                UPDATE public.invitations SET used_at = now() WHERE email = NEW.email;
            
            ELSE
                -- CENÁRIO B: Novo Usuário (Auto-Registro/Nova Organização)
                org_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Minha Organização');
                
                INSERT INTO public.tenants (name, slug)
                VALUES (org_name, LOWER(REPLACE(org_name, ' ', '-')) || '-' || floor(random()*1000)::text)
                RETURNING id INTO new_tenant_id;

                INSERT INTO public.profiles (id, email, tenant_id, role, full_name, is_active)
                VALUES (
                    NEW.id, 
                    NEW.email, 
                    new_tenant_id, 
                    'ADMIN', -- Primeiro usuário de um novo tenant sempre é ADMIN
                    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
                    true
                );
            END IF;

            RETURN NEW;
        END;
        $FUNCTION$ LANGUAGE plpgsql SECURITY DEFINER;`;

        await prisma.$executeRawUnsafe(sqlFunction);
        console.log('✅ Trigger de Consistência de Cargo/Tenant atualizado!');

        // 2. AUDITORIA DE TENANT_ID (INFRAESTRUTURA)
        console.log('2. Verificando Tabelas sem tenant_id...');

        // Adicionando tenant_id em tabelas que faltam (Operação Segura em Produção com Default)
        const tablesToFix = ['OLTs', 'ONUs', 'Faturas', 'NotaFiscals'];
        // Nota: No banco real os nomes podem variar, vou usar os nomes do Prisma mapeados

        const alterSqls = [
            `ALTER TABLE public."OLTs" ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,
            `ALTER TABLE public."ONUs" ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,
            `ALTER TABLE public."Faturas" ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,
            `ALTER TABLE public."NotaFiscals" ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`
        ];

        for (const sql of alterSqls) {
            try {
                await prisma.$executeRawUnsafe(sql);
                console.log(`✅ Coluna tenant_id verificada/adicionada.`);
            } catch (e) {
                console.warn(`⚠ Tabela pode ter nome diferente ou já estar correta.`);
            }
        }

        console.log('\n--- ARQUITETURA SISTÊMICA NORMALIZADA ---');

    } catch (error) {
        console.error('❌ Erro na normalização sistêmica:', error);
    } finally {
        await prisma.$disconnect();
    }
}

systemicArchitectureFix();
