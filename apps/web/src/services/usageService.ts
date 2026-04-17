const USAGE_KEY = 'tita-module-usage';
const THRESHOLD = 15;
const WINDOW_24H = 24 * 60 * 60 * 1000;

interface UsageData {
    [path: string]: number[]; // array of timestamps
}

export const trackModuleAccess = (path: string) => {
    // Only track main paths
    if (!path.startsWith('/')) return;

    // Normalize path (get first segment)
    const segments = path.split('/');
    if (segments.length < 2) return;
    const mainPath = '/' + segments[1];

    try {
        const raw = localStorage.getItem(USAGE_KEY);
        const data: UsageData = raw ? JSON.parse(raw) : {};

        if (!data[mainPath]) data[mainPath] = [];

        const now = Date.now();
        data[mainPath].push(now);

        // Cleanup old timestamps (older than 24h)
        Object.keys(data).forEach(key => {
            data[key] = data[key].filter(ts => now - ts < WINDOW_24H);
            if (data[key].length === 0) delete data[key];
        });

        localStorage.setItem(USAGE_KEY, JSON.stringify(data));
    } catch (err) {
        console.error('Error tracking module access:', err);
    }
};

export const getFrequentlyAccessedModules = (): string[] => {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
        if (!raw) return [];
        const data: UsageData = JSON.parse(raw);
        const now = Date.now();

        return Object.keys(data)
            .filter(path => {
                const recentAccesses = data[path].filter(ts => now - ts < WINDOW_24H);
                return recentAccesses.length > THRESHOLD;
            })
            .sort((a, b) => {
                const countA = data[a].filter(ts => now - ts < WINDOW_24H).length;
                const countB = data[b].filter(ts => now - ts < WINDOW_24H).length;
                return countB - countA;
            });
    } catch (err) {
        console.error('Error getting frequent modules:', err);
        return [];
    }
};
