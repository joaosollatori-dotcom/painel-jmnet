import { supabase } from '../lib/supabase';

export interface Conversation {
    id_chat: string;
    contact_name_chat: string;
    contact_phone_chat?: string;
    contact_email_chat?: string;
    platform_chat: 'whatsapp' | 'instagram' | 'web';
    status_chat: 'new' | 'waiting' | 'active';
    assigned_to_user_chat?: string;
    is_pinned_chat: boolean;
    is_archived_chat: boolean;
    is_muted_chat: boolean;
    is_blocked_chat: boolean;
    unread_count_chat: number;
    last_message_chat?: string;
    last_message_at_chat: string;
    ai_active_chat: boolean;
    is_closed_chat: boolean;
    created_at_chat: string;
    updated_at_chat: string;
    tenant_id_chat: string;
}

export interface Message {
    id_msg: string;
    conversation_id_ref: string;
    sender_msg: string;
    text_msg: string;
    is_user_msg: boolean;
    is_bot_msg: boolean;
    reactions_msg: string[];
    file_url_msg?: string;
    file_name_msg?: string;
    status_msg?: 'pending' | 'sent' | 'delivered' | 'read';
    created_at_msg: string;
}

/**
 * Mapeamento de Engenharia: Converte dados brutos do DB para o formato Alongado.
 * Elimina redundâncias de nomes genéricos.
 */
const mapToLogicConversation = (raw: any): Conversation => {
    return {
        id_chat: raw.id,
        contact_name_chat: raw.contact_name,
        contact_phone_chat: raw.contact_phone,
        contact_email_chat: raw.contact_email,
        platform_chat: raw.platform,
        status_chat: raw.status,
        assigned_to_user_chat: raw.assigned_to,
        is_pinned_chat: raw.is_pinned,
        is_archived_chat: raw.is_archived,
        is_muted_chat: raw.is_muted,
        is_blocked_chat: raw.is_blocked,
        unread_count_chat: raw.unread_count,
        last_message_chat: raw.last_message,
        last_message_at_chat: raw.last_message_at,
        ai_active_chat: raw.ai_active,
        is_closed_chat: raw.is_closed,
        created_at_chat: raw.created_at,
        updated_at_chat: raw.updated_at,
        tenant_id_chat: raw.tenant_id
    };
};

const mapToLogicMessage = (raw: any): Message => {
    return {
        id_msg: raw.id,
        conversation_id_ref: raw.conversation_id,
        sender_msg: raw.sender,
        text_msg: raw.text,
        is_user_msg: raw.is_user,
        is_bot_msg: raw.is_bot,
        reactions_msg: raw.reactions || [],
        file_url_msg: raw.file_url,
        file_name_msg: raw.file_name,
        status_msg: raw.status,
        created_at_msg: raw.created_at
    };
};

// ──────────────────────────────
//   Conversations
// ──────────────────────────────

export const getConversations = async (options?: {
    search?: string;
    status?: 'active' | 'archived' | 'closed';
    unreadOnly?: boolean;
}): Promise<Conversation[]> => {
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

    if (options?.unreadOnly) {
        query = query.gt('unread_count', 0);
    }

    const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('last_message_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToLogicConversation);
};

export const createConversation = async (
    partial: Partial<Conversation>
): Promise<Conversation> => {
    // Reverta o mapeamento para salvar no banco (snake_case puro)
    const dbPayload = {
        contact_name: partial.contact_name_chat,
        contact_phone: partial.contact_phone_chat,
        platform: partial.platform_chat,
        status: partial.status_chat || 'new',
        tenant_id: partial.tenant_id_chat
    };

    const { data, error } = await supabase
        .from('conversations')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapToLogicConversation(data);
};

export const updateConversation = async (
    id: string,
    updates: Partial<Conversation>
): Promise<void> => {
    const dbPayload: any = {};
    if (updates.status_chat) dbPayload.status = updates.status_chat;
    if (updates.is_archived_chat !== undefined) dbPayload.is_archived = updates.is_archived_chat;
    if (updates.is_closed_chat !== undefined) dbPayload.is_closed = updates.is_closed_chat;
    if (updates.assigned_to_user_chat) dbPayload.assigned_to = updates.assigned_to_user_chat;

    const { error } = await supabase
        .from('conversations')
        .update({ ...dbPayload, updated_at: new Date().toISOString() })
        .eq('id', id);

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
    return (data || []).map(mapToLogicMessage);
};

export const sendMessage = async (
    conversationId: string,
    text: string,
    sender: string,
    isUser: boolean = true
): Promise<Message> => {
    const { data: insertedData, error: insertError } = await supabase
        .from('messages')
        .insert([{
            conversation_id: conversationId,
            text: text,
            sender: sender,
            is_user: isUser,
            is_bot: !isUser,
            reactions: []
        }])
        .select()
        .single();

    if (insertError) throw insertError;

    // Atualiza metadados da conversa
    await supabase
        .from('conversations')
        .update({
            last_message: text,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

    return mapToLogicMessage(insertedData);
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
            (payload) => callback(mapToLogicMessage(payload.new))
        )
        .subscribe();
};

export const subscribeToConversations = (callback: (row: Conversation) => void) => {
    return supabase
        .channel('conversations')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations' },
            (payload) => callback(mapToLogicConversation(payload.new))
        )
        .subscribe();
};

export const getInternalMessages = async (channel: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('internal_messages')
            .select('*')
            .eq('channel', channel)
            .order('created_at');
        if (error) return [];
        return data || [];
    } catch (err) {
        return [];
    }
};
