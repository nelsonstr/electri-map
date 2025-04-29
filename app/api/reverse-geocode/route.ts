import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    if (!lat || !lon) {
        return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 })
    }
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
            { headers: { 'User-Agent': 'ElectricityStatusMap/1.0' } }
        )
        if (!response.ok) {
            return NextResponse.json({ error: 'Nominatim error', status: response.status }, { status: response.status })
        }
        const data = await response.json()
        const address = data.address || {}
        const city = address.city || address.town || address.village || address.county || 'Unknown location'
        const country = address.country || 'Unknown region'
        return NextResponse.json({ city, country })
    } catch (err) {
        console.error('Error in reverse-geocode API:', err)
        return NextResponse.json({ city: 'Unknown location', country: 'Unknown region' })
    }
} 
