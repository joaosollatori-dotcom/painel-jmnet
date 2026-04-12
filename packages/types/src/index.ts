export * from './assinante';
export * from './financeiro';
export * from './rede';

export interface APIResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
