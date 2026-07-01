import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables de entorno, lo avisamos en consola y en la UI.
export const supabaseReady = Boolean(url && key);

export const supabase = supabaseReady ? createClient(url, key) : null;
