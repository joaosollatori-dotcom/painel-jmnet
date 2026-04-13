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

export interface Appointment {
    id: string;
    leadId?: string;
    clienteId?: string;
    tipo: 'VISITA_COMERCIAL' | 'INSTALACAO' | 'DEMONSTRACAO' | 'LIGACAO' | 'RETORNO_PROPOSTA' | 'VISTORIA_TECNICA';
    titulo: string;

    // Temporal
    dataInicio: string;
    dataFim?: string;
    duracaoEstimada?: number; // minutos
    fusoHorario?: string;
    isDiaInteiro: boolean;

    // Responsáveis
    vendedorId?: string;
    tecnicoId?: string;
    equipeIds?: string[];
    supervisorId?: string;

    // Localização
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    pontoReferencia?: string;
    latitude?: number;
    longitude?: number;
    linkGoogleMaps?: string;

    // Status e Controle
    status: 'AGENDADO' | 'CONFIRMADO' | 'DESLOCAMENTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'NAO_ATENDIDO' | 'CANCELADO' | 'REAGENDADO';
    motivoCancelamento?: string;
    reagendamentosContagem: number;
    dataConfirmacao?: string;
    canalConfirmacao?: 'WHATSAPP' | 'TELEFONE' | 'EMAIL';

    // Vinculações
    funnelStageId?: string;
    propostaId?: string;
    erpOrderId?: string;
    protocoloOrigem?: string;

    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
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

/* ====== Appointments Services ====== */

export const getAppointments = async (): Promise<Appointment[]> => {
    try {
        const { data, error } = await supabase
            .from('Appointment')
            .select('*')
            .order('dataInicio', { ascending: true });

        if (error) {
            // Se a tabela não existe (PGRST205), retorna mock para demonstração
            if (error.code === 'PGRST205') {
                console.warn('Tabela Appointment não encontrada. Usando dados fictícios.');
                return mockAppointments;
            }
            throw error;
        }
        return data || [];
    } catch (err) {
        console.error('Erro ao carregar agendamentos:', err);
        return mockAppointments;
    }
};

const mockAppointments: Appointment[] = [
    {
        id: '1',
        leadId: '1',
        tipo: 'INSTALACAO',
        titulo: 'Instalação de Fibra 1GB',
        status: 'CONFIRMADO',
        dataInicio: new Date().toISOString(),
        duracaoEstimada: 90,
        cidade: 'São Paulo',
        isDiaInteiro: false,
        reagendamentosContagem: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '2',
        leadId: '2',
        tipo: 'VISITA_COMERCIAL',
        titulo: 'Demonstração Corporativa',
        status: 'DESLOCAMENTO',
        dataInicio: new Date(Date.now() + 3600000).toISOString(),
        duracaoEstimada: 45,
        cidade: 'Rio de Janeiro',
        isDiaInteiro: false,
        reagendamentosContagem: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const createAppointment = async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const { data, error } = await supabase
        .from('Appointment')
        .insert([{
            ...appointment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<void> => {
    const { error } = await supabase
        .from('Appointment')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const deleteAppointment = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('Appointment')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
