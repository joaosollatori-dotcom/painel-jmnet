import { supabase } from '../lib/supabase';

export interface Lead {
    id: string;
    nomeCompleto: string;
    cpfCnpj?: string;
    telefonePrincipal: string;
    telefoneSecundario?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    pontoReferencia?: string;
    canalEntrada: string;
    campanha?: string;
    vendedorId?: string;
    statusViabilidade: 'PENDENTE' | 'APROVADA' | 'REPROVADA';
    observacoes?: string;
    tipoCliente: 'RESIDENCIAL' | 'EMPRESARIAL';
    interessePlano?: string;
    perfilComercial?: string;
    decisorIdentificado: boolean;
    melhorHorario?: string;
    tentativasContato: number;
    dataEntrada: string;
    createdAt: string;
    updatedAt: string;
}

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createLead = async (lead: Partial<Lead>): Promise<Lead> => {
    const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    const { error } = await supabase
        .from('leads')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const deleteLead = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
