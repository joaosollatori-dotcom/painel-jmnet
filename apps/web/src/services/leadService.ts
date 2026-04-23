import { supabase } from '../lib/supabase';

export interface Lead {
    id_crm: string;
    tenant_id_crm: string;
    nome_completo_crm: string;
    cpf_cnpj_crm?: string;
    rg_crm?: string;
    data_nascimento_crm?: string;
    email_crm?: string;
    telefone_principal_crm: string;
    telefone_secundario_crm?: string;
    telefone_whatsapp_crm?: string;
    tipo_pessoa_crm: 'PF' | 'PJ';

    // Endereço
    cep_crm?: string;
    logradouro_crm?: string;
    numero_crm?: string;
    complemento_crm?: string;
    bairro_crm?: string;
    cidade_crm?: string;
    uf_crm?: string;

    // Negócio
    canal_entrada_crm: string;
    vendedor_id_crm?: string;
    score_qualificacao_crm: number;
    status_qualificacao_crm: string;
    status_viabilidade_crm: string;
    plano_interesse_crm?: string;
    valor_plano_crm?: number;

    // Controle
    data_entrada_crm: string;
    data_ultima_interacao_crm: string;
    created_at_crm: string;
    updated_at_crm: string;
    stage_id_crm?: string;
    status_agendamento_crm?: string;
}

export interface Appointment {
    id_appt: string;
    lead_id_ref: string;
    titulo_appt: string;
    data_inicio_appt: string;
    status_appt: string;
    tecnico_id_ref?: string;
    vendedor_id_ref?: string;
    tipo_appt: string;
}

/**
 * Mapeamento de Engenharia: Converte dados brutos do DB para o formato Alongado.
 * Elimina redundâncias e unifica snake/camel case.
 */
const mapToLogicLead = (raw: any): Lead => {
    return {
        id_crm: raw.id,
        tenant_id_crm: raw.tenant_id || raw.tenantId,
        nome_completo_crm: raw.nomeCompleto || raw.full_name,
        cpf_cnpj_crm: raw.cpfCnpj || raw.cpf_cnpj,
        rg_crm: raw.rg,
        data_nascimento_crm: raw.dataNascimento || raw.data_nascimento,
        email_crm: raw.email,
        telefone_principal_crm: raw.telefonePrincipal || raw.telefone_principal,
        telefone_secundario_crm: raw.telefoneSecundario || raw.telefone_secundario,
        telefone_whatsapp_crm: raw.telefoneWhatsapp || raw.telefone_whatsapp,
        tipo_pessoa_crm: raw.tipoPessoa || raw.tipo_pessoa,
        cep_crm: raw.cep,
        logradouro_crm: raw.logradouro,
        numero_crm: raw.numero,
        complemento_crm: raw.complemento,
        bairro_crm: raw.bairro,
        cidade_crm: raw.cidade,
        uf_crm: raw.uf,
        canal_entrada_crm: raw.canalEntrada || raw.canal_entrada,
        vendedor_id_crm: raw.vendedorId || raw.vendedor_id,
        score_qualificacao_crm: raw.scoreQualificacao || 0,
        status_qualificacao_crm: raw.statusQualificacao || raw.status_qualificacao,
        status_viabilidade_crm: raw.statusViabilidade || raw.status_viabilidade,
        plano_interesse_crm: raw.interessePlano || raw.plano_interesse,
        valor_plano_crm: raw.valorPlano || raw.valor_plano,
        data_entrada_crm: raw.dataEntrada || raw.data_entrada,
        data_ultima_interacao_crm: raw.dataUltimaInteracao || raw.data_ultima_interacao,
        created_at_crm: raw.createdAt || raw.created_at,
        updated_at_crm: raw.updatedAt || raw.updated_at,
        stage_id_crm: raw.stageId || raw.stage_id,
        status_agendamento_crm: raw.status_agendamento
    };
};

export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase
        .from('Lead')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) return [];
    return (data || []).map(mapToLogicLead);
};

export const createLead = async (lead: Partial<Lead>): Promise<Lead> => {
    const dbPayload = {
        nomeCompleto: lead.nome_completo_crm,
        telefonePrincipal: lead.telefone_principal_crm,
        tipoPessoa: lead.tipo_pessoa_crm,
        tenant_id: lead.tenant_id_crm,
        updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('Lead')
        .insert([dbPayload])
        .select()
        .single();

    if (error) throw error;
    return mapToLogicLead(data);
};

export const getAppointments = async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('Lead')
        .select('id, nomeCompleto, dataInstalacao, tecnicoId, vendedorId, statusQualificacao, status_agendamento')
        .not('dataInstalacao', 'is', null);

    if (error) return [];

    return (data || []).map(l => ({
        id_appt: l.id,
        lead_id_ref: l.id,
        titulo_appt: `Instalação: ${l.nomeCompleto}`,
        data_inicio_appt: l.dataInstalacao,
        status_appt: l.status_agendamento || 'AGENDADO',
        tecnico_id_ref: l.tecnicoId,
        vendedor_id_ref: l.vendedorId,
        tipo_appt: 'INSTALACAO'
    }));
};
