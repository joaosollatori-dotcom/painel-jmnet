import { supabase } from '../lib/supabase';

export interface RemoteAccessKey {
    id_key: string;
    token_key: string;
    expires_at_key: string;
    used_at_key?: string;
    created_at_key: string;
}

export interface AllowedIP {
    id_ip: string;
    ip_address_ip: string;
    description_ip: string;
    created_at_ip: string;
}

/**
 * Mapeamento de Engenharia: Converte dados brutos do DB para o formato Alongado.
 */
const mapToLogicIP = (raw: any): AllowedIP => {
    return {
        id_ip: raw.id,
        ip_address_ip: raw.ip_address,
        description_ip: raw.description,
        created_at_ip: raw.created_at
    };
};

const mapToLogicKey = (raw: any): RemoteAccessKey => {
    return {
        id_key: raw.id,
        token_key: raw.key_token,
        expires_at_key: raw.expires_at,
        used_at_key: raw.used_at,
        created_at_key: raw.created_at
    };
};

// ──────────────────────────────
//   SECURITY KEYS (PRODUCTION)
// ──────────────────────────────

export const generateRemoteAccessKey = async (): Promise<string> => {
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

export const listRemoteAccessKeys = async (): Promise<RemoteAccessKey[]> => {
    const { data, error } = await supabase
        .from('remote_access_keys')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToLogicKey);
};

// ──────────────────────────────
//   IP WHITELIST (PRODUCTION)
// ──────────────────────────────

export const getAllowedIPs = async (): Promise<AllowedIP[]> => {
    const { data, error } = await supabase
        .from('allowed_ips')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToLogicIP);
};

export const addAllowedIP = async (ip: string, description: string): Promise<void> => {
    // Validação de segurança: Impede duplicidade de IP na whitelist
    const { data: existing } = await supabase
        .from('allowed_ips')
        .select('id')
        .eq('ip_address', ip)
        .maybeSingle();

    if (existing) return;

    const { error } = await supabase.from('allowed_ips').insert([{
        ip_address: ip,
        description
    }]);

    if (error) throw error;
};

export const removeAllowedIP = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('allowed_ips')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
