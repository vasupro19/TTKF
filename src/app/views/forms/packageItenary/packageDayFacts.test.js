import { describe, expect, test } from 'vitest'
import { dayTitle, isStay, moveItem, nightsOf, positionChoices, staysOf } from './packageDayFacts'

const stay = (name, entryType = 'Stay') => ({ entryType, destination: { name }, title: `Day in ${name}` })

describe('package days', () => {
    test('only Stay and Transit + Stay mean a night', () => {
        expect(['Stay', 'TransitStay'].every(isStay)).toBe(true)
        expect(['Transit', 'FreshUp', undefined].some(isStay)).toBe(false)
    })

    test('nights in each place, in trip order', () => {
        const days = [stay('Shimla'), stay('Shimla'), stay('Manali'), stay('Manali'), stay('Manali')]
        expect(staysOf(days)).toEqual([
            { destination: 'Shimla', nights: 2, from: 1 },
            { destination: 'Manali', nights: 3, from: 3 }
        ])
        expect(nightsOf(days)).toBe(5)
    })

    test('a travel day breaks a run, and a day with no place counts no night', () => {
        const days = [stay('Shimla'), { entryType: 'Transit' }, stay('Shimla'), { entryType: 'Stay' }]
        expect(staysOf(days)).toEqual([
            { destination: 'Shimla', nights: 1, from: 1 },
            { destination: 'Shimla', nights: 1, from: 3 }
        ])
    })

    test('a day without an entry type is a stay (older data)', () => {
        expect(staysOf([{ destination: { name: 'Goa' } }])).toEqual([{ destination: 'Goa', nights: 1, from: 1 }])
    })

    test('moving a day', () => {
        expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
        expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
        const same = ['a', 'b']
        expect(moveItem(same, 0, 5)).toBe(same)
        expect(moveItem(same, 1, 1)).toBe(same)
    })

    test('a day’s title falls back to its itinerary', () => {
        expect(dayTitle({ title: 'Arrive' })).toBe('Arrive')
        expect(dayTitle({ itenary: { title: 'From itinerary' } })).toBe('From itinerary')
        expect(dayTitle({})).toBe('Untitled day')
    })

    test('where a new day can go', () => {
        expect(positionChoices([])).toEqual([{ value: 0, label: 'As Day 1' }])
        const choices = positionChoices([{ title: 'A' }, { title: 'B' }, { title: 'C' }])
        expect(choices.map(choice => choice.value)).toEqual([0, 1, 2, 3])
        expect(choices[0].label).toMatch(/start/)
        expect(choices[2].label).toBe('After Day 2: B')
        expect(choices[3].label).toBe('At the end, as Day 4')
    })
})
