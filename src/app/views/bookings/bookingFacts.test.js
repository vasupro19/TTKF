import { describe, expect, test } from 'vitest'
import {
    STEPS,
    doneCount,
    guestMoney,
    nextStep,
    progressOf,
    rupees,
    stageOf,
    stepsFor,
    supplierMoney,
    urgency
} from './bookingFacts'

const row = over => ({
    id: 1,
    leadId: 11,
    guestName: 'Asha Verma',
    phone: '9876543210',
    sellingPrice: '90000.00',
    guestPaidAmount: '45000.00',
    guestPaymentStatus: 'Partially Paid',
    hotelAssigned: true,
    taxiAssigned: false,
    supplierPaymentStatus: 'Unpaid',
    status: 'Confirmed',
    ...over
})

describe('booking facts', () => {
    test('the next step is the first one not done, in the order an agent works', () => {
        const progress = progressOf({ booking: row() })
        expect(nextStep(progress).next).toBe('Add transport')
        expect(nextStep(progressOf({ booking: row({ taxiAssigned: true }) })).next).toBe('Record the guest’s payment')
        expect(
            nextStep(
                progressOf({
                    booking: row({
                        taxiAssigned: true,
                        guestPaymentStatus: 'Fully Paid',
                        supplierPaymentStatus: 'Fully Paid'
                    })
                })
            ).next
        ).toBe('Send the voucher to the guest')
    })

    test('progress from a booking and its services matches the list flags', () => {
        const services = [
            { type: 'Hotel', paymentStatus: 'Fully Paid' },
            { type: 'Taxi', paymentStatus: 'Partially Paid' }
        ]
        expect(progressOf({ booking: row(), services })).toEqual({
            hotel: true,
            taxi: true,
            guestPaid: false,
            suppliersPaid: false,
            voucher: false
        })
    })

    test('stages: not started until something is booked, ready only when every step is done', () => {
        expect(stageOf(progressOf({ booking: row({ hotelAssigned: false }) }))).toBe('action')
        expect(stageOf(progressOf({ booking: row() }))).toBe('progress')
        expect(stageOf({ hotel: true, taxi: true, guestPaid: true, suppliersPaid: true, voucher: true })).toBe('ready')
    })

    test('money from decimal strings or numbers', () => {
        expect(guestMoney(row())).toEqual({ price: 90000, received: 45000, balance: 45000, share: 0.5 })
        expect(
            supplierMoney([
                { cost: '20000.00', paidAmount: 5000 },
                { cost: 15000, paidAmount: '0' }
            ])
        ).toEqual({
            cost: 35000,
            paid: 5000,
            due: 30000
        })
        expect(rupees('125000.5')).toBe('₹1,25,000.5')
    })

    test('a booking that is not ready and leaves within two weeks is flagged', () => {
        const today = new Date('2026-12-07T10:00:00Z')
        expect(urgency('2026-12-12T00:00:00.000Z', false, today)).toBe('travels in 5 days')
        expect(urgency('2026-12-08T00:00:00.000Z', false, today)).toBe('travels tomorrow')
        expect(urgency('2026-12-07T00:00:00.000Z', false, today)).toBe('travels today')
        expect(urgency('2026-12-12T00:00:00.000Z', true, today)).toBe('')
        expect(urgency('2027-01-12T00:00:00.000Z', false, today)).toBe('')
        expect(urgency(null, false, today)).toBe('')
    })
})

describe('the steps each person works through', () => {
    test('operations and accounts see all five', () => {
        expect(stepsFor('manage')).toBe(STEPS)
        expect(stepsFor('view')).toBe(STEPS)
        expect(stepsFor()).toBe(STEPS)
    })

    test('sales has four: no "Suppliers paid", and hotels and transport are asked for, not booked', () => {
        const steps = stepsFor('none')
        expect(steps.map(step => step.key)).toEqual(['hotel', 'taxi', 'guestPaid', 'voucher'])
        expect(steps.find(step => step.key === 'hotel')).toMatchObject({
            label: 'Hotel booked by operations',
            next: 'Ask operations for a hotel'
        })
        expect(steps.find(step => step.key === 'taxi')).toMatchObject({
            next: 'Ask operations for transport',
            section: 'hotels'
        })
        // ? the steps that are the same for everyone stay as they were
        expect(steps.find(step => step.key === 'voucher')).toEqual(STEPS.find(step => step.key === 'voucher'))
    })

    test('progress and the next step are counted over the steps given', () => {
        const progress = progressOf({ booking: row({ guestPaymentStatus: 'Fully Paid', taxiAssigned: true }) })
        const sales = stepsFor('none')
        // ? sales is done but for the voucher; everyone else is also waiting for the suppliers to be paid
        expect(doneCount(progress, sales)).toBe(3)
        expect(nextStep(progress, sales).key).toBe('voucher')
        expect(nextStep(progress).key).toBe('suppliersPaid')
    })
})
