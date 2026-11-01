import { describe, expect, test } from 'vitest'
import { buildEnquiryRequest, emailInText, hasTripDetails, phoneInText, readEnquiry } from './enquiryReader'

const TODAY = '2026-10-30'
const CAMPAIGNS = [
    { id: 1, title: 'Himachal' },
    { id: 2, title: 'Kashmir' }
]
const VEHICLES = ['Sedan', 'Innova Crysta', 'Tempo Traveller 12 seater']
const TEXT = `Hi, I am Rohit Sharma. We are 4 adults and 2 kids, planning Shimla Manali 6 nights from 15 Dec.
Need 3 star hotels with breakfast, Innova from Delhi. Budget around 80k. Call me on 98765 43210, rohit.s@gmail.com`

const AI = {
    fullName: 'Rohit Sharma',
    phone: '98765 43210',
    email: 'rohit.s@gmail.com',
    trip: 'himachal',
    startDate: '2026-12-15',
    nights: 6,
    adults: 4,
    children: 2,
    hotelCategory: 'Deluxe',
    mealPlan: 'CP',
    vehicle: 'Innova',
    pickupLocation: 'Delhi',
    budget: '80k',
    wishes: 'Shimla and Manali, 6 nights'
}

describe('reading a pasted enquiry', () => {
    test('fills the lead and its trip from what the AI read, checked against the agency’s lists', () => {
        const { lead, trip, found } = readEnquiry(AI, {
            text: TEXT,
            campaigns: CAMPAIGNS,
            vehicles: VEHICLES,
            today: TODAY
        })
        expect(lead).toEqual({
            fullName: 'Rohit Sharma',
            phone: '98765 43210',
            senderEmail: 'rohit.s@gmail.com',
            campaignId: '1',
            remarks: 'Shimla and Manali, 6 nights · Budget: 80k'
        })
        expect(trip).toMatchObject({
            adults: '4',
            children: '2',
            pickupDate: '2026-12-15',
            dropDate: '2026-12-21',
            packageType: 'Deluxe',
            foodPlan: 'CP',
            taxiType: 'Innova Crysta',
            pickupLocation: 'Delhi'
        })
        expect(found).toEqual(expect.arrayContaining(['name', 'phone', 'email', 'trip (Himachal)', 'dates', 'guests']))
        expect(hasTripDetails(trip)).toBe(true)
    })

    test('a number or email that is not in the text is never used: the text’s own is', () => {
        const { lead } = readEnquiry(
            { ...AI, phone: '91234 56789', email: 'someone@else.com' },
            { text: TEXT, campaigns: CAMPAIGNS, today: TODAY }
        )
        expect(lead.phone).toBe('98765 43210')
        expect(lead.senderEmail).toBe('rohit.s@gmail.com')
    })

    test('when the AI can’t be reached, the phone and email are still read from the text', () => {
        const { lead, trip } = readEnquiry({}, { text: TEXT, campaigns: CAMPAIGNS, today: TODAY })
        expect(lead.phone).toBe('98765 43210')
        expect(lead.senderEmail).toBe('rohit.s@gmail.com')
        expect(hasTripDetails(trip)).toBe(false)
    })

    test('values the agency doesn’t have, past dates and wrong dates are left out', () => {
        const { lead, trip } = readEnquiry(
            {
                trip: 'Goa',
                hotelCategory: '7 star',
                mealPlan: 'buffet',
                vehicle: 'Helicopter',
                startDate: '2026-02-30',
                endDate: '2026-01-10',
                adults: -2
            },
            { text: 'Goa trip', campaigns: CAMPAIGNS, vehicles: VEHICLES, today: TODAY }
        )
        expect(lead.campaignId).toBe('')
        expect(trip).toMatchObject({
            packageType: '',
            foodPlan: '',
            taxiType: '',
            pickupDate: '',
            dropDate: '',
            adults: ''
        })
        expect(readEnquiry({ startDate: '2026-10-01' }, { text: '', today: TODAY }).trip.pickupDate).toBe('')
    })

    test('finds phone numbers and emails the way guests write them', () => {
        expect(phoneInText('call +91-98765-43210 pls')).toBe('+91-98765-43210')
        expect(phoneInText('dates 15/12 to 21/12, 4 pax')).toBe('')
        expect(emailInText('mail me at A.B@Mail.co.in thanks')).toBe('A.B@Mail.co.in')
    })

    test('the AI is told today’s date and the agency’s trips', () => {
        const request = buildEnquiryRequest({ text: TEXT, campaigns: CAMPAIGNS, today: TODAY })
        const payload = JSON.parse(request.messages[0].content)
        expect(payload).toMatchObject({ today: TODAY, trips: ['Himachal', 'Kashmir'], enquiry: TEXT })
        expect(request.system).toMatch(/never invent/)
    })
})

describe('the places the guest named', () => {
    test('kept in order with their nights, only when the enquiry names them', () => {
        const { places, found } = readEnquiry(
            {
                ...AI,
                places: [
                    { name: 'Shimla', nights: 2 },
                    { name: 'manali', nights: 4 },
                    { name: 'Kasol', nights: 1 },
                    { name: 'Shimla', nights: 9 }
                ]
            },
            { text: TEXT, campaigns: CAMPAIGNS, vehicles: VEHICLES, today: TODAY }
        )
        expect(places).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'manali', nights: 4 }
        ])
        expect(found).toContain('places')
    })

    test('none named, or no reply from the AI: no places', () => {
        expect(readEnquiry({ ...AI, places: 'Shimla' }, { text: TEXT, today: TODAY }).places).toEqual([])
        expect(readEnquiry({}, { text: TEXT, today: TODAY }).places).toEqual([])
    })

    test('the AI is asked for the places, in travel order', () => {
        expect(buildEnquiryRequest({ text: TEXT }).system).toContain('places: the places the guest wants to see')
    })
})
