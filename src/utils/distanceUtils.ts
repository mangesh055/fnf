export interface VITCampus {
  id: string
  name: string
  shortName: string
  latitude: number
  longitude: number
}

export const VIT_CAMPUSES: VITCampus[] = [
  {
    id: 'vit_bibwewadi',
    name: 'VIT Bibwewadi Campus',
    shortName: 'VIT Bibwewadi',
    latitude: 18.463825,
    longitude: 73.868290,
  },
  {
    id: 'vit_kondhwa',
    name: 'VIT Kondhwa Campus',
    shortName: 'VIT Kondhwa',
    latitude: 18.460104,
    longitude: 73.884486,
  },
]

// Haversine formula to compute distance in km between two GPS coordinates
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371 // Earth radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

export function formatDistanceLabel(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)}m`
  }
  return `${distKm} km`
}

export function getVITDistances(propLat?: number, propLng?: number) {
  if (!propLat || !propLng) return []

  return VIT_CAMPUSES.map((campus) => {
    const dist = calculateDistanceKm(propLat, propLng, campus.latitude, campus.longitude)
    return {
      ...campus,
      distanceKm: dist,
      formattedDistance: formatDistanceLabel(dist),
    }
  })
}
