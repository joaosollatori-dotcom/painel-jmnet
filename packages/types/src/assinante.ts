export interface Assinante {
    id: string;
    nome: string;
    cpfCnpj: string;
    status: 'ATIVO' | 'BLOQUEADO' | 'CANCELADO';
    createdAt: string;
}

export interface Endereco {
    id: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}
