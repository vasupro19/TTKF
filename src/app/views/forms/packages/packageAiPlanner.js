/**
 * AI package planner — turns a free-text brief such as
 * "2N Shimla 3N Manali from Chandigarh by cab, include Sissu and Rohtang"
 * into a day-wise package.
 *
 * Two kinds of AI call:
 *   1. PLAN, once: destinations, nights, origin, transport, and a title plus
 *      highlights for every day, with the requested stops placed on the day
 *      they are actually visited from.
 *   2. WRITE, once per WRITER_BATCH_SIZE days: the descriptions, with the whole
 *      trip outline as context so days do not repeat each other.
 *
 * The day STRUCTURE (how many days, which ones are transfers) is not taken from
 * the model. The wizard builds it from destinations + nights as it always has,
 * and the plan's content is mapped onto those rows. A model that miscounts days
 * then costs one day's title, not a wrongly shaped package.
 */

export const WRITER_BATCH_SIZE = 3

const ENTRY_TYPES = new Set(['Stay', 'TransitStay', 'Transit'])

export const PLANNER_SYSTEM_PROMPT = `You are an expert Indian holiday package planner. Turn a travel agent's short brief into a structured, day-wise package plan.

Respond ONLY with a JSON object with these keys:
- packageName: string — catchy, ending with "<days>D/<nights>N"
- originLocation: string — pickup city if the brief or knownOriginLocation gives one, else ""
- transportMode: string — the vehicle or mode as the agent wrote it (e.g. Innova, Cab, Tempo Traveller, Volvo, Train, Flight) if the brief or knownTransportMode gives one, else ""
- destinations: array of { "name": string, "nights": integer } in travel order, as the brief lists them
- mustInclude: array of strings — every specific place, excursion or activity the brief asks for besides the destinations themselves, spelled properly (e.g. "Chandratal Lake", "Rohtang Pass")
- days: array of { "day": integer, "destination": string, "type": "TransitStay" | "Stay" | "Transit", "title": string, "highlights": array of strings }
- warnings: array of short strings for the agent

DAY STRUCTURE — follow exactly:
- One day per night at each destination, in travel order. The first day at a destination is its arrival day.
- If originLocation is set: the first day at EVERY destination has type "TransitStay" (travel from the origin or the previous stop), and add one final day with type "Transit" and destination "" for the drop back to the origin.
- If originLocation is empty: the first day of the trip has type "Stay" and there is no final drop day. Arrival at every later destination is still "TransitStay".
- Every other day has type "Stay".

PLANNING RULES:
0. mustInclude items are firm requests from the guest. Place EVERY one of them, even a demanding excursion such as Chandratal Lake — put any concern (road condition, altitude, season, permit) in warnings instead of leaving it out. The only reason to leave one out is that there are not enough days, and then say so in warnings.
1. Put every mustInclude item on a day at the destination it is visited from — e.g. Rohtang Pass, Chandratal Lake, Sissu, Atal Tunnel, Solang Valley and Kullu from Manali; Kufri, Chail and Naldehra from Shimla. Read misspellings sensibly ("rotang" = Rohtang Pass, "chandrataal" = Chandratal Lake, "sisu" = Sissu).
2. Long excursions go on full "Stay" days, never on arrival or drop days. Arrival days get light, nearby sightseeing only.
3. Pair places on the same route on the same day, with at most one major excursion per day.
4. Never repeat a place on two days.
5. Fill the remaining days with the destination's best-known real sightseeing.
6. highlights: 2 to 4 real place or activity names for that day, with requested items spelled properly. Never list travel logistics (check-in, check-out, pickup, drop, arrival, departure, the journey itself) as a highlight. The final drop day may have an empty highlights array — never invent filler.
7. title: under 10 words naming the day's key places, joined with "&" or ","; never start with Explore, Visit, Tour, Discover, Day or Enjoy. A TransitStay title names the route, e.g. "Chandigarh to Shimla & Mall Road Evening". The drop day title names the return, e.g. "Manali to Chandigarh Return Journey".
8. Never add days beyond the nights given. If the requested items cannot all fit, leave the extras out and add a warning naming what did not fit.
9. Add a warning for anything the agent must arrange: permits (e.g. Rohtang Pass needs one), weekly closures or seasonal access. Warnings are only for things the agent must act on — never restate or summarise the itinerary.

Return JSON only.`

export const WRITER_SYSTEM_PROMPT = `You are a senior travel writer producing quotation-ready day descriptions for an Indian holiday package.

Respond ONLY with a JSON object: { "days": [ { "day": integer, "description": string } ] } — one entry for each day in "days", using its "day" number.

RULES:
1. Two paragraphs separated by a blank line, 110 to 150 words in total.
2. Name every place in that day's highlights, each with a concrete detail of what guests see or do there.
3. TransitStay: the journey from "from" to "to" (using transportMode if given), then arrival, check-in and the light sightseeing.
4. Transit: check-out, the return journey from "from" to "to", and a warm close to the holiday.
5. Stay: end with the return to the hotel for the overnight stay.
6. The trip outline is context only — do not repeat what other days cover.
7. Do not invent timings, prices, hotel names or transport operators. No bullets, markdown or emojis.

Return JSON only.`

const cleanString = (value, maxLength = 160) =>
    typeof value === 'string' || typeof value === 'number'
        ? String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength)
        : ''

// ? lowercase words only, so "Rohtang Pass" and "rohtang-pass" compare equal
const normalizeText = value =>
    (value || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()

const uniqueBy = (items, keyOf) =>
    items.filter((item, index) => items.findIndex(other => keyOf(other) === keyOf(item)) === index)

// ? models list the logistics of a day ("Hotel Check-in", "Overnight Volvo Journey") as if they were sights
const LOGISTICS_HIGHLIGHT =
    /\b(check[\s-]?in|check[\s-]?out|pick[\s-]?up|drop|arrival|departure|journey|transfer|drive|views?)\b/i

/**
 * @description replaces any day/night suffix the model wrote with one computed
 *              from the nights — models miscount it ("5D/6N" for a 6-day trip)
 */
export const withDurationSuffix = (name, destinations) => {
    const nights = destinations.reduce((sum, item) => sum + (Number(item.nights) || 0), 0)
    const base = (name || '').replace(/[\s,:–-]*\d+\s*D\s*\/\s*\d+\s*N\s*$/i, '').trim()
    return base && nights ? `${base} ${nights + 1}D/${nights}N` : base
}

export const buildPlannerRequest = ({ brief, originLocation = '', transportMode = '' }) => ({
    system: PLANNER_SYSTEM_PROMPT,
    messages: [
        {
            role: 'user',
            content: JSON.stringify({
                brief,
                knownOriginLocation: originLocation,
                knownTransportMode: transportMode
            })
        }
    ]
})

/**
 * @description sanitises the planner's JSON — the model's output is untrusted,
 *              so every field is type-checked, trimmed and bounded
 */
export const normalizePlan = raw => {
    const plan = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    const list = value => (Array.isArray(value) ? value : [])

    const destinations = uniqueBy(
        list(plan.destinations)
            .map(item => ({
                name: cleanString(item?.name, 60),
                nights: Math.min(30, Math.max(1, Math.round(Number(item?.nights)) || 1))
            }))
            .filter(item => item.name),
        item => normalizeText(item.name)
    )

    const days = list(plan.days).map(day => ({
        destinationName: cleanString(day?.destination, 60),
        entryType: ENTRY_TYPES.has(day?.type) ? day.type : 'Stay',
        title: cleanString(day?.title, 120),
        highlights: list(day?.highlights)
            .map(item => cleanString(item, 60))
            .filter(item => item && !LOGISTICS_HIGHLIGHT.test(item))
            .slice(0, 5)
    }))

    return {
        packageName: withDurationSuffix(cleanString(plan.packageName, 100), destinations),
        originLocation: cleanString(plan.originLocation, 60),
        transportMode: cleanString(plan.transportMode, 40),
        destinations,
        days,
        // ? models echo the destinations back as requests ("Shimla", "Manali"); those are not stops
        mustInclude: uniqueBy(
            list(plan.mustInclude)
                .map(item => cleanString(typeof item === 'string' ? item : item?.name, 60))
                .filter(item => item && !destinations.some(place => normalizeText(place.name) === normalizeText(item))),
            normalizeText
        ),
        warnings: list(plan.warnings)
            .map(item => cleanString(item, 240))
            .filter(Boolean)
            .slice(0, 6)
    }
}

const isDropRow = row => row.entryType === 'Transit' && !row.destinationName

/**
 * @description maps the plan's days onto the wizard's day rows. Rows are matched
 *              per destination in order; the drop row takes the plan's Transit
 *              day. Rows with no matching plan day are returned unchanged.
 * @param {object[]} rows day rows from buildActivitiesFromDestinations
 * @param {object[]} planDays normalizePlan(...).days
 */
export const applyPlanToRows = (rows, planDays) => {
    const used = new Set()
    const takeDay = predicate => {
        const index = planDays.findIndex((day, position) => !used.has(position) && predicate(day))
        if (index === -1) return null
        used.add(index)
        return planDays[index]
    }

    return rows.map(row => {
        const destinationKey = normalizeText(row.destinationName)
        const planned = isDropRow(row)
            ? takeDay(day => day.entryType === 'Transit' && !day.destinationName) ||
              takeDay(day => day.entryType === 'Transit')
            : takeDay(day => day.entryType !== 'Transit' && normalizeText(day.destinationName) === destinationKey)

        if (!planned) return row

        return {
            ...row,
            title: planned.title || row.title,
            highlights: planned.highlights
        }
    })
}

/**
 * @description finds the day each requested stop landed on
 * @returns {{ name: string, dayNumber: number | null }[]}
 */
export const matchInclusions = (rows, mustInclude) =>
    mustInclude.map(name => {
        const needle = normalizeText(name)
        const index = rows.findIndex(row =>
            [row.title, ...(row.highlights || [])]
                .map(normalizeText)
                .some(text => text && (text.includes(needle) || (text.length >= 4 && needle.includes(text))))
        )

        return { name, dayNumber: index === -1 ? null : index + 1 }
    })

export const buildWriterBatches = (rows, size = WRITER_BATCH_SIZE) => {
    const batches = []
    for (let start = 0; start < rows.length; start += size) {
        batches.push(rows.slice(start, start + size))
    }
    return batches
}

// ? where a transfer day starts and ends — the previous stop, or the origin
const routeFor = (rows, index, originLocation) => {
    const row = rows[index]
    const previousStop =
        rows
            .slice(0, index)
            .map(item => item.destinationName)
            .filter(Boolean)
            .pop() || ''

    if (row.entryType === 'TransitStay') {
        return { from: previousStop || originLocation, to: row.destinationName }
    }
    if (isDropRow(row)) {
        return { from: previousStop, to: originLocation }
    }
    return {}
}

export const buildWriterRequest = ({ batch, rows, packageName = '', originLocation = '', transportMode = '' }) => ({
    system: WRITER_SYSTEM_PROMPT,
    messages: [
        {
            role: 'user',
            content: JSON.stringify({
                packageName,
                originLocation,
                transportMode,
                tripOutline: rows.map((row, index) => `Day ${index + 1}: ${row.title}`),
                days: batch.map(row => {
                    const index = rows.indexOf(row)
                    return {
                        day: index + 1,
                        type: row.entryType,
                        destination: row.destinationName || '',
                        ...routeFor(rows, index, originLocation),
                        title: row.title,
                        highlights: row.highlights || []
                    }
                })
            })
        }
    ]
})

/**
 * @description maps the writer's reply back to row ids by day number
 * @returns {Record<string, string>} row id -> description
 */
export const parseWriterDescriptions = (raw, batch, rows) => {
    let entries = []
    if (Array.isArray(raw)) entries = raw
    else if (Array.isArray(raw?.days)) entries = raw.days

    const descriptions = {}
    entries.forEach(entry => {
        const description = typeof entry?.description === 'string' ? entry.description.trim() : ''
        const row = rows[Number(entry?.day) - 1]
        if (description && row && batch.includes(row) && !descriptions[row.id]) {
            descriptions[row.id] = description
        }
    })
    return descriptions
}
