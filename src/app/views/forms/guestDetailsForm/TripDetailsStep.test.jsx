import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import TripDetailsStep from './TripDetailsStep'

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
