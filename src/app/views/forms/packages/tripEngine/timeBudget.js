/**
 * TIME BUDGET — how much of each day is actually free for sightseeing.
 *
 *   day window − travel − check-in / check-out − meals − buffer = usable time
 *
 * Travel uses the UPPER end of the leg's estimated duration plus a terrain
 * buffer, because an itinerary that is late by an hour on a mountain road is
 * a worse failure than one with an hour to spare. All times are minutes from
 * midnight; nothing here claims precision the inputs do not have.
 */

import { DAY_TYPES } from './route'
import { hasSeniorsOrChildren } from './requirements'

export const PACE_PROFILES = {
    relaxed: {
        dayStart: 9 * 60,
        dayEnd: 19 * 60,
        maxActivities: 3,
        lightEveningMax: 1,
        bufferRatio: 0.25,
        checkIn: 60
    },
    balanced: {
        dayStart: 8 * 60 + 30,
        dayEnd: 20 * 60,
        maxActivities: 5,
        lightEveningMax: 2,
        bufferRatio: 0.2,
        checkIn: 45
    },
    packed: {
        dayStart: 7 * 60 + 30,
        dayEnd: 21 * 60,
        maxActivities: 7,
        lightEveningMax: 3,
        bufferRatio: 0.15,
        checkIn: 30
    }
}

const TERRAIN_BUFFER = { mountain: 0.2, mixed: 0.1, plains: 0.05 }
const LUNCH_MINUTES = 60
const CHECK_OUT_MINUTES = 45
const MEAL_STOP_MINUTES = 45
const COMFORT_STOP_MINUTES = 15
// ? with no pickup city the guest is assumed to reach the first stay around midday
const ASSUMED_ARRIVAL = 12 * 60 + 30
// ? a drive this short leaves the morning of the departure day free
const SHORT_DEPARTURE_DRIVE = 4 * 60
// ? longer than this, a transfer or the drive home starts early
const LONG_DRIVE = 6 * 60
const EARLY_CHECK_OUT = 7 * 60
const EARLY_DEPARTURE = 6 * 60 + 30
const EVENING_END = 20 * 60 + 30
// ? a high pass or a long excursion starts early, whatever the pace
export const EARLY_EXCURSION_START = 7 * 60 + 30

export const profileFor = requirements => {
    const profile = { ...(PACE_PROFILES[requirements.pace] || PACE_PROFILES.balanced) }
    if (hasSeniorsOrChildren(requirements)) {
        // ? parents or small children: more slack, fewer stops, an earlier evening
        profile.bufferRatio += 0.1
        profile.maxActivities = Math.max(2, profile.maxActivities - 1)
        profile.dayEnd -= 60
    }
    return profile
}

export const parseClock = value => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || '')
    return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/**
 * @description minutes a leg really takes: the upper duration estimate, a terrain buffer, and meal / comfort
 *              stops. Returns ranges so the day can show "approx. 2:00–3:30 PM" rather than a fake exact time.
 */
export const travelTime = leg => {
    if (!leg?.estimate) return null
    const [minHours, maxHours] = leg.estimate.durationHours
    const drive = Math.round(maxHours * 60)
    const buffer = Math.round(drive * (TERRAIN_BUFFER[leg.estimate.terrain] ?? TERRAIN_BUFFER.mixed))
    const stops = (maxHours > 4 ? MEAL_STOP_MINUTES : 0) + Math.floor(maxHours / 3) * COMFORT_STOP_MINUTES
    return {
        minMinutes: Math.round(minHours * 60) + stops,
        maxMinutes: drive + buffer + stops,
        driveMinutes: drive,
        bufferMinutes: buffer,
        stopMinutes: stops
    }
}

const suggestedDeparture = (leg, fallback) => parseClock(leg?.estimate?.suggestedDeparture) ?? fallback

/**
 * @returns {{ window: {start, end}, departAt, arrive: {earliest, latest}, readyAt, sightseeing: {start, end},
 *             usableMinutes, lunch: boolean, bufferMinutes, travel, assumedArrival: boolean }}
 */
export const dayBudget = (day, leg, profile, requirements) => {
    const window = { start: profile.dayStart, end: profile.dayEnd }
    const travel = travelTime(leg)
    const base = { window, travel, departAt: null, arrive: null, readyAt: null, lunch: false, assumedArrival: false }

    if (day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER) {
        let arrive
        let departAt = null
        let checkOutAt = null
        if (travel) {
            // ? a long first drive starts early; a transfer day starts after breakfast and check-out
            const early = travel.maxMinutes > 6 * 60 ? 6 * 60 + 30 : 8 * 60
            if (day.type === DAY_TYPES.ARRIVAL) {
                departAt = suggestedDeparture(leg, early)
            } else {
                // ? a long transfer means an early breakfast and check-out, not a leisurely start
                checkOutAt =
                    travel.maxMinutes > LONG_DRIVE ? Math.min(profile.dayStart, EARLY_CHECK_OUT) : profile.dayStart
                departAt = Math.max(checkOutAt + CHECK_OUT_MINUTES, suggestedDeparture(leg, 0))
            }
            arrive = { earliest: departAt + travel.minMinutes, latest: departAt + travel.maxMinutes }
        } else {
            const at = parseClock(requirements.arrival.time) ?? ASSUMED_ARRIVAL
            arrive = { earliest: at, latest: at }
        }
        const readyAt = arrive.latest + profile.checkIn
        // ? whatever the pace, an arrival evening has room for a short walk before dinner
        const eveningEnd = Math.max(window.end, EVENING_END)
        const usableMinutes = Math.max(0, eveningEnd - readyAt)
        return {
            ...base,
            departAt,
            checkOutAt,
            arrive,
            readyAt,
            assumedArrival: !travel && !requirements.arrival.time,
            sightseeing: { start: readyAt, end: eveningEnd },
            usableMinutes,
            bufferMinutes: travel?.bufferMinutes || 0
        }
    }

    if (day.type === DAY_TYPES.DEPARTURE) {
        const shortDrive = !travel || travel.driveMinutes <= SHORT_DEPARTURE_DRIVE
        let checkOutAt = window.start
        let departAt
        if (shortDrive) {
            // ? only a short drive (or no drive) leaves a morning for sightseeing before leaving
            departAt = Math.max(12 * 60, window.start + 180)
        } else {
            // ? a long drive home starts early so it does not end at midnight
            departAt = suggestedDeparture(
                leg,
                travel.maxMinutes > LONG_DRIVE ? EARLY_DEPARTURE : window.start + CHECK_OUT_MINUTES
            )
            checkOutAt = Math.min(window.start, departAt - CHECK_OUT_MINUTES)
        }
        const sightseeing = shortDrive ? { start: checkOutAt + CHECK_OUT_MINUTES, end: departAt - 30 } : null
        return {
            ...base,
            departAt,
            arrive: travel ? { earliest: departAt + travel.minMinutes, latest: departAt + travel.maxMinutes } : null,
            checkOutAt,
            sightseeing,
            usableMinutes: sightseeing ? Math.max(0, sightseeing.end - sightseeing.start) : 0,
            bufferMinutes: travel?.bufferMinutes || 0
        }
    }

    // FULL_DAY and EXCURSION
    const bufferMinutes = Math.round((window.end - window.start) * profile.bufferRatio)
    return {
        ...base,
        lunch: true,
        sightseeing: { start: window.start, end: window.end },
        usableMinutes: Math.max(0, window.end - window.start - LUNCH_MINUTES - bufferMinutes),
        bufferMinutes
    }
}

export const LUNCH = { minutes: LUNCH_MINUTES, earliest: 12 * 60 + 30 }
