import { createClient } from '@supabase/supabase-js';

const url = 'https://iskocxmileyzbrjxwhbh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlza29jeG1pbGV5emJyanh3aGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjUzMjcsImV4cCI6MjA5MTUwMTMyN30.VAvGg0s5nNBIIaKtEQGz_A776ubaERD7PC_swXesbd0';

export const supabase = createClient(url, key);
export type Database = typeof supabase;
