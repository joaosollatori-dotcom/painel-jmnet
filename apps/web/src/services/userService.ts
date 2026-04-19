import { supabase } from '../lib/supabase';

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

export const getCurrentProfile = async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            tenants (
                name,
                slug
            )
        `)
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return {
        ...data,
        tenantId: data.tenant_id,
        fullName: data.full_name,
        isActive: data.is_active,
        role: data.role as UserRole
    };
};

export const getTenantUsers = async (tenantId: string): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) throw error;

    return data.map(d => ({
        ...d,
        tenantId: d.tenant_id,
        fullName: d.full_name,
        isActive: d.is_active,
        role: d.role as UserRole
    }));
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
