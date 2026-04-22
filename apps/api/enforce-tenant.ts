import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function addTenantIds() {
    console.log('--- ENFORCING TENANT_ID ON SYSTEM TABLES ---');
    try {
        const queries = [
            // Garante tenant_id nas tabelas principais encontradas
            `ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,
            `ALTER TABLE public.customer_occurrences ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,
            `ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,
            `ALTER TABLE public.sales_stages ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);`,

            // Corrige RLS para Ordem de Serviço e Ocorrências
            `ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;`,
            `DROP POLICY IF EXISTS "tenant_isolation" ON public.service_orders;`,
            `CREATE POLICY "tenant_isolation" ON public.service_orders FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));`,

            `ALTER TABLE public.customer_occurrences ENABLE ROW LEVEL SECURITY;`,
            `DROP POLICY IF EXISTS "tenant_isolation" ON public.customer_occurrences;`,
            `CREATE POLICY "tenant_isolation" ON public.customer_occurrences FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));`
        ];

        for (const sql of queries) {
            try {
                await prisma.$executeRawUnsafe(sql);
                console.log(`✅ Comando executado: ${sql.substring(0, 50)}...`);
            } catch (e) {
                console.warn(`⚠ Falha ou redundância: ${sql.substring(0, 50)}`);
            }
        }

        console.log('--- FINALIZADO ---');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

addTenantIds();
