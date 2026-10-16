import { describe, expect, test } from 'vitest'
import { bookingsCsv, filtersFromSearch, hasAnyFilter, searchWithFilters } from './bookingsListFacts'

describe('the bookings list address', () => {
    test('reads what is valid and drops the rest', () => {
        expect(
            filtersFromSearch(
                '?stage=ready&convertedBy=4&createdFrom=2026-10-01&travelTo=soon&guestPayment=partial&invoice=nope&supplierPayment=paid'
            )
        ).toEqual({
            stage: 'ready',
            convertedBy: '4',
            createdFrom: '2026-10-01',
            createdTo: '',
            travelFrom: '',
            travelTo: '',
            guestPayment: 'partial',
            supplierPayment: 'paid',
            invoice: ''
        })
        expect(filtersFromSearch('?stage=bogus&convertedBy=x').stage).toBe('all')
    })

    test('writes only what is set, keeps other parameters', () => {
        expect(searchWithFilters('?foo=1&guestPayment=paid', { stage: 'action', invoice: 'with' })).toBe(
            '?foo=1&guestPayment=paid&stage=action&invoice=with'
        )
        expect(searchWithFilters('?stage=action&invoice=with', { stage: 'all', invoice: '' })).toBe('')
    })

    test('the stage alone is not a filter', () => {
        expect(hasAnyFilter({ invoice: '' })).toBe(false)
        expect(hasAnyFilter({ invoice: 'with' })).toBe(true)
        expect(hasAnyFilter({}, 'asha')).toBe(true)
    })
})

describe('the bookings CSV', () => {
    test('a header and a line per booking, with quoting', () => {
        const text = bookingsCsv([
            {
                bookingNo: 'B-1',
                guestName: 'Rao, Asha',
                sellingPrice: '90000.00',
                guestPaidAmount: 0,
                stage: 'action',
                createdAt: '2026-10-02T10:00:00.000Z'
            }
        ])
        const [header, line] = text.split('\r\n')
        expect(header.startsWith('Booking no.,Guest,Phone')).toBe(true)
        expect(line).toContain('"Rao, Asha"')
        expect(line).toContain('Not started')
        expect(line).toContain('90000,0')
        expect(line).toContain('2026-10-02')
    })
})
