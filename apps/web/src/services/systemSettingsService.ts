import { supabase } from '../lib/supabase';

export interface SystemSetting {
    id: string;
    tenantId: string; // SaaS Isolation
    category: 'LOSS_REASON' | 'OS_TYPE' | 'OCCURRENCE_TYPE';
    label: string;
    value: string;
    isActive: boolean;
    createdAt?: string;
}

// Default fallbacks caso a tabela ainda não exista no Supabase do cliente
const defaultSettings: SystemSetting[] = [
    { id: '1', tenantId: 'system', category: 'LOSS_REASON', label: 'Preço / Financeiro', value: 'PRECO', isActive: true },
    { id: '2', tenantId: 'system', category: 'LOSS_REASON', label: 'Sinal Ruim / Instabilidade', value: 'SINAL', isActive: true },
    { id: '3', tenantId: 'system', category: 'LOSS_REASON', label: 'Concorrência agressiva', value: 'CONCORRENCIA', isActive: true },
    { id: '4', tenantId: 'system', category: 'LOSS_REASON', label: 'Fidelidade operadora', value: 'FIDELIDADE', isActive: true },
    { id: '5', tenantId: 'system', category: 'LOSS_REASON', label: 'Demora no atendimento', value: 'ATENDIMENTO', isActive: true },
    { id: '6', tenantId: 'system', category: 'OS_TYPE', label: 'Instalação Fibra', value: 'INSTALACAO', isActive: true },
    { id: '7', tenantId: 'system', category: 'OS_TYPE', label: 'Reparo de Rompimento', value: 'REPARO', isActive: true },
    { id: '8', tenantId: 'system', category: 'OS_TYPE', label: 'Mudança de Endereço', value: 'MUDANCA', isActive: true },
    { id: '9', tenantId: 'system', category: 'OCCURRENCE_TYPE', label: 'Queda Geral', value: 'QUEDA_GERAL', isActive: true },
    { id: '10', tenantId: 'system', category: 'OCCURRENCE_TYPE', label: 'Lentidão', value: 'LENTIDAO', isActive: true }
];

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*');

        if (error) {
            console.warn("System settings table not found. Using defaults.");
            return defaultSettings;
        }

        return data.map(d => ({
            id: d.id,
            tenantId: d.tenant_id,
            category: d.category,
            label: d.label,
            value: d.value,
            isActive: d.is_active ?? d.isActive
        }));
    } catch (e) {
        return defaultSettings;
    }
};

export const saveSystemSetting = async (setting: Partial<SystemSetting>): Promise<SystemSetting | null> => {
    const isNew = !setting.id || !setting.id.includes('-');

    // Tratamento para camelCase vs snake_case
    const payload = {
        category: setting.category,
        label: setting.label,
        value: setting.value,
        is_active: setting.isActive,
    };

    try {
        if (isNew) {
            const { data, error } = await supabase
                .from('system_settings')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return { ...data, isActive: data.is_active };
        } else {
            const { data, error } = await supabase
                .from('system_settings')
                .update(payload)
                .eq('id', setting.id)
                .select()
                .single();
            if (error) throw error;
            return { ...data, isActive: data.is_active };
        }
    } catch (err) {
        console.error("Erro ao salvar configuração no Supabase. Certifique-se que a tabela 'system_settings' existe.", err);
        throw err;
    }
};

export const deleteSystemSetting = async (id: string): Promise<boolean> => {
    if (!id.includes('-')) {
        // IDs falsos do default
        return true;
    }
    try {
        const { error } = await supabase.from('system_settings').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        return false;
    }
};
