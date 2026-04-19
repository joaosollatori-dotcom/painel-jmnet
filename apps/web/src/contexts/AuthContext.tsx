import React, { createContext, useContext, useEffect, useState } from 'react';
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

    useEffect(() => {
        let mounted = true;

        console.log("TITÃ DEBUG: Iniciando listener de Auth...");

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("TITÃ DEBUG: Evento de Auth:", event);
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session) {
                await fetchProfile();
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async () => {
        console.log("TITÃ DEBUG: Buscando perfil no banco...");
        try {
            const p = await getCurrentProfile();
            console.log("TITÃ DEBUG: Perfil retornado:", p ? "Encontrado" : "Não encontrado (null)");
            setProfile(p);
        } catch (err) {
            console.error("TITÃ DEBUG: Erro fatal no fetchProfile:", err);
        } finally {
            setLoading(false);
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
