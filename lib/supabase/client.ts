import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// This is a singleton pattern for client-side only
let client: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  // Don't create a client if running on the server
  if (typeof window === "undefined") {
    throw new Error("This client is only meant to be used on the client side")
  }

  // Return the cached client if it exists
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and anon key are required. Please check your environment variables.")
  }

  client = createSupabaseClient(supabaseUrl, supabaseKey)
  return client
}
