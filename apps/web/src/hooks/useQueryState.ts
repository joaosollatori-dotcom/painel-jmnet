import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook para sincronizar estado reativo com query parameters da URL.
 * Permite validação de filtros e estados MICRO/NANO via deep linking.
 */
export function useQueryState<T = string>(
    key: string,
    defaultValue: T
): [T, (newValue: T) => void] {
    const [searchParams, setSearchParams] = useSearchParams();

    const paramValue = searchParams.get(key);

    // Converte o valor da URL de volta para o tipo T básico (string, number, boolean)
    let value: T = paramValue !== null ? (paramValue as unknown as T) : defaultValue;

    if (typeof defaultValue === 'number' && paramValue !== null) {
        value = Number(paramValue) as unknown as T;
    } else if (typeof defaultValue === 'boolean' && paramValue !== null) {
        value = (paramValue === 'true') as unknown as T;
    }

    const setValue = useCallback((newValue: T) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (newValue === defaultValue || newValue === undefined || newValue === null) {
                next.delete(key);
            } else {
                next.set(key, String(newValue));
            }
            return next;
        }, { replace: true }); // replace: true para não inundar o histórico do browser
    }, [key, defaultValue, setSearchParams]);

    return [value, setValue];
}
