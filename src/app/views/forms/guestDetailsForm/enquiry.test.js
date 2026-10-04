import { describe, expect, test } from 'vitest'
import { enquiryDate, enquiryFacts, withEnquiry } from './tripDetails'

// ? "today" for these tests: 2 Oct 2026
const today = new Date('2026-10-02T08:00:00Z')

describe('the start date an enquiry states', () => {
    test.each([
        ['Travel dates: 2026-10-30 to 2026-11-02', '2026-10-30'],
        ['From 30/10/2026', '2026-10-30'],
        ['30-10-26 for 4 nights', '2026-10-30'],
        ['30 Oct 2026', '2026-10-30'],
        ['around 30th October', '2026-10-30'],
        ['Oct 30, 2026', '2026-10-30'],
        ['15 Jan', '2027-01-15'],
        ['5 Sept', '2027-09-05']
    ])('%s', (text, date) => {
        expect(enquiryDate(text, today)).toBe(date)
    })

    test('no date, an impossible one, or one already past gives none', () => {
        expect(enquiryDate('Last week of October', today)).toBe('')
        expect(enquiryDate('31/02/2027', today)).toBe('')
        expect(enquiryDate('12 Mar 2026', today)).toBe('')
    })
})

describe('what an enquiry says the trip is', () => {
    test('adults, children and the start date', () => {
        expect(
            enquiryFacts('Destination: Manali\nTravelers: 13 adults 2 children\nTravel dates: 30 Oct 2026', today)
        ).toEqual({
            adults: '13',
            children: '2',
            pickupDate: '2026-10-30'
        })
        expect(enquiryFacts('Travelers: 4', today)).toEqual({ adults: '4' })
        expect(enquiryFacts('We are 6 people', today)).toEqual({ adults: '6' })
    })

    test('only the empty fields are filled, and which ones is said', () => {
        const { values, used } = withEnquiry(
            { adults: '2', children: '', pickupDate: '' },
            'Travelers: 13 adults, 2 kids. 30 Oct 2026',
            today
        )
        expect(values).toEqual({ adults: '2', children: '2', pickupDate: '2026-10-30' })
        expect(used).toEqual(['children', 'pickupDate'])
    })
})
