import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Delay showing to not overlap initial load transitions
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-consent-banner glass">
            <div className="cookie-content">
                <div className="cookie-icon">🍪</div>
                <div className="cookie-text">
                    <p>
                        Valorizamos sua privacidade. Utilizamos cookies para autenticação, salvamento de preferências de sistema
                        e monitoramento técnico de rede para garantir sua melhor conexão.
                    </p>
                    <div className="cookie-links">
                        <Link to="/privacy" onClick={() => setIsVisible(false)}>Ver Política de Privacidade</Link>
                    </div>
                </div>
            </div>
            <div className="cookie-actions">
                <button className="btn-decline" onClick={handleDecline}>Recusar</button>
                <button className="btn-accept" onClick={handleAccept}>Aceitar e Continuar</button>
            </div>
        </div>
    );
};

export default CookieConsent;
