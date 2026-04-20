import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, getCurrentProfile } from '../services/userService';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const lastFetchedUserId = useRef<string | null>(null);
    const fetchInProgress = useRef<boolean>(false);
    const profileRef = useRef<Profile | null>(null);

    useEffect(() => {
        let mounted = true;

        console.log("TITÃ DEBUG: [V2.05.22] Iniciando listener de Auth...");

        // Safety Unlock Definitivo: Não importa o que aconteça, libera o app em 10s
        const finalSafetyTimeout = setTimeout(() => {
            if (mounted) {
                console.warn("TITÃ DEBUG: FINAL SAFETY UNLOCK TRIGGERED!");
                setLoading(false);
            }
        }, 10000);

        // KICKSTART: Verifica sessão atual imediatamente (v2.05.22)
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("TITÃ DEBUG: Kickstart session check:", session ? "Tem sessão" : "Sem sessão");
            if (!mounted) return;
            if (session) {
                setSession(session);
                setUser(session.user);
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("TITÃ DEBUG: Evento de Auth:", event);
            if (!mounted) return;

            // Limpeza de URL pós-confirmação
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                if (window.location.hash || window.location.search.includes('type=recovery')) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session) {
                if (session.user.id !== lastFetchedUserId.current || !profileRef.current) {
                    await fetchProfile(session.user);
                } else {
                    setLoading(false);
                }
            } else {
                lastFetchedUserId.current = null;
                setProfile(null);
                profileRef.current = null;
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(finalSafetyTimeout);
        };
    }, []);

    const fetchProfile = async (u: User) => {
        // Se já estamos buscando este mesmo usuário, não faz nada
        if (fetchInProgress.current && lastFetchedUserId.current === u.id) return;

        console.log("TITÃ DEBUG: Buscando perfil no banco para:", u.email);
        fetchInProgress.current = true;
        lastFetchedUserId.current = u.id;

        try {
            // Corrida com timeout para não travar o app nunca (v2.05.21)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout Supabase Query")), 8000)
            );

            const profilePromise = getCurrentProfile(u);
            const p = await Promise.race([profilePromise, timeoutPromise]) as Profile | null;

            // Verificação de segurança: O usuário ainda é o mesmo que iniciou esta busca?
            if (lastFetchedUserId.current !== u.id) {
                console.warn("TITÃ DEBUG: Descartando fetch de perfil obsoleto.");
                return;
            }

            console.log("TITÃ DEBUG: Perfil retornado:", p ? "Encontrado" : "Não encontrado (null)");
            setProfile(p);
            profileRef.current = p;
        } catch (err) {
            console.error("TITÃ DEBUG: Erro no fetchProfile (Timeout ou SQL):", err);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
