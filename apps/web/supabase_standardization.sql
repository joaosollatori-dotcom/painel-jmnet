-- =====================================================
-- TITÃ | ISP — SCHEMA STANDARDIZATION
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name     TEXT NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure all columns exist for existing table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'whatsapp';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ai_active BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender           TEXT NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text TEXT NOT NULL DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_user BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions TEXT[] DEFAULT '{}';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 3. INTERNAL MESSAGES
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel          TEXT NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.internal_messages ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT 'User';
ALTER TABLE public.internal_messages ADD COLUMN IF NOT EXISTS user_avatar TEXT;
ALTER TABLE public.internal_messages ADD COLUMN IF NOT EXISTS message_text TEXT NOT NULL DEFAULT '';
ALTER TABLE public.internal_messages ADD COLUMN IF NOT EXISTS user_color TEXT;
ALTER TABLE public.internal_messages ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- 4. CUSTOMER OCCURRENCES
CREATE TABLE IF NOT EXISTS public.customer_occurrences (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS protocol TEXT UNIQUE;
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT 'Cliente';
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS opening_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]';
ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- 5. SERVICE ORDERS
CREATE TABLE IF NOT EXISTS public.service_orders (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS occurrence_id UUID REFERENCES public.customer_occurrences(id);
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;

-- 6. LEADS
-- Use DO block for leads in case it's a view
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS full_name TEXT;
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS main_phone TEXT;
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- RLS POLICIES (Conditional apply)
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
