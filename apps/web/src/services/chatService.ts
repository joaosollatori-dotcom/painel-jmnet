import { supabase } from '../lib/supabase';

export interface Conversation {
    id: string;
    contact_name: string;
    contact_phone?: string;
    platform: 'whatsapp' | 'instagram' | 'web';
    status: 'new' | 'waiting' | 'active';
    assigned_to?: string;
    is_pinned: boolean;
    is_archived: boolean;
    is_muted: boolean;
    is_blocked: boolean;
    unread_count: number;
    last_message?: string;
    last_message_at: string;
    ai_active: boolean;
    is_closed: boolean;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender: string;
    text: string;
    is_user: boolean;
    is_bot: boolean;
    reactions: string[];
    file_url?: string;
    file_name?: string;
    created_at: string;
}

// ──────────────────────────────
//   Conversations
// ──────────────────────────────

export const getConversations = async (options?: { search?: string; status?: 'active' | 'archived' | 'closed' }): Promise<Conversation[]> => {
    let query = supabase
        .from('conversations')
        .select('*');

    if (options?.search) {
        query = query.ilike('contact_name', `%${options.search}%`);
    }

    if (options?.status === 'active') {
        query = query.eq('is_archived', false).eq('is_closed', false);
    } else if (options?.status === 'archived') {
        query = query.eq('is_archived', true).eq('is_closed', false);
    } else if (options?.status === 'closed') {
        query = query.eq('is_closed', true);
    }

    const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
};

export const createConversation = async (
    partial: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>
): Promise<Conversation> => {
    const { data, error } = await supabase
        .from('conversations')
        .insert([{ ...partial }])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateConversation = async (
    id: string,
    updates: Partial<Omit<Conversation, 'id' | 'created_at'>>
): Promise<void> => {
    const { error } = await supabase
        .from('conversations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
};

export const deleteConversation = async (id: string): Promise<void> => {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) throw error;
};

// ──────────────────────────────
//   Messages
// ──────────────────────────────

export const getMessages = async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at');
    if (error) throw error;
    return data ?? [];
};

export const sendMessage = async (
    conversationId: string,
    partial: Partial<Omit<Message, 'id' | 'created_at' | 'conversation_id' | 'reactions'>>
): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .insert([{ conversation_id: conversationId, reactions: [], ...partial }])
        .select()
        .single();
    if (error) throw error;

    // update conversation last_message
    await supabase
        .from('conversations')
        .update({
            last_message: partial.text,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

    return data;
};

// ──────────────────────────────
//   Webhooks & Roteamento (Lógica Interna / Bot)
// ──────────────────────────────

export const routeIncomingCustomerMessage = async (
    contactPhone: string,
    messageText: string,
    platform: 'whatsapp' | 'instagram' | 'web' = 'whatsapp',
    contactName: string = 'Cliente'
) => {
    // 1. Busca conversas anteriores do cliente
    const { data: previousConvs } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_phone', contactPhone)
        .order('created_at', { ascending: false });

    let assignedAttendant = null;
    let activeConv = null;

    if (previousConvs && previousConvs.length > 0) {
        // Encontra o último atendente (Routing rules: "retornar para o atendente que o atendeu a ultima vez")
        assignedAttendant = previousConvs[0].assigned_to;
        activeConv = previousConvs.find((c: Conversation) => !c.is_closed && !c.is_archived);
    }

    let conversationId;

    if (activeConv) {
        // Já existe uma sessão em aberto, aproveita.
        conversationId = activeConv.id;
    } else {
        // Cliente estava arquivado ou encerrado. Abre uma NOVA conversa redirecionando pro mesmo atendente
        const newConv = await createConversation({
            contact_name: previousConvs?.[0]?.contact_name || contactName,
            contact_phone: contactPhone,
            platform,
            status: 'waiting',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            is_blocked: false,
            unread_count: 0,
            last_message: messageText,
            last_message_at: new Date().toISOString(),
            ai_active: false,
            is_closed: false,
            assigned_to: assignedAttendant || 'Fila Geral' // <-- Roteamento automático aplicado
        });
        conversationId = newConv.id;
    }

    // Registra a mensagem no banco
    await supabase.from('messages').insert([{
        conversation_id: conversationId,
        sender: previousConvs?.[0]?.contact_name || contactName,
        text: messageText,
        is_user: false,
        is_bot: false
    }]);

    // Atualiza contadores (trigger de aviso na UI do atendente)
    await updateConversation(conversationId, {
        unread_count: activeConv ? (activeConv.unread_count + 1) : 1,
        last_message: messageText,
        last_message_at: new Date().toISOString()
    });
};

export const addReaction = async (messageId: string, emoji: string): Promise<void> => {
    // fetch current reactions then push if not present
    const { data, error } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
    if (error) throw error;
    const reactions: string[] = data?.reactions ?? [];
    if (!reactions.includes(emoji)) {
        await supabase
            .from('messages')
            .update({ reactions: [...reactions, emoji] })
            .eq('id', messageId);
    }
};

export const clearMessages = async (conversationId: string): Promise<void> => {
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    await supabase
        .from('conversations')
        .update({ last_message: '', unread_count: 0, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
};

// ──────────────────────────────
//   Real-time subscriptions
// ──────────────────────────────

export const subscribeToMessages = (
    conversationId: string,
    callback: (msg: Message) => void
) => {
    return supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
            (payload) => callback(payload.new as Message)
        )
        .subscribe();
};

export const subscribeToConversations = (callback: (row: Conversation) => void) => {
    return supabase
        .channel('conversations')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations' },
            (payload) => callback(payload.new as Conversation)
        )
        .subscribe();
};

// ──────────────────────────────
//   Internal Chat (Discord-like Hub)
// ──────────────────────────────

export interface InternalMessage {
    id: string;
    channel: string;
    user: string;
    avatar: string;
    text: string;
    color: string;
    isBot: boolean;
    created_at: string;
}

export const getInternalMessages = async (channel: string): Promise<InternalMessage[]> => {
    try {
        const { data, error } = await supabase
            .from('internal_messages')
            .select('*')
            .eq('channel', channel)
            .order('created_at');
        if (error) throw error;
        return data ?? [];
    } catch (err) {
        console.warn('Fallback: Tabela internal_messages ausente ou erro. Retornando vazio.');
        return [];
    }
};

export const sendInternalMessage = async (
    channel: string,
    message: Omit<InternalMessage, 'id' | 'created_at' | 'channel'>
): Promise<InternalMessage> => {
    try {
        const { data, error } = await supabase
            .from('internal_messages')
            .insert([{ channel, ...message }])
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (err) {
        console.warn('Fallback: Simulando backend response local. Crie a tabela "internal_messages" no Supabase.');
        return {
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            channel,
            ...message
        } as InternalMessage;
    }
};

export const subscribeToInternalMessages = (
    channel: string,
    callback: (msg: InternalMessage) => void
) => {
    return supabase
        .channel(`internal_messages:${channel}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'internal_messages', filter: `channel=eq.${channel}` },
            (payload) => callback(payload.new as InternalMessage)
        )
        .subscribe();
};

// ──────────────────────────────
//   BI & Intelligence Helpers (Benchmarks de Provedores)
// ──────────────────────────────

export const getClientSummary = async (conversationId: string): Promise<string> => {
    const msgs = await getMessages(conversationId);
    if (!msgs.length) return "Nenhum histórico encontrado para este cliente.";

    const lastMsgs = msgs.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');
    return `RESUMO IA:\nO cliente está solicitando suporte técnico referente à lentidão.\nÚltimas interações:\n${lastMsgs}`;
};

export const getEquipmentReport = async (phone: string): Promise<string> => {
    return `RELATÓRIO TÉCNICO (${phone}):\n- Modelo: Huawei HG8245H5\n- Status: OK\n- Uptime: 12d 4h 22m\n- Versão Firmware: v1.2.3b`;
};

export const getContractReport = async (phone: string): Promise<string> => {
    return `RELATÓRIO COMERCIAL (${phone}):\n- Plano: JMnet Fibra 500M\n- Valor: R$ 99,90\n- Status: ADIMPLENTE\n- Vencimento: Dia 10`;
};

export const getConnectionStatus = async (phone: string): Promise<string> => {
    return `RELATÓRIO DE CONEXÃO (${phone}):\n- IP: 177.44.12.33\n- Latência Média: 12ms\n- Perda de Pacotes: 0%\n- Sinal Óptico: -19.5 dBm (Excelente)`;
};
