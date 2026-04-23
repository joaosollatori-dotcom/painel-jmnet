import { supabase } from '../lib/supabase';
import { getUserIP } from './ipService';

export interface AuditLog {
    id_audit: string;
    actor_id_audit: string;
    tenant_id_audit: string;
    action_audit: string;
    resource_audit: string;
    details_audit: any;
    ip_address_audit: string;
    timestamp_audit: string;
}

/**
 * Mapeia os dados brutos de auditoria para o formato "Alongado" e limpo.
 * Elimina redundâncias entre camelCase e snake_case.
 */
const mapToLogicAudit = (raw: any): AuditLog => {
    return {
        id_audit: raw.id,
        actor_id_audit: raw.actor_id || raw.actorId,
        tenant_id_audit: raw.tenant_id || raw.tenantId,
        action_audit: raw.action,
        resource_audit: raw.resource,
        details_audit: raw.details,
        ip_address_audit: raw.ip_address || raw.ipAddress,
        timestamp_audit: raw.created_at || raw.createdAt
    };
};

export const logAction = async (action: string, resource: string, details: any = {}): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const ip = await getUserIP();

        await supabase.from('audit_logs').insert([{
            actor_id: user.id,
            action,
            resource,
            details,
            ip_address: ip,
            retention_type: (action === 'ACCESS' || action === 'DELETE') ? 'FORENSIC' : 'OPERATIONAL'
        }]);
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
};

export const getGlobalAuditLogs = async (limit = 100): Promise<AuditLog[]> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`*`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return [];

        return (data || []).map(mapToLogicAudit);
    } catch (e) {
        return [];
    }
};
