import { describe, expect, test } from 'vitest'
import { gapLabel, gapRows, inputsLine, missingRates, pricedCount, pricesFromResult } from './ratesPrice'

const result = {
    categories: [
        { priceKey: 'deluxePrice', ok: true, perPerson: 13200, missing: [] },
        { priceKey: 'superDeluxePrice', ok: true, perPerson: 15800, missing: [] },
        {
            priceKey: 'luxuryPrice',
            ok: false,
            perPerson: null,
            missing: ['No Luxury rate for Manali', 'No cab rate for Innova']
        },
        {
            priceKey: 'premiumPrice',
            ok: false,
            perPerson: null,
            missing: ['No Premium rate for Manali', 'No cab rate for Innova']
        }
    ]
}

describe('a quote priced from the rate card', () => {
    test('puts the per-person prices in the boxes, only for the categories that were priced', () => {
        expect(pricesFromResult(result, { basis: 'perPerson', people: 4 })).toEqual({
            deluxePrice: '13200',
            superDeluxePrice: '15800'
        })
    })

    test('a quote priced as a total takes the per-person price times the guests', () => {
        expect(pricesFromResult(result, { basis: 'total', people: 4 })).toEqual({
            deluxePrice: '52800',
            superDeluxePrice: '63200'
        })
        expect(pricesFromResult(result, { basis: 'total', people: 0 })).toEqual({
            deluxePrice: '13200',
            superDeluxePrice: '15800'
        })
    })

    test('nothing priced, nothing to put in', () => {
        expect(
            pricesFromResult({ categories: [{ priceKey: 'deluxePrice', ok: false, perPerson: null, missing: ['x'] }] })
        ).toEqual({})
        expect(pricesFromResult(null)).toEqual({})
        expect(pricedCount(result)).toBe(2)
        expect(pricedCount(null)).toBe(0)
    })

    test('says what the card lacks once, however many categories need it', () => {
        expect(missingRates(result)).toEqual([
            'No Luxury rate for Manali',
            'No cab rate for Innova',
            'No Premium rate for Manali'
        ])
        expect(missingRates({ categories: [] })).toEqual([])
    })

    test('describes the quote, with the margin only for someone who may see it', () => {
        const inputs = { persons: 2, nights: 3, rooms: 1, mealPlan: 'CP', vehicle: 'Sedan', marginPct: 15 }
        expect(inputsLine(inputs, true)).toBe('2 guests · 3 nights · 1 room · CP meals · Sedan cab · 15% margin')
        expect(inputsLine(inputs, false)).toBe('2 guests · 3 nights · 1 room · CP meals · Sedan cab')
        expect(inputsLine({ ...inputs, persons: 1, nights: 1, vehicle: null, marginPct: null }, true)).toBe(
            '1 guest · 1 night · 1 room · CP meals · no cab'
        )
        expect(inputsLine(null, true)).toBe('')
    })
})

describe('the prices typed beside missing rates', () => {
    const gaps = [
        { id: 'route|Sedan|manali|jibhi|', kind: 'route', vehicle: 'Sedan', from: 'Manali', to: 'Jibhi' },
        { id: 'local|Sedan|jibhi||', kind: 'local', vehicle: 'Sedan', place: 'Jibhi' },
        {
            id: 'hotel||jibhi||delux',
            kind: 'hotel',
            place: 'Jibhi',
            category: 'delux',
            categoryLabel: 'Deluxe',
            mealPlan: 'MAP'
        }
    ]

    test('turns each typed price into the row to save, and skips the empty ones', () => {
        const rows = gapRows(gaps, { [gaps[0].id]: '5,000', [gaps[2].id]: '1800' })
        expect(rows.routes).toEqual([
            { vehicle: 'Sedan', fromPlace: 'Manali', toPlace: 'Jibhi', rate: '5000', bothWays: true }
        ])
        expect(rows.days).toEqual([])
        expect(rows.hotels).toEqual([{ place: 'Jibhi', category: 'delux', mapRate: '1800' }])
    })

    test('names each missing rate', () => {
        expect(gaps.map(gapLabel)).toEqual(['Sedan: Manali to Jibhi', 'Sedan: a day in Jibhi', 'Deluxe hotel in Jibhi'])
    })
})
