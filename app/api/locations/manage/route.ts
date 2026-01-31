import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const { action, id, user_id } = body

    if (!id || !user_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action === "renew") {
      // Check if item belongs to user
      const { data: existing, error: fetchError } = await supabase
        .from("locations")
        .select("id")
        .eq("id", id)
        .eq("user_id", user_id)
        .single()

      if (fetchError || !existing) {
        return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 })
      }

      // Extend expiration by 24 hours
      // We perform a raw query or calculation because standard Supabase client fits better with explicit values
      // Note: We'll calculate the new time in JS for simplicity, or we could use DB method.
      // JS method:
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const { error: updateError } = await supabase
        .from("locations")
        .update({ expires_at: newExpiry })
        .eq("id", id)

      if (updateError) throw updateError

      return NextResponse.json({ success: true, expires_at: newExpiry })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error managing location:", error)
    return NextResponse.json({ error: "Management failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const user_id = searchParams.get("user_id")

    if (!id || !user_id) {
        return NextResponse.json({ error: "Missing id or user_id" }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
        .from("locations")
        .select("id")
        .eq("id", id)
        .eq("user_id", user_id)
        .single()
    
    if (fetchError || !existing) {
        return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 })
    }

    // Delete
    const { error: deleteError } = await supabase
        .from("locations")
        .delete()
        .eq("id", id)

    if (deleteError) throw deleteError
    
    return NextResponse.json({ success: true })

  } catch (error) {
      console.error("Error deleting location:", error)
      return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
