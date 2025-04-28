import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const createClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key are required. Please check your environment variables.")
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}
