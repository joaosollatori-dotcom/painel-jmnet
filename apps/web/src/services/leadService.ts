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
    viabilidadeConfirmada?: boolean;
    propostaAceita?: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createLead = async (lead: Partial<Lead>): Promise<Lead> => {
    // Map to snake_case for DB insert
    const dbLead = { ...lead } as any;
    if (dbLead.vendedorId) { dbLead.vendedor_id = dbLead.vendedorId; delete dbLead.vendedorId; }
    if (dbLead.dataEntrada) { dbLead.data_entrada = dbLead.dataEntrada; delete dbLead.dataEntrada; }
    if (dbLead.dataUltimaInteracao) { dbLead.data_ultima_interacao = dbLead.dataUltimaInteracao; delete dbLead.dataUltimaInteracao; }

    const { data, error } = await supabase
        .from('leads')
        .insert([dbLead])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    // Map to snake_case for DB update
    const dbUpdates = { ...updates } as any;
    if (dbUpdates.vendedorId) { dbUpdates.vendedor_id = dbUpdates.vendedorId; delete dbUpdates.vendedorId; }
    if (dbUpdates.dataUltimaInteracao) { dbUpdates.data_ultima_interacao = dbUpdates.dataUltimaInteracao; delete dbUpdates.dataUltimaInteracao; }
    if (dbUpdates.statusViabilidade) { dbUpdates.status_viabilidade = dbUpdates.statusViabilidade; delete dbUpdates.statusViabilidade; }
    if (dbUpdates.statusQualificacao) { dbUpdates.status_qualificacao = dbUpdates.statusQualificacao; delete dbUpdates.statusQualificacao; }

    const { error } = await supabase
        .from('leads')
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
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
    const { data, error } = await supabase
        .from('appointment')
        .select('*')
        .order('data_inicio', { ascending: true });

    if (error) return [];
    return data || [];
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<void> => {
    const dbUpdates = { ...updates } as any;
    if (dbUpdates.dataInicio) { dbUpdates.data_inicio = dbUpdates.dataInicio; delete dbUpdates.dataInicio; }

    const { error } = await supabase
        .from('appointment')
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const createAppointment = async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const dbAppt = { ...appointment } as any;
    if (dbAppt.dataInicio) { dbAppt.data_inicio = dbAppt.dataInicio; delete dbAppt.dataInicio; }

    const { data, error } = await supabase
        .from('appointment')
        .insert([dbAppt])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getLeadHistory = async (leadId: string): Promise<LeadHistory[]> => {
    const { data, error } = await supabase
        .from('lead_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('data_evento', { ascending: false });

    if (error) return [];
    return data || [];
};

export const createLeadHistory = async (history: Partial<LeadHistory>): Promise<LeadHistory> => {
    const dbHist = { ...history } as any;
    if (dbHist.leadId) { dbHist.lead_id = dbHist.leadId; delete dbHist.leadId; }
    if (dbHist.dataEvento) { dbHist.data_evento = dbHist.dataEvento; delete dbHist.dataEvento; }
    if (dbHist.metadata) { dbHist.metadados = dbHist.metadata; delete dbHist.metadata; }

    const { data, error } = await supabase
        .from('lead_history')
        .insert([dbHist])
        .select()
        .single();

    if (error) throw error;
    return data;
};
