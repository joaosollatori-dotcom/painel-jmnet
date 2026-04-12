export interface OLT {
    id: string;
    nome: string;
    ip: string;
    modelo: string;
}

export interface ONU {
    id: string;
    oltId: string;
    serial: string;
    ponPort: number;
    status: 'ONLINE' | 'OFFLINE';
    sinal?: string;
}
