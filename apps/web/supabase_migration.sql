-- =====================================================
--  PAINEL JMNET — SCHEMA SUPABASE
--  Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name     TEXT NOT NULL,
    contact_phone    TEXT,
    platform         TEXT DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp','instagram','web')),
    status           TEXT DEFAULT 'active' CHECK (status IN ('new','waiting','active')),
    is_pinned        BOOLEAN DEFAULT false,
    is_archived      BOOLEAN DEFAULT false,
    is_muted         BOOLEAN DEFAULT false,
    is_blocked       BOOLEAN DEFAULT false,
    unread_count     INTEGER DEFAULT 0,
    last_message     TEXT,
    last_message_at  TIMESTAMPTZ DEFAULT NOW(),
    ai_active        BOOLEAN DEFAULT false,
    is_closed        BOOLEAN DEFAULT false,
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

-- 3. ROW LEVEL SECURITY (desabilitado para MVP, habilite com auth depois)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_full_conversations" ON public.conversations
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_messages" ON public.messages
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. REAL-TIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. SEED — Dados iniciais de demonstração
INSERT INTO public.conversations
    (contact_name, contact_phone, platform, status, unread_count, last_message, last_message_at)
VALUES
    ('João Silva',   '+55 11 91234-5678', 'whatsapp',  'new',     2, 'Preciso da segunda via do boleto', NOW() - INTERVAL '10 minutes'),
    ('Maria Souza',  '+55 21 99876-5432', 'instagram', 'active',  5, 'O sinal está oscilando muito hoje', NOW() - INTERVAL '1 hour'),
    ('Carlos Antunes', '+55 31 98765-4321', 'whatsapp','waiting',  0, 'Qual o valor do plano de 500mb?', NOW() - INTERVAL '2 hours'),
    ('Ana Oliveira', '+55 41 97654-3210', 'web',       'active',  0, 'Obrigada pelo atendimento!', NOW() - INTERVAL '14 hours')
ON CONFLICT DO NOTHING;
