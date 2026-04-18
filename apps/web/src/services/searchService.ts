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

    // 1. Buscar em Leads
    const { data: leads } = await supabase
        .from('leads')
        .select('id, nome, provedor')
        .ilike('nome', `%${query}%`)
        .limit(3);

    leads?.forEach(l => results.push({
        id: l.id,
        type: 'lead',
        title: l.nome,
        subtitle: `Lead: ${l.provedor || 'Sem provedor'}`
    }));

    // 2. Buscar em Assinantes (Cientes)
    const { data: assinantes } = await supabase
        .from('assinantes')
        .select('id, nome, documento')
        .or(`nome.ilike.%${query}%,documento.ilike.%${query}%`)
        .limit(3);

    assinantes?.forEach(a => results.push({
        id: a.id,
        type: 'assinante',
        title: a.nome,
        subtitle: `Cliente: ${a.documento}`
    }));

    // 3. Buscar em OS (Ordens de Serviço)
    const { data: ordens } = await supabase
        .from('os')
        .select('id, cliente_nome, tipo')
        .or(`cliente_nome.ilike.%${query}%,id.ilike.%${query}%`)
        .limit(3);

    ordens?.forEach(o => results.push({
        id: o.id,
        type: 'os',
        title: o.cliente_nome,
        subtitle: `OS: ${o.tipo} (#${o.id.slice(0, 5)})`
    }));

    return results;
};
