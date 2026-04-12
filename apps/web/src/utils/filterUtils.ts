/**
 * Generic filter function that searches for a term across all string properties of an object.
 * Supports nested objects and can be customized with specific fields.
 */
export const genericFilter = <T extends Record<string, any>>(
    items: T[],
    searchTerm: string,
    searchFields?: (keyof T)[]
): T[] => {
    if (!searchTerm || !items.length) return items;

    const normalizedSearch = searchTerm.toLowerCase().trim();

    return items.filter((item) => {
        // If specific fields are provided, only search within those
        const fieldsToSearch = searchFields || (Object.keys(item) as (keyof T)[]);

        return fieldsToSearch.some((key) => {
            const value = item[key];

            if (value === null || value === undefined) return false;

            // Direct string match
            if (typeof value === 'string') {
                return value.toLowerCase().includes(normalizedSearch);
            }

            // Number match
            if (typeof value === 'number') {
                return value.toString().includes(normalizedSearch);
            }

            // Deep search in objects (like nested contact info)
            if (typeof value === 'object' && !Array.isArray(value)) {
                return Object.values(value).some((val) =>
                    typeof val === 'string' && val.toLowerCase().includes(normalizedSearch)
                );
            }

            return false;
        });
    });
};
