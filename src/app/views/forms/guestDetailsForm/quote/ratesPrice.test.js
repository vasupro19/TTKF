import { describe, expect, test } from 'vitest'
import { inputsLine, missingRates, pricedCount, pricesFromResult } from './ratesPrice'

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
