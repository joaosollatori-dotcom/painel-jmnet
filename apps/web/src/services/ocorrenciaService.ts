import { supabase } from '../lib/supabase';

export interface Ocorrencia {
    id: string;
    protocol: string;
    customer_name: string;
    subject: string;
    priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    status: 'ABERTA' | 'EM_ANALISE' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDA' | 'CANCELADA';
    opening_date: string;
    last_update: string;
    seller_id?: string;
    description?: string;
    comentarios?: any[];
    anexos?: any[];
}

export const getOcorrencias = async (): Promise<Ocorrencia[]> => {
    const { data, error } = await supabase
        .from('customer_occurrences')
        .select('*')
        .order('last_update', { ascending: false });

    if (error) {
        console.warn('Tabela ocorrencias não encontrada. Verifique o banco.');
        return [];
    }
    return data || [];
};

export const createOcorrencia = async (oco: Partial<Ocorrencia>, tenantId?: string): Promise<Ocorrencia> => {
    const { data, error } = await supabase
        .from('customer_occurrences')
        .insert([{
            ...oco,
            tenant_id: tenantId,
            opening_date: new Date().toISOString(),
            last_update: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateOcorrencia = async (id: string, updates: Partial<Ocorrencia>): Promise<void> => {
    const { error } = await supabase
        .from('customer_occurrences')
        .update({ ...updates, last_update: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};
