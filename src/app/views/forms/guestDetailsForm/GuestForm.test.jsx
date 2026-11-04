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
            removeTour: vi.fn(),
            createItenary: vi.fn(),
            createSingleTour: vi.fn(),
            savedQuotes: [],
            setQuoteCampaign: vi.fn(),
            refetchQuotes: vi.fn(),
            createPlanned: vi.fn(),
            planFromTrip: vi.fn(),
            assistAi: vi.fn(),
            findPhotos: vi.fn(),
            leadPlaces: [],
            updatePlaces: vi.fn()
        },
        dispatch: mockDispatch,
        thunk: thunkAction,
        mutation: mockMutation,
        idle: () => [vi.fn(), { isLoading: false }]
    }
})

vi.mock('react-redux', () => ({ useDispatch: () => dispatch, useSelector: select => select({ loading: {} }) }))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
// ? the mail themes the send dialogs offer
vi.mock('@/app/store/slices/api/mailTemplateSlice', () => ({
    useGetMailThemesQuery: () => ({
        data: {
            data: {
                themes: [
                    { key: 'classic', label: 'Classic', description: 'Navy on white', swatch: ['#0f4c81'] },
                    { key: 'coastal', label: 'Coastal', description: 'A teal header band', swatch: ['#0b6e78'] }
                ]
            }
        }
    })
}))
vi.mock('@/app/store/slices/api/vehicleSlice', () => ({ useGetVehiclesQuery: () => ({ data: undefined }) }))
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
    useCreateSingleGuestTourItenaryMutation: mutation((...args) => api.createSingleTour(...args)),
    getGuestTourById: { initiate: () => thunk(() => ({ data: { data: api.tourRows } })) }
}))
vi.mock('@/app/store/slices/api/gstSlice', () => ({
    useGetQuoteTaxesQuery: () => ({ data: null, isFetching: false }),
    useGetTaxProfileQuery: () => ({ data: null, isFetching: false }),
    useSetQuoteTaxMutation: () => [() => ({ unwrap: () => Promise.resolve({}) }), { isLoading: false }]
}))
vi.mock('@/app/store/slices/api/ratesSlice', () => ({
    usePriceFromRatesMutation: () => [() => ({ unwrap: () => Promise.resolve({ data: null }) }), { isLoading: false }]
}))
vi.mock('@/app/store/slices/api/packageConvert', () => ({
    useGetPackageByLeadIdQuery: () => ({ data: undefined }),
    useConvertPackageMutation: idle
}))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useShareLeadDetailsMutation: idle,
    useGetQuoteLinkMutation: idle,
    useGetLeadByIdQuery: () => ({
        data: { data: { fullName: 'Asha Verma', phone: '9999999999', campaignId: 1, places: api.leadPlaces } }
    }),
    useUpdateLeadPlacesMutation: mutation((...args) => api.updatePlaces(...args)),
    getLeadPreview: { initiate: () => thunk(() => ({ data: { data: { html: '' } } })) }
}))
vi.mock('@/app/store/slices/api/aiSlice', () => ({
    useAssistAiMutation: mutation((...args) => api.assistAi(...args)),
    useLazyGetTravelImagesQuery: mutation((...args) => api.findPhotos(...args)),
    useGetTravelImagesQuery: () => ({ data: undefined, isLoading: false })
}))
// ? the AI planner itself is tested in aiPackage.test.js: here it answers with a ready two-day plan
vi.mock('./aiPackage', async importOriginal => ({
    ...(await importOriginal()),
    planFromTrip: (...args) => api.planFromTrip(...args),
    daysFromPlan: trip => trip.plannedDays,
    packageNameFor: () => 'Manali 2D/1N'
}))
vi.mock('@/app/store/slices/api/packageSlice', () => ({
    useCreatePlannedPackageMutation: mutation((...args) => api.createPlanned(...args)),
    useGetAllPackagesClientQuery: () => ({
        data: {
            data: [
                {
                    id: 6,
                    name: 'Char Dham Yatra',
                    campaignId: 2,
                    campaign: { title: 'Uttarakhand' },
                    packageItenaries: [
                        {
                            id: 61,
                            title: 'Haridwar arrival',
                            itenary: { id: 961 },
                            destination: { id: 71 },
                            entryType: 'Stay'
                        }
                    ]
                },
                {
                    id: 5,
                    name: 'Manali Escape',
                    campaignId: 1,
                    campaign: { title: 'Himachal' },
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
    useCreateItenaryClientMutation: mutation((...args) => api.createItenary(...args)),
    useUpdateItenaryClientMutation: idle,
    useGetItenaryClientsQuery: () => ({ data: { data: [] }, isLoading: false })
}))
vi.mock('@/app/store/slices/api/destinationSlice', () => ({
    useCreateDestinationClientMutation: idle,
    useUpdateDestinationClientMutation: idle,
    useGetDestinationClientsQuery: () => ({ data: { data: [] }, isLoading: false })
}))
vi.mock('@/app/store/slices/api/campaignSlice', () => ({
    useGetCampaignsQuery: () => ({
        data: {
            data: [
                { id: 1, title: 'Himachal' },
                { id: 2, title: 'Uttarakhand' }
            ]
        }
    })
}))
vi.mock('@/app/store/slices/api/guestQuote', () => ({
    useGetGuestQuotesQuery: () => ({ data: { data: api.savedQuotes }, refetch: api.refetchQuotes }),
    useSetGuestQuoteCampaignMutation: mutation((...args) => api.setQuoteCampaign(...args))
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
    api.createItenary.mockImplementation(payload => ({ success: true, data: { id: 555, ...payload } }))
    api.createSingleTour.mockImplementation(() => ({ success: true }))
    api.savedQuotes = []
    api.setQuoteCampaign.mockImplementation(payload => ({ success: true, data: payload }))
    api.planFromTrip.mockReset()
    api.createPlanned.mockReset()
    api.assistAi.mockReset()
    api.assistAi.mockImplementation(() => ({ content: [{ text: '{}' }] }))
    api.findPhotos.mockReset()
    api.findPhotos.mockImplementation(() => ({ urls: [] }))
    api.leadPlaces = []
    api.updatePlaces.mockReset()
    api.updatePlaces.mockImplementation(({ places }) => ({ success: true, data: places }))
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
        const days = within(screen.getByRole('list', { name: 'Days of the quote' })).getAllByRole('listitem')
        expect(within(days[0]).getByText('Arrive Shimla')).toBeInTheDocument()
        expect(within(days[0]).getByText(/5 Oct/)).toBeInTheDocument()
        expect(within(days[1]).getByText('Mall Road walk')).toBeInTheDocument()
        expect(
            within(days[0]).getByRole('button', { name: /Hotels · Deluxe: Hotel Willow Banks, Hotel Combermere/ })
        ).toBeInTheDocument()
        expect(screen.getByText('2 adults · from 5 Oct · Deluxe (3 star)')).toBeInTheDocument()
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
            expect(
                within(
                    within(screen.getByRole('list', { name: 'Days of the quote' })).getAllByRole('listitem')[0]
                ).getByText('Mall Road walk')
            ).toBeInTheDocument()
        )

        const first = within(screen.getByRole('list', { name: 'Days of the quote' })).getAllByRole('listitem')[0]
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

    test('a new quote can be for another trip: only its packages are offered and its new days are saved in that campaign', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [row(1, 1, 'Arrive Shimla')]
        renderPage()

        fireEvent.click(await screen.findByRole('button', { name: 'New quote' }))
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Uttarakhand' }))
        expect(screen.getByRole('button', { name: /Quote 2 · Uttarakhand/ })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('combobox', { name: 'Trip for Quote 2' })).toHaveTextContent('Uttarakhand')
        // ? the pick is saved with the quote, so the email uses Uttarakhand whatever the days are saved under
        expect(api.setQuoteCampaign).toHaveBeenCalledWith({ leadId: 7, quoteNo: 2, campaignId: 2 })

        // ? only Uttarakhand's packages are offered for this quote, never Himachal's
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Start from a package' }))
        const options = await screen.findAllByRole('option')
        expect(options).toHaveLength(1)
        expect(options[0]).toHaveTextContent('Char Dham Yatra')
        expect(screen.queryByRole('option', { name: /Manali Escape/ })).not.toBeInTheDocument()

        // a day typed for this quote is saved in Uttarakhand, not the lead's Himachal
        fireEvent.keyDown(document.activeElement, { key: 'Escape' })
        fireEvent.click(screen.getByRole('button', { name: 'Add a day' }))
        const title = await screen.findByRole('combobox', { name: 'Day title' })
        fireEvent.change(title, { target: { value: 'Rishikesh rafting' } })
        fireEvent.click(screen.getByRole('button', { name: 'Add day' }))
        await waitFor(() => expect(api.createItenary).toHaveBeenCalled())
        expect(api.createItenary.mock.calls[0][0]).toMatchObject({ title: 'Rishikesh rafting', campaignId: 2 })
        await waitFor(() => expect(api.createSingleTour).toHaveBeenCalled())
        expect(api.createSingleTour.mock.calls[0][0]).toMatchObject({ quoteNo: 2, itenaryId: 555 })
    }, 15000) // ? two quotes and a trip change: about 5s when the whole suite runs at once

    test('the package picker of a quote offers only the packages of that quote’s trip', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        renderPage()

        // ? Quote 1 is for the lead's own trip, Himachal: its package is offered, Uttarakhand's is not
        fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Start from a package' }))
        const options = await screen.findAllByRole('option')
        expect(options).toHaveLength(1)
        expect(options[0]).toHaveTextContent('Manali Escape')
        expect(screen.queryByRole('option', { name: /Char Dham Yatra/ })).not.toBeInTheDocument()
    })

    // ? a Spiti trip runs through Shimla and Manali, saved under Himachal
    const himachalDay = (id, order, title, quoteNo = 1) => ({
        ...row(id, order, title),
        quoteNo,
        itenary: { id: 900 + id, campaignId: 1, description: `${title}: the day plan.` },
        destination: { ...shimla, campaignId: 1 }
    })

    test('the trip picked for a quote wins over the campaign its days are saved under', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [himachalDay(1, 1, 'Arrive Shimla'), himachalDay(2, 1, 'Shimla to Kaza', 2)]
        api.savedQuotes = [{ quoteNo: 2, campaignId: 2 }]
        renderPage()

        expect(await screen.findByRole('button', { name: /Quote 2 · Uttarakhand/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Quote 1 · Himachal/ })).toBeInTheDocument()
    })

    test('changing a quote’s trip saves it, and the quote is labelled with it', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [himachalDay(1, 1, 'Arrive Shimla')]
        renderPage()

        const trip = await screen.findByRole('combobox', { name: 'Trip for Quote 1' })
        expect(trip).toHaveTextContent('Himachal')
        fireEvent.mouseDown(trip)
        fireEvent.click(await screen.findByRole('option', { name: 'Uttarakhand' }))

        await waitFor(() => expect(api.setQuoteCampaign).toHaveBeenCalledWith({ leadId: 7, quoteNo: 1, campaignId: 2 }))
        expect(await screen.findByRole('button', { name: /Quote 1 · Uttarakhand/ })).toBeInTheDocument()
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({ payload: expect.objectContaining({ message: 'Quote 1 is now for Uttarakhand' }) })
        )
    })

    test('a trip that could not be saved says why and leaves the quote as it was', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [himachalDay(1, 1, 'Arrive Shimla')]
        api.setQuoteCampaign.mockImplementation(() =>
            Promise.reject(
                Object.assign(new Error('409'), { data: { message: 'This workspace has not been updated.' } })
            )
        )
        renderPage()

        const trip = await screen.findByRole('combobox', { name: 'Trip for Quote 1' })
        fireEvent.mouseDown(trip)
        fireEvent.click(await screen.findByRole('option', { name: 'Uttarakhand' }))

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ message: 'This workspace has not been updated.' })
                })
            )
        )
        expect(screen.getByRole('combobox', { name: 'Trip for Quote 1' })).toHaveTextContent('Himachal')
    })

    test('a quote made with its trip but no days yet is still there after a reload', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.tourRows = [himachalDay(1, 1, 'Arrive Shimla')]
        api.savedQuotes = [{ quoteNo: 2, campaignId: 2 }]
        renderPage()

        expect(await screen.findByRole('button', { name: /Quote 2 · Uttarakhand/ })).toBeInTheDocument()
    })
    test('“Create package with AI” plans from the trip details, saves the package for the trip, fills the quote with the guest’s days and opens the rate check', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05', leadRemarks: 'Wants snow' }
        const plannedDays = [
            { title: 'Delhi to Manali', description: 'Drive up for Asha.', place: 'Manali', entryType: 'TransitStay' },
            { title: 'Manali to Delhi Return', description: 'Drive home.', place: '', entryType: 'Transit' }
        ]
        // ? the places are known before the days are planned: their hotels and photos are looked up meanwhile
        api.planFromTrip.mockImplementation(async ({ onPlaces }) => {
            onPlaces(['Manali'])
            return { status: 'ready', plannedDays, assumptions: [] }
        })
        api.assistAi.mockImplementation(() => ({
            content: [{ text: '{"places":[{"name":"Manali","delux_hotel":"Snow Valley | Apple Country"}]}' }]
        }))
        api.findPhotos.mockImplementation(place =>
            place === 'Manali' ? { urls: [{ url: 'https://p/manali-1.jpg' }, { url: 'https://p/manali-2.jpg' }] } : {}
        )
        api.createPlanned.mockImplementation(payload => ({
            success: true,
            data: {
                id: 77,
                name: payload.name,
                packageItenaries: [
                    {
                        title: 'Delhi to Manali',
                        itenary: { id: 801 },
                        destination: { id: 31 },
                        entryType: 'TransitStay'
                    },
                    { title: 'Manali to Delhi Return', itenary: { id: 802 }, destination: null, entryType: 'Transit' }
                ]
            }
        }))
        // ? the saved days come back on the reload, as on the server
        api.createTour.mockImplementation(({ itenaryList }) => {
            api.tourRows = itenaryList.map((item, index) => ({
                ...row(index + 1, index + 1, item.title),
                entryType: item.entryType,
                description: item.description
            }))
            return { success: true }
        })
        renderPage()

        fireEvent.click(await screen.findByRole('button', { name: 'Create package with AI' }))
        const dialog = await screen.findByRole('dialog')
        fireEvent.change(within(dialog).getByLabelText(/Anything else the guest wants/), {
            target: { value: 'Solang Valley' }
        })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Create package' }))

        await waitFor(() => expect(api.createTour).toHaveBeenCalledTimes(1))
        expect(api.planFromTrip.mock.calls[0][0]).toMatchObject({ region: 'Himachal', extra: 'Solang Valley' })
        expect(api.planFromTrip.mock.calls[0][0].values).toMatchObject({ adults: '2', leadRemarks: 'Wants snow' })
        expect(api.createPlanned).toHaveBeenCalledWith({
            campaignId: 1,
            name: 'Manali 2D/1N',
            // ? the drive home shows the place of the night before
            days: [
                { ...plannedDays[0], image: 'https://p/manali-1.jpg' },
                { ...plannedDays[1], image: 'https://p/manali-2.jpg' }
            ],
            places: [{ name: 'Manali', delux_hotel: 'Snow Valley | Apple Country' }]
        })
        // ? one photo search per place, not per day
        expect(api.findPhotos).toHaveBeenCalledTimes(1)
        expect(api.createTour.mock.calls[0][0].itenaryList).toEqual([
            {
                title: 'Delhi to Manali',
                description: 'Drive up for Asha.',
                itenaryId: 801,
                image: '',
                destinationId: 31,
                entryType: 'TransitStay',
                quoteNo: 1
            },
            {
                title: 'Manali to Delhi Return',
                description: 'Drive home.',
                itenaryId: 802,
                image: '',
                destinationId: '',
                entryType: 'Transit',
                quoteNo: 1
            }
        ])
        // ? the quote shows the guest's own text, and its prices are checked against the rate card next
        expect(await screen.findByText('Drive up for Asha.')).toBeInTheDocument()
        expect(await screen.findByText('Prices from your rates — Quote 1')).toBeInTheDocument()
    })

    test('the lead’s places are the route: shown in the dialog, an edit is saved on the lead and planned', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.leadPlaces = [{ name: 'Shimla', nights: 2 }]
        api.planFromTrip.mockResolvedValue({ status: 'needs-input', questions: [{ id: 'x', text: 'Stop here' }] })
        renderPage()

        fireEvent.click(await screen.findByRole('button', { name: 'Create package with AI' }))
        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByRole('combobox', { name: 'Place' })).toHaveValue('Shimla')
        fireEvent.click(within(dialog).getByRole('button', { name: 'Add a place' }))
        fireEvent.change(within(dialog).getByRole('combobox', { name: 'Place 2' }), { target: { value: 'Manali' } })
        fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Nights in Manali' }), {
            target: { value: '3' }
        })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Create package' }))

        const route = [
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: 3 }
        ]
        await waitFor(() => expect(api.planFromTrip).toHaveBeenCalledTimes(1))
        expect(api.updatePlaces).toHaveBeenCalledWith({ id: 7, places: route })
        expect(api.planFromTrip.mock.calls[0][0].places).toEqual(route)
    })

    test('when the AI needs more, it asks, and nothing is saved', async () => {
        api.guestDetail = { id: 'g1', leadId: 7, adults: 2, pickupDate: '2026-10-05' }
        api.planFromTrip.mockResolvedValue({
            status: 'needs-input',
            questions: [{ id: 'destinations', text: 'Which destinations, and how many nights in each?' }]
        })
        renderPage()

        fireEvent.click(await screen.findByRole('button', { name: 'Create package with AI' }))
        const dialog = await screen.findByRole('dialog')
        fireEvent.click(within(dialog).getByRole('button', { name: 'Create package' }))

        expect(await within(dialog).findByText('Which destinations, and how many nights in each?')).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
        expect(api.createPlanned).not.toHaveBeenCalled()
        expect(api.createTour).not.toHaveBeenCalled()
    })
})
