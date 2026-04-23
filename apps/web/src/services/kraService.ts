import { supabase } from '../lib/supabase';

export interface CVAValidation {
    isValid: boolean;
    expiresAt?: string;
    targetIp?: string;
}

/**
 * Solicita a validação de um código CVA para liberação de acesso KRA.
 * O código é gerado pelo suporte e validado pelo Founder (ou sistema).
 */
export const validateCVA = async (code: string): Promise<CVAValidation> => {
    try {
        // Mock da lógica: No futuro isso chamará uma Edge Function que valida o CVA
        // e já adiciona o IP à tabela allowed_ips com expiração automática.

        // Simulação de verificação
        const { data, error } = await supabase
            .from('remote_access_keys')
            .select('*')
            .eq('key_token', code)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            return { isValid: false };
        }

        // Marcar como usado e retornar validade
        await supabase
            .from('remote_access_keys')
            .update({ used_at: new Date().toISOString() })
            .eq('id', data.id);

        return {
            isValid: true,
            expiresAt: data.expires_at,
        };
    } catch (e) {
        return { isValid: false };
    }
};

/**
 * Adiciona o IP atual à whitelist com uma nota de expiração (KRA).
 */
export const registerKRA = async (ip: string, durationMinutes: number = 60): Promise<void> => {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const description = `KRA Support - Expira em ${expiresAt.toLocaleTimeString('pt-BR')}`;

    await supabase.from('allowed_ips').insert([{
        ip_address: ip,
        description,
        // No banco real, deveríamos ter uma coluna 'expires_at'
    }]);
};
