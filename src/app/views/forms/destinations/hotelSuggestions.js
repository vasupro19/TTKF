/**
 * HOTEL SUGGESTIONS — the top hotels of a destination, in the four categories
 * a package is quoted in.
 *
 * One AI call per destination. Only hotels the model is confident exist are
 * kept: a short list is better than a made-up name in a customer's quotation.
 * Stored the way the rest of Travelytics reads them: "Hotel A | Hotel B".
 */

export const HOTEL_FIELDS = [
    { field: 'delux_hotel', key: 'delux', label: 'Delux' },
    { field: 'super_delux_hotel', key: 'super_delux', label: 'Super Delux' },
    { field: 'luxury_hotel', key: 'luxury', label: 'Luxury' },
    { field: 'premium_hotel', key: 'premium', label: 'Premium' }
]

export const HOTELS_PER_CATEGORY = 4

export const HOTEL_SYSTEM_PROMPT = `You are a hotel expert for Indian holidays. For the destination given, list the top hotels a travel agent would quote there, in four categories.

Respond ONLY with a JSON object: { "destination": string (the place's proper name), "delux": [], "super_delux": [], "luxury": [], "premium": [] }. Each list holds up to 4 entries, the best first, each { "name": string, "town": string (the town or city the hotel is actually in) }.

Categories:
- delux: good-value, well-reviewed 3-star properties
- super_delux: upscale 4-star properties
- luxury: 5-star and well-known luxury hotels
- premium: the destination's most exclusive stays — iconic heritage, top boutique or ultra-luxury. Most towns have only one or two; list only those.

RULES:
1. Only real hotels you are confident exist, under their current names. Never invent or guess a name. Fewer than 4 is expected when unsure — an empty list is better than a wrong hotel.
2. "town" is where the hotel really is. Only list hotels located in this destination itself or its immediate outskirts — never a famous hotel from another town or state.
3. Put each hotel in the category of its real star level and price: a 5-star belongs in luxury or premium, never lower; a mid-range resort never goes in premium.
4. "name" is the hotel name only: no descriptions, prices, star ratings or numbering.
5. Each hotel appears in one category only.
6. If the destination is not a real place, return empty lists.

Return JSON only.`

export const buildHotelRequest = destination => ({
    system: HOTEL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify({ destination: destination.trim() }) }]
})

const words = value =>
    (value || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()

// ? "The Span Resort & Spa" and "Span Resort and Spa" are the same hotel
const GENERIC_WORDS = new Set(['the', 'hotel', 'hotels', 'resort', 'resorts', 'spa', 'and', 'by', 'a'])
const hotelKey = name =>
    words(name)
        .split(' ')
        .filter(word => word && !GENERIC_WORDS.has(word))
        .join(' ')

// ? the model names each hotel's town; a hotel said to be elsewhere is dropped, whatever the model claims
const inDestination = (town, destination) => {
    if (!town) return true
    const where = words(town)
    const place = words(destination)
    return !place || where.includes(place) || place.includes(where)
}

const cleanName = value =>
    (typeof value === 'string' ? value : '')
        .replace(/^\s*\d+[).\s-]*/, '')
        .replace(/^[-*•]\s*/, '')
        // ? "Span Resort — 4-star riverside resort" → "Span Resort"
        .split(/\s+[—–-]\s+|\s*\(|:\s/)[0]
        .replace(/\s+/g, ' ')
        .trim()

const readReply = response => {
    const text = (response?.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
    try {
        return JSON.parse(text)
    } catch (error) {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        try {
            return start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : {}
        } catch (innerError) {
            return {}
        }
    }
}

/**
 * @description the model's reply as the destination form's four fields ("A | B | C | D"); a hotel listed in
 *              two categories is kept only in the first
 * @returns {{ destination: string, hotels: Record<string, string>, count: number }}
 */
export const parseHotelReply = (response, requested = '') => {
    const raw = readReply(response)
    const destination = typeof raw.destination === 'string' ? raw.destination.trim() : ''
    const seen = new Set()
    let count = 0

    const hotels = Object.fromEntries(
        HOTEL_FIELDS.map(({ field, key }) => {
            const names = (Array.isArray(raw[key]) ? raw[key] : [])
                .filter(entry => typeof entry === 'string' || inDestination(entry?.town, requested || destination))
                .map(entry => cleanName(typeof entry === 'string' ? entry : entry?.name))
                .filter(name => name.length >= 3 && name.length <= 80)
                .filter(name => {
                    const id = hotelKey(name) || name.toLowerCase()
                    if (seen.has(id)) return false
                    seen.add(id)
                    return true
                })
                .slice(0, HOTELS_PER_CATEGORY)
            count += names.length
            return [field, names.join(' | ')]
        })
    )

    return { destination, hotels, count }
}
