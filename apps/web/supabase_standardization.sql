-- =====================================================
-- TITÃ | ISP — SCHEMA STANDARDIZATION
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name     TEXT NOT NULL,
    contact_phone    TEXT,
    contact_email    TEXT,
    platform         TEXT DEFAULT 'whatsapp',
    status           TEXT DEFAULT 'active',
    is_pinned        BOOLEAN DEFAULT false,
    is_archived      BOOLEAN DEFAULT false,
    is_muted         BOOLEAN DEFAULT false,
    is_blocked       BOOLEAN DEFAULT false,
    unread_count     INTEGER DEFAULT 0,
    last_message     TEXT,
    last_message_at  TIMESTAMPTZ DEFAULT NOW(),
    ai_active        BOOLEAN DEFAULT false,
    is_closed        BOOLEAN DEFAULT false,
    assigned_to      TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id  UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender           TEXT NOT NULL,
    text             TEXT NOT NULL,
    is_user          BOOLEAN DEFAULT false,
    is_bot           BOOLEAN DEFAULT false,
    reactions        TEXT[] DEFAULT '{}',
    file_url         TEXT,
    file_name        TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INTERNAL MESSAGES
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel          TEXT NOT NULL,
    user_name        TEXT NOT NULL,
    user_avatar      TEXT,
    message_text     TEXT NOT NULL,
    user_color       TEXT,
    is_bot           BOOLEAN DEFAULT false,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER OCCURRENCES
CREATE TABLE IF NOT EXISTS public.customer_occurrences (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocol           TEXT UNIQUE,
    customer_name      TEXT NOT NULL,
    subject            TEXT,
    priority           TEXT,
    status             TEXT,
    opening_date       TIMESTAMPTZ DEFAULT NOW(),
    last_update        TIMESTAMPTZ DEFAULT NOW(),
    seller_id          UUID,
    description        TEXT,
    comments           JSONB DEFAULT '[]',
    attachments        JSONB DEFAULT '[]'
);

-- 5. SERVICE ORDERS
CREATE TABLE IF NOT EXISTS public.service_orders (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_type         TEXT,
    status             TEXT,
    description        TEXT,
    priority           TEXT,
    scheduled_date     TIMESTAMPTZ,
    customer_name      TEXT,
    customer_address   TEXT,
    conversation_id    UUID,
    occurrence_id      UUID REFERENCES public.customer_occurrences(id),
    completion_date    TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name          TEXT NOT NULL,
    email              TEXT,
    main_phone         TEXT,
    whatsapp_phone     TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Conditional apply only if relation is a table)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_occurrences' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.customer_occurrences ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "anon_full_access" ON public.customer_occurrences;
        CREATE POLICY "anon_full_access" ON public.customer_occurrences FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "anon_full_access" ON public.service_orders;
        CREATE POLICY "anon_full_access" ON public.service_orders FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "anon_full_access" ON public.leads;
        CREATE POLICY "anon_full_access" ON public.leads FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
END $$;
