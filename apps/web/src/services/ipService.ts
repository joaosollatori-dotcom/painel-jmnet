/**
 * Utilitário para capturar o IP público do cliente.
 * Usado para auditoria e whitelist de segurança.
 */
export const getUserIP = async (): Promise<string> => {
    const services = [
        'https://api.ipify.org?format=json',
        'https://api64.ipify.org?format=json',
        'https://api.seeip.org?format=json'
    ];

    for (const url of services) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) continue;
            const data = await response.json();
            return data.ip || data.ip_address || 'UNKNOWN';
        } catch (error) {
            console.warn(`Failed to fetch IP from ${url}:`, error);
            continue; // Tenta o próximo serviço
        }
    }

    return 'UNKNOWN';
};
