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

export const createInvitation = async (email: string, role: UserRole): Promise<string> => {
    const token = btoa(Math.random().toString()).slice(0, 24);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existing } = await supabase.from('invitations').select('id').eq('email', email).maybeSingle();
    if (existing) {
        throw new Error("Um convite para este e-mail já existe na base.");
    }

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

export const getInvitations = async (): Promise<Invitation[]> => {
    try {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return [];
        return (data || []).map(mapToLogicInvitation);
    } catch (e) {
        return [];
    }
};

export const validateInvitation = async (token: string): Promise<Partial<Invitation> | null> => {
    try {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('invite_token', token)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) return null;

        return mapToLogicInvitation(data);
    } catch (e) {
        return null;
    }
};

export const claimInvite = async (userId: string, token: string): Promise<void> => {
    await supabase
        .from('invitations')
        .update({ used_at: new Date().toISOString(), used_by: userId })
        .eq('invite_token', token);
};
