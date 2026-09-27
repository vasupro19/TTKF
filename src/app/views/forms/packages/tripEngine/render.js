/**
 * RENDERING — turns a DayPlan into what the rest of Travelytics stores and
 * prints: a day title, a plain-text description (line by line, which the
 * package PDF and quotation email now keep), and the entry type the package
 * model understands.
 *
 * Times are shown as approximate ranges rounded to the half hour, because the
 * underlying figures are estimates.
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

const legSummary = leg => {
    if (!leg?.estimate) return `${leg.from} → ${leg.to}`
    const via = leg.estimate.via.length ? ` via ${leg.estimate.via.join(', ')}` : ''
    const facts = [
        formatKm(leg.estimate.distanceKm),
        `${formatHours(leg.estimate.durationHours)} by ${leg.mode.toLowerCase()}`
    ]
        .filter(Boolean)
        .join(', ')
    return `${leg.from} → ${leg.to}${via} (${facts}, estimated)`
}

/**
 * @description the day as plain text lines, for the quotation, PDF and email
 */
export const renderDayDescription = dayPlan => {
    const lines = []

    if (dayPlan.leg) lines.push(`Route: ${legSummary(dayPlan.leg)}`)

    dayPlan.timeline.forEach(item => {
        const when = formatWindow(item.start, item.end)
        if (item.kind === 'travel' && item.leg) {
            const stops = item.leg.estimate?.stops?.map(stop => stop.name).join(', ')
            const drive = item.leg.estimate
                ? ` (${formatHours(item.leg.estimate.durationHours)} of driving, plus stops)`
                : ''
            lines.push(`On the road${drive}${stops ? `: ${stops}` : ''}`)
            return
        }
        if (item.kind === 'activity') {
            const note = item.activity.note ? ` — ${item.activity.note}` : ''
            lines.push(`${when}: ${item.label}${note}`)
            return
        }
        if (item.kind === 'stay') {
            lines.push(`Evening: ${item.label}`)
            return
        }
        lines.push(`${when}: ${item.label}${item.assumed ? ' (assumed)' : ''}`)
    })

    const notes = [
        ...dayPlan.warnings,
        ...(dayPlan.leg?.estimate?.notes || []).map(note => `Road: ${note} (general guidance)`),
        ...dayPlan.clusters.flatMap(cluster =>
            cluster.access.map(entry => `${entry.note} (general guidance — verify before travel)`)
        )
    ]
    notes.forEach(note => lines.push(`Note: ${note}`))

    if (dayPlan.stay) lines.push(`Stay: ${dayPlan.stay}`)

    return lines.join('\n')
}
