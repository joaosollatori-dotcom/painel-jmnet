import { supabase } from '../lib/supabase';

export interface SectorVisualSettings {
    sector: string;
    wallpaperUrl: string;
}

/**
 * Salva a configuração de wallpaper para um setor específico do Tenant.
 */
export const saveSectorWallpaper = async (tenantId: string, sector: string, wallpaperUrl: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('sector_visual_settings')
            .upsert({
                tenant_id: tenantId,
                sector: sector,
                wallpaper_url: wallpaperUrl,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id,sector' });

        if (error) {
            console.warn("Tabela sector_visual_settings não encontrada. Usando fallback via localstorage ou TenantSettings.");
            // Logica de fallback se a tabela não existir:
            await supabase.from('TenantSettings').upsert({
                tenantId,
                [`wallpaper_${sector.toLowerCase()}`]: wallpaperUrl
            });
        }
    } catch (e) {
        console.error("Erro ao salvar wallpaper por setor:", e);
        throw e;
    }
};

/**
 * Recupera o wallpaper de um setor específico.
 */
export const getSectorWallpaper = async (tenantId: string, sector: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('sector_visual_settings')
            .select('wallpaper_url')
            .eq('tenant_id', tenantId)
            .eq('sector', sector)
            .maybeSingle();

        if (error || !data) {
            // Tenta o fallback mencionado no save
            const { data: tenantData } = await supabase
                .from('TenantSettings')
                .select(`wallpaper_${sector.toLowerCase()}`)
                .eq('tenantId', tenantId)
                .maybeSingle() as any;

            return tenantData?.[`wallpaper_${sector.toLowerCase()}`] || null;
        }
        return data.wallpaper_url;
    } catch (e) {
        return null;
    }
};
