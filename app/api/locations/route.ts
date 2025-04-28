import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const { latitude, longitude, has_electricity, comment } = body

    // Validate required fields
    if (typeof latitude !== "number" || typeof longitude !== "number" || typeof has_electricity !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body. Required fields: latitude, longitude, has_electricity" },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        latitude,
        longitude,
        has_electricity,
        comment: comment || null,
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
