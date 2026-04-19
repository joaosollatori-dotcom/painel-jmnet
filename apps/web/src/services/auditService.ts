import { supabase } from '../lib/supabase';

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

        // In a real environment, we would get the IP from a service or the backend
        // Here we can use a placeholder or a public IP service
        const ip = 'FETCHING...';

        await supabase.from('audit_logs').insert([{
            actor_id: user.id,
            action,
            resource,
            details,
            ip_address: ip
        }]);
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
};

export const getGlobalAuditLogs = async (limit = 100): Promise<AuditLog[]> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                profiles:actor_id (full_name, email),
                tenants:tenant_id (name)
            `)
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
