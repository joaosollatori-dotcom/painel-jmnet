/**
 * Privacy & Consent Management Utility
 */

export type ConsentStatus = 'accepted' | 'declined' | null;

export const getCookieConsent = (): ConsentStatus => {
    return localStorage.getItem('cookie-consent') as ConsentStatus;
};

export const setCookieConsent = (status: 'accepted' | 'declined') => {
    localStorage.setItem('cookie-consent', status);

    // Custom event to notify other parts of the app if needed without reload
    window.dispatchEvent(new Event('cookieConsentChanged'));

    // If declining, we should clean up non-essential storage immediately
    if (status === 'declined') {
        localStorage.removeItem('tita-theme');
        localStorage.removeItem('tita-finish');
        // Note: We don't remove 'cookie-consent' itself as it's needed to remember the choice
    }
};

export const hasAcceptedCookies = (): boolean => {
    return getCookieConsent() === 'accepted';
};
