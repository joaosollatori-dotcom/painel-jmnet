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

        console.log("TITÃ DEBUG: [V2.05.23] Monitorando Auth...");

        // Safety Unlock Definitivo (v2.05.23)
        const safetyTimeout = setTimeout(() => {
            if (mounted) {
                console.warn("TITÃ DEBUG: EMERGENCY UNLOCK!");
                setLoading(false);
            }
        }, 8000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("TITÃ DEBUG: Auth Event:", event);
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (!session) {
                setLoading(false);
                setProfile(null);
                profileRef.current = null;
                lastFetchedUserId.current = null;
            } else {
                // Se o usuário é novo ou não temos perfil, busca
                if (session.user.id !== lastFetchedUserId.current) {
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
        if (fetchInProgress.current && lastFetchedUserId.current === u.id) return;

        fetchInProgress.current = true;
        lastFetchedUserId.current = u.id;

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB Timeout")), 6000)
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
