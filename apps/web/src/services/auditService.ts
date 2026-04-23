import { supabase } from '../lib/supabase';
import { getUserIP } from './ipService';

export interface AuditLog {
    id: string;
    actorId: string;
    tenantId: string;
    action: string;
    resource: string;
    details: any;
    ipAddress: string;
    createdAt: string;
}

export const logAction = async (action: string, resource: string, details: any = {}): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Captura o IP real para auditoria forense (Milestone 4)
        const ip = await getUserIP();

        await supabase.from('audit_logs').insert([{
            actor_id: user.id,
            action,
            resource,
            details,
            ip_address: ip,
            // Flag para política de compressão: logs normais expiram em 30 dias.
            // Logs de alta prioridade (ACCESS/DELETE) são mantidos por mais tempo.
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

        if (error) {
            console.warn("Audit logs table not found or inaccessible. Run SQL migration.");
            return [];
        }
        return data.map(d => ({
            ...d,
            actorId: d.actor_id,
            tenantId: d.tenant_id,
            ipAddress: d.ip_address,
            createdAt: d.created_at
        }));
    } catch (e) {
        return [];
    }
};
