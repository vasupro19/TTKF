/**
 * VALIDATION — runs on every plan before it is shown.
 *
 * A HARD failure means a user requirement is not met (a destination, a night
 * count, a required place, a journey leg). The plan is then not displayed:
 * the engine repairs what it can and turns the rest into a conflict with
 * options for the agent. SOFT checks are quality warnings.
 */

import { DAY_TYPES } from './route'
import { normalizeText, sameName, totalNightsOf } from './requirements'

const looselyEqual = (left, right) => {
    const a = normalizeText(left)
    const b = normalizeText(right)
    return Boolean(a && b) && (a.includes(b) || (a.length >= 4 && b.includes(a)))
}

// ? a required item is met by a scheduled place with that name, or by a scheduled cluster that says it covers it
export const isCovered = (days, name) =>
    days.some(
        day =>
            day.activities.some(activity => looselyEqual(activity.name, name)) ||
            (day.clusters || []).some(cluster => cluster.covers.some(covered => looselyEqual(covered, name)))
    )

const covers = (plan, name) => isCovered(plan.days, name)

/**
 * @param {object} plan { requirements, route, days, unresolved }
 * @param {object} profile pace profile
 * @returns {{ ok: boolean, checks: {id, label, pass, hard, detail}[] }}
 */
export const validatePlan = (plan, profile) => {
    const { requirements, route, days } = plan
    const checks = []
    const check = (id, label, pass, { hard = false, detail = '' } = {}) =>
        checks.push({ id, label, pass, hard, detail })

    const stayDays = days.filter(day => day.type !== DAY_TYPES.DEPARTURE)
    const nightsByStay = name => stayDays.filter(day => sameName(day.stay, name)).length

    check('origin', 'Origin included', !requirements.origin || route.stops[0]?.name === requirements.origin, {
        hard: true
    })
    check(
        'final',
        'Final destination included',
        !requirements.finalDestination || route.stops[route.stops.length - 1]?.name === requirements.finalDestination,
        { hard: true }
    )

    const missingStays = requirements.destinations.filter(
        item => !route.stays.some(stay => sameName(stay.destination, item.name))
    )
    check('destinations', 'Every requested destination kept', !missingStays.length, {
        hard: true,
        detail: missingStays.map(item => item.name).join(', ')
    })

    const wrongNights = requirements.destinations.filter(item => nightsByStay(item.name) !== item.nights)
    check('nights', 'Hotel nights match', !wrongNights.length && stayDays.length === totalNightsOf(requirements), {
        hard: true,
        detail: wrongNights.map(item => `${item.name}: ${nightsByStay(item.name)} of ${item.nights}`).join(', ')
    })

    const uncovered = requirements.requiredAttractions.filter(item => !covers(plan, item.name))
    check('required', 'Required places included', !uncovered.length, {
        hard: true,
        detail: uncovered.map(item => item.name).join(', ')
    })

    const legsWithoutDay = route.legs.filter(leg => !days.some(day => day.legId === leg.id))
    check('legs', 'Every journey leg has a day', !legsWithoutDay.length, {
        hard: true,
        detail: legsWithoutDay.map(leg => `${leg.from} → ${leg.to}`).join(', ')
    })

    const legsWithoutEstimate = days.filter(day => day.legId && !day.leg?.estimate)
    check('travel-time', 'Travel time accounted for', !legsWithoutEstimate.length, {
        hard: true,
        detail: legsWithoutEstimate.map(day => `Day ${day.dayNumber}`).join(', ')
    })

    const busyTravelDays = days.filter(
        day =>
            (day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER || day.type === DAY_TYPES.DEPARTURE) &&
            day.activities.filter(activity => activity.recommended).length > profile.lightEveningMax
    )
    check('travel-days', 'Arrival, transfer and departure days kept light', !busyTravelDays.length, {
        detail: busyTravelDays.map(day => `Day ${day.dayNumber}`).join(', ')
    })

    const overlapping = days.filter(day =>
        day.activities.some((activity, index) => index > 0 && activity.start < day.activities[index - 1].end)
    )
    check('overlap', 'No overlapping activities', !overlapping.length, {
        hard: true,
        detail: overlapping.map(day => `Day ${day.dayNumber}`).join(', ')
    })

    // ? measured against the day's own sightseeing window (an arrival evening runs later than the pace's day end)
    const lateRecommended = days.filter(day =>
        day.activities.some(
            activity => activity.recommended && activity.end > (day.budget?.sightseeing?.end ?? profile.dayEnd)
        )
    )
    check('timing', 'No impossible timing', !lateRecommended.length, {
        hard: true,
        detail: lateRecommended.map(day => `Day ${day.dayNumber}`).join(', ')
    })

    const backtracking = route.stays.some(
        (stay, index) =>
            index > 0 &&
            route.stays.slice(0, index - 1).some(earlier => sameName(earlier.destination, stay.destination))
    )
    check('backtracking', 'No backtracking between stays', !backtracking)

    const noBuffer = days.filter(day => day.leg && !day.budget?.travel?.bufferMinutes)
    check('buffers', 'Travel buffers included', !noBuffer.length)

    const overPaced = days.filter(
        day => day.activities.filter(activity => activity.recommended).length > profile.maxActivities
    )
    check('pace', 'Pace respected', !overPaced.length)

    const repeated = new Set()
    const seen = new Set()
    days.forEach(day =>
        day.activities.forEach(activity => {
            const key = normalizeText(activity.name)
            if (seen.has(key)) repeated.add(activity.name)
            seen.add(key)
        })
    )
    check('repeats', 'No place repeated', !repeated.size, { detail: [...repeated].join(', ') })

    check('unresolved', 'Every required place has a day', !(plan.unresolved || []).length, {
        hard: true,
        detail: (plan.unresolved || []).map(item => item.name).join(', ')
    })

    return { ok: checks.every(item => item.pass || !item.hard), checks }
}
