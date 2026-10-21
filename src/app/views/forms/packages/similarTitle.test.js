import { describe, expect, test } from 'vitest'
import { findSimilarTitle, sameDay } from './similarTitle'

describe('the same day, worded differently', () => {
    test('the same title with extra words is the same day (the arrival day planned from another city)', () => {
        expect(sameDay('Arrival in Manali & Evening Rest', 'Arrival in Manali')).toBe(true)
        expect(sameDay('Arrival in Manali', 'Arrival in Manali & Mall Road Evening')).toBe(true)
        expect(sameDay('Manali Local Sightseeing & Solang Valley', 'Manali Local Sightseeing')).toBe(true)
    })

    test('the same words in another order, case or spacing are the same day', () => {
        expect(sameDay('Naggar Castle & Old Manali Cafes', 'old manali cafes  &  naggar castle')).toBe(true)
        expect(sameDay('Day 1 - Arrival in Manali', 'day 1 – arrival in manali')).toBe(true)
    })

    test('two sightseeing days that share only a place are different days', () => {
        expect(sameDay('Old Manali & Vashisht', 'Hadimba Temple, Vashisht Village & Mall Road')).toBe(false)
        expect(sameDay('Naggar Castle & Old Manali Cafes', 'Old Manali & Vashisht')).toBe(false)
    })

    test('a route is only the same as the same route', () => {
        expect(sameDay('Dharamshala to Manali', 'Manali to Dharamshala')).toBe(false)
        expect(sameDay('Shimla to Jibhi', 'Shimla to Jibhi & Local Walk')).toBe(false)
        expect(sameDay('Shimla to Jibhi', 'shimla  to  jibhi')).toBe(true)
        expect(sameDay('Manali Departure', 'Manali to Delhi Return')).toBe(false)
    })

    test('one shared word, or a one-word title, is not enough', () => {
        expect(sameDay('Arrival', 'Arrival in Manali')).toBe(false)
        expect(sameDay('Manali Departure', 'Manali Arrival')).toBe(false)
    })

    test('titles with different numbers are different days', () => {
        expect(sameDay('Day 1 - Arrival', 'Day 2 - Arrival')).toBe(false)
        expect(sameDay('Day plan 1', 'Day plan 10')).toBe(false)
        expect(sameDay('Day 2 - Local sightseeing', 'Day 2 - Local sightseeing & Shopping')).toBe(true)
    })

    test('nothing in a title means no match', () => {
        expect(sameDay('', 'Arrival in Manali')).toBe(false)
        expect(sameDay(null, null)).toBe(false)
    })

    test('finds the saved itinerary that is the same day, or nothing', () => {
        const saved = [
            { title: 'Old Manali & Vashisht' },
            { title: 'Arrival in Manali' },
            { title: 'Manali Departure' }
        ]
        expect(findSimilarTitle('Arrival in Manali & Evening Rest', saved)).toBe(saved[1])
        expect(findSimilarTitle('Hadimba Temple & Mall Road', saved)).toBeNull()
        expect(findSimilarTitle('Arrival in Manali', [])).toBeNull()
    })
})
