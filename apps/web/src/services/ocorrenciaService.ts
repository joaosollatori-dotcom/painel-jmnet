import { supabase } from '../lib/supabase';

export interface Ocorrencia {
    id: string;
    protocolo: string;
    cliente: string;
    assunto: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    status: 'ABERTA' | 'EM_ANALISE' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDA' | 'CANCELADA';
    data_abertura: string;
    ultima_atualizacao: string;
    vendedor_id?: string;
    descricao?: string;
    comentarios?: any[];
    anexos?: any[];
}

export const getOcorrencias = async (): Promise<Ocorrencia[]> => {
    const { data, error } = await supabase
        .from('customer_occurrences')
        .select('*')
        .order('ultima_atualizacao', { ascending: false });

    if (error) {
        console.warn('Tabela ocorrencias não encontrada. Verifique o banco.');
        return [];
    }
    return data || [];
};

export const createOcorrencia = async (oco: Partial<Ocorrencia>): Promise<Ocorrencia> => {
    const { data, error } = await supabase
        .from('customer_occurrences')
        .insert([{
            ...oco,
            data_abertura: new Date().toISOString(),
            ultima_atualizacao: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateOcorrencia = async (id: string, updates: Partial<Ocorrencia>): Promise<void> => {
    const { error } = await supabase
        .from('customer_occurrences')
        .update({ ...updates, ultima_atualizacao: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};
