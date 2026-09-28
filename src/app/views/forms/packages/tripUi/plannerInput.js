/**
 * THE PLANNER'S INPUT — the few things the simple planner asks, and how they
 * become the engine's TripRequirements.
 *
 * The screen asks five plain questions (from, where to, when, who, what kind of
 * trip). Everything else is either inferred by the engine or hidden under
 * "More options". This module is the translation layer, so the screens never
 * deal with engine concepts.
 */

export const WHO = [
    { value: 'solo', label: 'Solo' },
    { value: 'couple', label: 'Couple' },
    { value: 'family', label: 'Family' },
    { value: 'friends', label: 'Friends' }
]

export const PACE = [
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'packed', label: 'Packed' }
]

// ? '' means "decide later": the engine plans around a private cab and says so
export const TRANSPORT = [
    { value: 'Private cab', label: 'Private cab' },
    { value: 'Own car', label: 'Own car' },
    { value: 'Volvo / bus', label: 'Public transport' },
    { value: '', label: 'Decide later' }
]

export const INTERESTS = ['Nature', 'Mountains', 'Snow', 'Food', 'Culture', 'Adventure', 'Shopping', 'Photography']

export const BUDGETS = ['Budget', 'Mid-range', 'Luxury']

export const DEFAULT_NIGHTS = 2
const DEFAULT_ADULTS = { solo: 1, couple: 2 }

export const emptyPlannerInput = () => ({
    origin: '',
    endsAt: '',
    destinations: [],
    startDate: '',
    who: '',
    adults: null,
    children: null,
    withParents: false,
    pace: 'balanced',
    transport: '',
    vehicle: '',
    interests: [],
    mustSee: '',
    budget: '',
    excluded: []
})

const titleCase = value =>
    value
        .toLowerCase()
        .replace(/(^|[\s-])([a-z])/g, (match, lead, letter) => `${lead}${letter.toUpperCase()}`)
        .trim()

const clampNights = value => Math.min(30, Math.max(1, Math.round(Number(value)) || DEFAULT_NIGHTS))

const sameName = (left, right) => (left || '').trim().toLowerCase() === (right || '').trim().toLowerCase()

const NIGHTS_TOKEN = /(\d+)\s*(?:n\b|nts?\b|nights?\b)/i

/**
 * @description reads a destination line the way a person writes it:
 *              "Shimla", "Shimla + Manali", "Shimla, Manali and Kasol", "2N Shimla 3N Manali",
 *              "2 nights Shimla, 3 nights Manali", "Shimla 2 nights, Manali 3",
 *              "Delhi to Shimla to Manali", "Delhi → Shimla → Manali → Delhi"
 * @returns {{ places: { name: string, nights: number | null }[], isRoute: boolean }}
 */
export const parseDestinationText = text => {
    let raw = (text || '').replace(/\s+/g, ' ').trim()
    if (!raw) return { places: [], isRoute: false }

    // ? "Delhi to Shimla" and arrows describe a route, so the first place may be where the trip starts
    const isRoute = /→|->|\bto\b/i.test(raw)

    // ? nights written without separators ("2N Shimla 3N Manali" / "Shimla 2N Manali 3N"): cut at each count
    const nightsFirst = /^\d/.test(raw)
    raw = nightsFirst
        ? raw.replace(/(\d+\s*(?:n\b|nts?\b|nights?\b))/gi, ',$1')
        : raw.replace(/(\d+\s*(?:n\b|nts?\b|nights?\b))/gi, '$1,')

    const parts = raw
        .split(/\s*(?:→|->|\+|,|&|\/|;|\bto\b|\band\b|\bthen\b)\s*/i)
        .map(part => part.trim())
        .filter(Boolean)

    const places = []
    parts.forEach(part => {
        const match = part.match(NIGHTS_TOKEN) || part.match(/\((\d+)\)|^(\d+)\s|\s(\d+)$/)
        const count = match ? match.slice(1).find(Boolean) : null
        const name = part
            .replace(NIGHTS_TOKEN, '')
            .replace(/\(\d+\)|^\d+\s|\s\d+$/g, '')
            .replace(/\b(nights?|days?|trip|tour)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        if (!name) {
            // ? a bare "3 nights" belongs to the place before it ("Shimla, 3 nights")
            if (count && places.length) places[places.length - 1].nights = clampNights(count)
            return
        }
        places.push({ name: titleCase(name), nights: count ? clampNights(count) : null })
    })

    return { places, isRoute }
}

/**
 * @description adds what the agent typed in "Going to" to the input: a route's first place becomes the
 *              origin when none is set, a return to the origin is dropped, known places get their nights
 *              updated, and new places get a sensible default.
 */
export const addDestinationText = (input, text) => {
    const { places, isRoute } = parseDestinationText(text)
    if (!places.length) return input

    let { origin } = input
    let list = [...places]

    if (isRoute && list.length > 1 && !origin && list[0].nights == null) {
        origin = list[0].name
        list = list.slice(1)
    }
    if (origin) {
        if (sameName(list[0]?.name, origin) && list.length > 1) list = list.slice(1)
        if (sameName(list[list.length - 1]?.name, origin) && list.length > 1) list = list.slice(0, -1)
    }

    const destinations = [...input.destinations]
    list.forEach(place => {
        const existing = destinations.findIndex(item => sameName(item.name, place.name))
        if (existing >= 0) {
            if (place.nights) destinations[existing] = { ...destinations[existing], nights: place.nights }
        } else {
            destinations.push({ name: place.name, nights: place.nights ?? DEFAULT_NIGHTS })
        }
    })

    return { ...input, origin, destinations }
}

export const totalNights = input => input.destinations.reduce((sum, item) => sum + (Number(item.nights) || 0), 0)

const addDays = (isoDate, days) => {
    const date = new Date(`${isoDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

export const formatShortDate = isoDate =>
    isoDate
        ? new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC'
          })
        : ''

/**
 * @description "12 Oct – 17 Oct" from the start date and the nights, or '' without a date
 */
export const dateRangeLabel = input => {
    if (!input.startDate) return ''
    return `${formatShortDate(input.startDate)} – ${formatShortDate(addDays(input.startDate, totalNights(input)))}`
}

const travellerNotes = input => (input.withParents ? ['travelling with parents'] : [])

/**
 * @description the planner's answers as the engine's requirements. Only what the agent actually chose is
 *              passed on; the engine fills the rest with labelled assumptions.
 */
export const toRequirements = input => ({
    origin: input.origin.trim(),
    finalDestination: input.endsAt.trim(),
    destinations: input.destinations
        .filter(item => item.name.trim())
        .map(item => ({ name: item.name.trim(), nights: clampNights(item.nights) })),
    startDate: input.startDate,
    travellers: {
        type: input.who,
        adults: input.adults ?? DEFAULT_ADULTS[input.who] ?? null,
        children: input.children,
        seniors: null,
        notes: travellerNotes(input)
    },
    transport: { mode: input.transport, vehicle: input.vehicle.trim() },
    pace: input.pace,
    interests: input.interests.map(item => item.toLowerCase()),
    excludedAttractions: input.excluded,
    budget: input.budget
})

const TRANSPORT_VALUES = TRANSPORT.map(item => item.value)

/**
 * @description the other way: what the engine understood (from a pasted message, or after a change
 *              request) shown back in the planner's simple fields
 */
export const fromRequirements = (requirements, previous = emptyPlannerInput()) => ({
    ...previous,
    origin: requirements.origin || previous.origin,
    endsAt:
        requirements.finalDestination && !sameName(requirements.finalDestination, requirements.origin)
            ? requirements.finalDestination
            : previous.endsAt,
    destinations: requirements.destinations.length
        ? requirements.destinations.map(item => ({ name: item.name, nights: item.nights }))
        : previous.destinations,
    startDate: requirements.startDate || previous.startDate,
    who: WHO.some(item => item.value === requirements.travellers.type) ? requirements.travellers.type : previous.who,
    adults: requirements.travellers.adults ?? previous.adults,
    children: requirements.travellers.children || previous.children,
    withParents: previous.withParents || /parent|elder|senior/i.test(requirements.travellers.notes.join(' ')),
    pace: requirements.pace || previous.pace,
    transport: TRANSPORT_VALUES.includes(requirements.transport.mode)
        ? requirements.transport.mode
        : previous.transport,
    vehicle: requirements.transport.vehicle || previous.vehicle,
    interests: [
        ...new Set([
            ...previous.interests,
            ...requirements.interests
                .map(item => INTERESTS.find(option => option.toLowerCase() === item.toLowerCase()))
                .filter(Boolean)
        ])
    ],
    mustSee: previous.mustSee || requirements.requiredAttractions.map(item => item.name).join(', '),
    excluded: requirements.excludedAttractions.length ? requirements.excludedAttractions : previous.excluded,
    budget: requirements.budget || previous.budget
})

/**
 * @description what is still needed before a plan can be built, in plain words — or '' when ready
 */
export const missingBasics = input => {
    if (!input.origin.trim()) return 'Add where the trip starts, so we can plan the drive there.'
    if (!input.destinations.some(item => item.name.trim())) return 'Add at least one place to visit.'
    return ''
}
