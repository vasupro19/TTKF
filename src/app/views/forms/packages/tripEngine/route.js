/**
 * ROUTE — the journey, before any attraction is considered.
 *
 *   origin → stay 1 (n nights) → stay 2 (n nights) → … → final destination
 *
 * Every arrow is a JourneyLeg that consumes real time on a real day. The day
 * skeleton is built from the route alone, deterministically: how many days
 * there are and what kind each one is never depends on the model.
 */

import { normalizeText } from './requirements'

export const DAY_TYPES = {
    ARRIVAL: 'ARRIVAL',
    FULL_DAY: 'FULL_DAY',
    TRANSFER: 'TRANSFER',
    EXCURSION: 'EXCURSION',
    DEPARTURE: 'DEPARTURE'
}

export const DAY_TYPE_LABELS = {
    ARRIVAL: 'Arrival',
    FULL_DAY: 'Full day',
    TRANSFER: 'Transfer',
    EXCURSION: 'Excursion',
    DEPARTURE: 'Departure'
}

export const legKey = leg => `${normalizeText(leg.from)}>${normalizeText(leg.to)}|${normalizeText(leg.mode)}`

/**
 * @returns {{ stops: object[], legs: object[], stays: object[] }}
 */
export const buildRoute = requirements => {
    const { mode } = requirements.transport
    const stays = requirements.destinations.map(item => ({ destination: item.name, nights: item.nights }))
    const final = requirements.finalDestination || requirements.origin

    const stops = [
        ...(requirements.origin ? [{ name: requirements.origin, kind: 'origin' }] : []),
        ...stays.map(stay => ({ name: stay.destination, kind: 'stay', nights: stay.nights })),
        ...(final ? [{ name: final, kind: 'final' }] : [])
    ]

    const legs = []
    for (let index = 0; index < stops.length - 1; index += 1) {
        legs.push({ id: `leg-${index + 1}`, from: stops[index].name, to: stops[index + 1].name, mode })
    }

    return { stops, legs, stays }
}

const addDays = (isoDate, days) => {
    if (!isoDate) return ''
    const date = new Date(`${isoDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

/**
 * @description one day per night plus the last day. Arrival at the first stay is ARRIVAL, arrival at every
 *              later stay is TRANSFER, the last day is DEPARTURE, everything else starts as FULL_DAY (an
 *              excursion is assigned later).
 */
export const buildDaySkeleton = (route, requirements) => {
    const days = []
    const legTo = name => route.legs.find(leg => leg.to === name && leg.from !== name)

    route.stays.forEach((stay, stayIndex) => {
        for (let night = 0; night < stay.nights; night += 1) {
            const isArrivalDay = night === 0
            let type = DAY_TYPES.FULL_DAY
            let leg = null

            if (isArrivalDay) {
                type = stayIndex === 0 ? DAY_TYPES.ARRIVAL : DAY_TYPES.TRANSFER
                // ? the first stay only has an inbound leg when there is an origin
                leg = stayIndex === 0 && !requirements.origin ? null : legTo(stay.destination) || null
            }

            days.push({
                type,
                location: stay.destination,
                stay: stay.destination,
                dayAtStay: night + 1,
                legId: leg?.id || null
            })
        }
    })

    const lastStay = route.stays[route.stays.length - 1]
    if (lastStay) {
        const outbound = route.legs[route.legs.length - 1]
        const hasOutbound = outbound && outbound.from === lastStay.destination
        days.push({
            type: DAY_TYPES.DEPARTURE,
            location: lastStay.destination,
            stay: null,
            dayAtStay: null,
            legId: hasOutbound ? outbound.id : null
        })
    }

    return days.map((day, index) => {
        const leg = route.legs.find(item => item.id === day.legId)
        return {
            ...day,
            index,
            dayNumber: index + 1,
            date: addDays(requirements.startDate, index),
            // ? identifies "the same day" across re-plans, so unchanged days keep their plan
            key: [day.type, normalizeText(day.location), day.dayAtStay ?? 'out', leg ? legKey(leg) : 'none'].join('|')
        }
    })
}
