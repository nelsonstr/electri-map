import { format, subDays, isAfter, parseISO } from "date-fns"

export type Location = {
  id: string
  latitude: number
  longitude: number
  has_electricity: boolean
  service_type: string
  comment: string | null
  created_at: string
  city?: string
  country?: string
}

export type StatParams = {
  locations: Location[]
  days?: number
}

// Helper to filter locations by date range
const filterByDate = (locations: Location[], days: number) => {
  const cutoff = subDays(new Date(), days)
  return locations.filter((loc) => isAfter(parseISO(loc.created_at), cutoff))
}

export const processServiceStats = ({ locations, days = 30 }: StatParams) => {
  const filtered = days ? filterByDate(locations, days) : locations
  
  const stats: Record<string, { total: number; working: number; issue: number }> = {}
  
  filtered.forEach(loc => {
    const type = loc.service_type || 'electrical'
    if (!stats[type]) {
      stats[type] = { total: 0, working: 0, issue: 0 }
    }
    
    stats[type].total += 1
    if (loc.has_electricity) {
      stats[type].working += 1
    } else {
      stats[type].issue += 1
    }
  })
  
  return Object.entries(stats).map(([name, data]) => ({
    name,
    ...data,
    percentage: data.total > 0 ? (data.working / data.total) * 100 : 0
  })).sort((a, b) => b.total - a.total)
}

export const processTrendStats = ({ locations, days = 30 }: StatParams) => {
  const filtered = days ? filterByDate(locations, days) : locations
  const trends: Record<string, { date: string; reports: number; issues: number }> = {}
  
  filtered.forEach(loc => {
    const date = format(parseISO(loc.created_at), 'yyyy-MM-dd')
    
    if (!trends[date]) {
      trends[date] = { date, reports: 0, issues: 0 }
    }
    
    trends[date].reports += 1
    if (!loc.has_electricity) {
      trends[date].issues += 1
    }
  })
  
  return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))
}

export const processGeographicStats = ({ locations, days = 30 }: StatParams) => {
    const filtered = days ? filterByDate(locations, days) : locations
    const regions: Record<string, { name: string; total: number; issues: number }> = {}

    filtered.forEach(loc => {
        // Use city if available, otherwise fallback to rounded coords
        let regionName = loc.city || "Unknown Location";
        if (regionName === "Unknown Location") {
             const roundedLat = Math.round(loc.latitude * 10) / 10
             const roundedLng = Math.round(loc.longitude * 10) / 10
             regionName = `${roundedLat}, ${roundedLng}`
        }

        if (!regions[regionName]) {
            regions[regionName] = { name: regionName, total: 0, issues: 0 }
        }

        regions[regionName].total += 1
        if (!loc.has_electricity) {
            regions[regionName].issues += 1
        }
    })

     return Object.values(regions)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10) // Top 10 regions
}

// Simple client-side NLP for extracting topics/keywords
export const analyzeTopics = (locations: Location[]) => {
  const comments = locations
    .filter(loc => loc.comment && loc.comment.length > 3)
    .map(loc => loc.comment?.toLowerCase() || "")
    
  // Stop words to filter out
  const stopWords = new Set([
     "the", "and", "a", "an", "in", "on", "at", "to", "for", "of", "with", "is", "was", "are", "it", "this", "that",
     "my", "i", "we", "have", "had", "bin", "not", "but", "or", "as", "if", "so", "be", "no", "yes", "please", "help"
  ])
  
  const wordCounts: Record<string, number> = {}
  
  comments.forEach(comment => {
    // Remove punctuation and split
    const words = comment.replace(/[^\w\s]/g, '').split(/\s+/)
    
    words.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      }
    })
  })
  
  return Object.entries(wordCounts)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20) // Top 20 keywords
}
