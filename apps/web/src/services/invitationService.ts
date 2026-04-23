import { supabase } from '../lib/supabase';
import { UserRole } from './userService';

export interface Invitation {
    id_invite: string;
    email_target_invite: string;
    role_invite: UserRole;
    token_invite: string;
    expires_at_invite: string;
    used_at_invite?: string;
    tenant_id_ref_invite: string;
}

/**
 * Mapeia os dados brutos de convites para o formato "Alongado" e limpo.
 */
const mapToLogicInvitation = (raw: any): Invitation => {
    return {
        id_invite: raw.id,
        email_target_invite: raw.email,
        role_invite: raw.role as UserRole,
        token_invite: raw.invite_token,
        expires_at_invite: raw.expires_at,
        used_at_invite: raw.used_at,
        tenant_id_ref_invite: raw.tenant_id
    };
};

// ──────────────────────────────
//   INVITATION LOGIC (PRODUCTION)
// ──────────────────────────────

export const getInvitations = async (): Promise<Invitation[]> => {
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToLogicInvitation);
};

export const createInvitation = async (email: string, role: UserRole): Promise<string> => {
    const token = btoa(Math.random().toString()).slice(0, 24);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('invitations').insert([{
        email,
        invite_token: token,
        role,
        created_by: user?.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }]);

    if (error) throw error;

    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?invite=${token}`;
};

/**
 * Funçao Real de Reset: Chama o backend para invalidar o token antigo e gerar um novo.
 */
export const resetInvitation = async (inviteId: string): Promise<string> => {
    const { api } = await import('./api');
    const response = await api.post('/v1/invitations/reset', { inviteId });

    if (response.data?.newInvite?.invite_token) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/signup?invite=${response.data.newInvite.invite_token}`;
    }
    throw new Error("Erro ao resetar convite no servidor.");
};

/**
 * Funçao Real de Cancelamento: Deleta o registro do banco.
 */
export const cancelInvitation = async (inviteId: string): Promise<void> => {
    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId);

    if (error) throw error;
};

export const validateInvitation = async (token: string): Promise<Invitation | null> => {
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('invite_token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !data) return null;
    return mapToLogicInvitation(data);
};

export const claimInvite = async (userId: string, token: string): Promise<void> => {
    const { error } = await supabase
        .from('invitations')
        .update({ used_at: new Date().toISOString(), used_by: userId })
        .eq('invite_token', token);

    if (error) throw error;
};
