const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export const getPluggyConnectToken = async () => {
    const response = await fetch(`${API_URL}/financeiro/pluggy/connect-token`);
    const json = await response.json();
    return json.connectToken;
};

export const getPluggyAccounts = async (itemId: string) => {
    const response = await fetch(`${API_URL}/financeiro/pluggy/accounts/${itemId}`);
    const json = await response.json();
    return json.data;
};

export const getPluggyTransactions = async (accountId: string, from?: string, to?: string) => {
    let url = `${API_URL}/financeiro/pluggy/transactions/${accountId}`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    const json = await response.json();
    return json.data;
};

export const getFaturasSummary = async () => {
    const response = await fetch(`${API_URL}/financeiro/faturas`);
    const json = await response.json();
    return json.data;
};
