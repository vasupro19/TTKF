import { describe, expect, test } from 'vitest'
import { applyPatch, mergeRequirements, normalizeRequirements, resolveRequirements } from './requirements'
import { buildDaySkeleton, buildRoute, DAY_TYPES } from './route'
import { dayBudget, profileFor } from './timeBudget'
import { assignClusters, scheduleDay } from './schedule'
import { planTrip, understand } from './pipeline'
import { formatWindow, renderDayDescription } from './render'

const hm = clock => {
    const [hours, minutes] = clock.split(':').map(Number)
    return hours * 60 + minutes
}

const BASE = {
    origin: 'Delhi',
    destinations: [
        { name: 'Shimla', nights: 2 },
        { name: 'Manali', nights: 3 }
    ],
    transport: { mode: 'Private cab' },
    travellers: { adults: 2, type: 'couple' },
    pace: 'balanced',
    requiredAttractions: ['Rohtang', 'Atal Tunnel', 'Sissu']
}

const LEGS = {
    'Delhi>Shimla': { durationHours: [7, 8], distanceKm: [340, 360], terrain: 'mixed', via: ['Chandigarh'] },
    'Shimla>Manali': { durationHours: [7, 8], distanceKm: [240, 260], terrain: 'mountain', via: ['Mandi'] },
    'Manali>Delhi': { durationHours: [11, 13], distanceKm: [520, 550], terrain: 'mixed', suggestedDeparture: '06:00' },
    'Chandigarh>Shimla': { durationHours: [3, 4], distanceKm: [110, 120], terrain: 'mountain' },
    'Manali>Chandigarh': { durationHours: [8, 9], distanceKm: [300, 310], terrain: 'mixed' }
}

const LAHAUL = {
    id: 'lahaul',
    name: 'Atal Tunnel, Sissu & Rohtang loop',
    baseStay: 'Manali',
    places: [
        { name: 'Atal Tunnel', minutes: 30, travelFromPreviousMinutes: 60 },
        { name: 'Sissu', minutes: 120, travelFromPreviousMinutes: 30 },
        { name: 'Rohtang Pass', minutes: 90, travelFromPreviousMinutes: 90 }
    ],
    returnMinutes: 90,
    fullDay: true,
    covers: ['Rohtang', 'Atal Tunnel', 'Sissu'],
    access: [{ place: 'Rohtang Pass', kind: 'permit', note: 'Usually needs an online permit; check before travel.' }]
}

// ? a scripted model: answers each of the engine's calls and records what it was asked
const fakeModel = ({ clusters = [LAHAUL], unplaceable = [], write = null } = {}) => {
    const calls = []
    const ask = async request => {
        const payload = JSON.parse(request.messages[0].content)
        if (request.system.includes('day-by-day descriptions')) {
            calls.push({ kind: 'write', days: payload.days.map(day => day.day) })
            if (!write) throw new Error('model unavailable')
            return { days: payload.days.map(day => ({ day: day.day, description: write(day) })) }
        }
        if (request.system.includes('route and destination-logistics')) {
            calls.push({ kind: 'logistics', legs: payload.legs.map(leg => `${leg.from}>${leg.to}`) })
            return {
                legs: payload.legs.map(leg => ({ id: leg.id, ...LEGS[`${leg.from}>${leg.to}`] })),
                clusters: clusters.filter(cluster => payload.stays.some(stay => stay.name === cluster.baseStay)),
                unplaceable
            }
        }
        if (request.system.includes('senior destination expert')) {
            calls.push({ kind: 'fill', days: payload.days.map(day => day.day) })
            return {
                days: payload.days.map(day => ({
                    day: day.day,
                    title: `Day ${day.day} plan`,
                    activities: [1, 2, 3, 4, 5, 6].map(n => ({
                        name: `${day.location} spot ${n} (day ${day.day})`,
                        minutes: 60,
                        travelFromPreviousMinutes: 20
                    }))
                })),
                recommendations: [{ kind: 'destination', name: 'Kasol', reason: 'nearby', impact: 'needs a night' }]
            }
        }
        throw new Error(`unexpected request: ${request.system.slice(0, 40)}`)
    }
    return { ask, calls }
}

describe('requirements', () => {
    test('the form wins over the typed notes; lists are merged', () => {
        const merged = mergeRequirements(
            { origin: 'Chandigarh', pace: 'relaxed', requiredAttractions: ['Sissu'], interests: ['cafes'] },
            { origin: 'Delhi', requiredAttractions: ['Rohtang'] }
        )
        expect(merged.origin).toBe('Delhi')
        expect(merged.pace).toBe('relaxed')
        expect(merged.requiredAttractions.map(item => item.name)).toEqual(['Rohtang', 'Sissu'])
        expect(merged.interests).toEqual(['cafes'])
    })

    test('a destination is never also a required attraction', () => {
        const requirements = normalizeRequirements({
            destinations: [{ name: 'Manali', nights: 3 }],
            requiredAttractions: ['Manali', 'Sissu']
        })
        expect(requirements.requiredAttractions.map(item => item.name)).toEqual(['Sissu'])
    })

    test('gaps become labelled assumptions; only a missing route blocks', () => {
        const resolved = resolveRequirements({ destinations: [{ name: 'Manali', nights: 4 }] })
        expect(resolved.blocked).toBe(false)
        expect(resolved.requirements.transport.mode).toBe('Private cab')
        expect(resolved.assumptions.map(item => item.id)).toEqual(
            expect.arrayContaining(['transport', 'pace', 'origin'])
        )
        expect(resolved.questions[0].id).toBe('origin')

        expect(resolveRequirements({ origin: 'Delhi' }).blocked).toBe(true)
    })

    test('travelling with parents means a relaxed pace by default', () => {
        const resolved = resolveRequirements({
            destinations: [{ name: 'Shimla', nights: 2 }],
            travellers: { type: 'family', notes: ['travelling with parents'] }
        })
        expect(resolved.requirements.pace).toBe('relaxed')
    })

    test('a region-only request uses the suggested route, as an assumption', () => {
        const resolved = resolveRequirements({
            region: 'Himachal',
            suggestedDestinations: [{ name: 'Shimla', nights: 2 }]
        })
        expect(resolved.requirements.destinations).toEqual([{ name: 'Shimla', nights: 2 }])
        expect(resolved.assumptions.find(item => item.id === 'route').text).toMatch(/AI chose Shimla/)
    })

    test('patches change one thing and keep the rest', () => {
        const withNight = applyPatch(BASE, { type: 'add-night', destination: 'manali' })
        expect(withNight.destinations.map(item => item.nights)).toEqual([2, 4])
        expect(withNight.origin).toBe('Delhi')

        const withoutRohtang = applyPatch(BASE, { type: 'remove-required', names: ['Rohtang Pass'] })
        expect(withoutRohtang.requiredAttractions.map(item => item.name)).toEqual(['Atal Tunnel', 'Sissu'])

        const withKasol = applyPatch(BASE, { type: 'add-destination', name: 'Kasol', nights: 1, after: 'Shimla' })
        expect(withKasol.destinations.map(item => item.name)).toEqual(['Shimla', 'Kasol', 'Manali'])
    })
})

describe('understand', () => {
    const reply = body => async () => body

    test('a place the guest named is a destination even when the model files it as a suggestion', async () => {
        const requirements = await understand({
            text: 'Delhi to Manali 5 nights, want snow',
            form: {},
            ask: reply({ origin: 'Delhi', suggestedDestinations: [{ name: 'Manali', nights: 5, reason: '' }] })
        })
        expect(requirements.destinations).toEqual([{ name: 'Manali', nights: 5 }])
        expect(requirements.suggestedDestinations).toEqual([])
    })

    test('a real suggestion for a region-only request stays a suggestion', async () => {
        const requirements = await understand({
            text: '6 days from Delhi, Himachal, scenic places',
            form: {},
            ask: reply({ origin: 'Delhi', region: 'Himachal', suggestedDestinations: [{ name: 'Shimla', nights: 2 }] })
        })
        expect(requirements.destinations).toEqual([])
        expect(requirements.suggestedDestinations.map(item => item.name)).toEqual(['Shimla'])
    })
})

describe('route and day skeleton', () => {
    const { requirements } = resolveRequirements(BASE)

    test('origin → stays → back to origin, one leg per arrow', () => {
        const route = buildRoute(requirements)
        expect(route.stops.map(stop => stop.name)).toEqual(['Delhi', 'Shimla', 'Manali', 'Delhi'])
        expect(route.legs.map(leg => `${leg.from}>${leg.to}`)).toEqual([
            'Delhi>Shimla',
            'Shimla>Manali',
            'Manali>Delhi'
        ])
    })

    test('5 nights are 6 days, each with a type', () => {
        const days = buildDaySkeleton(buildRoute(requirements), requirements)
        expect(days.map(day => day.type)).toEqual([
            DAY_TYPES.ARRIVAL,
            DAY_TYPES.FULL_DAY,
            DAY_TYPES.TRANSFER,
            DAY_TYPES.FULL_DAY,
            DAY_TYPES.FULL_DAY,
            DAY_TYPES.DEPARTURE
        ])
        expect(days.filter(day => day.legId).map(day => day.dayNumber)).toEqual([1, 3, 6])
    })

    test('without an origin the first day is an arrival with no leg, and the last is an onward departure', () => {
        const resolved = resolveRequirements({ destinations: [{ name: 'Manali', nights: 4 }] }).requirements
        const route = buildRoute(resolved)
        const days = buildDaySkeleton(route, resolved)
        expect(route.legs).toEqual([])
        expect(days).toHaveLength(5)
        expect(days[0]).toMatchObject({ type: DAY_TYPES.ARRIVAL, legId: null })
        expect(days[4]).toMatchObject({ type: DAY_TYPES.DEPARTURE, legId: null })
    })

    test('dates follow the start date', () => {
        const dated = resolveRequirements({ ...BASE, startDate: '2026-10-30' }).requirements
        expect(buildDaySkeleton(buildRoute(dated), dated).map(day => day.date)).toEqual([
            '2026-10-30',
            '2026-10-31',
            '2026-11-01',
            '2026-11-02',
            '2026-11-03',
            '2026-11-04'
        ])
    })
})

describe('time budget', () => {
    const { requirements } = resolveRequirements(BASE)
    const profile = profileFor(requirements)
    const leg = (key, id = 'leg') => ({ id, from: key.split('>')[0], to: key.split('>')[1], estimate: LEGS[key] })

    test('a long arrival drive leaves only an evening, never a full sightseeing day', () => {
        const budget = dayBudget({ type: DAY_TYPES.ARRIVAL }, leg('Delhi>Shimla'), profile, requirements)
        expect(budget.departAt).toBe(hm('06:30'))
        expect(budget.arrive.latest).toBeGreaterThan(hm('14:30'))
        expect(budget.usableMinutes).toBeLessThan(5 * 60)
        expect(budget.lunch).toBe(false)
    })

    test('a long transfer checks out early; the travel includes a terrain buffer and stops', () => {
        const budget = dayBudget({ type: DAY_TYPES.TRANSFER }, leg('Shimla>Manali'), profile, requirements)
        expect(budget.checkOutAt).toBe(hm('07:00'))
        expect(budget.travel.bufferMinutes).toBeGreaterThan(0)
        expect(budget.travel.maxMinutes).toBeGreaterThan(8 * 60)
    })

    test('a long drive home leaves early; a short one leaves a morning free', () => {
        const long = dayBudget({ type: DAY_TYPES.DEPARTURE }, leg('Manali>Delhi'), profile, requirements)
        expect(long.departAt).toBe(hm('06:00'))
        expect(long.usableMinutes).toBe(0)

        const short = dayBudget({ type: DAY_TYPES.DEPARTURE }, leg('Chandigarh>Shimla'), profile, requirements)
        expect(short.usableMinutes).toBeGreaterThan(60)
    })

    test('a relaxed pace has less usable time than a packed one', () => {
        const relaxed = dayBudget(
            { type: DAY_TYPES.FULL_DAY },
            null,
            profileFor({ ...requirements, pace: 'relaxed' }),
            requirements
        )
        const packed = dayBudget(
            { type: DAY_TYPES.FULL_DAY },
            null,
            profileFor({ ...requirements, pace: 'packed' }),
            requirements
        )
        expect(relaxed.usableMinutes).toBeLessThan(packed.usableMinutes)
    })
})

describe('scheduling', () => {
    const { requirements } = resolveRequirements(BASE)
    const profile = profileFor(requirements)
    const route = buildRoute(requirements)
    const days = buildDaySkeleton(route, requirements)
    const budgets = days.map(day => dayBudget(day, null, profile, requirements))

    test('a full-day excursion gets the first free full day at its base', () => {
        const { byDay, conflicts } = assignClusters(days, budgets, [LAHAUL])
        expect(conflicts).toEqual([])
        expect(Object.keys(byDay)).toEqual(['3'])
    })

    test('two full-day excursions with one full day free is a conflict, not a silent drop', () => {
        const oneNightManali = resolveRequirements({
            ...BASE,
            destinations: [{ name: 'Manali', nights: 2 }]
        }).requirements
        const skeleton = buildDaySkeleton(buildRoute(oneNightManali), oneNightManali)
        const second = { ...LAHAUL, id: 'second', name: 'Chandratal Lake', covers: ['Chandratal'] }
        const result = assignClusters(
            skeleton,
            skeleton.map(day => dayBudget(day, null, profile, oneNightManali)),
            [LAHAUL, second]
        )
        expect(result.conflicts.map(conflict => conflict.kind)).toEqual(['no-day'])
    })

    test('required places come first, lunch where the guest is, and recommendations only while time remains', () => {
        const day = days[3]
        const plan = scheduleDay({
            day,
            budget: budgets[3],
            leg: null,
            clusters: [LAHAUL],
            recommended: [1, 2, 3, 4].map(n => ({ name: `Extra ${n}`, minutes: 90, travelFromPreviousMinutes: 30 })),
            profile,
            title: ''
        })
        expect(plan.type).toBe(DAY_TYPES.EXCURSION)
        expect(plan.activities.slice(0, 3).map(item => item.name)).toEqual(['Atal Tunnel', 'Sissu', 'Rohtang Pass'])
        expect(
            plan.activities.every((item, index) => index === 0 || item.start >= plan.activities[index - 1].end)
        ).toBe(true)
        expect(plan.timeline.find(item => item.kind === 'meal').label).toBe('Lunch near Sissu')
        expect(plan.timeline.find(item => item.kind === 'depart').label).toBe('Early start from Manali')
        expect(plan.dropped.length).toBeGreaterThan(0)
    })
})

describe('pipeline', () => {
    test('builds the Delhi → Shimla → Manali → Delhi trip with the required places on one excursion day', async () => {
        const model = fakeModel()
        const trip = await planTrip({ requirements: BASE, ask: model.ask })

        expect(trip.status).toBe('ready')
        expect(trip.route.stops.map(stop => stop.name)).toEqual(['Delhi', 'Shimla', 'Manali', 'Delhi'])
        expect(trip.days.map(day => day.type)).toEqual([
            'ARRIVAL',
            'FULL_DAY',
            'TRANSFER',
            'EXCURSION',
            'FULL_DAY',
            'DEPARTURE'
        ])
        expect(trip.days[3].activities.filter(item => item.required).map(item => item.name)).toEqual([
            'Atal Tunnel',
            'Sissu',
            'Rohtang Pass'
        ])
        // travel days stay light; the AI's destination idea is a suggestion, not part of the route
        expect(trip.days[0].activities.length).toBeLessThanOrEqual(2)
        expect(trip.days[5].activities).toEqual([])
        expect(trip.recommendations.map(item => item.name)).toEqual(['Kasol'])
        expect(trip.questions.map(item => item.id)).toEqual(['dates'])
        expect(trip.validation.checks.filter(item => !item.pass)).toEqual([])
        expect(model.calls.map(call => call.kind)).toEqual(['logistics', 'fill', 'write'])
    })

    test('changing the origin re-estimates only the two legs that changed', async () => {
        const model = fakeModel()
        const first = await planTrip({ requirements: BASE, ask: model.ask })
        model.calls.length = 0

        const second = await planTrip({
            requirements: applyPatch(BASE, { type: 'set', field: 'origin', value: 'Chandigarh' }),
            previous: first,
            ask: model.ask
        })

        expect(second.route.stops.map(stop => stop.name)).toEqual(['Chandigarh', 'Shimla', 'Manali', 'Chandigarh'])
        expect(model.calls[0]).toEqual({ kind: 'logistics', legs: ['Chandigarh>Shimla', 'Manali>Chandigarh'] })
        // only the first and last day depend on those legs
        expect(model.calls[1]).toEqual({ kind: 'fill', days: [1, 6] })
        expect(second.days[1].activities).toEqual(first.days[1].activities)
    })

    test('"make it more relaxed" re-times the days without asking the model again', async () => {
        const model = fakeModel({
            write: day =>
                `${day.journey ? `On to ${day.journey.to}. ` : ''}${day.places.map(place => `Visit ${place.name}.`).join(' ')} ${'An easy day. '.repeat(20)}`
        })
        const first = await planTrip({ requirements: BASE, ask: model.ask })
        model.calls.length = 0

        const relaxed = await planTrip({
            requirements: applyPatch(BASE, { type: 'set', field: 'pace', value: 'relaxed' }),
            previous: first,
            ask: model.ask
        })

        // ? only days that lost a place are described again
        expect(model.calls.filter(call => call.kind !== 'write')).toEqual([])
        const count = trip =>
            trip.days.reduce((sum, day) => sum + day.activities.filter(item => item.recommended).length, 0)
        expect(count(relaxed)).toBeLessThan(count(first))
    })

    test('adding a night in Manali asks only for the new day', async () => {
        const model = fakeModel()
        const first = await planTrip({ requirements: BASE, ask: model.ask })
        model.calls.length = 0

        const longer = await planTrip({
            requirements: applyPatch(BASE, { type: 'add-night', destination: 'Manali' }),
            previous: first,
            ask: model.ask
        })

        expect(longer.days).toHaveLength(7)
        // same stays, same required places, same legs: nothing to re-estimate
        expect(model.calls.filter(call => call.kind === 'logistics')).toEqual([])
        expect(model.calls.find(call => call.kind === 'fill').days).toEqual([6])
    })

    test('a required place the route cannot reach is a conflict with options, and the plan is not ready', async () => {
        const model = fakeModel({ unplaceable: [{ name: 'Spiti Valley', reason: 'too far from these stays' }] })
        const trip = await planTrip({
            requirements: { ...BASE, requiredAttractions: ['Sissu', 'Spiti Valley'] },
            ask: model.ask
        })

        expect(trip.status).toBe('conflict')
        expect(trip.conflicts[0].names).toEqual(['Spiti Valley'])
        expect(trip.conflicts[0].options.map(option => option.patch.type)).toEqual(['remove-required'])
    })

    test('without the model, each day is still one paragraph: the journey, every place, checks and the stay', async () => {
        const trip = await planTrip({ requirements: BASE, ask: fakeModel().ask })
        const texts = trip.days.map(renderDayDescription)

        texts.forEach(text => {
            expect(text).not.toMatch(/\n/)
            expect(text).not.toMatch(/\d{1,2}:\d{2}|\b\d{1,2}\s*(AM|PM)\b|approx\./)
        })
        expect(texts[0]).toMatch(
            /^Set off from Delhi for the drive to Shimla via Chandigarh — roughly 340–360 km and 7–8 hours by private cab\./
        )
        expect(texts[0]).toMatch(/On arrival in Shimla, check in at the hotel/)
        expect(texts[0]).toMatch(/Overnight in Shimla\.$/)

        const excursion = texts[trip.days.findIndex(day => day.type === 'EXCURSION')]
        expect(excursion).toMatch(/full-day excursion to Atal Tunnel, Sissu and Rohtang Pass/)
        expect(excursion).toMatch(/Good to know about Rohtang Pass: usually needs an online permit/)
        expect(excursion).toMatch(/Overnight in Manali\.$/)
        expect(texts[texts.length - 1]).toMatch(/The tour ends on arrival in Delhi/)
        expect(formatWindow(hm('23:30'), hm('25:00'))).toMatch(/next day/)
    })

    test("the model's paragraph is used when it names every place and gives no clock times", async () => {
        const write = day =>
            `A lovely day around ${day.location}${day.journey ? `, travelling on to ${day.journey.to}` : ''}. ${day.places
                .map(place => `Spend time at ${place.name}, taking in the views and the atmosphere of the place.`)
                .join(
                    ' '
                )} The evening is yours to relax and enjoy the mountain air before a comfortable night.`.padEnd(
                220,
                ' Relax.'
            )
        const trip = await planTrip({ requirements: BASE, ask: fakeModel({ write }).ask })
        const excursion = trip.days.find(day => day.type === 'EXCURSION')
        expect(renderDayDescription(excursion)).toMatch(/^A lovely day around Manali\. Spend time at Atal Tunnel/)
    })

    test('a paragraph with time slots or a missing place is not used — that day is built from the plan', async () => {
        const write = day =>
            day.places.length
                ? `9:00 AM: ${day.places.map(place => place.name).join(', ')}. ${'A wonderful day in the hills. '.repeat(8)}`
                : `${'A calm and easy day at your own pace, with plenty of time to rest. '.repeat(4)}`
        const trip = await planTrip({ requirements: BASE, ask: fakeModel({ write }).ask })
        const excursion = trip.days.find(day => day.type === 'EXCURSION')
        expect(excursion.description).toBe('')
        expect(renderDayDescription(excursion)).toMatch(/full-day excursion to Atal Tunnel, Sissu and Rohtang Pass/)
        // ? day 1 drives to Shimla, and this text never says "Shimla"
        expect(trip.days[0].description).toBe('')
    })

    test('a re-plan that changes nothing does not ask for the paragraphs again', async () => {
        const write = day =>
            `${day.journey ? `Travel on to ${day.journey.to}. ` : ''}${day.places.map(place => `Visit ${place.name}.`).join(' ')} ${'Enjoy the day at an easy pace. '.repeat(8)}`
        const model = fakeModel({ write })
        const first = await planTrip({ requirements: BASE, ask: model.ask })
        const writes = model.calls.filter(call => call.kind === 'write').length
        expect(writes).toBe(1)
        await planTrip({ requirements: BASE, previous: first, ask: model.ask })
        expect(model.calls.filter(call => call.kind === 'write').length).toBe(writes)
    })
})
