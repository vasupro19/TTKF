import { describe, expect, it } from 'vitest'
import { emailStateOf, filtersOf, importableRows, importReport, statusOption } from './prospectFacts'

describe('prospects on screen', () => {
    it('says where each agency stands with email', () => {
        const future = new Date(Date.now() + 3 * 86400000).toISOString()
        expect(emailStateOf({ email: 'a@b.in', sequence: 'on', nextEmailAt: future, emailsSent: 1 })).toMatch(
            /^Follow-up due /
        )
        expect(emailStateOf({ email: 'a@b.in', sequence: 'on', nextEmailAt: '2020-01-01', emailsSent: 0 })).toBe(
            'First email goes next'
        )
        expect(emailStateOf({ email: 'a@b.in', doNotEmail: true, stopReason: 'bounced' })).toBe(
            'No email: the address bounced'
        )
        expect(emailStateOf({ email: 'a@b.in', sequence: 'done', stopReason: 'replied' })).toBe(
            'Emails finished: they replied'
        )
        expect(emailStateOf({ email: '', sequence: 'off' })).toBe('No email address')
        expect(emailStateOf({ email: 'a@b.in', sequence: 'off', emailsSent: 2 })).toBe('2 sent')
    })

    it('an unknown status shows as not contacted', () => {
        expect(statusOption('won').label).toBe('Won')
        expect(statusOption('odd').label).toBe('Not contacted')
    })

    it('the region filter lists the regions with their counts', () => {
        const region = filtersOf([{ region: 'Gujarat', count: 25 }]).find(filter => filter.key === 'region')
        expect(region.options).toEqual([{ value: 'Gujarat', label: 'Gujarat (25)' }])
    })

    it('imports only rows with something in them, and reports what happened', () => {
        expect(importableRows([{ Agency: 'X' }, { Agency: '', City: '  ' }, { '#': 0 }])).toEqual([{ Agency: 'X' }])
        expect(importReport({ added: 1, duplicates: 2, problems: [{ row: 4 }] })).toBe(
            'Added 1 agency, 2 already on the list, 1 rows without an agency name skipped.'
        )
    })
})
