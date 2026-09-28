import { describe, expect, test } from 'vitest'
import {
    addDestinationText,
    dateRangeLabel,
    emptyPlannerInput,
    fromRequirements,
    missingBasics,
    parseDestinationText,
    toRequirements,
    totalNights
} from './plannerInput'
import { resolveRequirements } from '../tripEngine/requirements'

const names = text => parseDestinationText(text).places

describe('parseDestinationText — destinations the way people write them', () => {
    test.each([
        ['Shimla', [{ name: 'Shimla', nights: null }]],
        [
            'shimla + manali',
            [
                { name: 'Shimla', nights: null },
                { name: 'Manali', nights: null }
            ]
        ],
        [
            'Shimla, Manali and Kasol',
            [
                { name: 'Shimla', nights: null },
                { name: 'Manali', nights: null },
                { name: 'Kasol', nights: null }
            ]
        ],
        [
            '2N Shimla 3N Manali',
            [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ]
        ],
        [
            '2 nights Shimla, 3 nights Manali',
            [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ]
        ],
        [
            'Shimla 2 nights, Manali 3',
            [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ]
        ],
        [
            'Shimla (2) + Manali (3)',
            [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ]
        ],
        ['mount abu', [{ name: 'Mount Abu', nights: null }]]
    ])('%s', (text, expected) => {
        expect(names(text)).toEqual(expected)
    })

    test('arrows and "to" mark a route', () => {
        expect(parseDestinationText('Delhi → Shimla → Manali → Delhi').isRoute).toBe(true)
        expect(parseDestinationText('Delhi to Shimla to Manali').isRoute).toBe(true)
        expect(parseDestinationText('Shimla + Manali').isRoute).toBe(false)
        expect(parseDestinationText('Toronto').isRoute).toBe(false)
    })
})

describe('addDestinationText — the "Going to" box', () => {
    test('a route sets the starting city when none is given, and drops the return to it', () => {
        const input = addDestinationText(emptyPlannerInput(), 'Delhi → Shimla → Manali → Delhi')
        expect(input.origin).toBe('Delhi')
        expect(input.destinations).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 2 }
        ])
    })

    test('with a starting city already set, typing it again does not add it as a stay', () => {
        const input = addDestinationText({ ...emptyPlannerInput(), origin: 'Delhi' }, 'Delhi to Manali')
        expect(input.destinations).toEqual([{ name: 'Manali', nights: 2 }])
    })

    test('a place already in the list updates its nights instead of repeating', () => {
        let input = addDestinationText(emptyPlannerInput(), 'Shimla + Manali')
        input = addDestinationText(input, 'Manali 3 nights')
        expect(input.destinations).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 3 }
        ])
        expect(totalNights(input)).toBe(5)
    })
})

describe('mapping to the engine', () => {
    const input = {
        ...emptyPlannerInput(),
        origin: 'Delhi',
        destinations: [
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 3 }
        ],
        startDate: '2026-10-12',
        who: 'couple',
        pace: 'relaxed',
        transport: 'Private cab',
        interests: ['Nature', 'Snow'],
        excluded: ['Kufri']
    }

    test('only the choices made are passed on, in the engine’s terms', () => {
        const requirements = toRequirements(input)
        expect(requirements).toMatchObject({
            origin: 'Delhi',
            destinations: input.destinations,
            startDate: '2026-10-12',
            travellers: { type: 'couple', adults: 2 },
            transport: { mode: 'Private cab' },
            pace: 'relaxed',
            interests: ['nature', 'snow'],
            excludedAttractions: ['Kufri']
        })
    })

    test('"decide later" leaves transport to the engine, which assumes a private cab and says so', () => {
        const resolved = resolveRequirements(toRequirements({ ...input, transport: '' }))
        expect(resolved.requirements.transport.mode).toBe('Private cab')
        expect(resolved.assumptions.map(item => item.id)).toContain('transport')
    })

    test('travelling with parents reaches the engine as a traveller note', () => {
        const resolved = resolveRequirements(toRequirements({ ...input, pace: '', withParents: true }))
        expect(resolved.requirements.pace).toBe('relaxed')
    })

    test('what the engine understood comes back as the planner’s fields', () => {
        const back = fromRequirements(
            resolveRequirements({
                origin: 'Chandigarh',
                destinations: [{ name: 'Manali', nights: 4 }],
                travellers: { type: 'family', notes: ['travelling with parents'] },
                transport: { mode: 'Own car' },
                requiredAttractions: ['Atal Tunnel', 'Sissu'],
                interests: ['snow', 'cafes']
            }).requirements
        )
        expect(back).toMatchObject({
            origin: 'Chandigarh',
            destinations: [{ name: 'Manali', nights: 4 }],
            who: 'family',
            withParents: true,
            transport: 'Own car',
            interests: ['Snow'],
            mustSee: 'Atal Tunnel, Sissu'
        })
    })

    test('the basics that are missing are said in plain words', () => {
        expect(missingBasics(emptyPlannerInput())).toMatch(/where the trip starts/)
        expect(missingBasics({ ...emptyPlannerInput(), origin: 'Delhi' })).toMatch(/at least one place/)
        expect(missingBasics(input)).toBe('')
        expect(dateRangeLabel(input)).toBe('12 Oct – 17 Oct')
    })
})

describe('day headlines', () => {
    test('an excursion is named in the agent’s words, in road order', async () => {
        const { dayHeadline } = await import('./dayText')
        const day = {
            type: 'EXCURSION',
            location: 'Manali',
            activities: [
                { name: 'Atal Tunnel Entrance', required: true },
                { name: 'Sissu Village', required: true },
                { name: 'Rohtang Pass (Point 1)', required: true },
                { name: 'Solang Valley', required: false }
            ],
            clusters: [{ covers: ['Rohtang', 'Atal Tunnel', 'Sissu'] }]
        }
        expect(dayHeadline(day)).toBe('Atal Tunnel → Sissu → Rohtang')
        expect(dayHeadline({ ...day, clusters: [{ covers: [] }] })).toBe(
            'Atal Tunnel Entrance → Sissu Village → Rohtang Pass'
        )
    })
})
