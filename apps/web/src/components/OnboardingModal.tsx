import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Buildings, Rocket, CheckCircle, Globe, ArrowRight, Spinner } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './OnboardingModal.css';

const OnboardingModal: React.FC = () => {
    const { user, signOut } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Form State
    const [tenantName, setTenantName] = useState('');
    const [tenantSlug, setTenantSlug] = useState('');

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantName || !tenantSlug) return;

        setLoading(true);
        console.log("TITÃ DEBUG: Iniciando criação da organização...", { tenantName, tenantSlug });

        try {
            console.log("TITÃ DEBUG: Chamando RPC 'onboard_organization'...");

            const { data, error: rpcError } = await supabase.rpc('onboard_organization', {
                org_name: tenantName,
                org_slug: tenantSlug.toLowerCase().replace(/\s/g, '-')
            });

            if (rpcError) {
                console.error("TITÃ DEBUG: Erro no RPC:", rpcError);
                throw rpcError;
            }

            if (data && !data.success) {
                console.error("TITÃ DEBUG: Falha lógica no onboarding:", data.error);
                throw new Error(data.error);
            }

            console.log("TITÃ DEBUG: Onboarding concluído via RPC com sucesso!", data);
            setStep(2);
            showToast('Organização fundada com sucesso!', 'success');

            setTimeout(() => window.location.reload(), 2000);

        } catch (err: any) {
            console.error("TITÃ DEBUG: Catch final no Onboarding:", err);
            showToast(err.message || 'Erro ao criar organização', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card">
                <div className="onboarding-progress">
                    <div className={`p-dot ${step >= 1 ? 'active' : ''}`} />
                    <div className="p-line" />
                    <div className={`p-dot ${step >= 2 ? 'active' : ''}`} />
                </div>

                {step === 1 ? (
                    <div className="onboarding-content">
                        <header>
                            <Rocket size={48} weight="fill" className="text-blue-500" />
                            <h2>Seja bem-vindo ao TITÃ | ISP</h2>
                            <p>Para começarmos, precisamos fundar sua organização operacional.</p>
                        </header>

                        <form onSubmit={handleCreateOrganization} className="onboarding-form">
                            <div className="titan-field">
                                <label><Buildings size={18} /> Nome da sua Empresa / ISP</label>
                                <input
                                    className="titan-input"
                                    placeholder="Ex: JM Net Telecom"
                                    value={tenantName}
                                    onChange={e => {
                                        setTenantName(e.target.value);
                                        if (!tenantSlug) setTenantSlug(e.target.value.toLowerCase().replace(/\s/g, '-'));
                                    }}
                                    required
                                />
                            </div>

                            <div className="titan-field">
                                <label><Globe size={18} /> Identificador Único (Slug)</label>
                                <div className="slug-input-wrapper">
                                    <span>tita.app/</span>
                                    <input
                                        className="titan-input"
                                        placeholder="jm-net"
                                        value={tenantSlug}
                                        onChange={e => setTenantSlug(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                                        required
                                    />
                                </div>
                                <small>Este será o seu endereço exclusivo no sistema.</small>
                            </div>

                            <div className="onboarding-actions">
                                <button type="button" className="btn-titan-secondary" onClick={signOut}>SAIR</button>
                                <button type="submit" className="btn-titan-primary" disabled={loading}>
                                    {loading ? <Spinner className="animate-spin" /> : (
                                        <>FUNDAR ORGANIZAÇÃO <ArrowRight weight="bold" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="onboarding-content success">
                        <CheckCircle size={80} weight="fill" className="text-green-500" />
                        <h2>Pronto para Decolar!</h2>
                        <p>Sua infraestrutura multi-tenant foi configurada. Prepare-se para o lançamento...</p>
                        <div className="success-loader" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingModal;
