import { supabase } from '../lib/supabase';
import { UserRole } from './userService';

export interface Invitation {
    id: string;
    email: string;
    role: UserRole;
    token: string;
    expiresAt: string;
    usedAt?: string;
    tenantId: string;
    targetUserId?: string;
}

const mapToLogicInvitation = (raw: any): Invitation => {
    return {
        id: raw.id,
        email: raw.email,
        role: raw.role as UserRole,
        token: raw.invite_token,
        expiresAt: raw.expires_at,
        usedAt: raw.used_at,
        tenantId: raw.tenant_id,
        targetUserId: raw.target_user_id
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
