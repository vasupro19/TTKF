import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import BookingsPage from './BookingsPage'
import BookingWorkspace from './BookingWorkspace'

const api = vi.hoisted(() => {
    const call = () => vi.fn(() => ({ unwrap: () => Promise.resolve({ success: true }) }))
    return {
        list: [],
        count: 0,
        summary: null,
        pageArgs: [],
        booking: null,
        hotels: [],
        taxis: [],
        payments: [],
        addService: call(),
        deleteService: call(),
        sendSupplierEmail: call(),
        addGuestPayment: call(),
        paySupplier: call(),
        sendVoucher: call(),
        sendHotel: call(),
        sendTaxi: call(),
        downloadPdf: call(),
        supplierPreview: null,
        snackbars: []
    }
})

const query = data => ({ data, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() })
const navigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async importOriginal => ({ ...(await importOriginal()), useNavigate: () => navigate }))
vi.mock('react-redux', () => ({
    useDispatch: () => action => {
        if (action?.type === 'preview') return Promise.resolve({ data: { data: { html: '<p>voucher</p>' } } })
        if (action?.type === 'supplierPreview') return Promise.resolve(api.supplierPreview)
        if (action?.type === 'snackbar') api.snackbars.push(action.payload.message)
        return action
    },
    useSelector: select => select({ loading: {} })
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/packageConvert', () => ({
    useGetBookingsPageQuery: args => {
        api.pageArgs.push(args)
        return query({ data: api.list, count: api.count, summary: api.summary })
    },
    useGetPackageByLeadIdQuery: () => query({ data: api.booking }),
    useGetServicesByPackageQuery: ({ type }) => query({ data: type === 'Hotel' ? api.hotels : api.taxis }),
    useGetGuestPaymentHistoryQuery: () => query({ data: api.payments }),
    useAddServiceToPackageMutation: () => [api.addService, { isLoading: false }],
    useDeleteServiceMutation: () => [api.deleteService],
    useSendSupplierEmailMutation: () => [api.sendSupplierEmail],
    useAddGuestPaymentMutation: () => [api.addGuestPayment, { isLoading: false }],
    useSendVoucherEmailMutation: () => [api.sendVoucher],
    useSendGuestHotelConfirmationEmailMutation: () => [api.sendHotel],
    useSendGuestTaxiConfirmationEmailMutation: () => [api.sendTaxi],
    useDownloadConfirmedVoucherPdfMutation: () => [api.downloadPdf],
    getConfirmedVoucherPreview: { initiate: () => ({ type: 'preview' }) },
    getSupplierEmailPreview: { initiate: id => ({ type: 'supplierPreview', id }) }
}))
vi.mock('@/app/store/slices/api/confirmedService', () => ({
    usePaySupplierMutation: () => [api.paySupplier, { isLoading: false }]
}))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useGetLeadByIdQuery: () =>
        query({ data: { fullName: 'Asha Verma', phone: '9876543210', senderEmail: 'asha@example.com' } })
}))
vi.mock('@/app/store/slices/api/guestSlice', () => ({
    useGetGuestByIdQuery: () =>
        query({
            data: {
                adults: 2,
                children: 1,
                pickupDate: '2026-12-12T00:00:00.000Z',
                dropDate: '2026-12-17T00:00:00.000Z'
            }
        })
}))
vi.mock('@/app/store/slices/api/guestTourSlice', () => ({
    useGetGuestTourByIdQuery: () =>
        query({
            data: [
                { id: 2, quoteNo: 1, order: 2, title: 'Shimla sightseeing', destination: { name: 'Shimla' } },
                { id: 1, quoteNo: 1, order: 1, title: 'Delhi to Shimla', destination: { name: 'Shimla' } },
                { id: 9, quoteNo: 2, order: 1, title: 'Quote two: Delhi to Manali', destination: { name: 'Manali' } }
            ]
        })
}))
vi.mock('@/app/store/slices/api/supplierSlice', () => ({
    useGetSuppliersQuery: () => ({
        data: { data: [{ id: 5, businessname: 'Hotel Willow Banks', city: 'Shimla' }] },
        isLoading: false
    })
}))

const listRow = over => ({
    id: 1,
    leadId: 11,
    guestName: 'Asha Verma',
    phone: '9876543210',
    selectedPackage: 'Deluxe',
    quotationNo: 1,
    sellingPrice: 90000,
    guestPaidAmount: 45000,
    guestPaymentStatus: 'Partially Paid',
    hotelAssigned: true,
    taxiAssigned: false,
    supplierPaymentStatus: 'Unpaid',
    status: 'Confirmed',
    travelDate: '2026-12-12T00:00:00.000Z',
    travelEnd: '2026-12-17T00:00:00.000Z',
    ...over
})

beforeEach(() => {
    vi.clearAllMocks()
    api.list = [
        listRow({ bookingNo: 'TTK-B-261002-003' }),
        listRow({ id: 2, leadId: 12, guestName: 'Rohan Das', hotelAssigned: false, guestPaidAmount: 0 })
    ]
    api.count = 2
    api.summary = { total: 2, toCollect: 135000, stages: { action: 1, progress: 1, ready: 0 } }
    api.pageArgs = []
    api.booking = {
        id: 1,
        bookingNo: 'TTK-B-261002-003',
        leadId: 11,
        sellingPrice: '90000.00',
        guestPaidAmount: '45000.00',
        guestPaymentStatus: 'Partially Paid',
        status: 'Confirmed',
        selectedPackage: 'Deluxe',
        quotationNo: 1
    }
    api.hotels = [
        {
            id: 21,
            type: 'Hotel',
            cost: '20000.00',
            paidAmount: '5000.00',
            paymentStatus: 'Partially Paid',
            startDate: '2026-12-12T00:00:00.000Z',
            endDate: '2026-12-14T00:00:00.000Z',
            quantity: 2,
            supplierId: 5,
            supplier: { businessname: 'Hotel Willow Banks', phone: '01772222' }
        }
    ]
    api.taxis = []
    api.snackbars = []
    api.supplierPreview = {
        data: {
            data: {
                to: 'rooms@willowbanks.example',
                subject: 'Room booking request – Asha Verma, 12 Dec 2026 (2 nights) – TravelKart',
                html: '<p>request</p>'
            }
        }
    }
    api.payments = [
        {
            id: 1,
            amount: '45000.00',
            paymentDate: '2026-11-01T00:00:00.000Z',
            paymentMethod: 'UPI',
            transactionId: 'UTR123'
        }
    ]
})

describe('Bookings list', () => {
    const renderList = () =>
        render(
            <MemoryRouter>
                <BookingsPage />
            </MemoryRouter>
        )
    const lastArgs = () => api.pageArgs[api.pageArgs.length - 1]

    test('each booking shows its number, money and next step, with every booking’s counts', () => {
        renderList()
        expect(
            screen.getByText('2 bookings · ₹1,35,000 still to collect from guests · 1 not started')
        ).toBeInTheDocument()
        expect(screen.getByText(/^TTK-B-261002-003 · /)).toBeInTheDocument()
        const asha = screen.getByRole('button', { name: 'Open the booking for Asha Verma' })
        expect(within(asha).getByText('Next: Add transport')).toBeInTheDocument()
        expect(within(asha).getByText(/12 Dec 2026 – 17 Dec 2026 · Deluxe · Quote 1/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Not started\s*1/ })).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Open the booking for Rohan Das' }))
        expect(navigate).toHaveBeenCalledWith('/process/packages/12')
    })

    test('the server is asked for one page: the stage chosen, then the search typed, from the first page', async () => {
        renderList()
        expect(lastArgs()).toEqual({ page: 0, pageSize: 25, stage: 'all', q: '' })

        fireEvent.click(screen.getByRole('button', { name: /Not started/ }))
        expect(lastArgs()).toMatchObject({ page: 0, stage: 'action' })

        fireEvent.change(screen.getByLabelText('Search bookings'), { target: { value: ' rohan ' } })
        await waitFor(() => expect(lastArgs()).toMatchObject({ page: 0, stage: 'action', q: 'rohan' }))
    })

    test('more than a page: which ones are shown, and the next page on request', () => {
        api.count = 60
        api.summary = { ...api.summary, total: 60 }
        renderList()
        expect(screen.getByText('1–25 of 60')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
        expect(lastArgs()).toMatchObject({ page: 1 })
    })

    test('a search that matches nothing says so', () => {
        api.list = []
        api.count = 0
        renderList()
        expect(screen.getByText('No bookings match.')).toBeInTheDocument()
    })
})

const renderBooking = () =>
    render(
        <MemoryRouter initialEntries={['/process/packages/11']}>
            <Routes>
                <Route path='/process/packages/:leadId' element={<BookingWorkspace />} />
            </Routes>
        </MemoryRouter>
    )

describe('One booking', () => {
    test('progress, the next step, money, hotels and payments on one page', () => {
        renderBooking()
        expect(screen.getByRole('heading', { name: 'Asha Verma' })).toBeInTheDocument()
        expect(screen.getByText('BOOKING · TTK-B-261002-003')).toBeInTheDocument()
        expect(screen.getByText(/12 Dec 2026 – 17 Dec 2026 · 2 adults, 1 child · Deluxe · Quote 1/)).toBeInTheDocument()
        expect(screen.getByText('1 of 5 done')).toBeInTheDocument()
        expect(screen.getByText('Next: Add transport')).toBeInTheDocument()

        const hotels = screen.getByRole('region', { name: 'Hotels' })
        expect(within(hotels).getByText('Hotel Willow Banks')).toBeInTheDocument()
        expect(within(hotels).getByText(/12 Dec 2026 – 14 Dec 2026 · 2 rooms/)).toBeInTheDocument()
        expect(within(hotels).getByText('₹5,000 paid · ₹15,000 due')).toBeInTheDocument()

        const payments = screen.getByRole('region', { name: 'Guest payments' })
        expect(within(payments).getByText('₹45,000')).toBeInTheDocument()
        expect(within(payments).getByText('Ref UTR123')).toBeInTheDocument()
        expect(screen.getByText('Price − supplier costs')).toBeInTheDocument()
        expect(screen.getByText('₹70,000')).toBeInTheDocument()
    })

    test('the itinerary shows only the booked quote, in order', () => {
        renderBooking()
        const itinerary = screen.getByRole('region', { name: 'Itinerary · Quote 1' })
        const days = within(itinerary).getAllByRole('listitem')
        expect(days).toHaveLength(2)
        expect(within(days[0]).getByText('Delhi to Shimla')).toBeInTheDocument()
        expect(within(days[1]).getByText('Shimla sightseeing')).toBeInTheDocument()
        expect(screen.queryByText('Quote two: Delhi to Manali')).not.toBeInTheDocument()
    })

    test('the next-step button opens the right form', async () => {
        renderBooking()
        // ? the first "Add transport" is the next-step button at the top; the second is the section's own
        fireEvent.click(screen.getAllByRole('button', { name: 'Add transport' })[0])
        expect(await screen.findByText('Add transport', { selector: 'h4' })).toBeInTheDocument()
    })

    test('removing a supplier asks first', async () => {
        renderBooking()
        const hotels = screen.getByRole('region', { name: 'Hotels' })
        fireEvent.click(within(hotels).getByRole('button', { name: 'Remove' }))
        expect(within(hotels).getByText('Remove Hotel Willow Banks from this booking?')).toBeInTheDocument()
        expect(api.deleteService).not.toHaveBeenCalled()
        fireEvent.click(within(hotels).getByRole('button', { name: 'Remove' }))
        await waitFor(() => expect(api.deleteService).toHaveBeenCalledWith(21))
    })

    test('the voucher is previewed before it is sent', async () => {
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Preview and email' }))
        const send = await screen.findByRole('button', { name: 'Send to asha@example.com' })
        expect(api.sendVoucher).not.toHaveBeenCalled()
        fireEvent.click(send)
        await waitFor(() => expect(api.sendVoucher).toHaveBeenCalledWith(1))
    })

    test('a hotel’s booking request is previewed, with who it goes to and the subject, before it is sent', async () => {
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Email hotel' }))
        const dialog = await screen.findByRole('dialog', { name: 'Booking request to Hotel Willow Banks' })
        expect(within(dialog).getByText('To rooms@willowbanks.example')).toBeInTheDocument()
        expect(
            within(dialog).getByText('Subject: Room booking request – Asha Verma, 12 Dec 2026 (2 nights) – TravelKart')
        ).toBeInTheDocument()
        expect(api.sendSupplierEmail).not.toHaveBeenCalled()

        fireEvent.click(within(dialog).getByRole('button', { name: 'Send to rooms@willowbanks.example' }))
        await waitFor(() => expect(api.sendSupplierEmail).toHaveBeenCalledWith(21))
    })

    test('a supplier without an email says so, and nothing opens or is sent', async () => {
        api.supplierPreview = {
            error: { data: { message: 'Hotel Willow Banks has no email address. Add one under Suppliers.' } }
        }
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Email hotel' }))
        await waitFor(() =>
            expect(api.snackbars).toContain('Hotel Willow Banks has no email address. Add one under Suppliers.')
        )
        expect(screen.queryByRole('dialog', { name: 'Booking request to Hotel Willow Banks' })).not.toBeInTheDocument()
        expect(api.sendSupplierEmail).not.toHaveBeenCalled()
    })
})
