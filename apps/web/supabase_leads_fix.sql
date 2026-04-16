-- Adiciona a coluna de status de agendamento na tabela de leads para persistência correta
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status_agendamento TEXT DEFAULT 'AGENDADO';

-- Comentário para documentar as opções de status
-- AGENDADO, CONFIRMADO, DESLOCAMENTO, EM_ANDAMENTO, CONCLUIDO, NAO_ATENDIDO, CANCELADO, REAGENDADO
