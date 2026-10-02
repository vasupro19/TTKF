import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import SupplierAssignmentForm from './supplierAssignment'

vi.mock('@/app/store/slices/api/supplierSlice', () => ({
    useGetSuppliersQuery: () => ({
        data: { data: [{ id: 3, businessname: 'Lucky Bhai Manali', city: 'Manali' }] },
        isLoading: false
    })
}))

const changes = vi.fn()
const last = () => changes.mock.calls[changes.mock.calls.length - 1][0]

// ? stable, as the booking page passes it, so the form does not reset on every render
const newTransport = {
    guestName: 'Mr. Vishal',
    defaults: {
        quantity: '1',
        startDate: '2026-10-02',
        details: { vehicleType: 'Tempo Traveller 17 seater', pickupPoint: 'Manali Volvo stand', dropPoint: 'Bhuntar' }
    }
}

beforeEach(() => changes.mockClear())

describe('transport', () => {
    test('a new line starts from the trip: vehicle, pickup, drop and the start date', () => {
        render(<SupplierAssignmentForm type='Taxi' row={newTransport} onDataChange={changes} />)
        expect(screen.getByLabelText('Vehicle type')).toHaveValue('Tempo Traveller 17 seater')
        expect(screen.getByLabelText('Pickup point')).toHaveValue('Manali Volvo stand')
        expect(screen.getByLabelText('Drop point')).toHaveValue('Bhuntar')
        expect(screen.getByLabelText('Start date')).toHaveValue('2026-10-02')
        expect(screen.getByLabelText('Vehicles')).toHaveValue(1)
    })

    test('pickup time and the driver are captured with the rest', () => {
        render(<SupplierAssignmentForm type='Taxi' row={newTransport} onDataChange={changes} />)
        fireEvent.change(screen.getByLabelText('Pickup time'), { target: { value: '08:00' } })
        fireEvent.change(screen.getByLabelText('Driver name'), { target: { value: 'Ramesh' } })
        fireEvent.change(screen.getByLabelText('Driver phone'), { target: { value: '9816000000' } })
        fireEvent.change(screen.getByLabelText('Agreed cost'), { target: { value: '35000' } })
        expect(last()).toMatchObject({
            cost: '35000',
            details: {
                vehicleType: 'Tempo Traveller 17 seater',
                pickupPoint: 'Manali Volvo stand',
                pickupTime: '08:00',
                driverName: 'Ramesh',
                driverPhone: '9816000000'
            }
        })
    })

    test('editing a saved line shows its saved details', () => {
        const saved = {
            id: 9,
            supplierId: 3,
            type: 'Taxi',
            cost: '35000',
            details: { vehicleType: 'Innova', driverName: 'Ramesh' }
        }
        render(<SupplierAssignmentForm type='Taxi' row={saved} onDataChange={changes} />)
        expect(screen.getByLabelText('Vehicle type')).toHaveValue('Innova')
        expect(screen.getByLabelText('Driver name')).toHaveValue('Ramesh')
        expect(screen.getByLabelText('Transporter')).toHaveValue('Lucky Bhai Manali (Manali)')
    })
})

describe('hotel', () => {
    const newHotel = {
        guestName: 'Mr. Vishal',
        defaults: { quantity: '4', roomType: 'Deluxe', details: { mealPlan: 'MAP' } }
    }

    test('rooms, room type and meal plan, and no transport fields', () => {
        render(<SupplierAssignmentForm type='Hotel' row={newHotel} onDataChange={changes} />)
        expect(screen.getByLabelText('Rooms')).toHaveValue(4)
        expect(screen.getByLabelText('Room type')).toHaveValue('Deluxe')
        expect(screen.getByRole('combobox', { name: 'Meal plan' })).toHaveTextContent('Breakfast & dinner (MAP)')
        expect(screen.queryByLabelText('Vehicle type')).not.toBeInTheDocument()

        fireEvent.change(screen.getByLabelText('Room type'), { target: { value: 'Swiss tent' } })
        expect(last()).toMatchObject({ roomType: 'Swiss tent', details: { mealPlan: 'MAP' } })
    })
})
