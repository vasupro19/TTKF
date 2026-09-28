/**
 * RENDERING — turns a DayPlan into what the rest of Travelytics stores and
 * prints: a day title, a description the guest reads, and the entry type the
 * package model understands.
 *
 * The description is one flowing paragraph — the journey, every place and
 * what the guest does there, anything to check, and where they sleep — never
 * a list of time slots. The model writes it (see the "write" step of the
 * pipeline); `composeDayParagraph` builds it from the plan when the model's
 * text is missing or fails its checks, so every day always has one.
 *
 * Clock times (for the agent's own view of the day) are shown as approximate
 * ranges rounded to the half hour, because the underlying figures are estimates.
 */

import { DAY_TYPES } from './route'

const roundTo = (minutes, step) => Math.round(minutes / step) * step

export const formatClock = minutes => {
    const rounded = roundTo(minutes, 15)
    const hours24 = Math.floor(rounded / 60) % 24
    const mins = rounded % 60
    const suffix = hours24 >= 12 ? 'PM' : 'AM'
    const hours12 = hours24 % 12 || 12
    // ? a long drive can end after midnight; say so instead of printing a misleading "1:30 AM"
    const nextDay = rounded >= 24 * 60 ? ' (next day)' : ''
    return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}${nextDay}`
}

/**
 * @description "approx. 2:00–3:30 PM" — collapses to one time when the range is narrow
 */
export const formatWindow = (start, end) => {
    if (start == null) return ''
    const from = roundTo(start, 30)
    const to = end == null ? from : roundTo(end, 30)
    if (to - from < 30) return `approx. ${formatClock(from)}`
    if (to >= 24 * 60) return `approx. ${formatClock(from)}–${formatClock(to)}`
    const [fromClock, fromSuffix] = formatClock(from).split(' ')
    const [toClock, toSuffix] = formatClock(to).split(' ')
    return fromSuffix === toSuffix
        ? `approx. ${fromClock}–${toClock} ${toSuffix}`
        : `approx. ${fromClock} ${fromSuffix}–${toClock} ${toSuffix}`
}

export const formatHours = hoursRange => {
    if (!hoursRange) return ''
    const [low, high] = hoursRange.map(hours => Math.round(hours * 2) / 2)
    return low === high ? `about ${low} h` : `about ${low}–${high} h`
}

export const formatKm = kmRange => {
    if (!kmRange) return ''
    const [low, high] = kmRange.map(km => roundTo(km, 10))
    return low === high ? `about ${low} km` : `about ${low}–${high} km`
}

export const entryTypeFor = dayPlan => {
    if (dayPlan.type === DAY_TYPES.DEPARTURE) return 'Transit'
    if (dayPlan.leg) return 'TransitStay'
    return 'Stay'
}

const fallbackTitle = dayPlan => {
    const places = dayPlan.activities.slice(0, 3).map(activity => activity.name)
    if (dayPlan.type === DAY_TYPES.DEPARTURE) {
        return dayPlan.leg ? `${dayPlan.leg.from} to ${dayPlan.leg.to} Return` : `Departure from ${dayPlan.location}`
    }
    if (dayPlan.leg) {
        const route = `${dayPlan.leg.from} to ${dayPlan.leg.to}`
        return places.length ? `${route} & ${places[0]}` : route
    }
    if (dayPlan.type === DAY_TYPES.ARRIVAL)
        return places.length ? `Arrival in ${dayPlan.location} & ${places[0]}` : `Arrival in ${dayPlan.location}`
    return places.length ? places.join(', ').replace(/, ([^,]*)$/, ' & $1') : `${dayPlan.location} at Leisure`
}

export const renderDayTitle = dayPlan => dayPlan.title || fallbackTitle(dayPlan)

// ---------------------------------------------------------------- the day as a paragraph

const joinNames = names =>
    names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

// ? the model's notes say what the guest does ("Take in the views…"); a note that starts that way reads as
//   "head to X and take in the views…", anything else is set off after a dash
const DOING =
    /^(enjoy|explore|visit|take|walk|stroll|see|admire|experience|stop|relax|soak|shop|try|watch|capture|discover|wander|browse|savour|savor|sample|ride|hike|climb|learn|marvel|pay|offer|witness|spend|catch|unwind|dine|pause|photograph|board|cross|drive|head|go|join|taste|picnic|feel|trek|play|splash|seek|sip|admire)\b/i

// ? "Hanuman statue…" keeps its capital; "Gentle snow activities…" does not need it after a dash
const COMMON_START =
    /^(a|an|the|this|its|gentle|short|quick|easy|leisurely|relaxed|historic|historical|famous|popular|scenic|beautiful|iconic|ancient|colonial|local|sweeping|panoramic|stunning|picturesque|serene|peaceful|quiet|lively|vibrant|bustling|charming|lovely|natural|wooden|old|sacred|holy|guided|great|best|one|home|known|ideal|perfect|spectacular|breathtaking|magnificent|grand|giant|huge|tall|large|small|hilltop|riverside|lakeside|open|free|fun|snow|adventure|boating|paragliding|rafting|trekking|skiing|horse|yak|cable|rope|shopping|street|views?|walks?|cafes?|shops?)\b/i
const lowerFirst = text =>
    text && (DOING.test(text) || COMMON_START.test(text)) ? text[0].toLowerCase() + text.slice(1) : text || ''

const asSentence = text => {
    const trimmed = (text || '').replace(/\s+/g, ' ').trim()
    if (!trimmed) return ''
    return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}${/[.!?]$/.test(trimmed) ? '' : '.'}`
}

const spread = (range, step, unit) => {
    if (!range) return ''
    const [low, high] = range.map(value => Math.round(value / step) * step)
    return low === high ? `${low} ${unit}` : `${low}–${high} ${unit}`
}

const journeyWord = mode => {
    const text = (mode || '').toLowerCase()
    if (text.includes('flight')) return 'flight'
    if (text.includes('train')) return 'train journey'
    if (text.includes('bus') || text.includes('volvo')) return 'bus journey'
    return 'drive'
}

const placeSentence = (connector, verb, activity) => {
    const note = (activity.note || '').replace(/[.!]+$/, '').trim()
    if (!note) return asSentence(`${connector} ${verb} ${activity.name}`)
    if (DOING.test(note)) return asSentence(`${connector} ${verb} ${activity.name} and ${lowerFirst(note)}`)
    return asSentence(`${connector} ${verb} ${activity.name} — ${lowerFirst(note)}`)
}

// ? on a day trip the places are named up front; each note then gets its own sentence
const excursionSentence = activity => {
    const note = activity.note.replace(/[.!]+$/, '').trim()
    return DOING.test(note)
        ? asSentence(`At ${activity.name}, ${lowerFirst(note)}`)
        : asSentence(`${activity.name} — ${lowerFirst(note)}`)
}

const journeySentence = (opener, leg) => {
    const towns = (leg.estimate?.via || []).filter(town => ![leg.from, leg.to].includes(town))
    const via = towns.length ? ` via ${joinNames(towns)}` : ''
    const facts = [spread(leg.estimate?.distanceKm, 10, 'km'), spread(leg.estimate?.durationHours, 0.5, 'hours')]
        .filter(Boolean)
        .join(' and ')
    const how = facts ? ` — roughly ${facts} by ${(leg.mode || 'road').toLowerCase()}` : ''
    return asSentence(`${opener} for the ${journeyWord(leg.mode)} to ${leg.to}${via}${how}`)
}

// ? an access note ("Usually needs a permit…") reads on after the colon; an acronym ("NGT permit…") keeps its case
const noteCase = text => (/^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text)

const accessSentences = dayPlan =>
    [
        ...new Map(
            dayPlan.clusters.flatMap(cluster => cluster.access).map(entry => [entry.note.toLowerCase(), entry])
        ).values()
    ]
        .slice(0, 3)
        .map(entry => asSentence(`Good to know${entry.place ? ` about ${entry.place}` : ''}: ${noteCase(entry.note)}`))

/**
 * @description the day as one paragraph, built from the plan alone: journey, places (with what to do there),
 *              checks and the overnight stay — in the day's order, with no clock times
 */
export const composeDayParagraph = dayPlan => {
    const sentences = []
    const items = dayPlan.timeline
    const leg = dayPlan.leg || null
    const isDeparture = dayPlan.type === DAY_TYPES.DEPARTURE
    const isExcursion = dayPlan.type === DAY_TYPES.EXCURSION
    const activities = items.filter(item => item.kind === 'activity' && item.activity).map(item => item.activity)
    const checkout = items.find(item => item.kind === 'checkout')
    const early = /early/i.test(checkout?.label || '')

    if (leg) {
        let opener = `Set off from ${leg.from}`
        if (checkout)
            opener = early
                ? `Check out early, with a packed breakfast, and set off from ${leg.from}`
                : `After breakfast, check out in ${leg.from} and set off`
        // ? sightseeing before a departure happens first; the drive is told after it
        if (!isDeparture || !activities.length) sentences.push(journeySentence(opener, leg))
        const stops = leg.estimate?.stops?.map(stop => stop.name) || []
        if (stops.length && (!isDeparture || !activities.length))
            sentences.push(asSentence(`Along the way, take breaks at ${joinNames(stops)}`))
        if (!isDeparture) {
            const rest = items.some(item => item.kind === 'rest')
            sentences.push(
                asSentence(
                    `On arrival in ${leg.to}, check in at the hotel${rest ? ' and relax after the journey' : ''}`
                )
            )
        }
    } else if (checkout) {
        sentences.push(
            asSentence(
                early ? `Check out early in ${dayPlan.location}` : `After breakfast, check out in ${dayPlan.location}`
            )
        )
    }

    const onExcursion = new Set(dayPlan.clusters.flatMap(cluster => cluster.places.map(place => place.name)))
    const excursionPlaces = isExcursion ? activities.filter(activity => onExcursion.has(activity.name)) : []
    const otherPlaces = activities.filter(activity => !excursionPlaces.includes(activity))

    if (excursionPlaces.length) {
        const start = items.some(item => item.kind === 'depart' && /early/i.test(item.label))
            ? 'Start early'
            : 'After breakfast, set out'
        sentences.push(
            asSentence(
                `${start} from ${dayPlan.location} on a full-day excursion to ${joinNames(excursionPlaces.map(item => item.name))}`
            )
        )
        excursionPlaces
            .filter(activity => activity.note)
            .forEach(activity => sentences.push(excursionSentence(activity)))
        if (!otherPlaces.length) sentences.push(asSentence(`Return to ${dayPlan.location} by evening`))
    }

    if (otherPlaces.length) {
        let connectors = ['After breakfast,', 'Next,', 'Then', 'Later,', 'Afterwards,']
        if (excursionPlaces.length) connectors = [`After returning to ${dayPlan.location},`, 'Then', 'Later,']
        else if (leg && !isDeparture) connectors = ['Later,', 'Then', 'Afterwards,', 'Later,']
        const startOf = new Map(
            items.filter(item => item.kind === 'activity' && item.activity).map(item => [item.activity, item.start])
        )
        let evening = false
        otherPlaces.forEach((activity, index) => {
            let connector = connectors[Math.min(index, connectors.length - 1)]
            // ? "in the evening" once, for the first place that starts after five
            if (!evening && index > 0 && startOf.get(activity) >= 17 * 60) {
                connector = 'In the evening,'
                evening = true
            }
            if (!evening && index === 0 && leg && !isDeparture && startOf.get(activity) >= 17 * 60) {
                connector = 'In the evening,'
                evening = true
            }
            sentences.push(placeSentence(connector, index % 2 ? 'head to' : 'visit', activity))
        })
    } else if (!leg && !isDeparture) {
        sentences.push(
            asSentence(`Spend the day at leisure in ${dayPlan.location} — explore at your own pace or simply relax`)
        )
    }

    if (isDeparture && leg && activities.length) {
        sentences.push(journeySentence(`Then set off from ${leg.from}`, leg))
    }

    sentences.push(...accessSentences(dayPlan))

    if (isDeparture) {
        if (leg) sentences.push(asSentence(`The tour ends on arrival in ${leg.to}, with memories to take home`))
        else sentences.push(asSentence('Continue on your onward journey, with memories to take home'))
    } else if (dayPlan.stay) {
        sentences.push(asSentence(`Overnight in ${dayPlan.stay}`))
    }

    return sentences.filter(Boolean).join(' ')
}

/**
 * @description the facts the model writes a day's paragraph from — and checks it against
 */
export const writeInputFor = dayPlan => ({
    day: dayPlan.dayNumber,
    type: dayPlan.type,
    title: renderDayTitle(dayPlan),
    location: dayPlan.location,
    journey: dayPlan.leg
        ? {
              from: dayPlan.leg.from,
              to: dayPlan.leg.to,
              by: dayPlan.leg.mode,
              via: dayPlan.leg.estimate?.via || [],
              distance: spread(dayPlan.leg.estimate?.distanceKm, 10, 'km'),
              drive: spread(dayPlan.leg.estimate?.durationHours, 0.5, 'hours'),
              stops: (dayPlan.leg.estimate?.stops || []).map(stop => ({ name: stop.name, note: stop.note || '' }))
          }
        : null,
    places: dayPlan.timeline
        .filter(item => item.kind === 'activity' && item.activity)
        .map(item => ({
            name: item.activity.name,
            note: item.activity.note || '',
            askedFor: Boolean(item.activity.required)
        })),
    checks: dayPlan.clusters.flatMap(cluster =>
        cluster.access.map(entry => ({ place: entry.place || '', note: entry.note }))
    ),
    restAfterJourney: dayPlan.timeline.some(item => item.kind === 'rest'),
    overnight: dayPlan.type === DAY_TYPES.DEPARTURE ? '' : dayPlan.stay || ''
})

/**
 * @description the day as the quotation, PDF and email show it: the model's paragraph when it passed its
 *              checks, otherwise one built from the plan
 */
export const renderDayDescription = dayPlan => dayPlan.description || composeDayParagraph(dayPlan)
