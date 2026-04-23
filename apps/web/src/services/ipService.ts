/**
 * Utilitário para capturar o IP público do cliente.
 * Usado para auditoria e whitelist de segurança.
 */
export const getUserIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Failed to get IP address:', error);
        return 'UNKNOWN';
    }
};
