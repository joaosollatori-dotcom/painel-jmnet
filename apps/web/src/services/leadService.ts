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

    // Endereço (Essencial para plotagem no mapa ISP)
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

    // Origem e Rastreamento
    canalEntrada: 'WhatsApp' | 'Ligação' | 'Formulário Web' | 'Indicação' | 'Visita' | 'Campanha';
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

    // Classificação e Qualificação
    tipoCliente: 'RESIDENCIAL' | 'EMPRESARIAL';
    perfilUso?: 'RESIDENCIAL_BASICO' | 'RESIDENCIAL_PREMIUM' | 'EMPRESARIAL_PEQUENO' | 'EMPRESARIAL_MEDIO';
    usoPrincipal?: string;
    numDispositivos?: number;
    temMEI?: boolean;
    scoreQualificacao: number;
    interessePlano?: string;
    valorPagoAtual?: number;
    operadoraAtual?: string;
    decisorIdentificado: boolean;
    statusQualificacao: 'PENDENTE' | 'EM_ANALISE' | 'QUALIFICADO' | 'DESQUALIFICADO';

    // Viabilidade Técnica (Diferencial ISP)
    statusViabilidade: 'PENDENTE' | 'EM_ANALISE' | 'VIAVEL' | 'INVIAVEL' | 'ESPECIAL';
    ctoProxima?: string;
    portasDisponiveis?: number;
    distanciaDistribuidor?: number;
    obsTecnica?: string;
    verificadoPor?: string;
    dataVerificacao?: string;

    // Proposta e Contrato
    planoSelecionado?: string;
    valorFinal?: number;
    fidelidadeMeses?: number;
    dataEnvioProposta?: string;
    statusProposta?: 'ENVIADA' | 'VISUALIZADA' | 'ACEITA' | 'RECUSADA';
    linkDocumentoAssinatura?: string;
    assinadoEm?: string;

    // Instalação e OS
    dataInstalacao?: string;
    turnoInstalacao?: string;
    tecnicoId?: string;
    numeroOS?: string;
    motivoReagendamento?: string;

    // Métricas e Controle
    dataEntrada: string;
    dataUltimaInteracao: string;
    dataProximoContato?: string;
    tentativasContato: number;
    isFrio: boolean;
    updatedAt: string;
    createdAt: string;

    history?: LeadHistory[];
}

export interface LeadHistory {
    id: string;
    leadId: string;
    type: 'STAGE_CHANGE' | 'NOTE' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'TASK' | 'DOCUMENT' | 'SYSTEM';
    content?: string;
    duration?: number;
    fromStage?: string;
    toStage?: string;
    responsavelId?: string;
    dataEvento: string;
    metadata?: any;
}

export interface Appointment {
    id: string;
    leadId?: string;
    clienteId?: string;
    tipo: 'VISITA_COMERCIAL' | 'INSTALACAO' | 'DEMONSTRACAO' | 'LIGACAO' | 'RETORNO_PROPOSTA' | 'VISTORIA_TECNICA';
    titulo: string;
    dataInicio: string;
    dataFim?: string;
    duracaoEstimada?: number;
    status: 'AGENDADO' | 'CONFIRMADO' | 'DESLOCAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'NAO_ATENDIDO' | 'CANCELADO' | 'REAGENDADO';
    tecnicoId?: string;
    vendedorId?: string;
    latitude?: number;
    longitude?: number;
    viabilidadeConfirmada?: boolean;
    propostaAceita?: boolean;
    createdAt: string;
    updatedAt: string;
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

export const getAppointments = async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('Appointment')
        .select('*')
        .order('dataInicio', { ascending: true });

    if (error) return [];
    return data || [];
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<void> => {
    const { error } = await supabase
        .from('Appointment')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const createAppointment = async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const { data, error } = await supabase
        .from('Appointment')
        .insert([appointment])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getLeadHistory = async (leadId: string): Promise<LeadHistory[]> => {
    const { data, error } = await supabase
        .from('LeadHistory')
        .select('*')
        .eq('leadId', leadId)
        .order('dataEvento', { ascending: false });

    if (error) return [];
    return data || [];
};

export const createLeadHistory = async (history: Partial<LeadHistory>): Promise<LeadHistory> => {
    const { data, error } = await supabase
        .from('LeadHistory')
        .insert([history])
        .select()
        .single();

    if (error) throw error;
    return data;
};
