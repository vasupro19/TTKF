import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import VehiclesPage from './VehiclesPage'

const api = vi.hoisted(() => ({ response: null, error: null, loading: false, save: null, snackbars: [] }))

vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'snackbar') api.snackbars.push(action.payload.message)
        return action
    },
    useSelector: select => select({ loading: {} })
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/vehicleSlice', () => ({
    useGetVehiclesQuery: () => ({ data: api.response, isLoading: api.loading, error: api.error }),
    useSaveVehiclesMutation: () => [api.save, { isLoading: false }]
}))

const list = (rows, summary = { ready: true, canEdit: true }) => ({ data: rows, summary })
const saved = [
    { id: 1, name: 'Sedan', seats: 4, active: true },
    { id: 2, name: 'Innova Crysta', seats: 7, active: true }
]

beforeEach(() => {
    vi.clearAllMocks()
    api.response = list(saved)
    api.error = null
    api.loading = false
    api.snackbars = []
    api.save = vi.fn(() => ({ unwrap: () => Promise.resolve({ message: 'Vehicles saved' }) }))
})

const add = () => fireEvent.click(screen.getByRole('button', { name: 'Add a vehicle' }))

describe('the vehicle list', () => {
    test('shows the agency’s vehicles with their seats', () => {
        render(<VehiclesPage />)
        expect(screen.getByRole('heading', { name: 'Vehicles' })).toBeInTheDocument()
        expect(screen.getByLabelText('Vehicle, row 1')).toHaveValue('Sedan')
        expect(screen.getByLabelText('Seats, row 1')).toHaveValue('4')
        expect(screen.getByLabelText('Vehicle, row 2')).toHaveValue('Innova Crysta')
        expect(screen.getByText('All saved')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save vehicles' })).toBeDisabled()
    })

    test('adds a vehicle of its own, and sends only what is new', async () => {
        render(<VehiclesPage />)
        add()
        fireEvent.change(screen.getByLabelText('Vehicle, row 3'), { target: { value: 'Mini Bus 32 seater' } })
        fireEvent.change(screen.getByLabelText('Seats, row 3'), { target: { value: '3a2' } })
        expect(screen.getByLabelText('Seats, row 3')).toHaveValue('32')
        expect(screen.getByText('Changes not saved')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Save vehicles' }))
        await waitFor(() =>
            expect(api.save).toHaveBeenCalledWith({
                rows: [{ name: 'Mini Bus 32 seater', seats: '32', active: true }],
                removeIds: []
            })
        )
        await waitFor(() => expect(api.snackbars).toContain('Vehicles saved'))
    })

    test('a saved vehicle’s name cannot be changed: rates and trips use it', () => {
        render(<VehiclesPage />)
        expect(screen.getByLabelText('Vehicle, row 1')).toBeDisabled()
        add()
        expect(screen.getByLabelText('Vehicle, row 3')).toBeEnabled()
    })

    test('its seats can change, and it can be hidden from the lists', async () => {
        render(<VehiclesPage />)
        fireEvent.change(screen.getByLabelText('Seats, row 1'), { target: { value: '5' } })
        fireEvent.click(screen.getByLabelText('Show in lists, row 2'))
        fireEvent.click(screen.getByRole('button', { name: 'Save vehicles' }))
        await waitFor(() =>
            expect(api.save).toHaveBeenCalledWith({
                rows: [
                    { id: 1, name: 'Sedan', seats: '5', active: true },
                    { id: 2, name: 'Innova Crysta', seats: '7', active: false }
                ],
                removeIds: []
            })
        )
    })

    test('removing sends the id to remove, and a vehicle that was never saved just goes', async () => {
        render(<VehiclesPage />)
        fireEvent.click(screen.getByLabelText('Remove vehicle 1'))
        expect(screen.queryByDisplayValue('Sedan')).not.toBeInTheDocument()
        add()
        fireEvent.click(screen.getByLabelText('Remove vehicle 2'))
        fireEvent.click(screen.getByRole('button', { name: 'Save vehicles' }))
        await waitFor(() => expect(api.save).toHaveBeenCalledWith({ rows: [], removeIds: [1] }))
    })

    test('the same vehicle twice is said at once, and nothing is sent', () => {
        render(<VehiclesPage />)
        add()
        fireEvent.change(screen.getByLabelText('Vehicle, row 3'), { target: { value: ' sedan ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save vehicles' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Row 3: sedan is already listed')
        expect(api.save).not.toHaveBeenCalled()
    })

    test('a name that cannot be used says why', () => {
        render(<VehiclesPage />)
        add()
        fireEvent.change(screen.getByLabelText('Vehicle, row 3'), { target: { value: 'Volvo + Alto' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save vehicles' }))
        expect(screen.getByRole('alert')).toHaveTextContent(/“\+”/)
        expect(api.save).not.toHaveBeenCalled()
    })

    test('what the server refuses is shown above the list, and the changes are kept', async () => {
        api.save = vi.fn(() => ({
            unwrap: () =>
                Promise.reject(
                    Object.assign(new Error('refused'), { data: { message: 'Mini Bus is already in the list' } })
                )
        }))
        render(<VehiclesPage />)
        add()
        fireEvent.change(screen.getByLabelText('Vehicle, row 3'), { target: { value: 'Mini Bus' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save vehicles' }))
        expect(await screen.findByText('Mini Bus is already in the list')).toBeInTheDocument()
        expect(screen.getByLabelText('Vehicle, row 3')).toHaveValue('Mini Bus')
    })

    test('discarding puts the list back', () => {
        render(<VehiclesPage />)
        add()
        fireEvent.change(screen.getByLabelText('Vehicle, row 3'), { target: { value: 'Mini Bus' } })
        fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
        expect(screen.queryByLabelText('Vehicle, row 3')).not.toBeInTheDocument()
        expect(screen.getByText('All saved')).toBeInTheDocument()
    })

    test('someone who may only read it cannot add, change or remove', () => {
        api.response = list(saved, { ready: true, canEdit: false })
        render(<VehiclesPage />)
        expect(screen.getByText(/operations team and the agency’s admins change this list/)).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Add a vehicle' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Save vehicles' })).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Remove vehicle 1')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Seats, row 1')).toBeDisabled()
    })

    test('an empty list invites the first vehicle', () => {
        api.response = list([])
        render(<VehiclesPage />)
        expect(screen.getByText('No vehicles yet. Add the ones you quote and book.')).toBeInTheDocument()
    })

    test('a server without the list yet says what to run, and the forms keep the built-in vehicles', () => {
        api.response = { data: [], summary: { ready: false, canEdit: false } }
        render(<VehiclesPage />)
        expect(screen.getByText(/upgradeQuotes\.js --fix/)).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Add a vehicle' })).not.toBeInTheDocument()
    })

    test('a list that cannot load says so', () => {
        api.response = undefined
        api.error = { status: 500 }
        render(<VehiclesPage />)
        expect(screen.getByText('Couldn’t load the vehicles. Please reload the page.')).toBeInTheDocument()
        expect(within(document.body).queryByRole('table')).not.toBeInTheDocument()
    })
})
