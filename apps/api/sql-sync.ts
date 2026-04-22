import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function sqlSync() {
    console.log('--- SYNCING TABLES VIA DIRECT SQL (BYPASS PRISMA) ---');
    try {
        const commands = [
            `CREATE TABLE IF NOT EXISTS public."Assinante" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, "cpfCnpj" text UNIQUE NOT NULL, metadata jsonb, status text DEFAULT 'ATIVO', tenant_id uuid REFERENCES public.tenants(id), "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now());`,
            `CREATE TABLE IF NOT EXISTS public."Endereco" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "assinanteId" uuid REFERENCES public."Assinante"(id) ON DELETE CASCADE, logradouro text NOT NULL, numero text NOT NULL, bairro text NOT NULL, cidade text NOT NULL, estado text NOT NULL, cep text NOT NULL, complemento text, tipo text DEFAULT 'COBRANCA');`,
            `CREATE TABLE IF NOT EXISTS public."Fatura" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "assinanteId" uuid REFERENCES public."Assinante"(id) ON DELETE CASCADE, valor decimal(10,2) NOT NULL, vencimento timestamptz NOT NULL, status text DEFAULT 'PENDENTE', tenant_id uuid REFERENCES public.tenants(id), "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now());`,
            `CREATE TABLE IF NOT EXISTS public."OLT" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, ip text UNIQUE NOT NULL, modelo text NOT NULL, comunidade text DEFAULT 'public', tenant_id uuid REFERENCES public.tenants(id));`,
            `CREATE TABLE IF NOT EXISTS public."ONU" (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "oltId" uuid REFERENCES public."OLT"(id) ON DELETE CASCADE, serial text UNIQUE NOT NULL, "ponPort" integer NOT NULL, status text DEFAULT 'OFFLINE', tenant_id uuid REFERENCES public.tenants(id));`,
            `ALTER TABLE public."Assinante" ENABLE ROW LEVEL SECURITY;`,
            `ALTER TABLE public."Fatura" ENABLE ROW LEVEL SECURITY;`,
            `ALTER TABLE public."OLT" ENABLE ROW LEVEL SECURITY;`,
            `ALTER TABLE public."ONU" ENABLE ROW LEVEL SECURITY;`,
            `DROP POLICY IF EXISTS tenant_isolation ON public."Assinante";`,
            `CREATE POLICY tenant_isolation ON public."Assinante" FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));`,
            `DROP POLICY IF EXISTS tenant_isolation ON public."Fatura";`,
            `CREATE POLICY tenant_isolation ON public."Fatura" FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));`
        ];

        for (const cmd of commands) {
            await prisma.$executeRawUnsafe(cmd);
            console.log('✅ Executado:', cmd.substring(0, 50));
        }
        console.log('✅ Tabelas criadas e Tenancificadas via SQL!');

    } catch (e) {
        console.error('❌ Erro no SQL Sync:', e);
    } finally {
        await prisma.$disconnect();
    }
}

sqlSync();
