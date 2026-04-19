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
    vendedorNome?: string; // Cache do nome para o Ranking

    // Classificação
    tipoCliente: 'RESIDENCIAL' | 'EMPRESARIAL';
    perfilUso?: string;
    scoreQualificacao: number;
    interessePlano?: string;
    statusQualificacao: 'PENDENTE' | 'EM_ANALISE' | 'QUALIFICADO' | 'DESQUALIFICADO';
    statusViabilidade: 'PENDENTE' | 'EM_ANALISE' | 'VIAVEL' | 'INVIAVEL' | 'ESPECIAL';

    // Proposta e Fechamento (DADOS PARA O MOTOR)
    planoSelecionado?: string;
    valorPlano?: number; // Para cálculo de LTV/Ticket Médio no Dashboard
    custoLead?: number; // Para cálculo de CAC real
    statusProposta?: 'ENVIADA' | 'VISUALIZADA' | 'ACEITA' | 'RECUSADA';
    motivoPerda?: 'PRECO' | 'SINAL' | 'CONCORRENCIA' | 'FIDELIDADE' | 'ATENDIMENTO' | 'OUTROS';

    // Datas e Controle (PADRÃO DO SEU DB)
    dataEntrada: string;
    dataUltimaInteracao: string;
    dataPrimeiroContato?: string; // Para o SLA de Resposta
    dataProximoContato?: string;
    createdAt: string;
    updatedAt: string;

    // Fallbacks para Realtime/Novos Schemas
    created_at?: string;
    updated_at?: string;

    stageId?: string;
    provedor?: string;
}

export interface LeadHistory {
    id: string;
    leadId: string;
    lead_id?: string;
    type: 'STAGE_CHANGE' | 'NOTE' | 'CALL' | 'WA' | 'WHATSAPP' | 'EMAIL' | 'TASK' | 'DOCUMENT' | 'SYSTEM' | 'SYS';
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
    titulo: string;
    dataInicio: string;
    status: 'AGENDADO' | 'CONFIRMADO' | 'DESLOCAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'NAO_ATENDIDO' | 'CANCELADO' | 'REAGENDADO';
    tecnicoId?: string;
    vendedorId?: string;
    tipo: 'VISITA_COMERCIAL' | 'INSTALACAO' | 'DEMONSTRACAO' | 'LIGACAO' | 'RETORNO_PROPOSTA' | 'VISTORIA_TECNICA';
}

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) {
        console.error('Erro Supabase (getLeads):', error);
        return [];
    }
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
    // Limpeza de campos calculados antes do envio
    const { id: _id, createdAt: _c, created_at: _c2, ...cleanUpdates } = updates as any;

    const { error } = await supabase
        .from('leads')
        .update({ ...cleanUpdates, updatedAt: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const getLeadHistory = async (leadId: string): Promise<LeadHistory[]> => {
    const { data, error } = await supabase
        .from('lead_history')
        .select('*')
        .eq('leadId', leadId)
        .order('dataEvento', { ascending: false });
    return data || [];
};

// ... restante mantido ...
export const createLeadHistory = async (history: Partial<LeadHistory>): Promise<LeadHistory> => {
    const { metadados, metadata, leadId, ...cleanHistory } = history as any;
    const { data, error } = await supabase
        .from('lead_history')
        .insert([{ ...cleanHistory, leadId: leadId || history.leadId, dataEvento: new Date().toISOString() }])
        .select().single();
    if (error) throw error;
    return data;
};

export const getAppointments = async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('leads')
        .select('id, nomeCompleto, dataInstalacao, turnoInstalacao, tecnicoId, vendedorId, statusQualificacao, statusAgendamento')
        .not('dataInstalacao', 'is', null)
        .order('dataInstalacao', { ascending: true });
    if (error) return [];
    return (data || []).map(l => ({
        id: l.id,
        leadId: l.id,
        titulo: `Instalação: ${l.nomeCompleto}`,
        dataInicio: l.dataInstalacao,
        status: (l.statusAgendamento || (l.statusQualificacao === 'CONCLUIDO' ? 'CONCLUIDO' : 'AGENDADO')) as Appointment['status'],
        tecnicoId: l.tecnicoId,
        vendedorId: l.vendedorId,
        tipo: 'INSTALACAO'
    }));
};

export const createAppointment = async (appt: any) => {
    const { error } = await supabase.from('appointments').insert([appt]);
    if (error) throw error;
};
