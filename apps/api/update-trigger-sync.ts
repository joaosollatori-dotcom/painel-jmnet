import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
async function run() {
    try {
        const sql = `
CREATE OR REPLACE FUNCTION public.handle_new_user_with_tenant()
RETURNS trigger AS $FUNCTION$
DECLARE
    new_tenant_id uuid;
    org_name text;
    inv_tenant_id_text text;
    inv_tenant_id uuid;
    inv_role text;
BEGIN
    inv_tenant_id_text := NEW.raw_user_meta_data ->> 'invite_tenant_id';
    inv_role := COALESCE(NEW.raw_user_meta_data ->> 'invite_role', 'ADMIN');

    IF inv_tenant_id_text IS NOT NULL AND inv_tenant_id_text ~ '^[0-9a-fA-F-]{36}$' THEN
        -- Joining existing tenant
        inv_tenant_id := inv_tenant_id_text::uuid;
        
        -- 1. Create/Update Profile
        INSERT INTO public.profiles (id, email, tenant_id, role, full_name)
        VALUES (NEW.id, NEW.email, inv_tenant_id, inv_role, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email))
        ON CONFLICT (id) DO UPDATE SET
            tenant_id = EXCLUDED.tenant_id,
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email;

        -- 2. AUTO-MARK INVITATION AS USED (v2.07.05 Fix)
        UPDATE public.invitations 
        SET used_at = now() 
        WHERE email = NEW.email AND used_at IS NULL;

    ELSE
        -- Creating new tenant
        org_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Minha Organização');
        
        INSERT INTO public.tenants (name, slug)
        VALUES (org_name, LOWER(REPLACE(org_name, ' ', '-')) || '-' || floor(random()*1000)::text)
        RETURNING id INTO new_tenant_id;

        INSERT INTO public.profiles (id, email, tenant_id, role, full_name)
        VALUES (NEW.id, NEW.email, new_tenant_id, 'ADMIN', org_name || ' Admin')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$FUNCTION$ LANGUAGE plpgsql SECURITY DEFINER;`;

        await prisma.$executeRawUnsafe(sql);
        console.log('Final Robust Trigger updated with Auto-Invite-Sync!');
    } catch (e) {
        console.error('Error updating trigger:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
