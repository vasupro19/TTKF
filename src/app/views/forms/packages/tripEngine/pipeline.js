/**
 * THE PIPELINE
 *
 *   input → understand → requirements → route → journey legs → time budgets
 *         → required excursions → recommendations → schedule → validate → write → Trip
 *
 * Model calls are cached by what they depend on, so a re-plan only asks for
 * what changed:
 *   - a leg estimate depends on (from, to, transport)  → a new origin re-asks two legs
 *   - excursion clusters depend on (stays, required places, month, constraints)
 *   - a day's recommendations depend on (day type, place, leg, its excursions),
 *     and are re-timed — not re-asked — when only the pace or budget changes
 *   - a day's written description depends on the facts it describes (route,
 *     places, notes, stay), so a day that did not change keeps its paragraph
 *
 * `ask(request)` sends one request to the AI endpoint and resolves to parsed JSON.
 */

import { buildDaySkeleton, buildRoute, DAY_TYPES, legKey } from './route'
import {
    emptyRequirements,
    mergeRequirements,
    normalizeRequirements,
    normalizeText,
    resolveRequirements
} from './requirements'
import { dayBudget, profileFor } from './timeBudget'
import { assignClusters, dedupeRecommended, freeMinutesFor, scheduleDay } from './schedule'
import { isCovered, validatePlan } from './validate'
import {
    buildEditRequest,
    buildFillRequest,
    buildLogisticsRequest,
    buildUnderstandRequest,
    buildWriteRequest,
    normalizeEdit,
    normalizeFill,
    normalizeLogistics,
    normalizeUnderstanding,
    normalizeWrite
} from './prompts'
import { writeInputFor } from './render'

export const emptyCache = () => ({ legs: {}, clusters: {}, days: {}, writeups: {} })

const FILL_CHUNK = 6
const WRITE_CHUNK = 7
const MAX_QUESTIONS = 2
const PACE_RANK = { relaxed: 0, balanced: 1, packed: 2 }

const clone = value => JSON.parse(JSON.stringify(value))

const looselyEqual = (left, right) => {
    const a = normalizeText(left)
    const b = normalizeText(right)
    return Boolean(a && b) && (a.includes(b) || (a.length >= 4 && b.includes(a)))
}

export const monthOf = isoDate =>
    isoDate ? new Date(`${isoDate}T00:00:00Z`).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }) : ''

const clusterCacheKey = requirements =>
    JSON.stringify({
        stays: requirements.destinations.map(item => normalizeText(item.name)),
        required: requirements.requiredAttractions.map(item => normalizeText(item.name)).sort(),
        month: monthOf(requirements.startDate),
        constraints: requirements.constraints.map(normalizeText).sort()
    })

/**
 * @description step 1a: what the typed text says, on its own. Cached by callers so the same text is not
 *              sent to the model twice.
 */
export const extractFromText = async ({ text, form = {}, ask }) => {
    const extracted = normalizeUnderstanding(
        await ask(buildUnderstandRequest({ text, form: normalizeRequirements(form) }))
    )
    // ? a "suggestion" the guest actually named ("Delhi to Manali 5 nights") is a destination, not an AI choice
    const typed = ` ${normalizeText(text)} `
    const suggested = extracted.suggestedDestinations
    if (
        !extracted.destinations.length &&
        suggested.length &&
        suggested.every(item => typed.includes(` ${normalizeText(item.name)} `))
    ) {
        extracted.destinations = suggested.map(({ name, nights }) => ({ name, nights }))
        extracted.suggestedDestinations = []
    }
    return extracted
}

/**
 * @description step 1: the typed notes and the form become one requirements object (the form wins)
 */
export const understand = async ({ text, form, ask }) => {
    if (!text?.trim()) return mergeRequirements(emptyRequirements(), form)
    return mergeRequirements(await extractFromText({ text, form, ask }), form)
}

/**
 * @description an agent's change request ("add one night in Manali") applied to the requirements
 */
export const editRequirements = async ({ requirements, instruction, ask }) =>
    normalizeEdit(await ask(buildEditRequest({ requirements, instruction })))

const fetchLogistics = async ({ route, requirements, cache, ask }) => {
    const clusterKey = clusterCacheKey(requirements)
    const month = monthOf(requirements.startDate)
    let missing = route.legs.filter(leg => !cache.legs[legKey(leg)])
    let needClusters = !cache.clusters[clusterKey]

    // ? one repair round: a reply that skips a leg is asked again for just that leg
    for (let attempt = 0; attempt < 2 && (missing.length || needClusters); attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        const reply = await ask(buildLogisticsRequest({ legs: missing, requirements, month }))
        const logistics = normalizeLogistics(reply, missing)
        missing.forEach(leg => {
            if (logistics.legs[leg.id]) cache.legs[legKey(leg)] = logistics.legs[leg.id]
        })
        if (needClusters) {
            cache.clusters[clusterKey] = { clusters: logistics.clusters, unplaceable: logistics.unplaceable }
            needClusters = false
        }
        missing = missing.filter(leg => !cache.legs[legKey(leg)])
    }

    return cache.clusters[clusterKey]
}

const fillKeyFor = (day, clustersOnDay) =>
    `${day.key}|${clustersOnDay.map(cluster => normalizeText(cluster.name)).join('+')}`

const fetchFill = async ({ skeleton, budgets, assignment, requirements, cache, ask }) => {
    const recommendations = []
    const needsFill = skeleton.filter(day => {
        const cached = cache.days[fillKeyFor(day, assignment.byDay[day.index] || [])]
        // ? a lower pace re-times the cached plan; only a busier pace needs more suggestions
        return !cached || PACE_RANK[requirements.pace] > PACE_RANK[cached.pace]
    })

    const alreadyPlanned = [
        ...Object.values(assignment.byDay).flatMap(clusters =>
            clusters.flatMap(cluster => cluster.places.map(place => place.name))
        ),
        ...skeleton
            .filter(day => !needsFill.includes(day))
            .flatMap(day =>
                cache.days[fillKeyFor(day, assignment.byDay[day.index] || [])].activities.map(item => item.name)
            )
    ]

    for (let start = 0; start < needsFill.length; start += FILL_CHUNK) {
        const chunk = needsFill.slice(start, start + FILL_CHUNK)
        const request = buildFillRequest({
            days: chunk.map(day => {
                const clustersOnDay = assignment.byDay[day.index] || []
                return {
                    day,
                    budget: budgets[day.index],
                    fixed: clustersOnDay.flatMap(cluster => cluster.places.map(place => place.name)),
                    freeMinutes: freeMinutesFor(budgets[day.index], clustersOnDay)
                }
            }),
            requirements,
            alreadyPlanned
        })
        // eslint-disable-next-line no-await-in-loop
        const reply = await ask(request)
        const fill = normalizeFill(
            reply,
            chunk.map(day => day.dayNumber)
        )
        chunk.forEach(day => {
            const entry = fill.days[day.dayNumber] || { title: '', activities: [] }
            cache.days[fillKeyFor(day, assignment.byDay[day.index] || [])] = { ...entry, pace: requirements.pace }
            alreadyPlanned.push(...entry.activities.map(item => item.name))
        })
        recommendations.push(...fill.recommendations)
    }

    return recommendations
}

/**
 * @description step "write": one guest-ready paragraph per day. Best effort — a day the model skips, or whose
 *              text fails its checks, keeps no description and is rendered from the plan instead, so a slow or
 *              failing model never costs the agent the plan itself.
 */
const writeDescriptions = async ({ days, requirements, cache, ask }) => {
    const writeups = cache.writeups || {}
    Object.assign(cache, { writeups })
    const inputs = days.map(writeInputFor)
    const keyOf = input => JSON.stringify({ ...input, travellers: requirements.travellers?.type || '' })
    const missing = inputs.filter(input => writeups[keyOf(input)] === undefined)

    for (let start = 0; start < missing.length; start += WRITE_CHUNK) {
        const chunk = missing.slice(start, start + WRITE_CHUNK)
        try {
            // eslint-disable-next-line no-await-in-loop
            const written = normalizeWrite(await ask(buildWriteRequest({ days: chunk, requirements })), chunk)
            // ? a paragraph that failed its checks is remembered as '' too — asking again on every edit would
            //   slow each change down for a day that already reads fine from the plan
            chunk.forEach(input => {
                writeups[keyOf(input)] = written[input.day] || ''
            })
        } catch (error) {
            // ? no reply at all (rate limit, network): nothing is cached, so the next plan tries again; this
            //   plan stands without the model's prose — see renderDayDescription
        }
    }

    return days.map((day, index) => ({ ...day, description: writeups[keyOf(inputs[index])] || '' }))
}

const conflictOptions = (conflict, requirements) => {
    const { names } = conflict
    const remove = { id: 'remove', label: `Leave out ${names.join(', ')}`, patch: { type: 'remove-required', names } }

    if (conflict.kind === 'no-day') {
        return [
            {
                id: 'add-night',
                label: `Add 1 night in ${conflict.base}`,
                patch: { type: 'add-night', destination: conflict.base }
            },
            remove
        ]
    }
    if (conflict.kind === 'off-route' && conflict.base) {
        const last = requirements.destinations[requirements.destinations.length - 1]?.name
        return [
            {
                id: 'add-destination',
                label: `Add ${conflict.base} (1 night) to the route`,
                patch: { type: 'add-destination', name: conflict.base, nights: 1, after: last }
            },
            remove
        ]
    }
    return [remove]
}

const describeConflict = conflict => {
    if (conflict.kind === 'no-day') {
        return `${conflict.names.join(', ')} needs a full day from ${conflict.base}, but the nights there are already used. It cannot fit without rushing the trip.`
    }
    if (conflict.kind === 'off-route') {
        return `${conflict.names.join(', ')} is done from ${conflict.base || 'a place that is not on this route'}, which is not one of the stays.`
    }
    return `${conflict.names.join(', ')}: ${conflict.reason || 'could not be placed on this route.'}`
}

/**
 * @description builds the trip, or incrementally rebuilds it from `previous`
 * @param {object} input
 * @param {object} input.requirements what the agent asked for — without engine defaults
 * @param {object|null} input.previous the last Trip, whose cache is reused
 * @param {Function} input.ask
 * @returns {Promise<object>} Trip
 */
export const planTrip = async ({ requirements: input, previous = null, ask }) => {
    const specified = normalizeRequirements(input)
    const resolved = resolveRequirements(specified)
    const cache = previous?.cache ? clone(previous.cache) : emptyCache()
    const base = { input: specified, requirements: resolved.requirements, assumptions: resolved.assumptions, cache }

    if (resolved.blocked) {
        return { ...base, status: 'needs-input', questions: resolved.questions.slice(0, MAX_QUESTIONS), days: [] }
    }

    const { requirements } = resolved
    const route = buildRoute(requirements)
    const profile = profileFor(requirements)

    const { clusters, unplaceable } = await fetchLogistics({ route, requirements, cache, ask })
    const legs = route.legs.map(leg => ({ ...leg, estimate: cache.legs[legKey(leg)] || null }))
    const legFor = day => legs.find(leg => leg.id === day.legId) || null

    const skeleton = buildDaySkeleton(route, requirements)
    const budgets = skeleton.map(day => dayBudget(day, legFor(day), profile, requirements))

    // ---- required places before anything else
    const assignment = assignClusters(skeleton, budgets, clusters)
    const orphans = requirements.requiredAttractions.filter(
        item =>
            !clusters.some(
                cluster =>
                    cluster.covers.some(name => looselyEqual(name, item.name)) ||
                    cluster.places.some(place => looselyEqual(place.name, item.name))
            ) && !unplaceable.some(entry => looselyEqual(entry.name, item.name))
    )

    const recommendations = await fetchFill({ skeleton, budgets, assignment, requirements, cache, ask })

    // ---- schedule every day inside its budget
    const taken = Object.values(assignment.byDay).flatMap(list =>
        list.flatMap(cluster => cluster.places.map(place => place.name))
    )
    const days = skeleton.map(day => {
        const clustersOnDay = assignment.byDay[day.index] || []
        const planKey = fillKeyFor(day, clustersOnDay)
        const cached = cache.days[planKey] || { title: '', activities: [] }
        const recommended = dedupeRecommended(cached.activities, { taken, excluded: requirements.excludedAttractions })
        const plan = scheduleDay({
            day,
            budget: budgets[day.index],
            leg: legFor(day),
            clusters: clustersOnDay,
            recommended,
            profile,
            previousStay: skeleton[day.index - 1]?.stay,
            title: cached.title
        })
        taken.push(...plan.activities.filter(item => item.recommended).map(item => item.name))
        return { ...plan, planKey }
    })

    // ---- conflicts: required places that could not get a day
    const conflicts = [
        ...assignment.conflicts.map(conflict => ({
            kind: conflict.kind,
            base: conflict.cluster.baseStay,
            names: conflict.cluster.covers.length
                ? conflict.cluster.covers
                : conflict.cluster.places.map(place => place.name)
        })),
        ...unplaceable.map(entry => ({ kind: 'unplaceable', names: [entry.name], reason: entry.reason })),
        ...orphans.map(item => ({
            kind: 'unplaceable',
            names: [item.name],
            reason: 'the planner could not place it on this route'
        }))
    ]
        .filter(conflict => conflict.names.some(name => !isCovered(days, name)))
        .map((conflict, index) => ({
            id: `conflict-${index + 1}`,
            ...conflict,
            text: describeConflict(conflict),
            options: conflictOptions(conflict, requirements)
        }))

    const validation = validatePlan(
        { requirements, route, days, unresolved: conflicts.flatMap(item => item.names.map(name => ({ name }))) },
        profile
    )

    // ---- the questions that would change this plan
    const accessSensitive =
        clusters.some(cluster => cluster.access.length) || legs.some(leg => leg.estimate?.terrain === 'mountain')
    const questions = [...resolved.questions]
    if (!requirements.startDate && accessSensitive) {
        questions.push({
            id: 'dates',
            field: 'startDate',
            priority: 3,
            text: 'What date does the trip start? Mountain roads and seasonal places change with the month.'
        })
    }

    const notes = [
        ...new Map(
            clusters
                .filter(cluster => days.some(day => day.clusters.includes(cluster)))
                .flatMap(cluster => cluster.access)
                .map(entry => [normalizeText(entry.note), entry])
        ).values()
    ]

    const planned = [
        ...requirements.destinations.map(item => item.name),
        ...days.flatMap(day => day.activities.map(item => item.name))
    ]
    const uniqueRecommendations = [
        ...new Map(
            recommendations
                .filter(item => !planned.some(name => looselyEqual(name, item.name)))
                .map(item => [normalizeText(item.name), item])
        ).values()
    ]

    // ? a hard failure that is not a placement conflict (timing, overlap) would leave the agent with nothing to
    //   choose — report it as a conflict with a retry, never as an empty screen
    const unexplained = validation.checks.filter(
        item => item.hard && !item.pass && item.id !== 'required' && item.id !== 'unresolved'
    )
    unexplained.forEach(item =>
        conflicts.push({
            id: `check-${item.id}`,
            kind: 'check',
            names: [],
            text: `${item.label} failed${item.detail ? ` (${item.detail})` : ''}. Building the plan again usually fixes this.`,
            options: [{ id: 'retry', label: 'Build again', patch: { type: 'retry' } }]
        })
    )

    // ? only a plan the agent can save is worth describing
    const describedDays = validation.ok ? await writeDescriptions({ days, requirements, cache, ask }) : days

    return {
        ...base,
        status: validation.ok ? 'ready' : 'conflict',
        questions: questions.sort((left, right) => left.priority - right.priority).slice(0, MAX_QUESTIONS),
        route,
        legs,
        profile,
        days: describedDays,
        conflicts,
        notes,
        warnings: assignment.warnings,
        recommendations: uniqueRecommendations,
        validation
    }
}

export const isTravelDay = day =>
    day.type === DAY_TYPES.ARRIVAL || day.type === DAY_TYPES.TRANSFER || day.type === DAY_TYPES.DEPARTURE
