import { describe, expect, test } from 'vitest'
import {
    buildHotelsRequest,
    daysFromPlan,
    nightsBetween,
    notesFromTrip,
    packageNameFor,
    planFromTrip,
    readHotels,
    routeFromPlaces,
    ungroundedPlaces,
    requirementsFromTrip,
    stayPlaces,
    withPhotos
} from './aiPackage'

const TRIP = {
    adults: '4',
    children: '1',
    rooms: '2',
    pickupDate: '2026-12-10',
    dropDate: '2026-12-15',
    pickupLocation: 'Delhi',
    dropLocation: 'Delhi',
    packageType: 'Deluxe',
    taxiType: 'Innova Crysta',
    arriveBy: 'Volvo',
    leadRemarks: 'Manali, wants snow, no trekking'
}

// ? a scripted model: reads Manali out of the notes, knows the roads, and plans plain days
const fakeModel = () => {
    const asked = []
    const ask = async request => {
        const payload = JSON.parse(request.messages[0].content)
        asked.push(request.system.slice(0, 30))
        if (request.system.includes('structured requirements')) {
            return { destinations: [{ name: 'Manali', nights: 5 }], constraints: ['no trekking'] }
        }
        if (request.system.includes('route and destination-logistics')) {
            return {
                legs: payload.legs.map(leg => ({
                    id: leg.id,
                    durationHours: [11, 12],
                    distanceKm: [520, 540],
                    terrain: 'mountain'
                })),
                clusters: [],
                unplaceable: []
            }
        }
        if (request.system.includes('senior destination expert')) {
            return {
                days: payload.days.map(day => ({
                    day: day.day,
                    title: '',
                    activities: [{ name: `Spot ${day.day}`, minutes: 60, travelFromPreviousMinutes: 20 }]
                }))
            }
        }
        if (request.system.includes('day-by-day descriptions')) {
            return { days: payload.days.map(day => ({ day: day.day, description: `Day ${day.day} for the family.` })) }
        }
        throw new Error('unexpected request')
    }
    return { ask, asked }
}

describe('a package from the guest’s trip details', () => {
    test('the nights come from the dates', () => {
        expect(nightsBetween('2026-12-10', '2026-12-15')).toBe(5)
        expect(nightsBetween('2026-12-10', '')).toBeNull()
        expect(nightsBetween('2026-12-15', '2026-12-10')).toBeNull()
    })

    test('the filled-in details are the planner’s form', () => {
        const form = requirementsFromTrip(TRIP)
        expect(form).toMatchObject({
            origin: 'Delhi',
            finalDestination: 'Delhi',
            region: '',
            totalNights: 5,
            startDate: '2026-12-10',
            travellers: { adults: 4, children: 1 },
            transport: { mode: 'Private cab', vehicle: 'Innova Crysta' },
            hotelPreference: 'Deluxe'
        })
    })

    test('the notes carry the trip, its length, the guest’s wishes and the agent’s', () => {
        const text = notesFromTrip({
            values: TRIP,
            region: 'Himachal',
            enquiry: 'Need Manali trip',
            extra: 'Add Solang'
        })
        expect(text).toContain('The agency\'s trip is named "Himachal"')
        expect(text).toContain('5 nights.')
        expect(text).toContain('Arrives by Volvo.')
        expect(text).toContain("Agent's notes: Add Solang")
        expect(text).toContain("Guest's notes: Manali, wants snow, no trekking")
        expect(text).toContain('Enquiry: Need Manali trip')
    })

    test('plans the trip and returns days the server can save, in order, with a name', async () => {
        const { ask } = fakeModel()
        const trip = await planFromTrip({ values: TRIP, region: 'Himachal', enquiry: '', extra: '', ask })
        expect(trip.status).toBe('ready')
        expect(trip.requirements.origin).toBe('Delhi')
        const days = daysFromPlan(trip)
        // ? 5 nights: 6 days, the first a drive to Manali, the last the drive home
        expect(days).toHaveLength(6)
        expect(days[0]).toMatchObject({ entryType: 'TransitStay', place: 'Manali' })
        expect(days[5]).toMatchObject({ entryType: 'Transit', place: '' })
        expect(days.every(day => day.title && day.description)).toBe(true)
        expect(days.filter(day => /Local Sightseeing/.test(day.title)).map(day => day.title)).toEqual([
            'Manali Local Sightseeing',
            'Manali Local Sightseeing 2',
            'Manali Local Sightseeing 3',
            'Manali Local Sightseeing 4'
        ])
        expect(packageNameFor(trip)).toBe('Manali 6D/5N')
    })
})

describe('hotels and photos for the package’s places', () => {
    const DAYS = [
        { title: 'Delhi to Shimla', place: 'Shimla' },
        { title: 'Shimla Local Sightseeing', place: 'shimla' },
        { title: 'Shimla to Manali', place: 'Manali' },
        { title: 'Manali Local Sightseeing', place: 'Manali' },
        { title: 'Manali Local Sightseeing 2', place: 'Manali' },
        { title: 'Manali to Delhi Return', place: '' }
    ]

    test('the places of the nights, each once, in order', () => {
        expect(stayPlaces(DAYS)).toEqual(['Shimla', 'Manali'])
    })

    test('one request asks for every place’s hotels', () => {
        const request = buildHotelsRequest({ places: ['Shimla', 'Manali'], region: 'Himachal' })
        expect(JSON.parse(request.messages[0].content)).toEqual({ trip: 'Himachal', places: ['Shimla', 'Manali'] })
        expect(request.system).toContain('delux_hotel')
    })

    test('keeps hotels for the places asked about only, and only the categories filled', () => {
        const raw = {
            places: [
                { name: 'shimla ', delux_hotel: 'Hotel A |  Hotel B', luxury_hotel: '', premium_hotel: 42 },
                { name: 'Goa', delux_hotel: 'Beach Inn' },
                { name: 'Manali', delux_hotel: '' }
            ]
        }
        expect(readHotels(raw, ['Shimla', 'Manali'])).toEqual({ Shimla: { delux_hotel: 'Hotel A | Hotel B' } })
        expect(readHotels({}, ['Shimla'])).toEqual({})
    })

    test('each day shows its place, days at one place take its photos in turn, the drive home the last place', () => {
        const photos = { Shimla: ['s1'], Manali: ['m1', 'm2'] }
        expect(withPhotos(DAYS, photos).map(day => day.image)).toEqual(['s1', 's1', 'm1', 'm2', 'm1', 'm2'])
        expect(withPhotos(DAYS, {}).every(day => day.image === '')).toBe(true)
    })
})

describe('the route rests on places someone wrote, never on a guess', () => {
    const values = { leadRemarks: 'Wants snow' }
    const stay = name => ({ name, nights: 2 })

    test('places named in the notes, the enquiry, the agent’s box or the trip’s name are planned', () => {
        expect(
            ungroundedPlaces({
                extracted: { destinations: [stay('Shimla'), stay('Manali')] },
                values: { leadRemarks: 'shimla and MANALI please' }
            })
        ).toBeNull()
        expect(
            ungroundedPlaces({ extracted: { destinations: [stay('Udaipur')] }, values, enquiry: 'Udaipur 3N' })
        ).toBeNull()
        expect(ungroundedPlaces({ extracted: { destinations: [stay('Goa')] }, values, extra: 'goa' })).toBeNull()
        expect(
            ungroundedPlaces({ extracted: { destinations: [stay('Manali')] }, values, region: 'Manali Volvo Special' })
        ).toBeNull()
    })

    test('a place nobody wrote is asked for, not planned (“Diwali Getaways 2026” names no place)', () => {
        const question = ungroundedPlaces({
            extracted: { destinations: [stay('Jaipur'), stay('Udaipur')] },
            values,
            region: 'Diwali Getaways 2026'
        })
        expect(question.id).toBe('destinations')
        expect(question.text).toContain('The AI suggested Jaipur, Udaipur')
        expect(question.text).toContain('Add the places the guest wants above')
    })

    test('a region the guest or the trip names gets the AI’s route; one nobody named does not', () => {
        const suggested = [stay('Shimla'), stay('Manali')]
        expect(
            ungroundedPlaces({
                extracted: { destinations: [], region: 'Himachal', suggestedDestinations: suggested },
                values,
                region: 'Himachal'
            })
        ).toBeNull()
        expect(
            ungroundedPlaces({
                extracted: { destinations: [], region: 'Himachal', suggestedDestinations: suggested },
                values: { leadRemarks: 'a himachal trip' },
                region: 'Diwali Getaways 2026'
            })
        ).toBeNull()
        const question = ungroundedPlaces({
            extracted: { destinations: [], region: 'Rajasthan', suggestedDestinations: [stay('Jaipur')] },
            values,
            region: 'Winter Himalaya Early Bird'
        })
        expect(question.text).toContain('The AI suggested Jaipur')
        expect(ungroundedPlaces({ extracted: { destinations: [] }, values }).text).toContain('don’t name any places')
    })

    test('when nobody named the places, it asks before any day is planned', async () => {
        const asked = []
        const ask = async request => {
            asked.push(request.system)
            return {
                destinations: [
                    { name: 'Jaipur', nights: 2 },
                    { name: 'Udaipur', nights: 2 }
                ]
            }
        }
        const trip = await planFromTrip({
            values: { pickupDate: '2027-01-13', dropDate: '2027-01-17', pickupLocation: 'Delhi' },
            region: 'Diwali Getaways 2026',
            enquiry: '',
            extra: '',
            ask
        })
        expect(trip.status).toBe('needs-input')
        expect(trip.questions[0].text).toContain('Jaipur, Udaipur')
        // ? only the reading step ran: no route, days or text were asked for
        expect(asked).toHaveLength(1)
    })
})

describe('the guest’s own places are the route', () => {
    test('nights as given; a place without nights shares what the dates leave, at least one night', () => {
        expect(
            routeFromPlaces([
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 3 }
            ])
        ).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 3 }
        ])
        expect(routeFromPlaces([{ name: 'Shimla', nights: 2 }, { name: 'Manali' }, { name: 'Kasol' }], 7)).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 3 },
            { name: 'Kasol', nights: 2 }
        ])
        expect(routeFromPlaces([{ name: 'Shimla', nights: 5 }, { name: 'Manali' }], 4)).toEqual([
            { name: 'Shimla', nights: 5 },
            { name: 'Manali', nights: 1 }
        ])
        // ? nights unknown and no dates: the planner reads them from the places as written
        expect(routeFromPlaces([{ name: 'Shimla' }])).toEqual([])
        expect(routeFromPlaces([])).toEqual([])
    })

    test('with places on the lead, a trip named "Diwali Getaways 2026" is planned along them, without asking', async () => {
        const { ask } = fakeModel()
        const trip = await planFromTrip({
            values: { ...TRIP, leadRemarks: '' },
            region: 'Diwali Getaways 2026',
            enquiry: '',
            extra: '',
            places: [{ name: 'Manali', nights: 5 }],
            ask
        })
        expect(trip.status).toBe('ready')
        expect(trip.requirements.destinations).toEqual([expect.objectContaining({ name: 'Manali', nights: 5 })])
    })

    test('the notes name the places first, in order', () => {
        const text = notesFromTrip({ values: {}, places: [{ name: 'Shimla', nights: 2 }, { name: 'Manali' }] })
        expect(text.split('\n')[0]).toBe('Places the guest wants, in this order: Shimla 2 nights, Manali.')
    })
})
