/**
 * SCHEDULING — required places first, then recommendations, inside each day's
 * time budget.
 *
 *   1. assignClusters: every required excursion gets a day at the stay it is
 *      done from, before anything else is planned. A cluster that cannot get a
 *      day is a CONFLICT, never a silent omission.
 *   2. scheduleDay: builds the day's timeline — travel, check-in/out, the
 *      required places in road order, then recommendations while time remains.
 *      Required places are never dropped; recommendations are, when the day is
 *      full.
 */

import { DAY_TYPES } from './route'
import { EARLY_EXCURSION_START, LUNCH } from './timeBudget'
import { normalizeText, sameName } from './requirements'

// ? a required trip this long takes the day: it is an excursion day
const EXCURSION_MINUTES = 4 * 60
const LATE_ARRIVAL = 22 * 60
const LUNCH_LATEST = 14 * 60

export const clusterMinutes = cluster =>
    cluster.places.reduce((sum, place) => sum + place.minutes + place.travelFromPreviousMinutes, 0) +
    cluster.returnMinutes

const canHostSightseeing = day => day.type !== DAY_TYPES.DEPARTURE

/**
 * @returns {{ byDay: Record<number, object[]>, conflicts: object[], warnings: object[] }}
 */
export const assignClusters = (days, budgets, clusters) => {
    const byDay = {}
    const remaining = Object.fromEntries(days.map(day => [day.index, budgets[day.index].usableMinutes]))
    const conflicts = []
    const warnings = []

    // ? full-day excursions first: they are the hardest to fit
    const ordered = [...clusters].sort((left, right) => Number(right.fullDay) - Number(left.fullDay))

    ordered.forEach(cluster => {
        const minutes = clusterMinutes(cluster)
        const atBase = days.filter(day => canHostSightseeing(day) && sameName(day.stay, cluster.baseStay))

        if (!atBase.length) {
            conflicts.push({ id: `off-route-${cluster.id}`, kind: 'off-route', cluster, minutes })
            return
        }

        const fullDays = atBase.filter(day => day.type === DAY_TYPES.FULL_DAY)
        const hasExcursion = day => (byDay[day.index] || []).some(item => item.fullDay)
        const fits = day => remaining[day.index] >= minutes

        let chosen
        if (cluster.fullDay) {
            chosen =
                fullDays.find(day => !hasExcursion(day) && !(byDay[day.index] || []).length) ||
                fullDays.find(day => !hasExcursion(day))
        } else {
            chosen = fullDays.find(day => !hasExcursion(day) && fits(day)) || atBase.find(fits)
        }

        if (!chosen) {
            conflicts.push({ id: `no-day-${cluster.id}`, kind: 'no-day', cluster, minutes })
            return
        }

        byDay[chosen.index] = [...(byDay[chosen.index] || []), cluster]
        remaining[chosen.index] -= minutes
        if (remaining[chosen.index] < 0) {
            // ? a required excursion longer than the planned day stays in, flagged as a long day
            warnings.push({
                id: `long-day-${chosen.index}`,
                dayIndex: chosen.index,
                text: `Day ${chosen.dayNumber} is long: ${cluster.name} takes about ${Math.round(minutes / 60)} hours.`
            })
        }
    })

    return { byDay, conflicts, warnings, remaining }
}

/**
 * @description the minutes left for recommendations once the day's required excursions are placed
 */
export const freeMinutesFor = (budget, clustersOnDay) =>
    Math.max(0, budget.usableMinutes - clustersOnDay.reduce((sum, cluster) => sum + clusterMinutes(cluster), 0))

const recommendedLimit = (day, profile, requiredPlaceCount, budget) => {
    if (day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER) {
        return budget.usableMinutes >= 60 ? profile.lightEveningMax : 0
    }
    if (day.type === DAY_TYPES.DEPARTURE) return budget.usableMinutes >= 90 ? 1 : 0
    return Math.max(0, profile.maxActivities - requiredPlaceCount)
}

/**
 * @param {object} input
 * @param {object} input.day skeleton day
 * @param {object} input.budget dayBudget(...)
 * @param {object|null} input.leg route leg with .estimate
 * @param {object[]} input.clusters required clusters assigned to this day
 * @param {object[]} input.recommended the model's activities for this day, already de-duplicated
 * @param {object} input.profile pace profile
 * @param {string} input.previousStay where the guest checks out from on a transfer day
 * @returns {object} DayPlan
 */
export const scheduleDay = ({ day, budget, leg, clusters, recommended, profile, previousStay, title }) => {
    const timeline = []
    const dropped = []
    const warnings = []

    const push = item => timeline.push(item)

    if (day.type === DAY_TYPES.TRANSFER && previousStay) {
        push({
            kind: 'checkout',
            label: `Breakfast and check-out in ${previousStay}`,
            start: budget.checkOutAt ?? profile.dayStart
        })
    }

    if ((day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER) && leg) {
        push({ kind: 'depart', label: `Depart ${leg.from}`, start: budget.departAt, leg })
        push({
            kind: 'travel',
            label: `${leg.from} → ${leg.to}`,
            start: budget.departAt,
            end: budget.arrive.latest,
            leg
        })
    }

    if (day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER) {
        push({
            kind: 'arrive',
            label: `Arrive in ${day.location}, hotel check-in`,
            start: budget.arrive.earliest,
            end: budget.arrive.latest,
            assumed: budget.assumedArrival
        })
    }

    if (day.type === DAY_TYPES.DEPARTURE) {
        const early = budget.checkOutAt < 7 * 60
        push({
            kind: 'checkout',
            label: early
                ? `Early check-out in ${day.location} (packed breakfast)`
                : `Breakfast and check-out in ${day.location}`,
            start: budget.checkOutAt
        })
    }

    // ---- sightseeing: required places first, in road order, then recommendations
    let cursor = budget.sightseeing?.start ?? null
    // ? an excursion that begins with a long drive (a high pass, a valley beyond a tunnel) starts early
    const longExcursion =
        (clusters[0]?.places[0]?.travelFromPreviousMinutes || 0) >= 90 ||
        clusters.some(cluster => clusterMinutes(cluster) >= 5 * 60)
    if (cursor != null && longExcursion && day.type === DAY_TYPES.FULL_DAY && cursor > EARLY_EXCURSION_START) {
        cursor = EARLY_EXCURSION_START
        push({ kind: 'depart', label: `Early start from ${day.location}`, start: cursor })
    }
    const limit = budget.sightseeing ? budget.sightseeing.end - (budget.lunch ? budget.bufferMinutes : 0) : null
    let lunchPlaced = !budget.lunch
    let overflowMinutes = 0
    // ? where the guest is right now: lunch is "near Sissu" mid-excursion and "in Manali" after the drive back
    let here = day.location

    const placeLunch = ({ before } = {}) => {
        // ? normally from 12:30; from 11:30 when the next visit would otherwise push lunch past 2 PM
        const earliest = before && before > LUNCH_LATEST ? 11 * 60 + 30 : LUNCH.earliest
        if (lunchPlaced || cursor == null || cursor < earliest) return
        push({
            kind: 'meal',
            label: here === day.location ? `Lunch in ${here}` : `Lunch near ${here}`,
            start: cursor,
            end: cursor + LUNCH.minutes
        })
        cursor += LUNCH.minutes
        lunchPlaced = true
    }

    const activities = []
    const addActivity = (item, required) => {
        placeLunch({ before: cursor + item.travelFromPreviousMinutes + item.minutes })
        const start = cursor + item.travelFromPreviousMinutes
        const end = start + item.minutes
        if (!required && end > limit) {
            dropped.push(item.name)
            return false
        }
        if (required && end > limit) overflowMinutes = Math.max(overflowMinutes, end - limit)
        const scheduled = { ...item, start, end, required, recommended: !required }
        activities.push(scheduled)
        push({ kind: 'activity', label: item.name, start, end, activity: scheduled })
        cursor = end
        here = item.name
        return true
    }

    if (cursor != null) {
        clusters.forEach(cluster => {
            cluster.places.forEach(place =>
                addActivity({ ...place, category: 'sightseeing', note: '', cluster: cluster.name }, true)
            )
            // ? eat before the drive back rather than after it
            placeLunch({ before: cursor + cluster.returnMinutes })
            if (cluster.returnMinutes) {
                push({
                    kind: 'travel',
                    label: `Return to ${day.location}`,
                    start: cursor,
                    end: cursor + cluster.returnMinutes
                })
                cursor += cluster.returnMinutes
            }
            here = day.location
        })

        const requiredPlaceCount = clusters.reduce((sum, cluster) => sum + cluster.places.length, 0)
        let allowed = recommendedLimit(day, profile, requiredPlaceCount, budget)
        recommended.forEach(item => {
            if (allowed <= 0) {
                dropped.push(item.name)
                return
            }
            if (addActivity(item, false)) allowed -= 1
        })

        placeLunch()
    }

    if (day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER) {
        if (!activities.length) push({ kind: 'rest', label: 'Rest after the journey', start: budget.readyAt })
    }

    if (day.type === DAY_TYPES.DEPARTURE) {
        push({ kind: 'depart', label: `Depart ${day.location}`, start: budget.departAt, leg })
        if (leg) {
            push({
                kind: 'travel',
                label: `${leg.from} → ${leg.to}`,
                start: budget.departAt,
                end: budget.arrive.latest,
                leg
            })
            push({
                kind: 'arrive',
                label: `Arrive in ${leg.to}`,
                start: budget.arrive.earliest,
                end: budget.arrive.latest
            })
            if (budget.arrive.latest > LATE_ARRIVAL) {
                warnings.push(
                    'The drive home ends late. Consider an overnight Volvo, a flight, or breaking the journey for an easier last day.'
                )
            }
        } else {
            push({ kind: 'onward', label: 'Onward journey', start: budget.departAt })
        }
    } else {
        push({
            kind: 'stay',
            label: `Dinner and overnight in ${day.stay}`,
            start: Math.max(cursor ?? 0, profile.dayEnd - 60)
        })
    }

    if (overflowMinutes > 45) {
        warnings.push(
            `A long day: the required places run about ${Math.round(overflowMinutes / 30) / 2} hours past a comfortable finish.`
        )
    }

    // ? a day built around a required out-of-town trip is an excursion, not a local full day
    const excursion = clusters.some(cluster => cluster.fullDay || clusterMinutes(cluster) >= EXCURSION_MINUTES)
    const type = excursion && day.type === DAY_TYPES.FULL_DAY ? DAY_TYPES.EXCURSION : day.type
    const usedMinutes = activities.reduce((sum, item) => sum + item.minutes + item.travelFromPreviousMinutes, 0)

    return {
        ...day,
        type,
        title,
        leg,
        budget,
        clusters,
        timeline,
        activities,
        dropped,
        warnings,
        usedMinutes,
        overflowMinutes
    }
}

/**
 * @description the model's activities minus anything required, excluded, or already planned on another day
 */
export const dedupeRecommended = (activities, { taken, excluded }) =>
    activities.filter(item => {
        const name = normalizeText(item.name)
        const clash = value => {
            const other = normalizeText(value)
            return (
                other &&
                (other === name ||
                    (other.length > 4 && name.includes(other)) ||
                    (name.length > 4 && other.includes(name)))
            )
        }
        return !taken.some(clash) && !excluded.some(clash)
    })
