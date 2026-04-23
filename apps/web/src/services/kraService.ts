import { supabase } from '../lib/supabase';
import { addAllowedIP } from './remoteAccessService';

export interface CVAValidation {
    is_valid_kra: boolean;
    expires_at_kra?: string;
    target_ip_kra?: string;
}

/**
 * Validação Real de CVA: Verifica o token, marca como usado e libera o IP.
 */
export const validateCVA = async (code: string, currentIp: string): Promise<CVAValidation> => {
    try {
        const { data, error } = await supabase
            .from('remote_access_keys')
            .select('*')
            .eq('key_token', code)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            return { is_valid_kra: false };
        }

        // Marcar chave como usada (Persistência Real)
        await supabase
            .from('remote_access_keys')
            .update({ used_at: new Date().toISOString() })
            .eq('id', data.id);

        // Autoflow: Registra o IP atual na whitelist por ser um acesso KRA validado
        await addAllowedIP(currentIp, `KRA Access - Code: ${code.slice(-6)}`);

        return {
            is_valid_kra: true,
            expires_at_kra: data.expires_at,
            target_ip_kra: currentIp
        };
    } catch (e) {
        return { is_valid_kra: false };
    }
};

/**
 * Registro de Emergência (Produção): Permite registrar um IP com tempo de vida.
 * Nota: Requer que o banco suporte expiração automática ou rotina de limpeza.
 */
export const registerKRA = async (ip: string, reason: string): Promise<void> => {
    await addAllowedIP(ip, `KRA Emergency: ${reason}`);
};
