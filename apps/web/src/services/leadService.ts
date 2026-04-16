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
    statusAgendamento?: 'AGENDADO' | 'CONFIRMADO' | 'DESLOCAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'NAO_ATENDIDO' | 'CANCELADO' | 'REAGENDADO';
    updatedAt: string;
    createdAt: string;

    history?: LeadHistory[];
}

export interface LeadHistory {
    id: string;
    leadId: string;
    lead_id?: string; // DB Alias
    type: 'STAGE_CHANGE' | 'NOTE' | 'CALL' | 'WA' | 'WHATSAPP' | 'EMAIL' | 'TASK' | 'DOCUMENT' | 'SYSTEM' | 'SYS';
    content?: string;
    duration?: number;
    fromStage?: string;
    toStage?: string;
    responsavelId?: string;
    responsavel_id?: string; // DB Alias
    dataEvento: string;
    data_evento?: string; // DB Alias
    metadata?: any;
    metadados?: any; // DB Name
}

export interface Appointment {
    id: string;
    leadId?: string;
    lead_id?: string; // DB Alias
    clienteId?: string;
    tipo: 'VISITA_COMERCIAL' | 'INSTALACAO' | 'DEMONSTRACAO' | 'LIGACAO' | 'RETORNO_PROPOSTA' | 'VISTORIA_TECNICA';
    titulo: string;
    dataInicio: string;
    data_inicio?: string; // DB Alias
    dataFim?: string;
    duracaoEstimada?: number;
    status: 'AGENDADO' | 'CONFIRMADO' | 'DESLOCAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'NAO_ATENDIDO' | 'CANCELADO' | 'REAGENDADO';
    tecnicoId?: string;
    vendedorId?: string;
    latitude?: number;
    longitude?: number;
    dataConfirmacao?: string;
    viabilidadeConfirmada?: boolean;
    propostaAceita?: boolean;
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
        .insert([{ ...lead, updatedAt: new Date().toISOString() }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    // Remove metadata fields that shouldn't be manually updated or could cause schema errors
    const { id: _id, leadId: _lid, createdAt: _c, ...cleanUpdates } = updates as any;

    const { error } = await supabase
        .from('leads')
        .update(cleanUpdates)
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

export const getAppointments = async (): Promise<Appointment[]> => {
    // We pull real lead data that has an installation date set
    const { data, error } = await supabase
        .from('leads')
        .select('id, nomeCompleto, dataInstalacao, turnoInstalacao, tecnicoId, vendedorId, statusQualificacao, statusAgendamento')
        .not('dataInstalacao', 'is', null)
        .order('dataInstalacao', { ascending: true });

    if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
    }

    // Map leads to appointment structure
    return (data || []).map(l => ({
        id: l.id,
        leadId: l.id,
        titulo: `Instalação: ${l.nomeCompleto}`,
        dataInicio: l.dataInstalacao,
        // Mapeamos o status real do banco, ou fallback para AGENDADO
        status: (l.statusAgendamento || (l.statusQualificacao === 'CONCLUIDO' ? 'CONCLUIDO' : 'AGENDADO')) as Appointment['status'],
        tecnicoId: l.tecnicoId,
        vendedorId: l.vendedorId,
        tipo: 'INSTALACAO',
        duracaoEstimada: 120, // Padrão de 2 horas para instalação
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }));
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<void> => {
    const leadUpdates: any = {};
    if (updates.dataInicio) leadUpdates.dataInstalacao = updates.dataInicio;
    if (updates.status) leadUpdates.statusAgendamento = updates.status;

    const { error } = await supabase
        .from('leads')
        .update({ ...leadUpdates, updatedAt: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const createAppointment = async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const leadUpdates: any = {
        dataInstalacao: appointment.dataInicio,
        updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('leads')
        .update(leadUpdates)
        .eq('id', appointment.leadId)
        .select()
        .single();

    if (error) throw error;
    return { ...data, dataInicio: data.dataInstalacao } as any;
};

export const getLeadHistory = async (leadId: string): Promise<LeadHistory[]> => {
    const { data, error } = await supabase
        .from('lead_history')
        .select('*')
        .eq('leadId', leadId)
        .order('dataEvento', { ascending: false });

    if (error) return [];
    return data || [];
};

export const createLeadHistory = async (history: Partial<LeadHistory>): Promise<LeadHistory> => {
    // metadata column is 400ing, dropping it to ensure persistence works
    const { metadados, metadata, ...cleanHistory } = history as any;

    const { data, error } = await supabase
        .from('lead_history')
        .insert([cleanHistory])
        .select()
        .single();

    if (error) throw error;
    return data;
};
