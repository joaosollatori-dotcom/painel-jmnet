import { supabase } from '../lib/supabase';

export interface ServiceOrder {
    id: string;
    tipo: string;
    status: 'ABERTA' | 'EM_EXECUCAO' | 'FINALIZADA' | 'CANCELADA';
    descricao: string;
    prioridade: 'NORMAL' | 'ALTA' | 'URGENTE';
    data_agendamento?: string;
    cliente_nome: string;
    cliente_endereco: string;
    conversation_id?: string;
    data_conclusao?: string;
    created_at: string;
}

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
    const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Tabela service_orders não encontrada ou erro ao buscar. Verifique o banco.');
        return [];
    }
    return data || [];
};

export const createServiceOrder = async (os: Partial<ServiceOrder>): Promise<ServiceOrder> => {
    const { data, error } = await supabase
        .from('service_orders')
        .insert([{
            ...os,
            status: os.status || 'ABERTA',
            prioridade: os.prioridade || 'NORMAL',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>): Promise<void> => {
    const { error } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};
