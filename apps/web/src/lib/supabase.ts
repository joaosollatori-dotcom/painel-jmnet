import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify consent to choose storage engine
const consent = localStorage.getItem('cookie-consent');
const storage = consent === 'accepted' ? localStorage : sessionStorage;

export const supabase = createClient(url, key, {
    auth: {
        storage: storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export type Database = typeof supabase;
