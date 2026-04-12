import { supabase } from '../lib/supabase';

export interface Lead {
    id: string;
    nomeCompleto: string;
    cpfCnpj?: string;
    rg?: string;
    dataNascimento?: string;
    email?: string;
    telefonePrincipal: string;
    telefoneSecundario?: string;
    telefoneWhatsapp?: string;
    tipoPessoa: 'PF' | 'PJ';

    // Endereço
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    pontoReferencia?: string;
    latitude?: number;
    longitude?: number;

    // Comercial / Entrada
    canalEntrada: string;
    campanha?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    indicador?: string;
    ipEntrada?: string;
    dispositivo?: string;
    vendedorId?: string;

    // Qualificação e Viabilidade
    tipoCliente: 'RESIDENCIAL' | 'EMPRESARIAL';
    perfilUso?: string;
    interesseDeclarado?: string;
    interessePlano?: string;
    valorPagoAtual?: number;
    operadoraAtual?: string;
    statusQualificacao: 'PENDENTE' | 'QUALIFICADO' | 'DESQUALIFICADO';
    statusViabilidade: 'PENDENTE' | 'APROVADA' | 'REPROVADA';

    // Controle
    observacoes?: string;
    perfilComercial?: string;
    decisorIdentificado: boolean;
    melhorHorario?: string;
    tentativasContato: number;
    dataProximoContato?: string;
    dataUltimaInteracao: string;
    isFrio: boolean;

    // Metricas
    dataEntrada: string;
    createdAt: string;
    updatedAt: string;
    stageId?: string;
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
