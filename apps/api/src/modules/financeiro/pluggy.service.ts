import { PluggyClient } from 'pluggy-sdk';

const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || '';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || '';

export const pluggyClient = new PluggyClient({
    clientId: PLUGGY_CLIENT_ID,
    clientSecret: PLUGGY_CLIENT_SECRET,
});

export const getConnectToken = async (options?: { clientUserId?: string; itemId?: string }) => {
    try {
        const response = await pluggyClient.createConnectToken(options?.itemId, {
            clientUserId: options?.clientUserId
        });
        return response;
    } catch (error) {
        console.error('Error creating Pluggy connect token:', error);
        throw error;
    }
};

export const getAccounts = async (itemId: string) => {
    try {
        const response = await pluggyClient.fetchAccounts(itemId);
        return response.results;
    } catch (error) {
        console.error(`Error fetching accounts for item ${itemId}:`, error);
        throw error;
    }
};

export const getTransactions = async (accountId: string, from?: string, to?: string) => {
    try {
        const response = await pluggyClient.fetchTransactions(accountId, { from, to });
        return response.results;
    } catch (error) {
        console.error(`Error fetching transactions for account ${accountId}:`, error);
        throw error;
    }
};

// --- Webhook Handlers ---

export const handleItemCreated = async (itemId: string) => {
    console.log(`[Pluggy Webhook] Item created: ${itemId}`);
    // Aqui você salvaria o itemId no banco de dados do tenant/organization
    // para consultas futuras automáticas.
};

export const handleItemUpdated = async (itemId: string) => {
    console.log(`[Pluggy Webhook] Item updated: ${itemId}`);
    // Sincronização automática de novas transações
};

export const handleItemError = async (itemId: string, error: any) => {
    console.error(`[Pluggy Webhook] Item error for ${itemId}:`, error);
    // Notificar o usuário que a conexão com o banco precisa de atenção
};
