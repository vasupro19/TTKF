import { describe, expect, it } from 'vitest'
import { emptyPayments, filtersFromSearch, searchAfter, statusFromSearch } from './paymentListTools'

describe('payment list filters in the address', () => {
    const options = { methods: ['UPI', 'Cash'], types: ['Hotel'] }
    it('reads valid values and drops the rest', () => {
        expect(
            filtersFromSearch('?method=UPI&from=2026-10-01&to=bad&recordedBy=4&q=%20utr%20&type=Boat', options)
        ).toEqual({ from: '2026-10-01', to: '', method: 'UPI', type: '', recordedBy: '4', q: 'utr' })
    })
    it('the status defaults to awaiting verification and is not written when it is that', () => {
        expect(statusFromSearch('')).toBe('PENDING')
        expect(statusFromSearch('?status=ALL')).toBe('ALL')
        expect(statusFromSearch('?status=nope')).toBe('PENDING')
        expect(searchAfter('?tab=supplier&status=ALL', { status: 'PENDING' })).toBe('?tab=supplier')
        expect(searchAfter('?tab=supplier', { method: 'UPI' })).toBe('?tab=supplier&method=UPI')
    })
    it('says the right thing when empty', () => {
        expect(emptyPayments({ loaded: true, count: 0, hasFilters: true })).toEqual({ kind: 'filtered' })
        expect(emptyPayments({ loaded: true, count: 0, status: 'PENDING', anyPayments: true }).title).toMatch(/waiting/)
        expect(emptyPayments({ loaded: true, count: 0, status: 'ALL', anyPayments: false }).title).toBe(
            'No guest payments yet'
        )
        expect(emptyPayments({ loaded: true, count: 0, supplier: true }).title).toBe('No supplier payments yet')
        expect(emptyPayments({ loaded: true, count: 3 })).toBeNull()
    })
})
