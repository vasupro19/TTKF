import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import GuestForm from './index'

const { api, dispatch, thunk, mutation, idle } = vi.hoisted(() => {
    // ? dispatch(x.initiate(...)) resolves like RTK Query's thunk: { data } or { error }
    const thunkAction = result => ({ type: 'thunk', result })
    const mockDispatch = vi.fn(action => (action?.type === 'thunk' ? Promise.resolve(action.result()) : action))
    const mockMutation = fn => () => [
        (...args) => ({ unwrap: () => Promise.resolve(fn(...args)) }),
        { isLoading: false }
    ]
    return {
        api: {
            guestDetail: null,
            tourRows: [],
            createGuest: vi.fn(),
            updateGuest: vi.fn(),
            createTour: vi.fn(),
            updateTour: vi.fn(),
            removeTour: vi.fn()
        },
        dispatch: mockDispatch,
        thunk: thunkAction,
        mutation: mockMutation,
        idle: () => [vi.fn(), { isLoading: false }]
    }
})

vi.mock('react-redux', () => ({ useDispatch: () => dispatch, useSelector: select => select({ loading: {} }) }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/guestSlice', () => ({
    useCreateGuestDetailMutation: mutation((...args) => api.createGuest(...args)),
    useUpdateGuestDetailMutation: mutation((...args) => api.updateGuest(...args)),
    getGuestById: {
        initiate: () =>
            thunk(() => (api.guestDetail ? { data: { data: api.guestDetail } } : { error: { status: 400 } }))
    }
}))
vi.mock('@/app/store/slices/api/guestTourSlice', () => ({
    useCreateGuestTourMutation: mutation((...args) => api.createTour(...args)),
    useUpdateGuestTourMutation: mutation((...args) => api.updateTour(...args)),
    useRemoveGuestTourItenaryMutation: mutation((...args) => api.removeTour(...args)),
    useCreateSingleGuestTourItenaryMutation: idle,
    getGuestTourById: { initiate: () => thunk(() => ({ data: { data: api.tourRows } })) }
}))
vi.mock('@/app/store/slices/api/packageConvert', () => ({
    useGetPackageByLeadIdQuery: () => ({ data: undefined }),
    useConvertPackageMutation: idle
}))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useShareLeadDetailsMutation: idle,
    useGetLeadByIdQuery: () => ({ data: { data: { fullName: 'Asha Verma', phone: '9999999999', campaignId: 1 } } }),
    getLeadPreview: { initiate: () => thunk(() => ({ data: { data: { html: '' } } })) }
}))
vi.mock('@/app/store/slices/api/aiSlice', () => ({
    useAssistAiMutation: idle,
    useGetTravelImagesQuery: () => ({ data: undefined, isLoading: false })
}))
vi.mock('@/app/store/slices/api/packageSlice', () => ({
    useGetAllPackagesClientQuery: () => ({
        data: {
            data: [
                {
                    id: 5,
                    name: 'Manali Escape',
                    packageItenaries: [
                        {
                            id: 51,
                            title: 'Arrive Manali',
                            itenary: { id: 901 },
                            destination: { id: 31 },
                            entryType: 'Stay'
                        },
                        {
                            id: 52,
                            title: 'Solang Valley',
                            itenary: { id: 902 },
                            destination: { id: 31 },
                            entryType: 'Stay'
                        }
                    ]
                }
            ]
        },
        isLoading: false
    })
}))
vi.mock('@/app/store/slices/api/itenarySlice', () => ({
    useCreateItenaryClientMutation: idle,
    useUpdateItenaryClientMutation: idle,
    useGetItenaryClientsQuery: () => ({ data: { data: [] }, isLoading: false })
}))
vi.mock('@/app/store/slices/api/destinationSlice', () => ({
    useCreateDestinationClientMutation: idle,
    useUpdateDestinationClientMutation: idle,
    useGetDestinationClientsQuery: () => ({ data: { data: [] }, isLoading: false })
}))
vi.mock('@/app/store/slices/api/guestTourPrice', () => ({
    useGetGuestTourPriceQuery: () => ({ data: undefined, isFetching: false }),
    useUpsertGuestTourPriceMutation: idle
}))

const shimla = { id: 31, name: 'Shimla', delux_hotel: 'Hotel Willow Banks | Hotel Combermere', super_delux_hotel: '' }
const row = (id, order, title) => ({
    id,
    order,
    title,
    quoteNo: 1,
    entryType: 'Stay',
    itenaryId: 900 + id,
    itenary: { id: 900 + id, description: `${title}: the day plan.` },
    destinationId: 31,
    destination: shimla
})

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/process/guest/add/7']}>
            <Routes>
                <Route path='/process/guest/add/:leadId' element={<GuestForm />} />
            </Routes>
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
    api.guestDetail = null
    api.tourRows = []
    api.createGuest.mockImplementation(payload => ({ success: true, data: { id: 'g1', ...payload } }))
    api.updateGuest.mockImplementation(({ id, ...payload }) => ({ success: true, data: { id, ...payload } }))
    api.createTour.mockImplementation(() => ({ success: true }))
    api.updateTour.mockImplementation(() => ({ success: true }))
    api.removeTour.mockImplementation(() => ({ success: true }))
})

describe('Quotation for a verified lead', () => {
    test('only adults and the start date are needed; saving goes straight on to the itinerary', async () => {
        renderPage()

        const save = await screen.findByRole('button', { name: 'Save and build the itinerary' })
        fireEvent.click(save)
        expect(await screen.findByText('How many adults?')).toBeInTheDocument()
        expect(screen.getByText('When does the trip start?')).toBeInTheDocument()
        expect(api.createGuest).not.toHaveBeenCalled()

        fireEvent.change(screen.getByRole('spinbutton', { name: /adults/i }), {
            target: { name: 'adults', value: '3' }
        })
        expect(screen.getByRole('spinbutton', { name: /rooms/i })).toHaveValue(2)
        fireEvent.change(screen.getByLabelText(/start date/i), { target: { name: 'pickupDate', value: '2026-10-05' } })
        fireEvent.click(save)

        await waitFor(() => expect(api.createGuest).toHaveBeenCalledTimes(1))
        expect(api.createGuest.mock.calls[0][0]).toMatchObject({
            leadId: 7,
            adults: 3,
            rooms: 2,
            children: null,
            pickupDate: '2026-10-05T00:00:00.000Z',
            dropDate: null,
            packageType: null
        })

        expect(await screen.findByText(/Quote 1 has no days yet/)).toBeInTheDocument()
        expect(screen.getByText('3 adults · from 5 Oct')).toBeInTheDocument()
    })

    test('a lead with trip details opens on its itinerary, with nights, dates and hotels', async () => {
        api.guestDetail = {
            id: 'g1',
            leadId: 7,
            adults: 2,
            pickupDate: '2026-10-05T00:00:00.000Z',
            packageType: 'Deluxe'
        }
        api.tourRows = [row(2, 2, 'Mall Road walk'), row(1, 1, 'Arrive Shimla')]
        renderPage()

        expect(await screen.findByText('2 days · 2 nights · Shimla 2N')).toBeInTheDocument()
        const days = screen.getAllByRole('listitem')
        expect(within(days[0]).getByText('Arrive Shimla')).toBeInTheDocument()
        expect(within(days[0]).getByText(/5 Oct/)).toBeInTheDocument()
        expect(within(days[1]).getByText('Mall Road walk')).toBeInTheDocument()
        expect(
            within(days[0]).getByRole('button', { name: /Hotels · Deluxe: Hotel Willow Banks, Hotel Combermere/ })
        ).toBeInTheDocument()
        expect(screen.getByText('2 adults · from 5 Oct · Deluxe')).toBeInTheDocument()
    })

    test('moving a day writes the new order; deleting one asks first', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [row(1, 1, 'Arrive Shimla'), row(2, 2, 'Mall Road walk')]
        renderPage()

        fireEvent.click(await screen.findByRole('button', { name: 'Move day 1 down' }))
        await waitFor(() => expect(api.updateTour).toHaveBeenCalledTimes(2))
        expect(api.updateTour.mock.calls.map(([args]) => args)).toEqual([
            { id: 2, order: 1 },
            { id: 1, order: 2 }
        ])
        await waitFor(() =>
            expect(within(screen.getAllByRole('listitem')[0]).getByText('Mall Road walk')).toBeInTheDocument()
        )

        const first = screen.getAllByRole('listitem')[0]
        fireEvent.click(within(first).getByRole('button', { name: 'Delete' }))
        expect(within(first).getByText('Delete day 1?')).toBeInTheDocument()
        expect(api.removeTour).not.toHaveBeenCalled()
        fireEvent.click(within(first).getByRole('button', { name: 'Delete' }))
        await waitFor(() => expect(api.removeTour).toHaveBeenCalledWith(2))
    })

    test('a package replaces the days only after the agent confirms', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [row(1, 1, 'Arrive Shimla')]
        renderPage()

        const picker = await screen.findByRole('combobox', { name: 'Replace the days with a package' })
        fireEvent.mouseDown(picker)
        fireEvent.click(await screen.findByText('Manali Escape · 2 days'))

        expect(await screen.findByText('Replace the days in Quote 1?')).toBeInTheDocument()
        expect(api.createTour).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: 'Replace days' }))

        await waitFor(() => expect(api.createTour).toHaveBeenCalledTimes(1))
        expect(api.createTour.mock.calls[0][0]).toEqual({
            leadId: '7',
            itenaryList: [
                { title: 'Arrive Manali', itenaryId: 901, image: '', destinationId: 31, entryType: 'Stay', quoteNo: 1 },
                { title: 'Solang Valley', itenaryId: 902, image: '', destinationId: 31, entryType: 'Stay', quoteNo: 1 }
            ]
        })
    })
})
