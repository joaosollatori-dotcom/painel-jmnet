import { supabase } from '../lib/supabase';

export interface Contrato {
    id: string;
    nome: string;
    cpfCnpj: string;
    status: 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'PENDENTE';
    tenant_id?: string;
    // Serviço de Internet
    planoInternet?: string;
    velocidadeDown?: number;
    velocidadeUp?: number;
    valorMensal?: number;
    tipoConexao?: 'FIBRA' | 'RADIO' | 'CABO' | 'SATELITE';
    tipoPPP?: 'PPPoE' | 'DHCP' | 'IP_FIXO';
    // Rede
    cto?: string;
    portaCto?: number;
    loginPPP?: string;
    senhaPPP?: string;
    macONU?: string;
    serialONU?: string;
    enderecoIP?: string;
    vlan?: string;
    pop?: string;
    tags?: string[];
    // Datas
    dataInicio?: string;
    dataAtivacao?: string;
    dataVencimentoFatura?: number; // dia do mês
    createdAt: string;
    updatedAt: string;
}

export interface ContratoFatura {
    id: string;
    valor: number;
    vencimento: string;
    status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'VENCIDO';
    createdAt: string;
}

// Busca o contrato (Assinante) vinculado a um Lead via cpfCnpj
export const getContratByLeadCpf = async (cpfCnpj: string): Promise<Contrato | null> => {
    const { data, error } = await supabase
        .from('Assinante')
        .select('*, faturas(*)')
        .eq('cpfCnpj', cpfCnpj)
        .maybeSingle();
    if (error || !data) return null;
    return mapAssinanteToContrato(data);
};

// Busca ou cria um Assinante a partir de um Lead
export const provisionarContrato = async (lead: {
    id: string;
    nomeCompleto: string;
    cpfCnpj: string;
    tenant_id?: string;
    planoSelecionado?: string;
    valorPlano?: number;
}): Promise<Contrato> => {
    // Verifica se já existe
    const existing = await getContratByLeadCpf(lead.cpfCnpj);
    if (existing) return existing;

    const { data, error } = await supabase
        .from('Assinante')
        .insert([{
            nome: lead.nomeCompleto,
            cpfCnpj: lead.cpfCnpj,
            status: 'PENDENTE',
            tenant_id: lead.tenant_id,
            metadata: {
                leadId: lead.id,
                planoSelecionado: lead.planoSelecionado,
                valorPlano: lead.valorPlano,
            }
        }])
        .select()
        .single();

    if (error) throw error;
    return mapAssinanteToContrato(data);
};

export const updateContrato = async (id: string, updates: Partial<Contrato>): Promise<void> => {
    const payload: any = {
        status: updates.status,
        updatedAt: new Date().toISOString(),
        metadata: {
            planoInternet: updates.planoInternet,
            velocidadeDown: updates.velocidadeDown,
            velocidadeUp: updates.velocidadeUp,
            valorMensal: updates.valorMensal,
            tipoConexao: updates.tipoConexao,
            tipoPPP: updates.tipoPPP,
            cto: updates.cto,
            portaCto: updates.portaCto,
            loginPPP: updates.loginPPP,
            senhaPPP: updates.senhaPPP,
            macONU: updates.macONU,
            serialONU: updates.serialONU,
            enderecoIP: updates.enderecoIP,
            vlan: updates.vlan,
            pop: updates.pop,
            tags: updates.tags,
            dataInicio: updates.dataInicio,
            dataVencimentoFatura: updates.dataVencimentoFatura,
        }
    };
    const { error } = await supabase.from('Assinante').update(payload).eq('id', id);
    if (error) throw error;
};

export const getFaturasDoContrato = async (assinanteId: string): Promise<ContratoFatura[]> => {
    const { data, error } = await supabase
        .from('Fatura')
        .select('*')
        .eq('assinanteId', assinanteId)
        .order('vencimento', { ascending: false });
    if (error) return [];
    return (data || []).map((f: any) => ({
        id: f.id,
        valor: parseFloat(f.valor),
        vencimento: f.vencimento,
        status: f.status,
        createdAt: f.createdAt,
    }));
};

// Vincula serial da ONU GenieACS ao contrato (salvo em metadata)
export const vincularONU = async (assinanteId: string, serialONU: string, macONU?: string): Promise<void> => {
    const { data: current } = await supabase.from('Assinante').select('metadata').eq('id', assinanteId).single();
    const newMeta = { ...(current?.metadata || {}), serialONU, macONU };
    const { error } = await supabase.from('Assinante').update({ metadata: newMeta }).eq('id', assinanteId);
    if (error) throw error;
};

function mapAssinanteToContrato(data: any): Contrato {
    const meta = data.metadata || {};
    return {
        id: data.id,
        nome: data.nome,
        cpfCnpj: data.cpfCnpj,
        status: data.status,
        tenant_id: data.tenant_id,
        planoInternet: meta.planoInternet || meta.planoSelecionado,
        velocidadeDown: meta.velocidadeDown,
        velocidadeUp: meta.velocidadeUp,
        valorMensal: meta.valorMensal || meta.valorPlano,
        tipoConexao: meta.tipoConexao,
        tipoPPP: meta.tipoPPP,
        cto: meta.cto,
        portaCto: meta.portaCto,
        loginPPP: meta.loginPPP,
        senhaPPP: meta.senhaPPP,
        macONU: meta.macONU,
        serialONU: meta.serialONU,
        enderecoIP: meta.enderecoIP,
        vlan: meta.vlan,
        pop: meta.pop,
        tags: meta.tags || [],
        dataInicio: meta.dataInicio,
        dataVencimentoFatura: meta.dataVencimentoFatura,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}
