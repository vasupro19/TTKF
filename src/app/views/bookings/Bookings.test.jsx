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
        sendReceipt: call(),
        addGuestPayment: call(),
        paySupplier: call(),
        sendVoucher: call(),
        sendHotel: call(),
        sendTaxi: call(),
        downloadPdf: call(),
        formChanges: {},
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
        if (action?.type === 'supplierPreview')
            return Promise.resolve(
                typeof api.supplierPreview === 'function' ? api.supplierPreview(action.arg) : api.supplierPreview
            )
        if (action?.type === 'receiptPreview')
            return Promise.resolve({
                data: { data: { to: 'asha@example.com', subject: 'Payment received', html: '<p>receipt</p>' } }
            })
        if (action?.type === 'guestServicePreview')
            return Promise.resolve({
                data: { data: { to: 'asha@example.com', subject: 'Hotel Confirmation', html: '<p>hotel</p>' } }
            })
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
    useSendGuestReceiptMutation: () => [api.sendReceipt],
    useAddGuestPaymentMutation: () => [api.addGuestPayment, { isLoading: false }],
    useSendVoucherEmailMutation: () => [api.sendVoucher],
    useSendGuestHotelConfirmationEmailMutation: () => [api.sendHotel],
    useSendGuestTaxiConfirmationEmailMutation: () => [api.sendTaxi],
    useDownloadConfirmedVoucherPdfMutation: () => [api.downloadPdf],
    getConfirmedVoucherPreview: { initiate: () => ({ type: 'preview' }) },
    getSupplierEmailPreview: { initiate: arg => ({ type: 'supplierPreview', arg }) },
    getGuestReceiptPreview: { initiate: arg => ({ type: 'receiptPreview', arg }) },
    getGuestServicePreview: { initiate: arg => ({ type: 'guestServicePreview', arg }) }
}))
vi.mock('@/core/components/modals/GuestPaymentModal', () => ({
    default: ({ open, onSave }) =>
        open ? (
            <button type='button' onClick={() => onSave({ amount: '20000', paymentMethod: 'UPI' })}>
                Save the payment
            </button>
        ) : null
}))
// ? the hotel/transport form: saving it sends back the line as it was opened (with the changes the test gives)
vi.mock('@/core/components/modals/AssignmentModal', () => ({
    default: ({ open, type, row, onSave }) =>
        open ? (
            <div>
                <h4>{row?.id ? 'Edit' : `Add ${type === 'Hotel' ? 'hotel' : 'transport'}`}</h4>
                <button type='button' onClick={() => onSave({ ...row, ...api.formChanges })}>
                    Save the form
                </button>
            </div>
        ) : null
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
    api.formChanges = {}
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
        fireEvent.click(screen.getAllByRole('button', { name: 'Preview and email' })[0])
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
        await waitFor(() =>
            expect(api.sendSupplierEmail).toHaveBeenCalledWith({
                id: 21,
                kind: 'request',
                previous: false,
                remove: false
            })
        )
    })

    test('each email says how it went — sent and when, or why it did not go', () => {
        api.hotels = [
            {
                ...api.hotels[0],
                lastEmail: { status: 'Failed', sentAt: '2026-10-02T04:30:00.000Z', notes: 'Recipient address rejected' }
            }
        ]
        api.booking = {
            ...api.booking,
            emails: {
                voucher: { status: 'Failed', sentAt: '2026-10-02T04:30:00.000Z', notes: 'Mailbox full' },
                hotel: { status: 'Sent', sentAt: '2026-10-02T04:30:00.000Z', notes: null },
                taxi: null
            }
        }
        renderBooking()
        const hotels = screen.getByRole('region', { name: 'Hotels' })
        expect(
            within(hotels).getByText(
                'Booking request didn’t go: Recipient address rejected. Check the address and send again.'
            )
        ).toBeInTheDocument()
        expect(screen.getByText('Didn’t go: Mailbox full. Check the address and send again.')).toBeInTheDocument()
        expect(screen.getByText(/^Emailed 2 Oct/)).toBeInTheDocument()
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

describe('Emails about the booking are always previewed first', () => {
    // ? Hotel Willow Banks has been sent this booking
    const booked = () => {
        api.hotels = [
            { ...api.hotels[0], lastEmail: { status: 'Sent', sentAt: '2026-10-02T04:30:00.000Z', kind: 'request' } }
        ]
    }
    const preview = (data, arg) => ({
        data: {
            data: {
                kind: arg?.kind || 'request',
                name: 'Hotel Willow Banks',
                to: 'rooms@willowbanks.example',
                subject: 'Subject',
                html: '<p>email</p>',
                changes: null,
                switchedFrom: null,
                ...data
            }
        }
    })

    test('an edited hotel whose supplier has the booking: the amendment is shown, then sent on click', async () => {
        booked()
        api.supplierPreview = arg => preview({ changes: [{ label: 'Rooms', was: '2 rooms', now: '3 rooms' }] }, arg)
        renderBooking()
        const hotels = screen.getByRole('region', { name: 'Hotels' })
        fireEvent.click(within(hotels).getByRole('button', { name: 'Edit' }))
        fireEvent.click(screen.getByRole('button', { name: 'Save the form' }))

        const dialog = await screen.findByRole('dialog', { name: 'Amendment to Hotel Willow Banks' })
        expect(within(dialog).getByText('Changed: Rooms.')).toBeInTheDocument()
        expect(api.sendSupplierEmail).not.toHaveBeenCalled()
        fireEvent.click(within(dialog).getByRole('button', { name: 'Send to rooms@willowbanks.example' }))
        await waitFor(() =>
            expect(api.sendSupplierEmail).toHaveBeenCalledWith({
                id: 21,
                kind: 'amendment',
                previous: false,
                remove: false
            })
        )
    })

    test('an edit that changes nothing the supplier was told: no amendment', async () => {
        booked()
        api.supplierPreview = arg => preview({ changes: [] }, arg)
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        fireEvent.click(screen.getByRole('button', { name: 'Save the form' }))
        await waitFor(() =>
            expect(api.snackbars).toContain(
                'Nothing Hotel Willow Banks was told has changed, so no amendment is needed.'
            )
        )
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('a hotel nobody was emailed about: editing it sends nothing', async () => {
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        fireEvent.click(screen.getByRole('button', { name: 'Save the form' }))
        await waitFor(() => expect(api.addService).toHaveBeenCalled())
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('a changed hotel: a request to the new one, then a cancellation to the one that had the booking', async () => {
        booked()
        api.supplierPreview = arg =>
            arg.previous
                ? preview({ kind: 'cancellation', name: 'Hotel Snow Crest', to: 'rooms@snowcrest.example' }, arg)
                : preview(
                      {
                          kind: 'request',
                          name: 'Hotel Eden',
                          to: 'eden@example.com',
                          switchedFrom: { name: 'Hotel Snow Crest', email: 'rooms@snowcrest.example' }
                      },
                      arg
                  )
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        fireEvent.click(screen.getByRole('button', { name: 'Save the form' }))

        const request = await screen.findByRole('dialog', { name: 'Booking request to Hotel Eden' })
        expect(within(request).getByRole('note')).toHaveTextContent('Hotel Snow Crest still has this booking')
        fireEvent.click(within(request).getByRole('button', { name: 'Send to eden@example.com' }))
        await waitFor(() =>
            expect(api.sendSupplierEmail).toHaveBeenCalledWith({
                id: 21,
                kind: 'request',
                previous: false,
                remove: false
            })
        )

        const cancel = await screen.findByRole('dialog', { name: 'Cancellation to Hotel Snow Crest' })
        // ? the old hotel's cancellation never takes the line off the booking
        expect(within(cancel).queryByRole('checkbox')).not.toBeInTheDocument()
        fireEvent.click(within(cancel).getByRole('button', { name: 'Send to rooms@snowcrest.example' }))
        await waitFor(() =>
            expect(api.sendSupplierEmail).toHaveBeenLastCalledWith({
                id: 21,
                kind: 'cancellation',
                previous: true,
                remove: false
            })
        )
    })

    test('cancelling a booked hotel: previewed, and it can also come off the booking', async () => {
        booked()
        api.hotels = [{ ...api.hotels[0], paidAmount: '0', paymentStatus: 'Unpaid' }]
        api.supplierPreview = arg => preview({ kind: 'cancellation' }, arg)
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }))
        const dialog = await screen.findByRole('dialog', { name: 'Cancellation to Hotel Willow Banks' })
        const remove = within(dialog).getByRole('checkbox', {
            name: 'Also remove Hotel Willow Banks from this booking'
        })
        expect(remove).not.toBeChecked()
        fireEvent.click(remove)
        fireEvent.click(within(dialog).getByRole('button', { name: 'Send to rooms@willowbanks.example' }))
        await waitFor(() =>
            expect(api.sendSupplierEmail).toHaveBeenCalledWith({
                id: 21,
                kind: 'cancellation',
                previous: false,
                remove: true
            })
        )
    })

    test('removing a hotel that has the booking offers the cancellation; one with payments stays on the booking', async () => {
        booked()
        api.supplierPreview = arg => preview({ kind: 'cancellation' }, arg)
        renderBooking()
        const hotels = screen.getByRole('region', { name: 'Hotels' })
        fireEvent.click(within(hotels).getByRole('button', { name: 'Remove' }))
        expect(
            within(hotels).getByText('Hotel Willow Banks has this booking. Send them a cancellation?')
        ).toBeInTheDocument()
        fireEvent.click(within(hotels).getByRole('button', { name: 'Send cancellation' }))
        const dialog = await screen.findByRole('dialog', { name: 'Cancellation to Hotel Willow Banks' })
        // ? ₹5,000 has been paid to this hotel
        expect(within(dialog).getByRole('checkbox')).toBeDisabled()
        expect(
            within(dialog).getByText('Payments to Hotel Willow Banks are recorded, so it stays on the booking.')
        ).toBeInTheDocument()
        expect(api.deleteService).not.toHaveBeenCalled()
    })

    test('recording a guest payment shows the receipt; it goes only when Send is clicked', async () => {
        api.addGuestPayment.mockReturnValueOnce({
            unwrap: () => Promise.resolve({ data: { paymentId: 41, guestEmail: 'asha@example.com' } })
        })
        renderBooking()
        fireEvent.click(screen.getAllByRole('button', { name: 'Record a payment' })[0])
        fireEvent.click(screen.getByRole('button', { name: 'Save the payment' }))
        await waitFor(() => expect(api.addGuestPayment).toHaveBeenCalled())

        const dialog = await screen.findByRole('dialog', { name: 'Payment receipt' })
        expect(api.sendReceipt).not.toHaveBeenCalled()
        fireEvent.click(within(dialog).getByRole('button', { name: 'Send to asha@example.com' }))
        await waitFor(() => expect(api.sendReceipt).toHaveBeenCalledWith(41))
    })

    test('the preview says who the email comes from, and why when it is not the user’s own mailbox', async () => {
        booked()
        api.supplierPreview = arg =>
            preview(
                {
                    from: 'TravelKart <hello@travelkart.in>',
                    fromNote: 'No supplier mailbox is set up, so this goes from the agency mailbox.'
                },
                arg
            )
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Email hotel' }))
        const dialog = await screen.findByRole('dialog', { name: 'Booking request to Hotel Willow Banks' })
        expect(within(dialog).getByText('From TravelKart <hello@travelkart.in>')).toBeInTheDocument()
        expect(within(dialog).getByRole('note', { name: 'Sender' })).toHaveTextContent(
            'No supplier mailbox is set up, so this goes from the agency mailbox.'
        )
    })

    test('a receipt can be emailed for any payment, after a preview', async () => {
        renderBooking()
        const payments = screen.getByRole('region', { name: 'Guest payments' })
        fireEvent.click(within(payments).getByRole('button', { name: 'Email receipt' }))
        const dialog = await screen.findByRole('dialog', { name: 'Payment receipt' })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Send to asha@example.com' }))
        await waitFor(() => expect(api.sendReceipt).toHaveBeenCalledWith(1))
    })

    test('the guest’s hotel details are previewed before they are sent', async () => {
        renderBooking()
        fireEvent.click(screen.getAllByRole('button', { name: 'Preview and email' })[1])
        const dialog = await screen.findByRole('dialog', { name: 'Hotel details for the guest' })
        expect(api.sendHotel).not.toHaveBeenCalled()
        fireEvent.click(within(dialog).getByRole('button', { name: 'Send to asha@example.com' }))
        await waitFor(() => expect(api.sendHotel).toHaveBeenCalledWith(1))
    })
})
