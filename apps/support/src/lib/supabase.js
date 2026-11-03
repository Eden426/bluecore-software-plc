import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Null when the app is built without Supabase config (e.g. the public help
// center preview); admin routes show a configuration error instead of crashing.
export const supabase = url && key ? createClient(url, key) : null;
