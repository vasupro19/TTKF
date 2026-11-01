/**
 * A PACKAGE FROM THE GUEST'S TRIP DETAILS — "Create package with AI" on a quote.
 *
 * The trip details (dates, guests, hotel category, vehicle, pickup and drop) are
 * the planner's form, so they win; the places the guest wants ("Shimla 2N,
 * Manali 3N", kept on the lead) are the route. The guest's notes, the enquiry and
 * anything the agent adds are the typed text the planner reads for wishes, and
 * for places when none are listed. A route is never guessed: places nobody
 * wrote are asked for (ungroundedPlaces). The planned days come back as the
 * plain days the server saves as a package (Helpers/plannedPackage.helper.js).
 */

import { extractFromText, planTrip } from '../packages/tripEngine/pipeline'
import { mergeRequirements, normalizeText } from '../packages/tripEngine/requirements'
import { DAY_TYPES } from '../packages/tripEngine/route'
import { entryTypeFor, renderDayDescription, renderDayTitle } from '../packages/tripEngine/render'
import { cleanPlaces, placesSentence } from '../leads/places'

const DAY_MS = 24 * 60 * 60 * 1000

const count = value => {
    const number = Number(value)
    return Number.isInteger(number) && number >= 0 ? number : null
}

/**
 * @description the nights between the start and end dates (YYYY-MM-DD), or null when either is missing or wrong
 */
export const nightsBetween = (start, end) => {
    if (!start || !end) return null
    const nights = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS)
    return Number.isInteger(nights) && nights > 0 && nights <= 30 ? nights : null
}

/**
 * @description the trip details as the planner's form: what the agent filled in, stated as constraints
 */
/**
 * @description the places as the planner's route, with nights for each: a place without nights shares what the trip's
 *              dates leave over (at least one night each). [] when some have no nights and the dates don't say how
 *              many — the planner then reads the nights from the places as written.
 */
export const routeFromPlaces = (places, totalNights = null) => {
    const stays = cleanPlaces(places)
    const open = stays.filter(place => !place.nights)
    if (!open.length) return stays.map(({ name, nights }) => ({ name, nights }))
    if (!totalNights) return []
    const left = totalNights - stays.reduce((sum, place) => sum + (place.nights || 0), 0)
    const base = Math.floor(Math.max(left, 0) / open.length)
    let extra = Math.max(left, 0) % open.length
    return stays.map(({ name, nights }) => {
        if (nights) return { name, nights }
        const share = base + (extra > 0 ? 1 : 0)
        extra -= 1
        return { name, nights: Math.max(1, share) }
    })
}

export const requirementsFromTrip = (values = {}, places = []) => ({
    origin: (values.pickupLocation || '').trim(),
    finalDestination: (values.dropLocation || '').trim(),
    // ? the trip's name is not taken as the region: it is often a campaign name; the notes say what it is
    region: '',
    totalNights: nightsBetween(values.pickupDate, values.dropDate),
    destinations: routeFromPlaces(places, nightsBetween(values.pickupDate, values.dropDate)),
    startDate: values.pickupDate || '',
    travellers: { adults: count(values.adults), children: count(values.children) || null },
    transport: values.taxiType ? { mode: 'Private cab', vehicle: values.taxiType } : {},
    hotelPreference: values.packageType || ''
})

/**
 * @description the text the planner reads for places and wishes: the trip, its length, how the guest travels, the
 *              guest's notes, the enquiry and what the agent adds here
 */
export const notesFromTrip = ({ values = {}, region = '', enquiry = '', extra = '', places = [] }) => {
    const nights = nightsBetween(values.pickupDate, values.dropDate)
    const wanted = placesSentence(places)
    return [
        wanted ? `Places the guest wants, in this order: ${wanted}.` : '',
        region
            ? `The agency's trip is named "${region}": a region only when those words name a real place or region (as "Kashmir Delight" does), not when it is a campaign name (as "Diwali Getaways 2026" is).`
            : '',
        nights ? `${nights} nights.` : '',
        values.tourType ? `Kind of trip: ${values.tourType}.` : '',
        values.arriveBy ? `Arrives by ${values.arriveBy}.` : '',
        values.leaveBy ? `Leaves by ${values.leaveBy}.` : '',
        extra?.trim() ? `Agent's notes: ${extra.trim()}` : '',
        values.leadRemarks?.trim() ? `Guest's notes: ${values.leadRemarks.trim()}` : '',
        enquiry?.trim() ? `Enquiry: ${enquiry.trim().slice(0, 1500)}` : ''
    ]
        .filter(Boolean)
        .join('\n')
}

// ? what to ask for when nobody named the places: the AI is not trusted to guess a route for a quote
const placesQuestion = guessed => ({
    id: 'destinations',
    field: 'destinations',
    text: `${
        guessed.length
            ? `The AI suggested ${guessed.join(', ')}, but the guest’s notes and the enquiry don’t mention them`
            : 'The guest’s notes and the enquiry don’t name any places'
    }, so no route was guessed. Add the places the guest wants above, e.g. Jaipur 2 nights and Udaipur 2 nights, and try again.`
})

/**
 * @description whether the route rests on what people wrote. A place is used only when the guest's places, the
 *              agent's box, the guest's notes, the enquiry or the trip's own name ("Manali Volvo Special") name it;
 *              a region instead of places ("a Himachal trip") the same way. A trip named "Diwali Getaways 2026"
 *              names no place, so a route for it would be a guess.
 * @returns {object|null} the question to ask instead of planning, or null when the places are grounded
 */
export const ungroundedPlaces = ({ extracted, values = {}, region = '', enquiry = '', extra = '', places = [] }) => {
    const listed = cleanPlaces(places).map(place => place.name)
    const written = ` ${normalizeText([...listed, extra, values.leadRemarks, enquiry].join(' '))} `
    const tripName = ` ${normalizeText(region)} `
    const inText = (name, text) => Boolean(normalizeText(name)) && text.includes(` ${normalizeText(name)} `)
    const named = name => inText(name, written) || inText(name, tripName)
    const stays = extracted?.destinations || []
    if (stays.length) {
        const guessed = stays.map(item => item.name).filter(name => !named(name))
        return guessed.length ? placesQuestion(guessed) : null
    }
    if (named(extracted?.region) && (extracted?.suggestedDestinations || []).length) return null
    return placesQuestion((extracted?.suggestedDestinations || []).map(item => item.name).filter(Boolean))
}

/**
 * @description plans the trip from the guest's details
 * @param {{ name: string, nights: number|null }[]} [places] the places the guest wants, in order: the route
 * @param {function} [onPlaces] called with the stay places as soon as they are known, before the days are planned,
 *        so their hotels and photos can be looked up meanwhile
 * @returns {Promise<object>} the planner's Trip: status 'ready', 'needs-input' (questions) or 'conflict'
 */
export const planFromTrip = async ({ values, region, enquiry, extra, ask, onPlaces, places = [] }) => {
    const form = requirementsFromTrip(values, places)
    const text = notesFromTrip({ values, region, enquiry, extra, places })
    const extracted = await extractFromText({ text, form, ask })
    // ? the agent's own list of places is the route as it stands; anything else must be in what people wrote
    if (!form.destinations.length) {
        const question = ungroundedPlaces({ extracted, values, region, enquiry, extra, places })
        if (question) return { status: 'needs-input', questions: [question], days: [], assumptions: [] }
    }
    const requirements = mergeRequirements(extracted, form)
    onPlaces?.((requirements.destinations || []).map(item => item.name).filter(Boolean))
    return planTrip({ requirements, ask })
}

const placeKey = name =>
    String(name || '')
        .trim()
        .toLowerCase()

/** @description the places the days stay the night at, each once, in order, as first written */
export const stayPlaces = days => {
    const places = new Map()
    days.forEach(day => {
        if (day.place && !places.has(placeKey(day.place))) places.set(placeKey(day.place), day.place)
    })
    return [...places.values()]
}

// ? the four hotel lists a place keeps, as the day form fills them (Deluxe … Premium)
export const HOTEL_FIELDS = ['delux_hotel', 'super_delux_hotel', 'luxury_hotel', 'premium_hotel']

export const HOTELS_SYSTEM_PROMPT = `You suggest hotels for an Indian travel agency's packages.

For each place in "places", give 2 or 3 real, currently operating hotels in or right next to that place for each category:
- delux_hotel: good 3-star
- super_delux_hotel: 4-star
- luxury_hotel: 5-star
- premium_hotel: the best luxury or boutique stays there

Respond ONLY with JSON: {"places":[{"name":"<the place exactly as given>","delux_hotel":"Hotel A | Hotel B","super_delux_hotel":"…","luxury_hotel":"…","premium_hotel":"…"}]}
Hotel names only, separated by " | ", no descriptions. Leave a category "" when you are not sure of real hotels for it.`

/** @description one AI request for the hotels of every place */
export const buildHotelsRequest = ({ places, region = '' }) => ({
    system: HOTELS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify({ trip: region, places }) }]
})

/**
 * @description the AI's hotels, for the places asked about only
 * @returns {object} place name (as asked) → { delux_hotel, super_delux_hotel, luxury_hotel, premium_hotel }, with
 *          only the categories it filled
 */
export const readHotels = (raw, places) => {
    const asked = new Map(places.map(name => [placeKey(name), name]))
    const hotels = {}
    ;(Array.isArray(raw?.places) ? raw.places : []).forEach(item => {
        const name = asked.get(placeKey(item?.name))
        if (!name) return
        const lists = {}
        HOTEL_FIELDS.forEach(field => {
            const list = typeof item[field] === 'string' ? item[field].replace(/\s+/g, ' ').trim().slice(0, 500) : ''
            if (list) lists[field] = list
        })
        if (Object.keys(lists).length) hotels[name] = lists
    })
    return hotels
}

/**
 * @description the days with a photo each: a day shows a photo of its place (the place of the night before on a
 *              day that ends travelling), and days at one place take its photos in turn
 * @param {object} photos place name → photo URLs
 */
export const withPhotos = (days, photos) => {
    const byPlace = new Map(Object.entries(photos).map(([name, urls]) => [placeKey(name), urls]))
    const used = {}
    let lastPlace = ''
    return days.map(day => {
        const place = placeKey(day.place) || lastPlace
        lastPlace = place
        const urls = byPlace.get(place) || []
        if (!urls.length) return { ...day, image: '' }
        used[place] = (used[place] || 0) + 1
        return { ...day, image: urls[(used[place] - 1) % urls.length] }
    })
}

/**
 * @description a ready plan's days as the server saves them. The nth full day at one place is "… Local Sightseeing",
 *              "… Local Sightseeing 2", the same titles the package wizard gives, so saved days are reused
 */
export const daysFromPlan = trip => {
    const fullDaysAt = {}
    return (trip?.days || []).map(day => {
        let ordinal = 1
        if (day.type === DAY_TYPES.FULL_DAY && !day.leg) {
            fullDaysAt[day.location] = (fullDaysAt[day.location] || 0) + 1
            ordinal = fullDaysAt[day.location]
        }
        return {
            title: renderDayTitle(day, ordinal),
            description: renderDayDescription(day),
            place: day.type === DAY_TYPES.DEPARTURE ? '' : day.stay || '',
            entryType: entryTypeFor(day)
        }
    })
}

/**
 * @description "Shimla - Manali 6D/5N"
 */
export const packageNameFor = trip => {
    const stays = trip?.requirements?.destinations || []
    const names = stays.map(item => item.name).filter(Boolean)
    if (!names.length) return ''
    const nights = stays.reduce((sum, item) => sum + (Number(item.nights) || 0), 0)
    return `${names.join(' - ')} ${nights + 1}D/${nights}N`
}

/**
 * @description the JSON in an AI reply ({ content: [{ text }] }): the whole text, or the outermost object in it
 */
export const parseAiReply = response => {
    const clean = (response?.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    const candidates = [clean, start !== -1 && end > start ? clean.slice(start, end + 1) : '']
    // eslint-disable-next-line no-restricted-syntax
    for (const candidate of candidates.filter(Boolean)) {
        try {
            return JSON.parse(candidate)
        } catch (error) {
            // ? try the looser candidate
        }
    }
    return {}
}
