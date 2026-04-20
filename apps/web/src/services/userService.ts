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
    fullName: string;
    email: string;
    tenantId: string;
    role: UserRole;
    avatarUrl?: string;
    isActive: boolean;
    permissions?: Permission[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    isActive: boolean;
}

export const getCurrentProfile = async (passedUser?: User): Promise<Profile | null> => {
    console.log("TITÃ DEBUG: Iniciando getCurrentProfile...");
    try {
        const user = passedUser || (await supabase.auth.getUser()).data.user;
        if (!user) {
            console.log("TITÃ DEBUG: Usuário não encontrado em getCurrentProfile");
            return null;
        }

        console.log("TITÃ DEBUG: Consultando banco para ID:", user.id);

        // Timeout agressivo de 5s para o banco (v2.05.22)
        const { data, error } = await Promise.race([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Timeout")), 5000))
        ]) as any;

        if (error) {
            console.warn("TITÃ DEBUG: Perfil não encontrado ou erro de RLS:", error);
            return null;
        }

        console.log("TITÃ DEBUG: Dados do perfil brutos recebidos");

        return {
            ...data,
            tenantId: data.tenant_id,
            fullName: data.full_name,
            isActive: data.is_active,
            role: data.role as UserRole
        };
    } catch (e) {
        console.error("TITÃ DEBUG: Exceção em getCurrentProfile:", e);
        return null;
    }
};

export const getTenantUsers = async (tenantId: string): Promise<Profile[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) {
            console.warn("Profiles table not found. Using empty list.");
            return [];
        }

        return data.map(d => ({
            ...d,
            tenantId: d.tenant_id,
            fullName: d.full_name,
            isActive: d.is_active,
            role: d.role as UserRole
        }));
    } catch (e) {
        return [];
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<void> => {
    const payload: any = {};
    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.role) payload.role = updates.role;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;

    const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

    if (error) throw error;
};

// Zoho-style permissions might be stored in a JSONB column in profiles or a separate table
// For now, let's implement the engine to read them.
export const checkPermission = (profile: Profile, action: string, resource: string): boolean => {
    if (profile.role === 'SUPER_ADMIN') return true;
    if (!profile.permissions) return false;

    return profile.permissions.some(p =>
        (p.action === action || p.action === '*') &&
        (p.resource === resource || p.resource === '*') &&
        p.allowed
    );
};
