import { supabase } from '../lib/supabase';

export interface RemoteAccessKey {
    id: string;
    token: string;
    expiresAt: string;
    usedAt?: string;
}

export interface AllowedIP {
    id: string;
    ipAddress: string;
    description: string;
}

export const generateRemoteAccessKey = async (): Promise<string> => {
    // Design similar to Service Role Key (titã_sk_...)
    const randomBody = btoa(Math.random().toString() + Date.now().toString()).slice(0, 48);
    const fullKey = `tita_sk_${randomBody}`;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('remote_access_keys').insert([{
        key_token: fullKey,
        created_by: user?.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }]);

    if (error) throw error;
    return fullKey;
};

export const consumeRemoteAccessKey = async (key: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('remote_access_keys')
        .update({ used_at: new Date().toISOString() })
        .eq('key_token', key)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .select();

    if (error || !data || data.length === 0) return false;
    return true;
};

export const getAllowedIPs = async (): Promise<AllowedIP[]> => {
    try {
        const { data, error } = await supabase.from('allowed_ips').select('*');
        if (error) {
            console.warn("Allowed IPs table not found. Run SQL migration.");
            return [];
        }
        return data.map(d => ({
            id: d.id,
            ipAddress: d.ip_address,
            description: d.description
        }));
    } catch (e) {
        return [];
    }
};

export const addAllowedIP = async (ip: string, description: string): Promise<void> => {
    const { error } = await supabase.from('allowed_ips').insert([{
        ip_address: ip,
        description
    }]);
    if (error) throw error;
};

export const removeAllowedIP = async (id: string): Promise<void> => {
    const { error } = await supabase.from('allowed_ips').delete().eq('id', id);
    if (error) throw error;
};
