import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
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
        v_company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'TITÃ ISP');
        v_role := COALESCE(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'invite_role', 'VENDEDOR');
        v_tenant_id := (new.raw_user_meta_data->>'invite_tenant_id')::uuid;

        IF v_tenant_id IS NULL THEN
          v_slug := LOWER(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9]', '-', 'g'));
          SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_slug LIMIT 1;
          IF v_tenant_id IS NULL THEN
            INSERT INTO public.tenants (name, slug, is_active)
            VALUES (v_company_name, v_slug, true)
            RETURNING id INTO v_tenant_id;
          END IF;
          v_role := 'SUPER_ADMIN';
        END IF;

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
        INSERT INTO public.audit_logs (action, resource, details)
        VALUES ('DB_TRIGGER_ERROR', 'AUTH_SIGNUP', jsonb_build_object('error', SQLERRM, 'user_id', new.id));
        RETURN new;
      END;
      $function$;
    `;
    await prisma.$executeRawUnsafe(sql);
    console.log('SUCCESS');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
