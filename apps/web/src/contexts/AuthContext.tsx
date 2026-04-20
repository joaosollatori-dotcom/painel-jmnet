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

        console.log("TITÃ DEBUG: Iniciando listener de Auth...");

        // Safety Unlock: Se em 7 segundos não tivermos resposta, libera a UI
        const safetyUnlock = setTimeout(() => {
            if (mounted && loading) {
                console.warn("TITÃ DEBUG: Safety Unlock ativado (Timeout)");
                setLoading(false);
            }
        }, 7000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("TITÃ DEBUG: Evento de Auth:", event);
            if (!mounted) return;

            // Limpeza de URL pós-confirmação (v2.05.16)
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                if (window.location.hash || window.location.search.includes('type=recovery')) {
                    console.log("TITÃ DEBUG: Limpando URL de autenticação...");
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session) {
                // Só busca perfil se o usuário mudou OU se não temos perfil e não estamos buscando
                if (session.user.id !== lastFetchedUserId.current || (!profileRef.current && !fetchInProgress.current)) {
                    await fetchProfile(session.user);
                    clearTimeout(safetyUnlock);
                } else {
                    setLoading(false);
                    clearTimeout(safetyUnlock);
                }
            } else {
                lastFetchedUserId.current = null;
                setProfile(null);
                profileRef.current = null;
                setLoading(false);
                clearTimeout(safetyUnlock);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
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
