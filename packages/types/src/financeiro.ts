export interface Fatura {
    id: string;
    assinanteId: string;
    valor: number;
    vencimento: string;
    status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ATRASADO';
}

export interface Pagamento {
    id: string;
    faturaId: string;
    metodo: 'PIX' | 'BOLETO' | 'CARTAO';
    valor: number;
}
