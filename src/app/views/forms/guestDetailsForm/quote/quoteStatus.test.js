import { describe, expect, test } from 'vitest'
import { hasPrice, quoteStageKey, sendChecklist, sentLine, viewLine, whatsAppMessage } from './quoteStatus'

describe('quote status', () => {
    test('a price in any hotel category counts', () => {
        expect(hasPrice(null)).toBe(false)
        expect(hasPrice({ deluxePrice: 0, luxuryPrice: '' })).toBe(false)
        expect(hasPrice({ luxuryPrice: '12000' })).toBe(true)
    })

    test('the step follows the quote: verified, in progress, sent, booked', () => {
        expect(quoteStageKey({})).toBe('verified')
        expect(quoteStageKey({ days: [{}] })).toBe('quoting')
        expect(quoteStageKey({ priceData: { deluxePrice: 5000 } })).toBe('quoting')
        expect(quoteStageKey({ days: [{}], lastSharedQuoteNo: 1, lastShareStatus: 'Sent' })).toBe('sent')
        expect(quoteStageKey({ days: [{}], lastSharedQuoteNo: 1, lastShareStatus: 'Failed' })).toBe('quoting')
        expect(quoteStageKey({ lastSharedQuoteNo: 1, confirmedPackage: { selectedPackage: 'deluxePrice' } })).toBe(
            'booked'
        )
    })

    test('the checklist says what is missing', () => {
        const items = sendChecklist({ tripLine: '2 adults', days: [{}, {}], priceData: null, guestEmail: '' })
        expect(items.map(item => [item.key, item.done])).toEqual([
            ['trip', true],
            ['days', true],
            ['price', false],
            ['email', false]
        ])
        expect(items[1].label).toBe('2 days planned')
    })

    test('the sent line covers never sent, failed, another version and sent', () => {
        expect(sentLine({ currentQuoteNo: 1 })).toBe('Not sent to the guest yet.')
        expect(sentLine({ lastSharedQuoteNo: 1, currentQuoteNo: 1, status: 'Failed', error: 'bounced' })).toMatch(
            /did not go \(bounced\)/
        )
        expect(sentLine({ lastSharedQuoteNo: 1, currentQuoteNo: 2 })).toMatch(/last got Quote 1/)
        expect(sentLine({ lastSharedQuoteNo: 2, currentQuoteNo: 2, lastSharedAt: '2026-10-14T10:00:00Z' })).toMatch(
            /Emailed to the guest on 14 Oct 2026/
        )
    })

    test('tells whether the guest opened the quote, once it has been sent', () => {
        const now = new Date('2026-10-16T12:00:00Z')
        const sent = { currentQuoteNo: 1, lastSharedQuoteNo: 1, status: 'Sent', now }
        expect(viewLine({ ...sent, lastSharedQuoteNo: null }).show).toBe(false)
        expect(viewLine({ ...sent, status: 'Failed' }).show).toBe(false)
        expect(viewLine({ ...sent, currentQuoteNo: 2 }).show).toBe(false)
        expect(viewLine({ ...sent, quoteViews: [] })).toMatchObject({ show: true, viewed: false })
        const opened = viewLine({
            ...sent,
            quoteViews: [{ quoteNo: 1, viewCount: 3, lastViewedAt: '2026-10-16T10:00:00Z' }]
        })
        expect(opened).toMatchObject({ show: true, viewed: true })
        expect(opened.text).toContain('3 times')
        expect(opened.text).toContain('2 hours ago')
    })

    test('the WhatsApp message carries the private link on its own line', () => {
        const text = whatsAppMessage({
            guestName: 'Asha',
            company: 'Acme',
            url: 'https://crm.example.com/v1/public/quote/a/b'
        })
        expect(text).toContain('Your travel quotation – Acme')
        expect(text).toContain('Hi Asha,')
        expect(text.split('\n')).toContain('https://crm.example.com/v1/public/quote/a/b')
        expect(text).not.toMatch(/attached/i)
        expect(whatsAppMessage({ url: 'x' })).toContain('Hi there,')
    })
})
