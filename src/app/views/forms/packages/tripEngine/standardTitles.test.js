import { describe, expect, test } from 'vitest'
import { renderDayTitle, standardDayTitle } from './render'
import { DAY_TYPES } from './route'

const day = (type, extra = {}) => ({ type, location: 'Manali', activities: [], ...extra })

describe('the fixed title of a day', () => {
    test('a full day at a place is "<place> Local Sightseeing", numbered from the second', () => {
        expect(standardDayTitle(day(DAY_TYPES.FULL_DAY), 1)).toBe('Manali Local Sightseeing')
        expect(standardDayTitle(day(DAY_TYPES.FULL_DAY), 2)).toBe('Manali Local Sightseeing 2')
        expect(standardDayTitle(day(DAY_TYPES.FULL_DAY, { location: 'Shimla' }), 1)).toBe('Shimla Local Sightseeing')
    })

    test('an arrival is "Arrival in <place>" with no first stop added', () => {
        expect(standardDayTitle(day(DAY_TYPES.ARRIVAL))).toBe('Arrival in Manali')
        expect(renderDayTitle(day(DAY_TYPES.ARRIVAL, { activities: [{ name: 'Evening Rest' }] }))).toBe(
            'Arrival in Manali'
        )
    })

    test('a day of travel is the route alone', () => {
        const transfer = day(DAY_TYPES.TRANSFER, { leg: { from: 'Dharamshala', to: 'Manali' } })
        expect(standardDayTitle(transfer)).toBe('Dharamshala to Manali')
        expect(
            renderDayTitle({
                ...transfer,
                activities: [{ name: 'Kullu Shawl Factory' }],
                title: 'Dharamshala to Manali & Kullu'
            })
        ).toBe('Dharamshala to Manali')
        expect(standardDayTitle(day(DAY_TYPES.ARRIVAL, { leg: { from: 'Delhi', to: 'Manali' } }))).toBe(
            'Delhi to Manali'
        )
    })

    test('a departure is "<place> Departure", or the route back when it is a journey', () => {
        expect(standardDayTitle(day(DAY_TYPES.DEPARTURE))).toBe('Manali Departure')
        expect(standardDayTitle(day(DAY_TYPES.DEPARTURE, { leg: { from: 'Manali', to: 'Delhi' } }))).toBe(
            'Manali to Delhi Return'
        )
    })

    test('an excursion has no fixed title: it names its own destination', () => {
        const excursion = day(DAY_TYPES.EXCURSION, { title: 'Solang Valley & Atal Tunnel' })
        expect(standardDayTitle(excursion)).toBeNull()
        expect(renderDayTitle(excursion)).toBe('Solang Valley & Atal Tunnel')
    })

    test('the same Manali days planned from two cities, with the model wording them differently, get the same titles', () => {
        const fromDelhi = [
            day(DAY_TYPES.ARRIVAL, {
                title: 'Arrival in Manali & Evening Rest',
                activities: [{ name: 'Evening Rest' }]
            }),
            day(DAY_TYPES.FULL_DAY, {
                title: 'Old Manali & Vashisht',
                activities: [{ name: 'Old Manali' }, { name: 'Vashisht' }]
            })
        ]
        const fromChandigarh = [
            day(DAY_TYPES.ARRIVAL, { title: 'Arrival in Manali', activities: [] }),
            day(DAY_TYPES.FULL_DAY, {
                title: 'Hadimba Temple, Vashisht Village & Mall Road',
                activities: [{ name: 'Hadimba Temple' }]
            })
        ]
        expect(fromDelhi.map(item => renderDayTitle(item))).toEqual(fromChandigarh.map(item => renderDayTitle(item)))
        expect(fromDelhi.map(item => renderDayTitle(item))).toEqual(['Arrival in Manali', 'Manali Local Sightseeing'])
    })
})
