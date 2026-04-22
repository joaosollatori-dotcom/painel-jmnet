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
    const lastEventTime = useRef<number>(0);

    useEffect(() => {
        let mounted = true;

        console.log("TITÃ DEBUG: [V2.05.29] Proteção Anti-Loop Ativada");

        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("TITÃ DEBUG: EMERGENCY UNLOCK (Safety fallback triggered)");
                setLoading(false);
            }
        }, 10000); // Reduzido para 10s para recuperação mais rápida

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const now = Date.now();

            // Anti-Loop: Ignora refreshes muito rápidos (menos de 5s) para evitar o bombardeio do Supabase
            if (event === 'TOKEN_REFRESHED' && (now - lastEventTime.current < 5000)) {
                console.log("TITÃ DEBUG: Ignorando refresh redundante (Anti-Loop)");
                return;
            }

            lastEventTime.current = now;
            console.log("TITÃ DEBUG: Auth Event (v24):", event);

            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (!session) {
                setLoading(false);
                setProfile(null);
                profileRef.current = null;
                lastFetchedUserId.current = null;
            } else {
                // Se o usuário mudou OU se não temos nenhum perfil ainda, busca.
                if (session.user.id !== lastFetchedUserId.current || !profileRef.current) {
                    fetchProfile(session.user);
                } else {
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const fetchProfile = async (u: User) => {
        // Anti-spam & Cooldown (v2.07.07)
        // Se já houver um carregamento em curso para este usuário, ignora.
        if (fetchInProgress.current && lastFetchedUserId.current === u.id) return;

        // Se o perfil já existe e foi carregado muito recentemente (< 2s), ignora TOKEN_REFRESHED barulhentos
        const now = Date.now();
        if (profileRef.current && now - lastEventTime.current < 2000) {
            setLoading(false);
            return;
        }

        fetchInProgress.current = true;
        lastFetchedUserId.current = u.id;

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB Timeout")), 15000)
            );

            const p = await Promise.race([getCurrentProfile(u), timeoutPromise]) as Profile | null;

            if (lastFetchedUserId.current === u.id) {
                setProfile(p);
                profileRef.current = p;
            }
        } catch (err) {
            console.error("TITÃ DEBUG: Erro carregando perfil (DB ou RLS loop):", err);
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
