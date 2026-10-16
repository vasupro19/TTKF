import { describe, expect, it } from 'vitest'
import {
    emptyInvoices,
    hasInvoiceFilters,
    invoiceFiltersFromSearch,
    invoiceQuery,
    invoiceSearchAfter
} from './invoiceFilters'

const NOW = new Date(2026, 9, 14)

describe('invoice filters in the address', () => {
    it('no month is this month, month=all is every month, bad values are dropped', () => {
        expect(invoiceFiltersFromSearch('', NOW).month).toBe('2026-10')
        expect(invoiceFiltersFromSearch('?month=all', NOW).month).toBe('')
        expect(invoiceFiltersFromSearch('?month=2026-13', NOW).month).toBe('2026-10')
        const filters = invoiceFiltersFromSearch('?kind=BILL_OF_SUPPLY&gst=maybe&issuedBy=3&from=2026-02-31', NOW)
        expect(filters).toMatchObject({ kind: 'BILL_OF_SUPPLY', gst: '', issuedBy: '3', from: '' })
    })
    it('typed dates replace the month in the request', () => {
        const filters = invoiceFiltersFromSearch('?month=2026-09&from=2026-04-01', NOW)
        expect(invoiceQuery(filters).month).toBeUndefined()
        expect(invoiceQuery(filters).from).toBe('2026-04-01')
        expect(invoiceQuery(invoiceFiltersFromSearch('?month=2026-09', NOW)).month).toBe('2026-09')
    })
    it('writes the month sensibly and knows when something is filtered', () => {
        expect(invoiceSearchAfter('?month=2026-09', { month: '2026-10' }, NOW)).toBe('')
        expect(invoiceSearchAfter('', { month: '' }, NOW)).toBe('?month=all')
        expect(hasInvoiceFilters(invoiceFiltersFromSearch('', NOW), NOW)).toBe(false)
        expect(hasInvoiceFilters(invoiceFiltersFromSearch('?q=a', NOW), NOW)).toBe(true)
        expect(hasInvoiceFilters(invoiceFiltersFromSearch('?month=2026-09', NOW), NOW)).toBe(true)
    })
    it('empty states', () => {
        expect(emptyInvoices({ loaded: true, count: 0, hasFilters: true, filters: {} })).toEqual({ kind: 'filtered' })
        expect(emptyInvoices({ loaded: true, count: 0, hasFilters: false, filters: { month: '' } }).title).toBe(
            'No invoices yet'
        )
    })
})
