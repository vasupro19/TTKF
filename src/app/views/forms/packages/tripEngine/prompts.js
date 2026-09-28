/**
 * THE MODEL'S JOBS — each call has one narrow responsibility, and every reply
 * is treated as untrusted input and normalised before the engine uses it.
 *
 *   1. understand  free text + form      → TripRequirements
 *   2. logistics   legs + required places → leg estimates, excursion clusters, access notes
 *   3. fill        fixed day skeleton     → recommended activities within each day's time
 *   4. edit        requirements + request → updated requirements (for incremental changes)
 *   5. write       the finished days       → one guest-ready paragraph per day
 *
 * Route, day types, time budgets, scheduling and validation are code, not prompts.
 */

import { normalizeRequirements, normalizeText } from './requirements'

const json = value => JSON.stringify(value)
const request = (system, content) => ({ system, messages: [{ role: 'user', content: json(content) }] })
const str = (value, max = 160) =>
    typeof value === 'string' || typeof value === 'number'
        ? String(value).replace(/\s+/g, ' ').trim().slice(0, max)
        : ''
const list = value => (Array.isArray(value) ? value : [])
const clamp = (value, min, max, fallback) => {
    const number = Number(value)
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}
const clock = value => (/^([01]?\d|2[0-3]):[0-5]\d$/.test(str(value)) ? str(value).padStart(5, '0') : '')
const range = (value, min, max) => {
    const pair = Array.isArray(value) ? value : [value, value]
    const low = clamp(pair[0], min, max, null)
    const high = clamp(pair[1] ?? pair[0], min, max, null)
    if (low == null && high == null) return null
    return [Math.min(low ?? high, high ?? low), Math.max(low ?? high, high ?? low)]
}

// ---------------------------------------------------------------- 1. understand

export const UNDERSTAND_SYSTEM_PROMPT = `You turn a travel agent's notes about a trip into structured requirements for an itinerary engine. Extract only what the notes say or clearly imply — never invent destinations, dates or attractions the guest did not ask for.

Respond ONLY with a JSON object with these keys (use "", null or [] when not stated):
- origin: the city the trip starts from
- finalDestination: where it ends, only if different from the origin
- destinations: [{ "name", "nights" }] in travel order. "2N Shimla 3N Manali", "2 nights shimla and 3 nights manali" and "shimla manali 2 night 3 night" all mean Shimla 2, Manali 3; "Delhi to Manali 5 nights" means origin Delhi and Manali 5. Proper-case the names.
- region: a region named instead of destinations, e.g. "Himachal"
- totalNights: nights for the whole trip when only a total is given ("6 days" = 5 nights)
- startDate: "YYYY-MM-DD", only if a date is given
- travellers: { "adults", "children", "seniors", "type": "couple" | "family" | "friends" | "solo" | "group", "notes": [e.g. "travelling with parents"] }
- transport: { "mode": "Private cab" | "Own car" | "Volvo / bus" | "Train" | "Flight" | "Tempo Traveller", "vehicle": e.g. "Innova" }
- pace: "relaxed" | "balanced" | "packed" — "don't make it hectic" or "not too much running around" = relaxed
- styles: e.g. "nature", "scenic", "adventure", "honeymoon", "luxury", "budget", "photography", "food", "culture", "shopping", "senior-friendly"
- interests: things to experience rather than a named place, e.g. "snow", "cafes", "scenic viewpoints"
- requiredAttractions: [{ "name", "destination" }] — every specific place or activity asked for as a must ("definitely Rohtang", "include Sissu", "we want Atal tunnel"), spelled properly, with the stay it is visited from. Not the destinations themselves.
- excludedAttractions: places or activities they do not want
- constraints: restrictions such as "no trekking", "limited walking"
- arrival: { "time": "HH:MM", "place" } and departure: { "time": "HH:MM", "place" }, if given
- budget, hotelPreference: short strings, if given
- suggestedDestinations: REQUIRED whenever no destinations are named but a region, a trip length or interests are (e.g. "6 days from Delhi, Himachal" → a sensible route for 5 nights): [{ "name", "nights", "reason" }] in travel order, nights adding up to totalNights. Leave it empty when destinations are named.

"form" holds fields the agent already filled in. Treat them as fixed; you may leave those keys empty.

Return JSON only.`

export const buildUnderstandRequest = ({ text, form }) => request(UNDERSTAND_SYSTEM_PROMPT, { notes: text, form })

export const normalizeUnderstanding = raw => normalizeRequirements(raw)

// ---------------------------------------------------------------- 2. logistics

export const LOGISTICS_SYSTEM_PROMPT = `You are a route and destination-logistics expert for Indian holidays. Given a trip's journey legs, stays and the places the guest must visit, return realistic logistics.

Respond ONLY with a JSON object:
- legs: one per input leg, same "id": { "id", "distanceKm": [min, max], "durationHours": [min, max], "via": [main towns in order], "terrain": "mountain" | "mixed" | "plains", "suggestedDeparture": "HH:MM", "stops": [{ "name" (a town or well-known landmark — never a named restaurant or business), "kind": "meal" | "scenic" | "comfort", "note" }], "notes": [short road or timing notes] }. durationHours is the driving (or door-to-door) time for the given transport at normal speeds for that road, without stops.
- clusters: the required places grouped into same-route excursions: [{ "id", "name", "baseStay" (the stay it is done from), "places": [{ "name", "minutes" (time spent there), "travelFromPreviousMinutes" (from the base or the previous place) }], "returnMinutes" (back to the base), "fullDay": boolean, "covers": [the requiredAttractions names it satisfies], "access": [{ "place", "kind": "permit" | "seasonal" | "weather" | "closure" | "timing", "note" }] }]. Places on one road belong in ONE cluster, visited in road order — e.g. Solang Valley, Atal Tunnel and Sissu are one circuit from Manali. Decide from real geography whether a place like Rohtang Pass fits the same day. A cluster may be a single place.
- unplaceable: [{ "name", "reason" }] — required places that cannot be done from any of the stays

RULES:
0. Every requiredAttractions item appears in exactly one cluster's "covers", or in "unplaceable" when it truly cannot be done from these stays. Never leave one out because it is long, remote or demanding — put the concern in "access" instead.
1. Use real geography and real road routes. Never invent places. "via" lists towns actually on the usual road between the two places, in order — never towns in another valley or off the route.
2. access notes are general guidance only, phrased as something to check (e.g. "usually needs an online permit; check current status before travel"). Never state current road status, timings, prices or availability as fact.
3. If "month" is given, reflect seasonal access for that month; otherwise say where access depends on the season.
4. Respect the travellers and constraints (e.g. parents, no trekking) in how a place is visited.

Return JSON only.`

export const buildLogisticsRequest = ({ legs, requirements, month }) =>
    request(LOGISTICS_SYSTEM_PROMPT, {
        legs: legs.map(({ id, from, to, mode }) => ({ id, from, to, mode })),
        stays: requirements.destinations,
        requiredAttractions: requirements.requiredAttractions,
        travellers: requirements.travellers,
        constraints: requirements.constraints,
        month: month || ''
    })

const ACCESS_KINDS = new Set(['permit', 'seasonal', 'weather', 'closure', 'timing'])
const TERRAINS = new Set(['mountain', 'mixed', 'plains'])

export const normalizeLogistics = (raw, legs) => {
    const input = raw && typeof raw === 'object' ? raw : {}
    const legEstimates = {}

    list(input.legs).forEach(item => {
        const leg = legs.find(candidate => candidate.id === str(item?.id))
        const durationHours = range(item?.durationHours, 0.2, 48)
        if (!leg || !durationHours) return
        legEstimates[leg.id] = {
            distanceKm: range(item?.distanceKm, 1, 5000),
            durationHours,
            via: list(item?.via)
                .map(town => str(town, 40))
                .filter(Boolean)
                .slice(0, 8),
            terrain: TERRAINS.has(str(item?.terrain)) ? str(item.terrain) : 'mixed',
            suggestedDeparture: clock(item?.suggestedDeparture),
            stops: list(item?.stops)
                .map(stop => ({
                    name: str(stop?.name, 60),
                    kind: ['meal', 'scenic', 'comfort'].includes(str(stop?.kind)) ? str(stop.kind) : 'comfort',
                    note: str(stop?.note, 140)
                }))
                .filter(stop => stop.name)
                .slice(0, 5),
            notes: list(item?.notes)
                .map(note => str(note, 200))
                .filter(Boolean)
                .slice(0, 4),
            // ? no live routing source: every figure here is the model's estimate, and the UI says so
            source: 'estimate'
        }
    })

    const clusters = list(input.clusters)
        .map((item, index) => ({
            id: str(item?.id, 40) || `cluster-${index + 1}`,
            name: str(item?.name, 80),
            baseStay: str(item?.baseStay, 60),
            places: list(item?.places)
                .map(place => ({
                    name: str(place?.name, 60),
                    minutes: Math.round(clamp(place?.minutes, 10, 600, 60)),
                    travelFromPreviousMinutes: Math.round(clamp(place?.travelFromPreviousMinutes, 0, 600, 30))
                }))
                .filter(place => place.name),
            returnMinutes: Math.round(clamp(item?.returnMinutes, 0, 600, 60)),
            fullDay: Boolean(item?.fullDay),
            covers: list(item?.covers)
                .map(name => str(name, 60))
                .filter(Boolean),
            access: list(item?.access)
                .map(entry => ({
                    place: str(entry?.place, 60),
                    kind: ACCESS_KINDS.has(str(entry?.kind)) ? str(entry.kind) : 'timing',
                    note: str(entry?.note, 220)
                }))
                .filter(entry => entry.note)
        }))
        .filter(cluster => cluster.places.length && cluster.baseStay)

    return {
        legs: legEstimates,
        clusters,
        unplaceable: list(input.unplaceable)
            .map(item => ({ name: str(item?.name, 60), reason: str(item?.reason, 200) }))
            .filter(item => item.name)
    }
}

// ---------------------------------------------------------------- 3. fill

export const FILL_SYSTEM_PROMPT = `You are a senior destination expert planning the sightseeing of an Indian holiday. The route, each day's type and its usable time are already fixed, and the guest's required places are already placed. Recommend what else to do on each day.

Respond ONLY with a JSON object:
- days: one entry per input day, same "day": { "day", "title", "activities": [{ "name", "area", "minutes", "travelFromPreviousMinutes", "category": "sightseeing" | "viewpoint" | "temple" | "museum" | "market" | "cafe" | "activity" | "nature" | "walk", "note" (one short sentence: what the guest does there) }] }
- recommendations: at most 3 optional bigger additions that are NOT put into the days: [{ "kind": "destination" | "attraction" | "experience", "name", "reason", "impact" (what it would change, e.g. "needs one more night") }]

RULES:
1. Stay within each day's usableMinutes (minutes plus travelFromPreviousMinutes). Fewer, better places beat a long list; leave time unused rather than overfill.
2. ARRIVAL and TRANSFER days get only light, close-by sightseeing after check-in, or none when the time is short. DEPARTURE days get none unless usableMinutes allows a short visit near the hotel.
3. Order each day's places geographically from the day's location, with no backtracking. A place that lies on the road of that day's "fixed" excursion belongs on that day (e.g. Solang Valley on the day that drives to Atal Tunnel). Never repeat a place from "alreadyPlanned" or from another day.
4. Never include anything in "excluded", and respect "constraints" (e.g. no trekking, limited walking).
5. Match the pace, travellers, styles and interests (e.g. cafes, snow, photography).
6. "fixed" lists the required places already on that day. Never list them again: "activities" are only ADDITIONAL places. When usableMinutes is 90 or more, use it — e.g. after returning from an excursion, a short visit near the hotel or in town.
7. "title": under 10 words naming the day's key places, including the fixed ones, e.g. "Kufri, Green Valley & Jakhu Temple". For an ARRIVAL or TRANSFER day name the route, e.g. "Delhi to Shimla & Mall Road Evening"; for DEPARTURE, e.g. "Manali to Delhi Return".
8. Only real, well-known places, correctly spelled. For cafes, restaurants and shops name the area ("Old Manali cafes", "Mall Road shopping") unless the place is a long-established landmark.

Return JSON only.`

const clockText = minutes =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const buildFillRequest = ({ days, requirements, alreadyPlanned }) =>
    request(FILL_SYSTEM_PROMPT, {
        travellers: requirements.travellers,
        pace: requirements.pace,
        styles: requirements.styles,
        interests: requirements.interests,
        constraints: requirements.constraints,
        excluded: requirements.excludedAttractions,
        transport: requirements.transport,
        alreadyPlanned,
        days: days.map(({ day, budget, fixed, freeMinutes }) => ({
            day: day.dayNumber,
            type: day.type,
            location: day.location,
            date: day.date || '',
            sightseeingWindow: budget.sightseeing
                ? `${clockText(budget.sightseeing.start)}-${clockText(budget.sightseeing.end)}`
                : 'none',
            usableMinutes: freeMinutes,
            fixed
        }))
    })

const CATEGORIES = new Set([
    'sightseeing',
    'viewpoint',
    'temple',
    'museum',
    'market',
    'cafe',
    'activity',
    'nature',
    'walk'
])

export const normalizeFill = (raw, dayNumbers) => {
    const input = raw && typeof raw === 'object' ? raw : {}
    const days = {}

    list(input.days).forEach(item => {
        const dayNumber = Number(item?.day)
        if (!dayNumbers.includes(dayNumber) || days[dayNumber]) return
        days[dayNumber] = {
            title: str(item?.title, 100),
            activities: list(item?.activities)
                .map(activity => ({
                    name: str(activity?.name, 60),
                    area: str(activity?.area, 60),
                    minutes: Math.round(clamp(activity?.minutes, 15, 480, 60)),
                    travelFromPreviousMinutes: Math.round(clamp(activity?.travelFromPreviousMinutes, 0, 240, 15)),
                    category: CATEGORIES.has(str(activity?.category)) ? str(activity.category) : 'sightseeing',
                    note: str(activity?.note, 160)
                }))
                .filter(activity => activity.name)
                .slice(0, 8)
        }
    })

    return {
        days,
        recommendations: list(input.recommendations)
            .map(item => ({
                kind: ['destination', 'attraction', 'experience'].includes(str(item?.kind))
                    ? str(item.kind)
                    : 'attraction',
                name: str(item?.name, 60),
                reason: str(item?.reason, 200),
                impact: str(item?.impact, 160)
            }))
            .filter(item => item.name)
            .slice(0, 3)
    }
}

// ---------------------------------------------------------------- 5. write

export const WRITE_SYSTEM_PROMPT = `You write the day-by-day descriptions in an Indian holiday quotation that a travel agent sends to the guest. Each day's plan is already fixed — describe it, do not change it.

Respond ONLY with a JSON object: { "days": [{ "day": number, "description": string }] }, one entry per input day.

Each description:
1. Is ONE flowing paragraph of 70–140 words in warm, professional quotation English — e.g. "After breakfast, drive to…", "In the evening, stroll along…".
2. Covers everything the day offers, in the order given: the journey (from, to, the main towns on the way, roughly how long, the stops), then EVERY place in "places" by its exact name — what the guest sees and does there, using its "note" and well-known facts about it (views, history, activities) — then the evening and the overnight stay.
3. Never gives clock times or time slots ("9:00 AM", "10–11 AM", "Morning:"), and never uses lists, headings or line breaks. "After breakfast", "by afternoon" and "in the evening" are fine.
4. Names no attraction, restaurant or hotel that is not in the day's input.
5. Mentions a "checks" item only as something to confirm, and with the place it belongs to, e.g. "Rohtang Pass usually needs a permit, which we will check before travel". Never states current road status, prices, timings or availability as fact.
6. On a DEPARTURE day, ends with the drop-off and a warm farewell; on other days, ends with the overnight stay, e.g. "Overnight in Manali."

Return JSON only.`

export const buildWriteRequest = ({ days, requirements }) =>
    request(WRITE_SYSTEM_PROMPT, {
        travellers: requirements.travellers,
        pace: requirements.pace,
        days
    })

// ? words that do not identify a place: "Solang Valley" is named when "Solang" is
const GENERIC_WORDS = new Set(
    'the a an of and at in on to cafe cafes road temple valley pass point lake market bazaar walk shopping view viewpoint area old new top hill hills fort palace museum garden gardens park waterfall falls village town city dam tunnel'.split(
        ' '
    )
)

const mentions = (text, name) => {
    const haystack = ` ${normalizeText(text)} `
    const wanted = normalizeText(name.replace(/\([^)]*\)/g, ' '))
    if (!wanted || haystack.includes(` ${wanted} `)) return true
    const words = wanted.split(' ').filter(word => word.length > 1 && !GENERIC_WORDS.has(word))
    return words.length > 0 && words.every(word => haystack.includes(` ${word}`))
}

const CLOCK_TIME =
    /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\b\.?|p\.?m\b\.?)|\b\d{1,2}:\d{2}\b|\b(?:morning|afternoon|evening|night)\s*:/i

/**
 * @description the model's paragraphs, each kept only if it reads as one paragraph, has no clock times, and
 *              names every place of its day (and the journey's end) — a day that fails gets '' and falls back
 *              to the paragraph built from the plan
 * @returns {Record<number, string>}
 */
export const normalizeWrite = (raw, inputs) => {
    const replies = new Map(
        list(raw?.days).map(item => [Number(item?.day), typeof item?.description === 'string' ? item.description : ''])
    )
    return Object.fromEntries(
        inputs.map(input => {
            const text = (replies.get(input.day) || '')
                .replace(/\s+/g, ' ')
                .replace(/^\s*day\s*\d+\s*[:\-–—]\s*/i, '')
                .trim()
            const names = [...input.places.map(place => place.name), ...(input.journey ? [input.journey.to] : [])]
            const ok =
                text.length >= 200 &&
                text.length <= 1600 &&
                !CLOCK_TIME.test(text) &&
                names.every(name => mentions(text, name))
            return [input.day, ok ? text : '']
        })
    )
}

// ---------------------------------------------------------------- 4. edit

export const EDIT_SYSTEM_PROMPT = `You update a trip's requirements from a travel agent's change request.

Respond ONLY with the complete updated requirements JSON object, in exactly the same shape as "requirements". Change only what the request asks for and keep everything else as it is.

Examples: "add Sissu" adds it to requiredAttractions; "change Delhi to Chandigarh" changes origin (and finalDestination if it was Delhi); "make it more relaxed" sets pace to "relaxed"; "add one night in Manali" adds 1 to Manali's nights; "remove Kasol" removes it from destinations or requiredAttractions; "we are travelling with parents" adds a travellers note.

Return JSON only.`

export const buildEditRequest = ({ requirements, instruction }) =>
    request(EDIT_SYSTEM_PROMPT, { requirements, request: instruction })

export const normalizeEdit = normalizeRequirements

export { normalizeText }
