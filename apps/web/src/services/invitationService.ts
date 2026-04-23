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
    target_user_id_invite?: string;
}

const mapToLogicInvitation = (raw: any): Invitation => {
    return {
        id_invite: raw.id,
        email_target_invite: raw.email,
        role_invite: raw.role as UserRole,
        token_invite: raw.invite_token,
        expires_at_invite: raw.expires_at,
        used_at_invite: raw.used_at,
        tenant_id_ref_invite: raw.tenant_id,
        target_user_id_invite: raw.target_user_id
    };
};

// ──────────────────────────────
//   INVITATION LOGIC (PRODUCTION)
// ──────────────────────────────

export const getInvitations = async (): Promise<Invitation[]> => {
    const { api } = await import('./api');
    const response = await api.get('/v1/invitations');
    return (response.data || []).map(mapToLogicInvitation);
};

/**
 * Criação Real de Convite + Usuário (Prisma de Vinculação).
 * Envia e-mail e senha inseridos pelo anfitrião para o backend.
 */
export const createInvitationWithUser = async (
    email: string,
    password: string,
    role: UserRole,
    tenantId: string
): Promise<any> => {
    const { api } = await import('./api');
    const response = await api.post('/v1/invitations/create', {
        email,
        password,
        role,
        tenantId
    });
    return response.data;
};

export const resetInvitation = async (inviteId: string): Promise<any> => {
    const { api } = await import('./api');
    const response = await api.post('/v1/invitations/reset', { inviteId });
    return response.data;
};

export const cancelInvitation = async (inviteId: string): Promise<void> => {
    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId);

    if (error) throw error;
};
