-- =====================================================
-- TITÃ | ISP — SECURITY & AUTH PRODUCTION SCHEMA
-- Foco: Vinculação de Prisma (User-Tenant-Invite) e TTL Real
-- =====================================================

-- 1. TABELAS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS public.allowed_ips (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address  INET NOT NULL,
    description TEXT,
    tenant_id   UUID,
    expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.remote_access_keys (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_token   TEXT UNIQUE NOT NULL,
    created_by  UUID REFERENCES auth.users(id),
    tenant_id   UUID,
    used_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CONVITES (VINCULAÇÃO DE PRISMA)
CREATE TABLE IF NOT EXISTS public.invitations (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email         TEXT NOT NULL,
    invite_token  TEXT UNIQUE NOT NULL,
    role          TEXT NOT NULL,
    tenant_id     UUID NOT NULL,
    created_by    UUID REFERENCES auth.users(id),
    target_user_id UUID, -- Vinculado ao ID que será criado/logado
    expires_at    TIMESTAMPTZ NOT NULL,
    used_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LÓGICA DE TTL (LIMPEZA AUTOMÁTICA)
CREATE OR REPLACE FUNCTION public.execute_security_cleanup()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.allowed_ips WHERE expires_at < NOW();
    DELETE FROM public.remote_access_keys WHERE expires_at < NOW();
    -- Mantém convites usados por 30 dias para auditoria, depois remove
    DELETE FROM public.invitations WHERE expires_at < NOW() OR (used_at < NOW() - INTERVAL '30 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Gatilhos para disparar a limpeza em cada nova inserção
DROP TRIGGER IF EXISTS tr_cleanup_ips ON public.allowed_ips;
CREATE TRIGGER tr_cleanup_ips BEFORE INSERT ON public.allowed_ips 
    FOR EACH ROW EXECUTE FUNCTION public.execute_security_cleanup();

DROP TRIGGER IF EXISTS tr_cleanup_invites ON public.invitations;
CREATE TRIGGER tr_cleanup_invites BEFORE INSERT ON public.invitations 
    FOR EACH ROW EXECUTE FUNCTION public.execute_security_cleanup();

-- 4. RLS - SEGURANÇA REAL (SOMENTE ADMINS E SUPORTE AUTORIZADO)
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_access_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Exemplo de política de Whitelist
CREATE POLICY "Admins can manage whitelist" ON public.allowed_ips
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
    );
