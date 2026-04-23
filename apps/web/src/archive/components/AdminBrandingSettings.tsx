import React, { useState, useEffect } from 'react';
import { Palette, Image, EnvelopeSimple, Scroll, FloppyDisk, ArrowsClockwise } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface TenantSettings {
    logoUrl: string;
    emailPrimaryColor: string;
    emailTemplateContrato: string;
    emailFooter: string;
}

export const AdminBrandingSettings: React.FC = () => {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<TenantSettings>({
        logoUrl: '',
        emailPrimaryColor: '#3b82f6',
        emailTemplateContrato: 'Olá [CLIENTE_NOME], segue seu contrato para assinatura: [LINK_ASSINATURA]',
        emailFooter: 'Atenciosamente, Equipe TITÃ'
    });

    useEffect(() => {
        if (profile?.tenantId) {
            loadSettings();
        }
    }, [profile?.tenantId]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('TenantSettings')
                .select('*')
                .eq('tenantId', profile?.tenantId)
                .maybeSingle();

            if (data) {
                setSettings({
                    logoUrl: data.logoUrl || '',
                    emailPrimaryColor: data.emailPrimaryColor || '#3b82f6',
                    emailTemplateContrato: data.emailTemplateContrato || '',
                    emailFooter: data.emailFooter || ''
                });
            }
        } catch (err) {
            console.error('Error loading branding settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile?.tenantId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('TenantSettings')
                .upsert({
                    tenantId: profile.tenantId,
                    ...settings,
                    updatedAt: new Date().toISOString()
                });

            if (error) throw error;
            showToast('Configurações de branding salvas!', 'success');
        } catch (err) {
            showToast('Erro ao salvar branding', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Carregando identidade visual...</div>;

    return (
        <div className="branding-settings-container">
            <div className="settings-grid-main">
                {/* Coluna de Edição */}
                <div className="branding-form">
                    <div className="titan-field">
                        <label><Image size={18} /> URL da Logomarca (PNG/SVG)</label>
                        <input
                            className="titan-input"
                            value={settings.logoUrl}
                            onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                            placeholder="https://suaempresa.com/logo.png"
                        />
                    </div>

                    <div className="titan-field">
                        <label><Palette size={18} /> Cor Primária (E-mails e Links)</label>
                        <div className="color-picker-flex">
                            <input
                                type="color"
                                className="color-input"
                                value={settings.emailPrimaryColor}
                                onChange={e => setSettings({ ...settings, emailPrimaryColor: e.target.value })}
                            />
                            <input
                                className="titan-input"
                                value={settings.emailPrimaryColor}
                                onChange={e => setSettings({ ...settings, emailPrimaryColor: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="titan-field">
                        <label><EnvelopeSimple size={18} /> Template do E-mail de Contrato</label>
                        <textarea
                            className="titan-input min-h-[120px]"
                            value={settings.emailTemplateContrato}
                            onChange={e => setSettings({ ...settings, emailTemplateContrato: e.target.value })}
                            placeholder="Use [CLIENTE_NOME] e [LINK_ASSINATURA]"
                        />
                        <small className="text-gray-500 mt-1 block">Variáveis disponíveis: [CLIENTE_NOME], [LINK_ASSINATURA], [CONTRATO_ID]</small>
                    </div>

                    <div className="titan-field">
                        <label>Rodapé Padrão dos E-mails</label>
                        <input
                            className="titan-input"
                            value={settings.emailFooter}
                            onChange={e => setSettings({ ...settings, emailFooter: e.target.value })}
                        />
                    </div>

                    <button className="btn-titan-primary w-full mt-4" onClick={handleSave} disabled={saving}>
                        {saving ? <ArrowsClockwise className="animate-spin" /> : <FloppyDisk />}
                        {saving ? 'SALVANDO...' : 'SALVAR IDENTIDADE VISUAL'}
                    </button>
                </div>

                {/* Coluna de Preview */}
                <div className="branding-preview">
                    <label className="text-xs uppercase text-gray-500 mb-2 block font-bold">PREVIEW DO E-MAIL</label>
                    <div className="email-preview-box">
                        <div className="email-preview-header" style={{ borderTop: `4px solid ${settings.emailPrimaryColor}` }}>
                            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-h-12 mx-auto" /> : <div className="text-xl font-bold py-4">SUA LOGO AQUI</div>}
                        </div>
                        <div className="email-preview-body">
                            <h2 style={{ color: settings.emailPrimaryColor }}>Olá, João Silva</h2>
                            <p>{settings.emailTemplateContrato.replace('[CLIENTE_NOME]', 'João Silva').replace('[LINK_ASSINATURA]', '')}</p>
                            <div className="preview-btn" style={{ backgroundColor: settings.emailPrimaryColor }}>ACESSAR CONTRATO</div>
                        </div>
                        <div className="email-preview-footer">
                            <p>{settings.emailFooter}</p>
                            <small>Powered by TITÃ Modern CRM</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
