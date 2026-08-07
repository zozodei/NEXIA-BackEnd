import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Cliente con la service_role key: corre en el backend, nunca se expone al
// frontend, y bypassea RLS (la autorización ya la maneja verifyToken/requireRoles).
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export default supabase;
