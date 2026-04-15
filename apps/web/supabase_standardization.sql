-- =====================================================
-- TITÃ | ISP — SCHEMA STANDARDIZATION
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- =====================================================
-- TITÃ | ISP — SCHEMA STANDARDIZATION & MIGRATION
-- =====================================================

-- Helper to safely rename columns
DO $$ 
BEGIN
    -- 4. CUSTOMER OCCURRENCES MIGRATIONS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='protocolo') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN protocolo TO protocol;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='cliente') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN cliente TO customer_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='assunto') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN assunto TO subject;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='prioridade') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN prioridade TO priority;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='data_abertura') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN data_abertura TO opening_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='ultima_atualizacao') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN ultima_atualizacao TO last_update;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='vendedor_id') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN vendedor_id TO seller_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_occurrences' AND column_name='descricao') THEN
        ALTER TABLE public.customer_occurrences RENAME COLUMN descricao TO description;
    END IF;

    -- 5. SERVICE ORDERS MIGRATIONS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='tipo') THEN
        ALTER TABLE public.service_orders RENAME COLUMN tipo TO order_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='descricao') THEN
        ALTER TABLE public.service_orders RENAME COLUMN descricao TO description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='prioridade') THEN
        ALTER TABLE public.service_orders RENAME COLUMN prioridade TO priority;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='data_agendamento') THEN
        ALTER TABLE public.service_orders RENAME COLUMN data_agendamento TO scheduled_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='cliente_nome') THEN
        ALTER TABLE public.service_orders RENAME COLUMN cliente_nome TO customer_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='cliente_endereco') THEN
        ALTER TABLE public.service_orders RENAME COLUMN cliente_endereco TO customer_address;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='ocorrencia_id') THEN
        ALTER TABLE public.service_orders RENAME COLUMN ocorrencia_id TO occurrence_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='data_conclusao') THEN
        ALTER TABLE public.service_orders RENAME COLUMN data_conclusao TO completion_date;
    END IF;
END $$;

-- NOW ENSURE BASE TABLES AND COLUMNS (for new setups)
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

-- RLS POLICIES
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
END $$;
