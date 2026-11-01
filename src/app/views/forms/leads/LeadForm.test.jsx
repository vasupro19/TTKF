import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import LeadsForm from './index'

const { api, mutation, dispatch } = vi.hoisted(() => ({
    api: { createLead: vi.fn(), createGuest: vi.fn(), assistAi: vi.fn(), updateLead: vi.fn(), updatePlaces: vi.fn() },
    mutation: fn => () => [
        (...args) => ({ unwrap: () => Promise.resolve().then(() => fn(...args)) }),
        { isLoading: false }
    ],
    dispatch: vi.fn(action => action)
}))

vi.mock('react-redux', () => ({
    useDispatch: () => dispatch,
    useSelector: select => select({ loading: {}, auth: { user: { email: 'priya@kart.com' } } })
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useCreateLeadMutation: mutation((...args) => api.createLead(...args)),
    useUpdateLeadMutation: mutation((...args) => api.updateLead(...args)),
    useUpdateLeadPlacesMutation: mutation((...args) => api.updatePlaces(...args)),
    useGetLeadAccessQuery: () => ({ data: { canSeeLeadSource: false } }),
    useGetAssigneesQuery: () => ({ data: { data: [{ id: 7, name: 'Priya', isMe: true }] } }),
    getLeadById: { initiate: () => ({}) }
}))
vi.mock('@/app/store/slices/api/usersSlice', () => ({
    useGetUsersQuery: () => ({ data: { data: [{ id: 7, name: 'Priya', email: 'priya@kart.com' }] } })
}))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({
    useGetCampaignsQuery: () => ({
        data: {
            data: [
                { id: 1, title: 'Himachal' },
                { id: 2, title: 'Kashmir' }
            ]
        }
    })
}))
vi.mock('@/app/store/slices/api/aiSlice', () => ({
    useAssistAiMutation: mutation((...args) => api.assistAi(...args))
}))
vi.mock('@/app/store/slices/api/guestSlice', () => ({
    useCreateGuestDetailMutation: mutation((...args) => api.createGuest(...args))
}))
vi.mock('@/app/store/slices/api/destinationSlice', () => ({
    useGetDestinationClientsQuery: () => ({
        data: {
            data: [
                { id: 1, name: 'Manali', campaignId: 1 },
                { id: 2, name: 'Gulmarg', campaignId: 2 }
            ]
        }
    })
}))
vi.mock('@/app/views/vehicles/useVehicles', () => ({
    default: () => ({ names: ['Sedan', 'Innova Crysta'], choices: [], ready: true })
}))

const ENQUIRY = 'Hi I am Rohit Sharma, 4 adults Manali 5 nights from 15 Dec, 3 star, Innova from Delhi. 98765 43210'

const renderForm = () =>
    render(
        <MemoryRouter initialEntries={['/leads/add']}>
            <Routes>
                <Route path='/leads/add' element={<LeadsForm />} />
            </Routes>
        </MemoryRouter>
    )

const aiAnswers = json => api.assistAi.mockResolvedValue({ content: [{ text: JSON.stringify(json) }] })

beforeEach(() => {
    vi.clearAllMocks()
    api.createLead.mockImplementation(payload => ({ success: true, data: { id: 41, ...payload } }))
    api.createGuest.mockImplementation(payload => ({ success: true, data: { id: 'g1', ...payload } }))
})

describe('the places the guest wants', () => {
    test('typed by hand, in order, and sent with the new lead', async () => {
        renderForm()
        fireEvent.change(screen.getByRole('textbox', { name: /Full name/ }), {
            target: { name: 'fullName', value: 'Asha' }
        })
        fireEvent.change(screen.getByRole('textbox', { name: /Phone number/ }), {
            target: { name: 'phone', value: '9876543210' }
        })
        fireEvent.change(screen.getByRole('combobox', { name: 'Place' }), { target: { value: 'Shimla' } })
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Nights in Shimla' }), { target: { value: '2' } })
        fireEvent.click(screen.getByRole('button', { name: 'Add a place' }))
        fireEvent.change(screen.getByRole('combobox', { name: 'Place 2' }), { target: { value: 'Manali' } })
        fireEvent.click(screen.getByRole('button', { name: 'Create lead' }))

        await waitFor(() => expect(api.createLead).toHaveBeenCalledTimes(1))
        expect(api.createLead.mock.calls[0][0].places).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: null }
        ])
    })
})

describe('Add a lead from a pasted enquiry', () => {
    test('AI fills the lead and its trip; creating saves both, with the guest’s own words', async () => {
        aiAnswers({
            fullName: 'Rohit Sharma',
            phone: '98765 43210',
            trip: 'Himachal',
            startDate: '2099-12-15',
            nights: 5,
            adults: 4,
            hotelCategory: 'Deluxe',
            vehicle: 'Innova',
            pickupLocation: 'Delhi',
            // ? Kasol is not in the enquiry: never kept
            places: [
                { name: 'Manali', nights: 5 },
                { name: 'Kasol', nights: 1 }
            ],
            wishes: 'Manali 5 nights'
        })
        renderForm()

        fireEvent.change(screen.getByLabelText('WhatsApp message, email or call notes'), {
            target: { value: ENQUIRY }
        })
        fireEvent.click(screen.getByRole('button', { name: 'Fill in with AI' }))

        expect(
            await screen.findByText(/Read the name, phone, trip \(Himachal\), places, dates, guests/)
        ).toBeInTheDocument()
        // ? the guest's places are filled in for the agent to check
        expect(screen.getByRole('combobox', { name: 'Place' })).toHaveValue('Manali')
        expect(screen.getByRole('spinbutton', { name: 'Nights in Manali' })).toHaveValue(5)
        expect(screen.queryByDisplayValue('Kasol')).not.toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: /Full name/ })).toHaveValue('Rohit Sharma')
        expect(screen.getByRole('textbox', { name: /Phone number/ })).toHaveValue('98765 43210')
        expect(screen.getByText('Trip details saved with the lead')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Create lead' }))

        await waitFor(() => expect(api.createGuest).toHaveBeenCalledTimes(1))
        expect(api.createLead.mock.calls[0][0]).toMatchObject({
            fullName: 'Rohit Sharma',
            phone: '+919876543210',
            campaignId: '1',
            remarks: 'Manali 5 nights',
            message: ENQUIRY,
            places: [{ name: 'Manali', nights: 5 }]
        })
        expect(api.createGuest.mock.calls[0][0]).toMatchObject({
            leadId: 41,
            adults: 4,
            pickupDate: '2099-12-15T00:00:00.000Z',
            dropDate: '2099-12-20T00:00:00.000Z',
            packageType: 'Deluxe',
            taxiType: 'Innova Crysta',
            pickupLocation: 'Delhi'
        })
    })

    test('nothing the agent typed is replaced, and “Don’t save” keeps the trip out', async () => {
        aiAnswers({ fullName: 'Rohit Sharma', phone: '98765 43210', adults: 4 })
        renderForm()

        fireEvent.change(screen.getByRole('textbox', { name: /Full name/ }), {
            target: { name: 'fullName', value: 'Rohit S. (Delhi)' }
        })
        fireEvent.change(screen.getByLabelText('WhatsApp message, email or call notes'), {
            target: { value: ENQUIRY }
        })
        fireEvent.click(screen.getByRole('button', { name: 'Fill in with AI' }))

        expect(await screen.findByText('Trip details saved with the lead')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: /Full name/ })).toHaveValue('Rohit S. (Delhi)')
        fireEvent.click(screen.getByRole('button', { name: 'Don’t save' }))
        fireEvent.click(screen.getByRole('button', { name: 'Create lead' }))

        await waitFor(() => expect(api.createLead).toHaveBeenCalledTimes(1))
        expect(api.createGuest).not.toHaveBeenCalled()
    })

    test('when the AI can’t be reached, the phone number is still read and the agent is told', async () => {
        api.assistAi.mockRejectedValue({ status: 503 })
        renderForm()

        fireEvent.change(screen.getByLabelText('WhatsApp message, email or call notes'), {
            target: { value: ENQUIRY }
        })
        fireEvent.click(screen.getByRole('button', { name: 'Fill in with AI' }))

        expect(await screen.findByText(/The AI couldn’t be reached just now, so only the phone/)).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: /Phone number/ })).toHaveValue('98765 43210')
    })
})
