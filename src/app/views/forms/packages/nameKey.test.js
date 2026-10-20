import { describe, expect, test } from 'vitest'
import nameKey from './nameKey'

describe('nameKey', () => {
    test('capitals, spacing and the kind of dash do not matter', () => {
        const same = ['Day 1 - Arrival', 'day 1 – arrival', '  Day  1-Arrival ', 'DAY 1 — ARRIVAL']
        expect(new Set(same.map(nameKey)).size).toBe(1)
    })

    test('names that really differ stay apart', () => {
        expect(nameKey('Shimla')).not.toBe(nameKey('Shimla City'))
        expect(nameKey('Day 1 - Arrival')).not.toBe(nameKey('Day 2 - Arrival'))
    })

    test('nothing in, nothing out', () => {
        expect(nameKey('')).toBe('')
        expect(nameKey(null)).toBe('')
        expect(nameKey(undefined)).toBe('')
    })
})
