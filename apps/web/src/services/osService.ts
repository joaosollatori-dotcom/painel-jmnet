import { supabase } from '../lib/supabase';

export interface ServiceOrder {
    id: string;
    order_type: string;
    status: 'ABERTA' | 'EM_EXECUCAO' | 'FINALIZADA' | 'CANCELADA';
    description: string;
    priority: 'NORMAL' | 'ALTA' | 'URGENTE';
    scheduled_date?: string;
    customer_name: string;
    customer_address: string;
    conversation_id?: string;
    occurrence_id?: string;
    completion_date?: string;
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

export const createServiceOrder = async (os: Partial<ServiceOrder>, tenantId?: string): Promise<ServiceOrder> => {
    const { data, error } = await supabase
        .from('service_orders')
        .insert([{
            ...os,
            tenant_id: tenantId,
            status: os.status || 'ABERTA',
            priority: os.priority || 'NORMAL',
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

export const getOSByOcorrencia = async (occurrenceId: string): Promise<ServiceOrder[]> => {
    const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('occurrence_id', occurrenceId);

    if (error) return [];
    return data || [];
};
