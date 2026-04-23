import { supabase } from '../lib/supabase';

export interface ServiceOrder {
    id_os: string;
    type_os: string;
    status_os: 'ABERTA' | 'EM_EXECUCAO' | 'FINALIZADA' | 'CANCELADA';
    description_os: string;
    priority_os: 'NORMAL' | 'ALTA' | 'URGENTE';
    scheduled_date_os?: string;
    customer_name_os: string;
    customer_address_os: string;
    conversation_id_ref_os?: string;
    occurrence_id_ref_os?: string;
    completion_date_os?: string;
    created_at_os: string;
}

/**
 * Mapeia os dados brutos da OS para o formato "Alongado" e limpo.
 */
const mapToLogicOS = (raw: any): ServiceOrder => {
    return {
        id_os: raw.id,
        type_os: raw.type,
        status_os: raw.status,
        description_os: raw.description,
        priority_os: raw.priority,
        scheduled_date_os: raw.scheduled_date,
        customer_name_os: raw.customer_name,
        customer_address_os: raw.customer_address,
        conversation_id_ref_os: raw.conversation_id,
        occurrence_id_ref_os: raw.occurrence_id,
        completion_date_os: raw.completion_date,
        created_at_os: raw.created_at
    };
};

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
    const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(mapToLogicOS);
};

export const createServiceOrder = async (os: Partial<ServiceOrder>, tenantId?: string): Promise<ServiceOrder> => {
    const dbPayload = {
        type: os.type_os,
        status: os.status_os || 'ABERTA',
        description: os.description_os,
        priority: os.priority_os || 'NORMAL',
        customer_name: os.customer_name_os,
        customer_address: os.customer_address_os,
        tenant_id: tenantId,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('service_orders')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapToLogicOS(data);
};

export const updateServiceOrder = async (id_os: string, updates: Partial<ServiceOrder>): Promise<void> => {
    const dbPayload: any = {};
    if (updates.status_os) dbPayload.status = updates.status_os;
    if (updates.completion_date_os) dbPayload.completion_date = updates.completion_date_os;

    const { error } = await supabase
        .from('service_orders')
        .update(dbPayload)
        .eq('id', id_os);

    if (error) throw error;
};

export const getOSByOcorrencia = async (occurrenceId: string): Promise<ServiceOrder[]> => {
    const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('occurrence_id', occurrenceId);

    if (error) return [];
    return (data || []).map(mapToLogicOS);
};
