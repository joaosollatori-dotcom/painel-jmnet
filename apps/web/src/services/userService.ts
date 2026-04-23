import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR' | 'TECNICO' | 'SUPORTE';

export interface Permission {
    action: string;
    resource: string;
    allowed: boolean;
}

export interface Profile {
    id: string; // matches auth.users.id
    full_name_user: string;
    email_user: string;
    tenant_id_user: string;
    role_user: UserRole;
    avatar_url_user?: string;
    is_active_user: boolean;
    permissions_user?: Permission[];
    created_at_user?: string;
    updated_at_user?: string;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    isActive: boolean;
}

/**
 * Converte os dados brutos do Supabase (snake_case) para o formato Unificado e Alongado.
 * Remove as duplicidades para manter a engenharia limpa.
 */
const mapToLogicProfile = (raw: any): Profile => {
    return {
        id: raw.id,
        full_name_user: raw.full_name,
        email_user: raw.email,
        tenant_id_user: raw.tenant_id,
        role_user: raw.role as UserRole,
        avatar_url_user: raw.avatar_url,
        is_active_user: raw.is_active,
        permissions_user: raw.permissions,
        created_at_user: raw.created_at,
        updated_at_user: raw.updated_at
    };
};

export const getCurrentProfile = async (passedUser?: User): Promise<Profile | null> => {
    try {
        const user = passedUser || (await supabase.auth.getUser()).data.user;
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !data) return null;

        return mapToLogicProfile(data);
    } catch (e) {
        console.error("TITÃ ERROR [Profile Engine]:", e);
        return null;
    }
};

export const getTenantUsers = async (tenantId: string): Promise<Profile[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) return [];

        return data.map(mapToLogicProfile);
    } catch (e) {
        return [];
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<void> => {
    const payload: any = {};
    if (updates.full_name_user) payload.full_name = updates.full_name_user;
    if (updates.role_user) payload.role = updates.role_user;
    if (updates.is_active_user !== undefined) payload.is_active = updates.is_active_user;
    if (updates.avatar_url_user) payload.avatar_url = updates.avatar_url_user;

    const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

    if (error) throw error;
};

export const checkPermission = (profile: Profile, action: string, resource: string): boolean => {
    if (profile.role_user === 'SUPER_ADMIN') return true;
    if (!profile.permissions_user) return false;

    return profile.permissions_user.some(p =>
        (p.action === action || p.action === '*') &&
        (p.resource === resource || p.resource === '*') &&
        p.allowed
    );
};

export const createProfile = async (profile: Partial<Profile>): Promise<void> => {
    const { error } = await supabase.from('profiles').insert([{
        id: profile.id,
        email: profile.email_user,
        full_name: profile.full_name_user,
        role: profile.role_user || 'SUPORTE',
        tenant_id: profile.tenant_id_user,
        is_active: true
    }]);

    if (error) throw error;
};
