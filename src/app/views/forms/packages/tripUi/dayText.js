/**
 * The words a collapsed day shows: a headline and one summary line.
 */
import { DAY_TYPES } from '../tripEngine/route'
import { formatHours } from '../tripEngine/render'

export const formatDate = isoDate =>
    isoDate
        ? new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC'
          })
        : ''

const words = value =>
    (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()

// ? the names the agent typed ("Rohtang"), in the road order of the places that cover them — not the
//   model's wordier place names ("Rohtang Pass (Point 1)")
const requiredNames = day =>
    day.activities
        .filter(item => item.required)
        .map(item => {
            const place = words(item.name)
            const asked = day.clusters.flatMap(cluster => cluster.covers).find(name => place.includes(words(name)))
            return asked || item.name.replace(/\s*\([^)]*\)/g, '').trim()
        })
        .filter((name, index, list) => list.indexOf(name) === index)

/**
 * @description the day's one-line headline — the route on a travel day, the places on a day trip
 */
export const dayHeadline = day => {
    if (day.leg) return `${day.leg.from} → ${day.leg.to}`
    if (day.type === DAY_TYPES.ARRIVAL) return `Arrive in ${day.location}`
    if (day.type === DAY_TYPES.DEPARTURE) return `Leave ${day.location}`
    if (day.type === DAY_TYPES.EXCURSION && requiredNames(day).length) return requiredNames(day).join(' → ')
    return day.location
}

/**
 * @description the second line: what kind of day it is, in words, and its shape
 */
export const daySummary = day => {
    const places = day.activities.map(item => item.name)
    if (day.leg) {
        const drive = day.leg.estimate
            ? `about ${formatHours(day.leg.estimate.durationHours).replace('about ', '')} on the road`
            : 'Travel day'
        return places.length ? `${drive}, then ${places.slice(0, 2).join(' and ')}` : drive
    }
    // ? no clock times here: the day reads as places, and the timings sit behind "Timings and drive"
    if (day.type === DAY_TYPES.EXCURSION && day.activities.length) return `Day trip from ${day.location}`
    if (day.type === DAY_TYPES.DEPARTURE)
        return places.length ? `${places[0]}, then onward` : 'Check out and head onward'
    return places.length ? places.slice(0, 3).join(', ') : 'At leisure'
}
