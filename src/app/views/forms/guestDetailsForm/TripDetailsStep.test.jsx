import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import TripDetailsStep from './TripDetailsStep'

// ? the agency's own vehicles (Vehicles screen): none loaded means the server has no list yet, so the built-in one is offered
const vehicles = vi.hoisted(() => ({ response: undefined }))
vi.mock('@/app/store/slices/api/vehicleSlice', () => ({ useGetVehiclesQuery: () => ({ data: vehicles.response }) }))

beforeEach(() => {
    vehicles.response = undefined
})

const open = (values = {}) => {
    const onSave = vi.fn()
    render(
        <TripDetailsStep
            initialValues={{ adults: '2', pickupDate: '2026-12-12', ...values }}
            isNew={false}
            onSave={onSave}
        />
    )
    const more = screen.queryByRole('button', { name: /More details/i })
    if (more) fireEvent.click(more)
    return onSave
}

const pick = name => {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Vehicle' }))
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name }))
}

describe('the guest’s vehicle', () => {
    test('chosen from the agency’s list, and saved with the trip', async () => {
        const onSave = open()
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Vehicle' }))
        const names = within(screen.getByRole('listbox'))
            .getAllByRole('option')
            .map(option => option.textContent)
        expect(names).toEqual([
            'Not decided',
            'Alto',
            'Sedan',
            'SUV (6 seater)',
            'SUV (7 seater)',
            'Innova Crysta',
            'Ertiga',
            'Tempo Traveller',
            'Tempo Traveller 12 seater',
            'Tempo Traveller 17 seater',
            'Tempo Traveller 22 seater',
            'Tempo Traveller 26 seater',
            'Tempo Traveller 32 seater',
            'Volvo',
            'Volvo + Alto',
            'Volvo + SUV',
            'Volvo + Sedan',
            'No vehicle'
        ])
        fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Volvo + SUV' }))
        fireEvent.click(screen.getByRole('button', { name: /save|continue|next/i }))
        await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ taxiType: 'Volvo + SUV' })))
    })

    test('a vehicle saved before the list changed still shows', () => {
        open({ taxiType: 'Hatchback' })
        expect(screen.getByRole('combobox', { name: 'Vehicle' })).toHaveTextContent('Hatchback')
        pick('Ertiga')
        expect(screen.getByRole('combobox', { name: 'Vehicle' })).toHaveTextContent('Ertiga')
    })
})

describe('the guest’s vehicle, from the agency’s own list', () => {
    const agency = list => ({ data: list, summary: { ready: true, canEdit: true } })
    const options = () => {
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Vehicle' }))
        return within(screen.getByRole('listbox'))
            .getAllByRole('option')
            .map(option => option.textContent)
    }

    test('offers its vehicles, a Volvo, a Volvo with each car, and no vehicle — not the built-in list', () => {
        vehicles.response = agency([
            { id: 1, name: 'Sedan', seats: 4, active: true },
            { id: 2, name: 'Innova Crysta', seats: 7, active: true },
            { id: 3, name: 'Mini Bus 32 seater', seats: 32, active: true },
            { id: 4, name: 'Winger', seats: null, active: true }
        ])
        open()
        expect(options()).toEqual([
            'Not decided',
            'Sedan',
            'Innova Crysta',
            'Mini Bus 32 seater',
            'Winger',
            'Volvo',
            'Volvo + Sedan',
            'Volvo + Innova Crysta',
            'No vehicle'
        ])
    })

    test('a vehicle that is hidden is not offered', () => {
        vehicles.response = agency([
            { id: 1, name: 'Sedan', seats: 4, active: true },
            { id: 2, name: 'Old Swift', seats: 4, active: false }
        ])
        open()
        const offered = options()
        expect(offered).toContain('Sedan')
        expect(offered).not.toContain('Old Swift')
        expect(offered).not.toContain('Volvo + Old Swift')
    })

    test('a vehicle of its own can be chosen and is saved with the trip', async () => {
        vehicles.response = agency([{ id: 1, name: 'Mini Bus 32 seater', seats: 32, active: true }])
        const onSave = open()
        pick('Mini Bus 32 seater')
        fireEvent.click(screen.getByRole('button', { name: /save|continue|next/i }))
        await waitFor(() =>
            expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ taxiType: 'Mini Bus 32 seater' }))
        )
    })

    test('a trip saved with a vehicle that is no longer listed still shows it', () => {
        vehicles.response = agency([{ id: 1, name: 'Sedan', seats: 4, active: true }])
        open({ taxiType: 'Volvo + Alto' })
        expect(screen.getByRole('combobox', { name: 'Vehicle' })).toHaveTextContent('Volvo + Alto')
    })

    test('an agency that has hidden or removed them all is offered none of the built-in ones', () => {
        vehicles.response = agency([])
        open()
        expect(options()).toEqual(['Not decided', 'Volvo', 'No vehicle'])
    })
})
