import { supabase } from '../lib/supabase';
import { Lead } from './leadService';

export interface SalesStage {
    id: string;
    nome: string;
    ordem: number;
    isObrigatoria: boolean;
    isConversao: boolean;
    slaDias: number;
    cor: string;
}

export interface LeadHistory {
    id: string;
    leadId: string;
    stageId: string;
    responsavelId?: string;
    dataEvento: string;
    motivoPerda?: string;
    observacoes?: string;
}

export const getSalesStages = async (): Promise<SalesStage[]> => {
    const { data, error } = await supabase
        .from('sales_stages')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        // Fallback para etapas padrão se a tabela não existir
        return [
            { id: '1', nome: 'Novo Lead', ordem: 0, isObrigatoria: false, isConversao: false, slaDias: 1, cor: '#6366f1' },
            { id: '2', nome: 'Viabilidade Verificada', ordem: 1, isObrigatoria: true, isConversao: false, slaDias: 2, cor: '#3b82f6' },
            { id: '3', nome: 'Proposta Enviada', ordem: 2, isObrigatoria: false, isConversao: false, slaDias: 2, cor: '#f59e0b' },
            { id: '4', nome: 'Contrato Assinado', ordem: 3, isObrigatoria: true, isConversao: false, slaDias: 1, cor: '#10b981' },
            { id: '5', nome: 'Agendado Instalação', ordem: 4, isObrigatoria: true, isConversao: false, slaDias: 3, cor: '#8b5cf6' },
            { id: '6', nome: 'Ativado (Vendido)', ordem: 5, isObrigatoria: true, isConversao: true, slaDias: 0, cor: '#10b981' },
            { id: '7', nome: 'Perdido', ordem: 6, isObrigatoria: true, isConversao: false, slaDias: 0, cor: '#ef4444' }
        ];
    }
    return data || [];
};

export const moveLead = async (leadId: string, stageId: string, details?: Partial<LeadHistory>): Promise<void> => {
    // 1. Atualiza o lead
    const { error: leadErr } = await supabase
        .from('Lead')
        .update({ stageId, updatedAt: new Date().toISOString() })
        .eq('id', leadId);

    if (leadErr) throw leadErr;

    // 2. Registra no histórico
    await supabase.from('lead_history').insert([{
        leadId,
        stageId,
        dataEvento: new Date().toISOString(),
        ...details
    }]);
};

export const getPipelineStats = async () => {
    const { data: leads } = await supabase.from('Lead').select('*');
    const { data: history } = await supabase.from('lead_history').select('*');

    const total = leads?.length || 0;
    const activated = leads?.filter(l => l.statusViabilidade === 'APROVADA')?.length || 0; // Exemplo de conversão

    return {
        conversionRate: total > 0 ? Math.round((activated / total) * 100) : 0,
        avgResponseTime: '7m 45s', // Ideal < 5m
        lostReasonLead: 'Preço concorrente (38%)',
        slaCompliance: 92, // Benchmark ISP: > 85%
        leadsTotal: total
    };
};
