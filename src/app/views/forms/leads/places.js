/**
 * THE PLACES A GUEST WANTS TO SEE — "Shimla 2N, Manali 3N"
 *
 * Kept on the lead (the server's GuestPlace table) and filled on Add a lead, by
 * "Paste the enquiry", or in the quote's trip details. "Create package with AI"
 * plans its route from them, so the AI does not have to guess where to go.
 */

export const MAX_PLACES = 12
const MAX_NIGHTS = 30

const placeKey = name =>
    String(name || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()

/**
 * @description the places as the server keeps them: a name each, nights a whole number from 1 to 30 or null, each
 *              place once (the first kept), the empty rows left out
 */
export const cleanPlaces = list => {
    const seen = new Set()
    const places = []
    ;(Array.isArray(list) ? list : []).forEach(item => {
        const name = String(item?.name ?? '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120)
        if (!name || seen.has(placeKey(name))) return
        seen.add(placeKey(name))
        const nights = Number(item?.nights)
        places.push({
            name,
            nights:
                item?.nights !== '' && Number.isInteger(nights) && nights >= 1 && nights <= MAX_NIGHTS ? nights : null
        })
    })
    return places.slice(0, MAX_PLACES)
}

/** @description "Shimla 2N, Manali" */
export const placesText = places =>
    cleanPlaces(places)
        .map(({ name, nights }) => (nights ? `${name} ${nights}N` : name))
        .join(', ')

/** @description "Shimla 2 nights, Manali" — as the AI reads them */
export const placesSentence = places =>
    cleanPlaces(places)
        .map(({ name, nights }) => (nights ? `${name} ${nights} ${nights === 1 ? 'night' : 'nights'}` : name))
        .join(', ')

/** @description whether two lists say the same places, in the same order, with the same nights */
export const samePlaces = (a, b) => JSON.stringify(cleanPlaces(a)) === JSON.stringify(cleanPlaces(b))

/**
 * @description the places to suggest while typing: the trip's own first, then the agency's other places, each once
 * @param {{ name: string, campaignId: number }[]} destinations the agency's saved places
 * @returns {{ name: string, group: string }[]}
 */
export const placeOptions = (destinations, campaignId) => {
    const trip = Number(campaignId) || null
    const byName = new Map()
    ;(Array.isArray(destinations) ? destinations : []).forEach(item => {
        const name = String(item?.name || '').trim()
        if (!name) return
        const key = placeKey(name)
        const inTrip = trip !== null && Number(item.campaignId) === trip
        if (!byName.has(key) || (inTrip && !byName.get(key).inTrip)) byName.set(key, { name, inTrip })
    })
    return [...byName.values()]
        .sort((a, b) => Number(b.inTrip) - Number(a.inTrip) || a.name.localeCompare(b.name))
        .map(({ name, inTrip }) => ({ name, group: inTrip ? 'This trip' : 'Other places' }))
}
