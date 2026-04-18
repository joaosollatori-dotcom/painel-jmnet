import { supabase } from '../lib/supabase';

export interface Lead {
    id: string;
    // Identidade
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
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    pontoReferencia?: string;
    latitude?: number;
    longitude?: number;

    // Origem
    canalEntrada: 'WhatsApp' | 'Ligação' | 'Formulário Web' | 'Indicação' | 'Visita' | 'Campanha';
    campanha?: string;
    vendedorId?: string;

    // Classificação
    tipoCliente: 'RESIDENCIAL' | 'EMPRESARIAL';
    perfilUso?: string;
    scoreQualificacao: number;
    interessePlano?: string;
    statusQualificacao: 'PENDENTE' | 'EM_ANALISE' | 'QUALIFICADO' | 'DESQUALIFICADO';
    statusViabilidade: 'PENDENTE' | 'EM_ANALISE' | 'VIAVEL' | 'INVIAVEL' | 'ESPECIAL';

    // Proposta
    planoSelecionado?: string;
    statusProposta?: 'ENVIADA' | 'VISUALIZADA' | 'ACEITA' | 'RECUSADA';

    // Datas e Controle (PADRÃO DB)
    dataEntrada: string;
    dataUltimaInteracao: string;
    dataProximoContato?: string;
    created_at: string;
    updated_at: string;

    // Aliases para compatibilidade legada
    createdAt?: string;
    updatedAt?: string;
}

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro Supabase (getLeads):', error);
        return [];
    }

    // Mapeamento de segurança para garantir que o front encontre createdAt/updatedAt se precisar
    return (data || []).map(l => ({
        ...l,
        createdAt: l.created_at,
        updatedAt: l.updated_at
    }));
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    const { id: _id, created_at: _c, createdAt: _c2, ...cleanUpdates } = updates as any;

    const { error } = await supabase
        .from('leads')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const createAppointment = async (appt: any) => {
    const { error } = await supabase.from('appointments').insert([appt]);
    if (error) throw error;
};
