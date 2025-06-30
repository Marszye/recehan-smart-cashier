import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvxsnfnpbkzokbkqwnxe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHNuZm5wYmt6b2tia3F3bnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDIyMzUsImV4cCI6MjA2Njc3ODIzNX0.S20n0pZNI4ndGp9dbYQkDUJ95PjFRf22ITjj_3v09yw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});