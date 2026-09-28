import { describe, expect, test } from 'vitest'
import {
    emptyTripDetails,
    fromGuestDetail,
    hasMoreDetails,
    suggestedRooms,
    toGuestPayload,
    tripSummary,
    validateTripDetails
} from './tripDetails'

const withValues = values => ({ ...emptyTripDetails(), ...values })

describe('trip details', () => {
    test('only adults and the start date are required', () => {
        expect(validateTripDetails(emptyTripDetails())).toEqual({
            adults: 'How many adults?',
            pickupDate: 'When does the trip start?'
        })
        expect(validateTripDetails(withValues({ adults: '2', pickupDate: '2026-10-05' }))).toEqual({})
        // ? formik gives type="number" inputs numbers
        expect(validateTripDetails(withValues({ adults: 2, pickupDate: '2026-10-05' }))).toEqual({})
    })

    test('optional numbers only have to make sense', () => {
        const errors = validateTripDetails(
            withValues({ adults: '0', children: '-1', rooms: '0', extraBedding: '1.5', pickupDate: '2026-10-05' })
        )
        expect(errors).toEqual({
            adults: 'At least 1 adult',
            children: 'Children can’t be negative',
            rooms: 'At least 1 room',
            extraBedding: 'Extra beds must be a whole number'
        })
    })

    test('the trip cannot end before it starts', () => {
        expect(
            validateTripDetails(withValues({ adults: '2', pickupDate: '2026-10-05', dropDate: '2026-10-01' })).dropDate
        ).toBe('The trip can’t end before it starts')
    })

    test('rooms follow the party size, two adults to a room', () => {
        expect(suggestedRooms('1')).toBe('1')
        expect(suggestedRooms(2)).toBe('1')
        expect(suggestedRooms('5')).toBe('3')
        expect(suggestedRooms('')).toBe('')
    })

    test('the payload sends numbers, midnight-UTC dates, and null for anything left empty', () => {
        const payload = toGuestPayload(
            withValues({ adults: '2', children: 1, pickupDate: '2026-10-05', foodPlan: 'CP', leadRemarks: '  ' }),
            7
        )
        expect(payload).toMatchObject({
            leadId: 7,
            adults: 2,
            children: 1,
            rooms: null,
            extraBedding: null,
            pickupDate: '2026-10-05T00:00:00.000Z',
            dropDate: null,
            foodPlan: 'CP',
            leadRemarks: null,
            tourType: null
        })
    })

    test('a saved record comes back as form values, dates as YYYY-MM-DD', () => {
        const values = fromGuestDetail({
            id: 'g1',
            adults: 2,
            children: 0,
            rooms: null,
            pickupDate: '2026-10-05T00:00:00.000Z',
            dropDate: null,
            packageType: 'Deluxe'
        })
        expect(values).toMatchObject({ adults: '2', children: '0', rooms: '', pickupDate: '2026-10-05', dropDate: '' })
        expect(values.packageType).toBe('Deluxe')
        expect(values.id).toBeUndefined()
    })

    test('"More details" opens by itself only when one of its fields has a value', () => {
        expect(hasMoreDetails(withValues({ adults: '2', foodPlan: 'CP' }))).toBe(false)
        expect(hasMoreDetails(withValues({ leadRemarks: 'Wants a river view' }))).toBe(true)
    })

    test('one summary line for the itinerary step', () => {
        expect(
            tripSummary(
                withValues({
                    adults: '2',
                    children: '1',
                    pickupDate: '2026-10-05',
                    dropDate: '2026-10-10',
                    packageType: 'Deluxe',
                    foodPlan: 'CP'
                })
            )
        ).toBe('2 adults, 1 child · 5 Oct – 10 Oct · Deluxe · Breakfast')
        expect(tripSummary(withValues({ adults: '1', pickupDate: '2026-10-05' }))).toBe('1 adult · from 5 Oct')
    })
})
