import { supabase } from '../lib/supabase';
import { UserRole } from './userService';

export interface Invitation {
    id: string;
    email: string;
    role: UserRole;
    token: string;
    expiresAt: string;
    usedAt?: string;
}

export const createInvitation = async (email: string, role: UserRole): Promise<string> => {
    const token = btoa(Math.random().toString()).slice(0, 24); // Token simples para convite
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('invitations').insert([{
        email,
        invite_token: token,
        role,
        created_by: user?.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }]);

    if (error) throw error;

    // Retorna o link de convite (placeholder do domínio atual)
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?invite=${token}`;
};

export const resetInvitation = async (inviteId: string): Promise<string> => {
    const { api } = await import('./api');
    const response = await api.post('/v1/invitations/reset', { inviteId });
    if (!response.data.success) throw new Error("Failed");

    // Retorna novo link
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?invite=${response.data.newInvite.invite_token}`;
};

export const getInvitations = async (): Promise<Invitation[]> => {
    try {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Invitations table not found. Run SQL migration.");
            return [];
        }
        return data.map(d => ({
            id: d.id,
            email: d.email,
            role: d.role as UserRole,
            token: d.invite_token,
            expiresAt: d.expires_at,
            usedAt: d.used_at
        })) as (Invitation & { usedAt: string | null })[];
    } catch (e) {
        return [];
    }
};
