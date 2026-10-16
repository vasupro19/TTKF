import { describe, expect, test } from 'vitest'
import {
    computeTax,
    parseRate,
    gstinShapeProblem,
    money,
    money2,
    splitText,
    modeOf,
    monthName,
    safeFileName,
    thisMonth
} from './gstFacts'

describe('computeTax', () => {
    test('GST extra: added on top, half CGST and half SGST in the same state', () => {
        expect(computeTax({ amount: 10000, mode: 'exclusive', rate: 5 })).toEqual({
            mode: 'exclusive',
            rate: 5,
            taxable: 10000,
            cgst: 250,
            sgst: 250,
            igst: 0,
            gst: 500,
            total: 10500
        })
    })

    test('GST included: taken out of the price, which stays the total', () => {
        expect(computeTax({ amount: 10500, mode: 'inclusive', rate: 5 })).toMatchObject({
            taxable: 10000,
            gst: 500,
            total: 10500
        })
    })

    test('another state pays IGST', () => {
        expect(computeTax({ amount: 20000, mode: 'exclusive', rate: 18, interState: true })).toMatchObject({
            cgst: 0,
            sgst: 0,
            igst: 3600,
            total: 23600
        })
    })

    test('no GST, a zero rate and an unknown mode leave the price whole', () => {
        expect(computeTax({ amount: 12345.67, mode: 'none', rate: 18 })).toMatchObject({ gst: 0, total: 12345.67 })
        expect(computeTax({ amount: 5000, mode: 'exclusive', rate: 0 })).toMatchObject({ mode: 'none', total: 5000 })
        expect(computeTax({ amount: 100, mode: 'sometimes', rate: 5 }).total).toBe(100)
    })

    test('paise add up: CGST + SGST is the GST, taxable + GST is the total', () => {
        ;[
            [9999.99, 5, 'inclusive'],
            [12345.67, 12, 'exclusive'],
            [333.33, 18, 'inclusive'],
            [0.01, 28, 'inclusive']
        ].forEach(([amount, rate, mode]) => {
            const tax = computeTax({ amount, mode, rate })
            expect(Math.round((tax.cgst + tax.sgst) * 100)).toBe(Math.round(tax.gst * 100))
            expect(Math.round((tax.taxable + tax.gst) * 100)).toBe(Math.round(tax.total * 100))
        })
    })

    test('agrees with the API on the figures its tests pin', () => {
        // ? 2 guests × 10,000 + 5% = 21,000; 20,350.50 inclusive of 12%
        expect(computeTax({ amount: 20000, mode: 'exclusive', rate: 5 }).total).toBe(21000)
        expect(computeTax({ amount: 18500, mode: 'inclusive', rate: 5 }).gst).toBe(880.95)
    })
})

describe('parseRate', () => {
    test('reads a rate with or without a percent sign', () => {
        expect(parseRate('18%')).toEqual({ ok: true, value: 18 })
        expect(parseRate(2.5)).toEqual({ ok: true, value: 2.5 })
    })

    test('refuses nonsense and anything above 28', () => {
        ;['', 'abc', '-5', '5.123', '28.01'].forEach(bad => expect(parseRate(bad).ok).toBe(false))
    })
})

test('a GSTIN typed with spaces and small letters is only checked for its shape', () => {
    expect(gstinShapeProblem(' 02aapfu0939f1zv ')).toBe('')
    expect(gstinShapeProblem('')).toBe('')
    expect(gstinShapeProblem('12345')).not.toBe('')
})

test('amounts read the way a quote and an invoice print them', () => {
    expect(money(21000)).toBe('₹21,000')
    expect(money(880.95)).toBe('₹880.95')
    expect(money(125000)).toBe('₹1,25,000')
    expect(money2(21000)).toBe('₹21,000.00')
    expect(splitText({ rate: 5, interState: false })).toBe('CGST 2.5% + SGST 2.5%')
    expect(splitText({ rate: 18, interState: true })).toBe('IGST 18%')
})

test('small helpers', () => {
    expect(modeOf('exclusive')).toBe('exclusive')
    expect(modeOf('x')).toBe('none')
    expect(monthName('2026-10')).toContain('2026')
    expect(thisMonth(new Date(2026, 9, 13))).toBe('2026-10')
    expect(safeFileName('TTK/2627/00001')).toBe('TTK_2627_00001')
})
