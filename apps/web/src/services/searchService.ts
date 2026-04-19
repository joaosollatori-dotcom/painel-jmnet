import { supabase } from '../lib/supabase';

export interface SearchResult {
    id: string;
    type: 'lead' | 'assinante' | 'os';
    title: string;
    subtitle: string;
}

export const globalSearch = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    const results: SearchResult[] = [];

    try {
        // 1. Buscar em Leads (Usando nomeCompleto e created_at corretos)
        const { data: leads, error: leadError } = await supabase
            .from('Lead')
            .select('id, nomeCompleto, planoSelecionado')
            .ilike('nomeCompleto', `%${query}%`)
            .limit(3);

        if (!leadError && leads) {
            leads.forEach(l => results.push({
                id: l.id,
                type: 'lead',
                title: l.nomeCompleto,
                subtitle: `Lead: ${l.planoSelecionado || 'Interessado'}`
            }));
        }

        // 2. Buscar em Ordens de Serviço (Tabela correta: service_orders)
        const { data: ordens, error: osError } = await supabase
            .from('service_orders')
            .select('id, customer_name, order_type')
            .or(`customer_name.ilike.%${query}%,id.ilike.%${query}%`)
            .limit(3);

        if (!osError && ordens) {
            ordens.forEach(o => results.push({
                id: o.id,
                type: 'os',
                title: o.customer_name,
                subtitle: `OS: ${o.order_type} (#${o.id.slice(0, 5)})`
            }));
        }

        // 3. Buscar em Assinantes (Tentativa silenciosa via leads qualificados ou customer_occurrences)
        // Como 'assinantes' deu 404, vamos evitar o erro direto.
        // Futuramente, se a tabela 'assinantes' for criada, habilitamos aqui.

    } catch (err) {
        console.warn('Erro silencioso na busca global (algumas tabelas podem estar ausentes):', err);
    }

    return results;
};
