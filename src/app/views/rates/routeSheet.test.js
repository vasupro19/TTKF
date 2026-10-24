import { describe, expect, test } from 'vitest'
import {
    blankSheetRow,
    copySheetRow,
    sheetChanges,
    sheetDuplicates,
    sheetFromRoutes,
    sheetProblem,
    withPrice
} from './routeSheet'

const route = (id, vehicle, fromPlace, toPlace, rate, extra = {}) => ({
    id,
    vehicle,
    fromPlace,
    toPlace,
    rate,
    bothWays: true,
    season: '',
    validFrom: '',
    validTo: '',
    repeatsYearly: false,
    ...extra
})

const saved = [
    route(1, 'Sedan', 'Chandigarh', 'Manali', 4500),
    route(2, 'Innova', 'Chandigarh', 'Manali', 6500),
    route(3, 'Sedan', 'Manali', 'Jibhi', 5000),
    route(4, 'Sedan', 'Chandigarh', 'Manali', 5500, {
        season: 'New Year',
        validFrom: '2026-12-20',
        validTo: '2027-01-05',
        repeatsYearly: true
    })
]

describe('the route sheet', () => {
    const sheet = sheetFromRoutes(saved)

    test('puts the cabs of one drive on one row, and a season on its own row', () => {
        expect(sheet.cabs).toEqual(['Sedan', 'Innova'])
        expect(sheet.rows.map(row => `${row.fromPlace}>${row.toPlace}${row.season ? ` ${row.season}` : ''}`)).toEqual([
            'Chandigarh>Manali',
            'Manali>Jibhi',
            'Chandigarh>Manali New Year'
        ])
        expect(sheet.rows[0].prices.sedan).toEqual({ id: 1, value: '4500' })
        expect(sheet.rows[0].prices.innova).toEqual({ id: 2, value: '6500' })
    })

    test('saves nothing when nothing changed', () => {
        expect(sheetChanges(sheet.rows, sheet.rows, sheet.cabs)).toEqual({ rows: [], removeIds: [] })
    })

    test('changes only the price that was edited, adds a new cab’s price, and removes a cleared one', () => {
        const rows = sheet.rows.map(row => ({ ...row }))
        rows[0] = withPrice(withPrice(rows[0], 'Sedan', '4800'), 'Innova', '')
        rows[1] = withPrice(rows[1], 'Innova', '7000')
        const { rows: out, removeIds } = sheetChanges(rows, sheet.rows, sheet.cabs)
        expect(removeIds).toEqual([2])
        expect(out).toEqual([
            expect.objectContaining({
                id: 1,
                vehicle: 'Sedan',
                fromPlace: 'Chandigarh',
                toPlace: 'Manali',
                rate: '4800'
            }),
            {
                vehicle: 'Innova',
                fromPlace: 'Manali',
                toPlace: 'Jibhi',
                rate: '7000',
                bothWays: true,
                season: '',
                validFrom: '',
                validTo: '',
                repeatsYearly: false
            }
        ])
    })

    test('removes every saved price of a row taken out', () => {
        const { rows: out, removeIds } = sheetChanges(sheet.rows.slice(1), sheet.rows, sheet.cabs)
        expect(out).toEqual([])
        expect(removeIds).toEqual([1, 2])
    })

    test('a copied row for a season starts with the prices and nothing saved', () => {
        const copy = copySheetRow(sheet.rows[0])
        expect(copy.prices.sedan).toEqual({ id: null, value: '4500' })
        const withDates = { ...copy, season: 'Peak', validFrom: '2027-05-01', validTo: '2027-06-15' }
        expect(sheetChanges([...sheet.rows, withDates], sheet.rows, sheet.cabs).rows).toHaveLength(2)
    })
})

describe('checking a row', () => {
    const cabs = ['Sedan', 'Innova']
    const fill = (extra = {}) =>
        withPrice(blankSheetRow({ fromPlace: 'Delhi', toPlace: 'Manali', ...extra }), 'Sedan', '9000')

    test('wants two different places and a price', () => {
        expect(sheetProblem(blankSheetRow(), cabs)).toMatch(/starts and ends/)
        expect(sheetProblem(blankSheetRow({ fromPlace: 'Delhi', toPlace: 'delhi' }), cabs)).toMatch(/two different/)
        expect(sheetProblem(blankSheetRow({ fromPlace: 'Delhi', toPlace: 'Manali' }), cabs)).toMatch(/at least one cab/)
        expect(sheetProblem(fill(), cabs)).toBe('')
    })

    test('checks the season dates', () => {
        expect(sheetProblem(fill({ validFrom: '2026-12-20' }), cabs)).toMatch(/start and an end/)
        expect(sheetProblem(fill({ validFrom: '2027-01-05', validTo: '2026-12-20' }), cabs)).toMatch(/ends before/)
        expect(sheetProblem(fill({ repeatsYearly: true }), cabs)).toMatch(/needs its dates/)
    })

    test('finds the same drive twice, also written the other way round', () => {
        const rows = [fill(), fill({ fromPlace: 'Manali', toPlace: 'Delhi' })]
        expect(Object.keys(sheetDuplicates(rows, cabs))).toEqual([rows[1].key])
        const oneWay = [fill({ bothWays: false }), fill({ fromPlace: 'Manali', toPlace: 'Delhi', bothWays: false })]
        expect(sheetDuplicates(oneWay, cabs)).toEqual({})
    })
})
