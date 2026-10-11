import { describe, expect, it } from 'vitest'
import {
    greetingFor,
    kpiCards,
    paymentMeta,
    periodLabel,
    periodRange,
    rupees,
    summaryArgs,
    toYmd
} from './dashboardHelpers'

const NOW = new Date(2026, 9, 11, 15, 30) // 11 Oct 2026

describe('periodRange', () => {
    it('turns each preset into days', () => {
        expect(periodRange('thisMonth', NOW)).toEqual({ from: '2026-10-01', to: '2026-10-31' })
        expect(periodRange('lastMonth', NOW)).toEqual({ from: '2026-09-01', to: '2026-09-30' })
        expect(periodRange('last3', NOW)).toEqual({ from: '2026-08-01', to: '2026-10-31' })
        expect(periodRange('thisYear', NOW)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
        expect(periodRange('nonsense', NOW)).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    })

    it('crosses the year in January', () => {
        const january = new Date(2027, 0, 5)
        expect(periodRange('lastMonth', january)).toEqual({ from: '2026-12-01', to: '2026-12-31' })
        expect(periodRange('last3', january)).toEqual({ from: '2026-11-01', to: '2027-01-31' })
    })

    it('custom: its own days, swapped when backwards, one side alone is one day, none is this month', () => {
        expect(periodRange('custom', NOW, { from: '2026-03-05', to: '2026-04-10' })).toEqual({
            from: '2026-03-05',
            to: '2026-04-10'
        })
        expect(periodRange('custom', NOW, { from: '2026-04-10', to: '2026-03-05' })).toEqual({
            from: '2026-03-05',
            to: '2026-04-10'
        })
        expect(periodRange('custom', NOW, { from: '2026-04-10', to: '' })).toEqual({
            from: '2026-04-10',
            to: '2026-04-10'
        })
        expect(periodRange('custom', NOW, { from: 'junk' })).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    })

    it('toYmd pads', () => {
        expect(toYmd(new Date(2026, 0, 3))).toBe('2026-01-03')
    })
})

describe('summaryArgs', () => {
    it('adds the person only when chosen', () => {
        expect(summaryArgs({ period: 'thisMonth', custom: {}, assignedTo: '' }, NOW)).toEqual({
            from: '2026-10-01',
            to: '2026-10-31'
        })
        expect(summaryArgs({ period: 'thisMonth', custom: {}, assignedTo: '7' }, NOW)).toEqual({
            from: '2026-10-01',
            to: '2026-10-31',
            assignedTo: '7'
        })
    })
})

describe('labels', () => {
    it('periodLabel', () => {
        expect(periodLabel('2026-10-01', '2026-10-31')).toBe('1 Oct – 31 Oct 2026')
        expect(periodLabel('2025-12-01', '2026-01-31')).toBe('1 Dec 2025 – 31 Jan 2026')
        expect(periodLabel('', '2026-01-31')).toBe('')
    })

    it('greetingFor', () => {
        expect(greetingFor(9)).toBe('Good morning')
        expect(greetingFor(13)).toBe('Good afternoon')
        expect(greetingFor(20)).toBe('Good evening')
    })

    it('paymentMeta', () => {
        expect(paymentMeta('Fully Paid')).toEqual({ label: 'Fully paid', color: 'success' })
        expect(paymentMeta('Partially Paid').label).toBe('Part paid')
        expect(paymentMeta('Unpaid').label).toBe('Not paid')
    })
})

describe('rupees', () => {
    it('Indian grouping, whole rupees', () => {
        expect(rupees(123456)).toBe('₹1,23,456')
        expect(rupees(12345678.6)).toBe('₹1,23,45,679')
        expect(rupees(0)).toBe('₹0')
        expect(rupees(null)).toBe('₹0')
        expect(rupees('abc')).toBe('₹0')
        expect(rupees(-1500)).toBe('-₹1,500')
    })
})

describe('kpiCards', () => {
    const base = {
        newLeads: 40,
        bookings: 6,
        conversion: 12.5,
        revenue: 450000,
        collected: 200000,
        toCollect: 150000,
        profit: null,
        supplierDue: null,
        awaitingVerification: { count: 0, amount: 0 }
    }

    it('without money: the six cards everyone sees', () => {
        const cards = kpiCards(base)
        expect(cards.map(card => card.key)).toEqual([
            'newLeads',
            'bookings',
            'conversion',
            'revenue',
            'collected',
            'toCollect'
        ])
        expect(cards[2].value).toBe('12.5%')
        expect(cards[3].value).toBe('₹4,50,000')
        expect(cards.find(card => card.key === 'toCollect').to).toBe('/process/packages')
    })

    it('profit and supplier dues for those who see every booking; awaiting verification while payments wait', () => {
        const cards = kpiCards({
            ...base,
            profit: 90000,
            supplierDue: 30000,
            awaitingVerification: { count: 2, amount: 15000 }
        })
        expect(cards.map(card => card.key).slice(6)).toEqual(['profit', 'supplierDue', 'awaitingVerification'])
        const waiting = cards.at(-1)
        expect(waiting).toMatchObject({ value: '₹15,000', to: '/process/transactions' })
        expect(waiting.caption).toBe('2 payments for accounts to check')
    })

    it('a profit of zero still shows', () => {
        expect(kpiCards({ ...base, profit: 0, supplierDue: 0 }).some(card => card.key === 'profit')).toBe(true)
    })
})
