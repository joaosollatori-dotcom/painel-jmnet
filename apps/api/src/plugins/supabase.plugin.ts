import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fp from "fastify-plugin";

declare module "fastify" {
    interface FastifyInstance {
        supabaseAdmin: SupabaseClient;
    }
}

export default fp(async (fastify) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
        fastify.log.warn("SUPABASE_SERVICE_ROLE_KEY não configurada. Funções de Admin Auth estarão desativadas.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Casting para any para evitar conflito de tipos genéricos complexos no decorate do Fastify
    fastify.decorate("supabaseAdmin", supabaseAdmin as any);
});
