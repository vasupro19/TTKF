import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import MailSettingsDialog from './MailSettingsDialog'

const api = vi.hoisted(() => ({ settings: null, save: vi.fn(), test: vi.fn(), refetch: vi.fn(), snackbars: [] }))

vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'snackbar') api.snackbars.push(action.payload)
        return action
    }
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/clientMailSlice', () => ({
    useGetClientMailQuery: () => ({
        data: { data: api.settings },
        isFetching: false,
        isError: false,
        refetch: api.refetch
    }),
    useSaveClientMailMutation: () => [
        payload => ({ unwrap: () => Promise.resolve(api.save(payload)) }),
        { isLoading: false }
    ],
    useTestClientMailMutation: () => [payload => ({ unwrap: () => Promise.resolve(api.test(payload)) })]
}))

const ready = () => ({
    setUp: true,
    encryptionReady: true,
    server: { host: '', port: null, secure: false },
    platformServer: { host: 'smtp.gmail.com', port: 587 },
    agency: { email: 'hello@travelkart.in', hasPassword: true },
    supplier: { email: '', name: '', hasPassword: false },
    users: [
        { id: 1, name: 'Priya Sharma', email: 'priya@travelkart.in', hasPassword: true },
        { id: 2, name: 'Rohit', email: 'rohit@travelkart.in', hasPassword: false }
    ]
})

const renderDialog = () => render(<MailSettingsDialog open client={{ id: 5, name: 'TravelKart' }} onClose={vi.fn()} />)
const section = label => screen.getByRole('region', { name: label })

beforeEach(() => {
    vi.clearAllMocks()
    api.snackbars = []
    api.settings = ready()
    api.save.mockImplementation(() => ({ success: true, message: 'Email settings saved for TravelKart' }))
    api.test.mockImplementation(() => ({ data: { ok: true, message: 'reservations@travelkart.in signed in.' } }))
})

describe('a client’s email settings', () => {
    test('shows the server in use, each mailbox — never a password — and which users send from their own', () => {
        renderDialog()
        expect(screen.getByText(/Leave empty to use smtp\.gmail\.com:587/)).toBeInTheDocument()
        expect(within(section('Agency mailbox')).getByText('Password saved')).toBeInTheDocument()
        expect(within(section('Supplier mailbox')).getByText('No password')).toBeInTheDocument()
        expect(screen.getByText(/1 of 2 users can send from their own mailbox: Priya Sharma/)).toBeInTheDocument()
    })

    test('a provider fills the server; the supplier mailbox is tested with what is typed, then saved', async () => {
        renderDialog()
        fireEvent.click(screen.getByRole('button', { name: 'Zoho (India)' }))
        const supplier = section('Supplier mailbox')
        fireEvent.change(within(supplier).getByLabelText('Email address'), {
            target: { value: 'reservations@travelkart.in' }
        })
        fireEvent.change(within(supplier).getByLabelText('Name suppliers see'), {
            target: { value: 'TravelKart Reservations' }
        })
        fireEvent.change(within(supplier).getByLabelText('App password'), { target: { value: 'app-pass' } })

        fireEvent.click(within(supplier).getByRole('button', { name: 'Test' }))
        await waitFor(() =>
            expect(api.test).toHaveBeenCalledWith({
                id: 5,
                mailbox: 'supplier',
                server: { host: 'smtp.zoho.in', port: '465', secure: true },
                supplier: { email: 'reservations@travelkart.in', name: 'TravelKart Reservations', password: 'app-pass' }
            })
        )
        expect(await within(supplier).findByText('reservations@travelkart.in signed in.')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() =>
            expect(api.save).toHaveBeenCalledWith({
                id: 5,
                server: { host: 'smtp.zoho.in', port: '465', secure: true },
                supplier: { email: 'reservations@travelkart.in', name: 'TravelKart Reservations', password: 'app-pass' }
            })
        )
    })

    test('a saved password is kept unless replaced, and removed only on request', async () => {
        renderDialog()
        const agency = section('Agency mailbox')
        fireEvent.click(within(agency).getByRole('button', { name: 'Remove' }))
        expect(within(agency).getByText('Password will be removed when you save')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() =>
            expect(api.save).toHaveBeenCalledWith({ id: 5, agency: { email: 'hello@travelkart.in', password: '' } })
        )
    })

    test('a server not set up yet says how to fix it', () => {
        api.settings = { ...ready(), setUp: false }
        renderDialog()
        expect(screen.getByText(/setupMailSettings\.js --fix/)).toBeInTheDocument()
        expect(screen.queryByRole('region', { name: 'Supplier mailbox' })).not.toBeInTheDocument()
    })
})
