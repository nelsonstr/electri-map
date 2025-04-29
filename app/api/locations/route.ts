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

// Helper to reverse-geocode coordinates to city and country
async function fetchLocationInfo(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    )
    const json = await res.json()
    const address = json.address || {}
    const city = address.city || address.town || address.village || address.county || 'Unknown location'
    const country = address.country || 'Unknown region'
    return { city, country }
  } catch (err) {
    console.error('Error reverse-geocoding:', err)
    return { city: 'Unknown location', country: 'Unknown region' }
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

    // Reverse-geocode inserted record for city and country
    const inserted = data[0]
    const { city, country } = await fetchLocationInfo(inserted.latitude, inserted.longitude)
    return NextResponse.json({ ...inserted, city, country })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
