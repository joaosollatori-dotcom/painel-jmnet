import { supabase } from '../lib/supabase';
import { addAllowedIP } from './remoteAccessService';

export interface CVAValidation {
    is_valid_kra: boolean;
    expires_at_kra?: string;
    target_ip_kra?: string;
}

/**
 * Validação de Auditoria KRA (MODO PRODUÇÃO REAL)
 * Não há simulação: Toda validação de CVA consome uma chave real e libera o IP no banco.
 */
export const validateCVA = async (code: string, currentIp: string): Promise<CVAValidation> => {
    // 1. Busca chave real (Remote Access Key) que ainda não foi usada
    const { data: keyData, error: keyError } = await supabase
        .from('remote_access_keys')
        .select('*')
        .eq('key_token', code)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (keyError || !keyData) {
        return { is_valid_kra: false };
    }

    // 2. Consumo Atômico da Chave (Impede Re-uso)
    const { error: updateError } = await supabase
        .from('remote_access_keys')
        .update({ used_at: new Date().toISOString() })
        .eq('id', keyData.id);

    if (updateError) throw updateError;

    // 3. Liberação de Acesso Real (TTL de 8h para Suporte KRA)
    await addAllowedIP(currentIp, `KRA SECURITY UNLOCK [CVA: ${code.slice(-4)}]`, 8);

    return {
        is_valid_kra: true,
        expires_at_kra: keyData.expires_at,
        target_ip_kra: currentIp
    };
};

/**
 * Registro de Emergência (Real): Registra o IP atual com justificativa para auditoria.
 */
export const registerKRA = async (ip: string, reason: string): Promise<void> => {
    // Auditamos a ação antes de registrar
    console.warn(`[KRA EMERGENCY] Desbloqueio solicitado para ${ip}. Motivo: ${reason}`);

    // Liberação real de 2 horas para emergências
    await addAllowedIP(ip, `KRA EMERGENCY: ${reason}`, 2);
};
