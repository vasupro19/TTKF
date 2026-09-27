import { describe, expect, test } from 'vitest'
import {
    applyPlanToRows,
    buildPlannerRequest,
    buildWriterBatches,
    buildWriterRequest,
    matchInclusions,
    normalizePlan,
    parseWriterDescriptions,
    withDurationSuffix
} from './packageAiPlanner'

// ? the shape buildActivitiesFromDestinations produces for "2N Shimla 3N Manali from Chandigarh"
const skeletonRows = () => [
    { id: 'a', entryType: 'TransitStay', destinationName: 'Shimla', title: 'Transfer from Chandigarh to Shimla' },
    { id: 'b', entryType: 'Stay', destinationName: 'Shimla', title: 'Shimla Scenic Spots & Market Walk' },
    { id: 'c', entryType: 'TransitStay', destinationName: 'Manali', title: 'Transfer from Shimla to Manali' },
    { id: 'd', entryType: 'Stay', destinationName: 'Manali', title: 'Manali Scenic Spots & Market Walk' },
    { id: 'e', entryType: 'Stay', destinationName: 'Manali', title: 'Manali Culture Trail & Sunset Time' },
    { id: 'f', entryType: 'Transit', destinationName: '', title: 'Drop from Manali to Chandigarh' }
]

const planDay = (destination, type, title, highlights = []) => ({ destination, type, title, highlights })

// ? applyPlanToRows takes normalised days, exactly as the wizard passes them
const planDays = (...days) => normalizePlan({ days }).days

describe('normalizePlan', () => {
    test('survives non-object model output', () => {
        expect(normalizePlan(null).destinations).toEqual([])
        expect(normalizePlan('oops').days).toEqual([])
        expect(normalizePlan([1, 2]).mustInclude).toEqual([])
    })

    test('clamps nights, drops nameless and duplicate destinations', () => {
        const plan = normalizePlan({
            destinations: [
                { name: ' Shimla ', nights: '2' },
                { name: '', nights: 3 },
                { name: 'Manali', nights: 0 },
                { name: 'shimla', nights: 4 },
                { name: 'Leh', nights: 99 }
            ]
        })

        expect(plan.destinations).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 1 },
            { name: 'Leh', nights: 30 }
        ])
    })

    test('defaults unknown day types to Stay and filters logistics highlights', () => {
        const plan = normalizePlan({
            days: [planDay('Goa', 'Beach', 'Goa Day', ['Hotel Check-in', 'Calangute Beach', 'Overnight Volvo Journey'])]
        })

        expect(plan.days[0].entryType).toBe('Stay')
        expect(plan.days[0].highlights).toEqual(['Calangute Beach'])
    })

    test('the destinations themselves are not requested stops', () => {
        const plan = normalizePlan({
            destinations: [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ],
            mustInclude: ['Shimla', 'manali', 'Chandratal Lake', 'Rohtang Pass']
        })
        expect(plan.mustInclude).toEqual(['Chandratal Lake', 'Rohtang Pass'])
    })

    test('drops scenery filler from highlights', () => {
        const plan = normalizePlan({
            days: [
                planDay('Manali', 'Stay', 'x', [
                    'Scenic drive from Delhi',
                    'High altitude mountain views',
                    'Kunzum Pass'
                ])
            ]
        })
        expect(plan.days[0].highlights).toEqual(['Kunzum Pass'])
    })

    test('accepts mustInclude as strings or objects, deduplicated', () => {
        const plan = normalizePlan({ mustInclude: ['Sissu', { name: 'Rohtang Pass' }, 'sissu', 42, null] })
        expect(plan.mustInclude).toEqual(['Sissu', 'Rohtang Pass'])
    })

    test('recomputes the package name duration', () => {
        const plan = normalizePlan({
            packageName: 'Himachal Escape 5D/6N',
            destinations: [
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ]
        })
        expect(plan.packageName).toBe('Himachal Escape 6D/5N')
    })
})

describe('buildPlannerRequest', () => {
    const payload = input => JSON.parse(buildPlannerRequest(input).messages[0].content)

    test('sends the brief as typed, and fixed destinations only when given', () => {
        expect(payload({ brief: '2n shimla 3n manali with chandratal' })).toEqual({
            brief: '2n shimla 3n manali with chandratal',
            knownOriginLocation: '',
            knownTransportMode: ''
        })
        expect(payload({ brief: 'x', destinations: [] }).fixedDestinations).toBeUndefined()
        expect(payload({ brief: 'x', destinations: [{ name: 'Manali', nights: 4 }] }).fixedDestinations).toEqual([
            { name: 'Manali', nights: 4 }
        ])
    })
})

describe('withDurationSuffix', () => {
    test('adds, replaces and leaves empty names alone', () => {
        const destinations = [{ name: 'Goa', nights: 3 }]
        expect(withDurationSuffix('Goa Getaway', destinations)).toBe('Goa Getaway 4D/3N')
        expect(withDurationSuffix('Goa Getaway - 2D / 1N', destinations)).toBe('Goa Getaway 4D/3N')
        expect(withDurationSuffix('', destinations)).toBe('')
    })
})

describe('applyPlanToRows', () => {
    test('maps plan days onto rows per destination, in order', () => {
        const rows = applyPlanToRows(
            skeletonRows(),
            planDays(
                planDay('Shimla', 'TransitStay', 'Chandigarh to Shimla & Mall Road', ['Mall Road']),
                planDay('Shimla', 'Stay', 'Kufri & Jakhoo Temple', ['Kufri', 'Jakhoo Temple']),
                planDay('Manali', 'TransitStay', 'Shimla to Manali via Kullu', ['Kullu']),
                planDay('Manali', 'Stay', 'Rohtang Pass & Sissu', ['Rohtang Pass', 'Sissu']),
                planDay('Manali', 'Stay', 'Solang Valley & Hadimba Temple', ['Solang Valley']),
                planDay('', 'Transit', 'Manali to Chandigarh Return', [])
            )
        )

        expect(rows.map(row => row.title)).toEqual([
            'Chandigarh to Shimla & Mall Road',
            'Kufri & Jakhoo Temple',
            'Shimla to Manali via Kullu',
            'Rohtang Pass & Sissu',
            'Solang Valley & Hadimba Temple',
            'Manali to Chandigarh Return'
        ])
        expect(rows[3].highlights).toEqual(['Rohtang Pass', 'Sissu'])
    })

    test('keeps the row structure when the model returns too many or too few days', () => {
        const rows = applyPlanToRows(
            skeletonRows(),
            planDays(
                planDay('Manali', 'Stay', 'Extra 1'),
                planDay('Manali', 'Stay', 'Extra 2'),
                planDay('Manali', 'Stay', 'Extra 3'),
                planDay('Manali', 'Stay', 'Extra 4')
            )
        )

        expect(rows).toHaveLength(6)
        expect(rows.map(row => row.entryType)).toEqual(skeletonRows().map(row => row.entryType))
        expect(rows[0].title).toBe('Transfer from Chandigarh to Shimla')
        expect(rows.slice(2, 5).map(row => row.title)).toEqual(['Extra 1', 'Extra 2', 'Extra 3'])
        expect(rows[5].title).toBe('Drop from Manali to Chandigarh')
    })

    test('the drop day takes a Transit day even if the model named the origin as its destination', () => {
        const rows = applyPlanToRows(skeletonRows(), planDays(planDay('Chandigarh', 'Transit', 'Return to Chandigarh')))
        expect(rows[5].title).toBe('Return to Chandigarh')
    })

    test('a Transit plan day never lands on a stay row', () => {
        const rows = applyPlanToRows(skeletonRows(), planDays(planDay('Manali', 'Transit', 'Wrong')))
        expect(rows.slice(0, 5).some(row => row.title === 'Wrong')).toBe(false)
    })
})

describe('matchInclusions', () => {
    const rows = [
        { title: 'Kufri & Jakhoo Temple', highlights: ['Kufri'] },
        { title: 'Snow Day', highlights: ['Rohtang Pass', 'Sissu Waterfall'] }
    ]

    test('matches loosely in both directions', () => {
        expect(matchInclusions(rows, ['Rohtang', 'Sissu', 'jakhoo temple'])).toEqual([
            { name: 'Rohtang', dayNumber: 2 },
            { name: 'Sissu', dayNumber: 2 },
            { name: 'jakhoo temple', dayNumber: 1 }
        ])
    })

    test('reports stops that were not placed', () => {
        expect(matchInclusions(rows, ['Kasol'])).toEqual([{ name: 'Kasol', dayNumber: null }])
    })
})

describe('writer', () => {
    const rows = skeletonRows().map(row => ({ ...row, highlights: [] }))

    test('batches in threes', () => {
        expect(buildWriterBatches(rows).map(batch => batch.map(row => row.id))).toEqual([
            ['a', 'b', 'c'],
            ['d', 'e', 'f']
        ])
    })

    test('request carries the route of transfer days and the whole outline', () => {
        const [, second] = buildWriterBatches(rows)
        const request = buildWriterRequest({ batch: buildWriterBatches(rows)[0], rows, originLocation: 'Chandigarh' })
        const payload = JSON.parse(request.messages[0].content)

        expect(payload.tripOutline).toHaveLength(6)
        expect(payload.days[0]).toMatchObject({ day: 1, from: 'Chandigarh', to: 'Shimla' })
        expect(payload.days[2]).toMatchObject({ day: 3, from: 'Shimla', to: 'Manali' })

        const drop = JSON.parse(
            buildWriterRequest({ batch: second, rows, originLocation: 'Chandigarh' }).messages[0].content
        ).days[2]
        expect(drop).toMatchObject({ day: 6, from: 'Manali', to: 'Chandigarh' })
    })

    test('descriptions map back by day number, ignoring days outside the batch', () => {
        const [first] = buildWriterBatches(rows)
        const parsed = parseWriterDescriptions(
            {
                days: [
                    { day: 1, description: ' One ' },
                    { day: 2, description: '' },
                    { day: 5, description: 'Not in this batch' },
                    { day: 'x', description: 'Junk' }
                ]
            },
            first,
            rows
        )

        expect(parsed).toEqual({ a: 'One' })
        expect(parseWriterDescriptions(null, first, rows)).toEqual({})
    })
})
