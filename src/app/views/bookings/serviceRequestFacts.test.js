import { describe, expect, test } from 'vitest'
import {
    draftPayload,
    draftProblem,
    isOpen,
    lineDefaults,
    openOf,
    requestDraft,
    requestState,
    requestSummary,
    rightsOf
} from './serviceRequestFacts'

describe('what a person may do about hotels and transport', () => {
    test('the server says: operations manages, accounts reads and pays, sales neither', () => {
        expect(rightsOf({ access: { suppliers: 'manage', pay: false } })).toEqual({
            suppliers: 'manage',
            manage: true,
            view: true,
            pay: false
        })
        expect(rightsOf({ access: { suppliers: 'view', pay: true } })).toMatchObject({
            manage: false,
            view: true,
            pay: true
        })
        expect(rightsOf({ access: { suppliers: 'none', pay: false } })).toMatchObject({
            manage: false,
            view: false,
            pay: false
        })
    })

    test('a server that does not say is an older one that let everyone: the page keeps working', () => {
        expect(rightsOf({ id: 1 })).toEqual({ suppliers: 'manage', manage: true, view: true, pay: true })
        expect(rightsOf(null)).toMatchObject({ manage: true })
    })
})

describe('a request in words', () => {
    const hotel = { type: 'Hotel', place: 'Manali', startDate: '2026-12-12', endDate: '2026-12-15', quantity: 2 }

    test('says what the guest needs', () => {
        expect(requestSummary(hotel)).toBe('Hotel in Manali · 12 Dec 2026 – 15 Dec 2026 · 2 rooms')
        expect(requestSummary({ type: 'Taxi', place: 'Delhi to Shimla', quantity: 1 })).toBe(
            'Transport: Delhi to Shimla · 1 vehicle'
        )
        expect(requestSummary({ type: 'Hotel', place: 'Kasol' })).toBe('Hotel in Kasol')
    })

    test('says how it stands: waiting, booked by whom, declined and why, or withdrawn', () => {
        expect(requestState({ status: 'Open' })).toMatchObject({ label: 'Waiting for operations', detail: '' })
        expect(requestState({ status: 'Done', repliedByName: 'Anil Verma' }).label).toBe('Booked by Anil Verma')
        expect(requestState({ status: 'Declined', repliedByName: 'Anil Verma', reply: 'No rooms' })).toMatchObject({
            label: 'Declined by Anil Verma',
            detail: 'No rooms'
        })
        expect(requestState({ status: 'Cancelled' }).label).toBe('Withdrawn')
        expect(requestState({ status: 'Done' }).label).toBe('Booked')
    })

    test('only an open request is waiting', () => {
        const list = [{ status: 'Open' }, { status: 'Done' }, { status: 'Cancelled' }]
        expect(openOf(list)).toEqual([{ status: 'Open' }])
        expect(isOpen({ status: 'Declined' })).toBe(false)
    })
})

describe('the form sales fills in', () => {
    const guest = {
        pickupDate: '2026-12-12T00:00:00.000Z',
        dropDate: '2026-12-17T00:00:00.000Z',
        rooms: 2,
        pickupLocation: 'Delhi',
        dropLocation: 'Shimla'
    }

    test('starts from the guest’s trip: the place of the quote, the dates, the rooms', () => {
        expect(requestDraft('Hotel', guest, 'Shimla')).toEqual({
            type: 'Hotel',
            place: 'Shimla',
            startDate: '2026-12-12',
            endDate: '2026-12-17',
            quantity: '2',
            note: ''
        })
    })

    test('transport starts from the route and one vehicle', () => {
        expect(requestDraft('Taxi', guest, 'Shimla')).toMatchObject({ place: 'Delhi to Shimla', quantity: '1' })
        expect(requestDraft('Taxi', {}, 'Shimla')).toMatchObject({ place: 'Shimla', startDate: '', quantity: '1' })
    })

    test('what is wrong is said before anything is sent', () => {
        const draft = { type: 'Hotel', place: 'Manali', startDate: '', endDate: '', quantity: '', note: '' }
        expect(draftProblem(draft)).toBe('')
        expect(draftProblem({ ...draft, place: '  ' })).toBe('Say where the guest needs the hotel')
        expect(draftProblem({ ...draft, type: 'Taxi', place: '' })).toBe('Say the route the guest needs')
        expect(draftProblem({ ...draft, startDate: '2026-12-15', endDate: '2026-12-12' })).toBe(
            'The last date is before the first'
        )
        expect(draftProblem({ ...draft, quantity: '0' })).toBe('Rooms must be a whole number from 1 to 99')
        expect(draftProblem({ ...draft, type: 'Taxi', place: 'x', quantity: '100' })).toBe(
            'Vehicles must be a whole number from 1 to 99'
        )
        expect(draftProblem({ ...draft, note: 'n'.repeat(1001) })).toBe('Keep the note under 1000 characters')
    })

    test('is sent without what was left empty, and never with a name: the server knows who is asking', () => {
        expect(
            draftPayload(7, { type: 'Hotel', place: ' Manali ', startDate: '', endDate: '', quantity: '', note: ' ' })
        ).toEqual({
            packageId: 7,
            type: 'Hotel',
            place: 'Manali',
            startDate: undefined,
            endDate: undefined,
            quantity: undefined,
            note: undefined
        })
        const full = draftPayload(7, {
            type: 'Hotel',
            place: 'Manali',
            startDate: '2026-12-12',
            endDate: '2026-12-15',
            quantity: '2',
            note: 'near the mall'
        })
        expect(full).toMatchObject({ quantity: 2, note: 'near the mall' })
        expect(Object.keys(full)).not.toContain('requestedByName')
    })
})

describe('operations adding what was asked for', () => {
    test('starts from the request’s dates and count, and from nothing it did not say', () => {
        expect(lineDefaults({ type: 'Hotel', startDate: '2026-12-12', endDate: '2026-12-15', quantity: 2 })).toEqual({
            startDate: '2026-12-12',
            endDate: '2026-12-15',
            quantity: '2'
        })
        expect(lineDefaults({ type: 'Hotel', place: 'Manali' })).toEqual({})
    })
})
