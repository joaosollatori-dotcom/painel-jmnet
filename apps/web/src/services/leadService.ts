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

    // Qualificação
    tipoCliente: 'RESIDENCIAL' | 'EMPRESARIAL';
    perfilUso?: string;
    usoPrincipal?: string;
    numDispositivos?: number;
    temMEI: boolean;
    scoreQualificacao: number;
    interesseDeclarado?: string;
    interessePlano?: string;
    valorPagoAtual?: number;
    operadoraAtual?: string;
    statusQualificacao: 'PENDENTE' | 'QUALIFICADO' | 'DESQUALIFICADO';

    // Viabilidade
    statusViabilidade: 'PENDENTE' | 'APROVADA' | 'REPROVADA';
    distanciaDistribuidor?: number;
    ctoProxima?: string;
    portasDisponiveis?: number;
    obsTecnica?: string;
    verificadoPor?: string;
    dataVerificacao?: string;

    // Proposta
    statusProposta?: string;
    valorProposta?: number;
    linkContrato?: string;
    dataAceite?: string;

    // Agendamento
    dataInstalacao?: string;
    turnoInstalacao?: string;
    tecnicoId?: string;
    numeroOS?: string;

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

    history?: LeadHistory[];
}

export interface LeadHistory {
    id: string;
    leadId: string;
    type: 'STAGE_CHANGE' | 'NOTE' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'TASK' | 'DOCUMENT';
    content?: string;
    duration?: number;
    fromStage?: string;
    toStage?: string;
    responsavelId?: string;
    dataEvento: string;
    metadata?: any;
}

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase
        .from('Lead')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createLead = async (lead: Partial<Lead>): Promise<Lead> => {
    const { data, error } = await supabase
        .from('Lead')
        .insert([lead])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    const { error } = await supabase
        .from('Lead')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const deleteLead = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('Lead')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
