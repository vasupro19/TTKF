import { describe, expect, it } from 'vitest'
import { dateTimeFormatter, isValidDateString } from './index'

describe('isValidDateString', () => {
    it('accepts the shapes the API and the forms send', () => {
        expect(isValidDateString('2026-10-14')).toBe(true)
        expect(isValidDateString('2026-10-14 13:05:00')).toBe(true)
        expect(isValidDateString('2026-10-14T13:05')).toBe(true)
        expect(isValidDateString('2026-10-14T08:09:48.848Z')).toBe(true)
        expect(isValidDateString('2026-10-14T13:39:48+05:30')).toBe(true)
    })
    it('refuses text that only looks like one', () => {
        expect(isValidDateString('2026-13-45')).toBe(false)
        expect(isValidDateString('HT-L-261014-001')).toBe(false)
        expect(isValidDateString('2026-10-14 and more')).toBe(false)
        expect(isValidDateString(20261014)).toBe(false)
    })
})

describe('dateTimeFormatter', () => {
    it('writes a timestamp as a day and time', () => {
        expect(dateTimeFormatter('2026-10-14T08:09:48.848Z')).toMatch(/^14\/10\/2026, \d{1,2}:\d{2}\s?[ap]m$/i)
    })
})
