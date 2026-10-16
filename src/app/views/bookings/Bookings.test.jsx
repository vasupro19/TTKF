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
        exportCalls: [],
        exportRows: [],
        booking: null,
        hotels: [],
        taxis: [],
        payments: [],
        paymentSummary: { pendingAmount: 0, canDecide: false },
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
        verifyPayment: call(),
        rejectPayment: call(),
        reversePayment: call(),
        updatePayment: call(),
        // ? the booking's invoices, and whether this user may cancel one
        invoices: [],
        invoiceSummary: { canCancel: false },
        createInvoice: call(),
        formChanges: {},
        supplierPreview: null,
        snackbars: [],
        people: []
    }
})

const query = data => ({ data, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() })
const navigate = vi.hoisted(() => vi.fn())

// ? the real navigate runs too, so the address bar (where the filters live) changes
vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal()
    return {
        ...actual,
        useNavigate: () => {
            const real = actual.useNavigate()
            return (...args) => {
                navigate(...args)
                return real(...args)
            }
        }
    }
})
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
        if (action?.type === 'bookingsPage') {
            api.exportCalls.push(action.arg)
            const start = action.arg.page * action.arg.pageSize
            return Promise.resolve({ data: { data: api.exportRows.slice(start, start + action.arg.pageSize) } })
        }
        if (action?.type === 'snackbar') api.snackbars.push(action.payload.message)
        return action
    },
    useSelector: select => select({ loading: {} })
}))
vi.mock('@app/store/slices/snackbar', () => ({ openSnackbar: payload => ({ type: 'snackbar', payload }) }))
vi.mock('@/app/store/slices/api/packageConvert', () => ({
    getBookingsPage: { initiate: arg => ({ type: 'bookingsPage', arg }) },
    useGetBookingsPageQuery: args => {
        api.pageArgs.push(args)
        return query({ data: api.list, count: api.count, summary: api.summary })
    },
    useGetPackageByLeadIdQuery: () => query({ data: api.booking }),
    useGetServicesByPackageQuery: ({ type }) => query({ data: type === 'Hotel' ? api.hotels : api.taxis }),
    useGetGuestPaymentHistoryQuery: () => query({ data: api.payments, summary: api.paymentSummary }),
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
vi.mock('@/app/store/slices/api/paymentSlice', () => ({
    useVerifyGuestPaymentMutation: () => [api.verifyPayment, { isLoading: false }],
    useRejectGuestPaymentMutation: () => [api.rejectPayment, { isLoading: false }],
    useReverseGuestPaymentMutation: () => [api.reversePayment, { isLoading: false }],
    useUpdateGuestPaymentMutation: () => [api.updatePayment, { isLoading: false }]
}))
vi.mock('@/app/store/slices/api/gstSlice', () => ({
    useGetBookingInvoicesQuery: () => query({ data: api.invoices, summary: api.invoiceSummary }),
    useCreateInvoiceMutation: () => [api.createInvoice, { isLoading: false }],
    useGetInvoicePreviewQuery: () => query(null),
    useDownloadInvoicePdfMutation: () => [vi.fn(), { isLoading: false }],
    useEmailInvoiceMutation: () => [vi.fn(), { isLoading: false }],
    useCancelInvoiceMutation: () => [vi.fn(), { isLoading: false }]
}))
vi.mock('@/app/store/slices/api/confirmedService', () => ({
    usePaySupplierMutation: () => [api.paySupplier, { isLoading: false }]
}))
vi.mock('@/app/store/slices/api/leadSlice', () => ({
    useGetAssigneesQuery: () => ({ data: { data: api.people } }),
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
    api.exportCalls = []
    api.exportRows = []
    api.people = []
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
            transactionId: 'UTR123',
            status: 'VERIFIED',
            hasProof: true,
            proofName: 'upi.png',
            reviewedByName: 'Meera (Accounts)'
        }
    ]
    api.paymentSummary = { pendingAmount: 0, canDecide: false }
    api.invoices = []
    api.invoiceSummary = { canCancel: false }
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
        expect(lastArgs()).toEqual({
            page: 0,
            pageSize: 25,
            stage: 'all',
            q: '',
            convertedBy: '',
            createdFrom: '',
            createdTo: '',
            travelFrom: '',
            travelTo: '',
            guestPayment: '',
            supplierPayment: '',
            invoice: ''
        })

        fireEvent.click(screen.getByRole('button', { name: /Not started/ }))
        expect(lastArgs()).toMatchObject({ page: 0, stage: 'action' })

        fireEvent.change(screen.getByLabelText('Search bookings'), { target: { value: ' rohan ' } })
        await waitFor(() => expect(lastArgs()).toMatchObject({ page: 0, stage: 'action', q: 'rohan' }))
    })

    test('Converted by: hidden for one person; for those who see everyone, asks for one person from the first page', () => {
        const { unmount } = renderList()
        expect(screen.queryByRole('combobox', { name: /Converted by/ })).toBeNull()
        unmount()

        api.people = [
            { id: 1, name: 'Asha', isMe: true },
            { id: 4, name: 'Neha', isMe: false }
        ]
        renderList()
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Converted by/ }))
        fireEvent.click(screen.getByRole('option', { name: 'Neha' }))
        expect(lastArgs()).toMatchObject({ page: 0, convertedBy: '4' })
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Converted by/ }))
        fireEvent.click(screen.getByRole('option', { name: 'Everyone' }))
        expect(lastArgs()).toMatchObject({ convertedBy: '' })
    })

    test('more than a page: which ones are shown, and the next page on request', () => {
        api.count = 60
        api.summary = { ...api.summary, total: 60 }
        renderList()
        expect(screen.getByText(/Showing 1–25 of 60 bookings/)).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
        expect(lastArgs()).toMatchObject({ page: 1 })
    })

    test('a search that matches nothing says so', () => {
        api.list = []
        api.count = 0
        renderList()
        expect(screen.getByText('No confirmed bookings yet')).toBeInTheDocument()
        expect(screen.queryByText(/No bookings match these filters/)).toBeNull()
    })

    test('nothing matches the filters: says so, and Clear filters brings everything back', () => {
        api.list = []
        api.count = 0
        api.summary = { total: 8, toCollect: 0, stages: { action: 8 } }
        render(
            <MemoryRouter initialEntries={['/process/packages?guestPayment=paid&invoice=none']}>
                <BookingsPage />
            </MemoryRouter>
        )
        expect(lastArgs()).toMatchObject({ guestPayment: 'paid', invoice: 'none' })
        expect(screen.getByText('No bookings match these filters.')).toBeInTheDocument()
        expect(screen.getByText('0 bookings (filtered from 8)')).toBeInTheDocument()
        fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
        expect(lastArgs()).toMatchObject({ guestPayment: '', invoice: '' })
    })

    test('the dates and dropdowns are sent to the server from the first page, and kept in the address bar', () => {
        renderList()
        fireEvent.change(screen.getByLabelText('Travel from'), { target: { value: '2026-11-01' } })
        expect(lastArgs()).toMatchObject({ page: 0, travelFrom: '2026-11-01' })
        fireEvent.change(screen.getByLabelText('Created to'), { target: { value: '2026-10-14' } })
        expect(lastArgs()).toMatchObject({ travelFrom: '2026-11-01', createdTo: '2026-10-14' })
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Invoice/ }))
        fireEvent.click(screen.getByRole('option', { name: 'Has GST invoice' }))
        expect(lastArgs()).toMatchObject({ invoice: 'with' })
        expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    })

    test('the page size is kept as a choice', () => {
        renderList()
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Rows/ }))
        fireEvent.click(screen.getByRole('option', { name: '50' }))
        expect(lastArgs()).toMatchObject({ page: 0, pageSize: 50 })
    })

    test('export all asks for every page of what is filtered', async () => {
        api.count = 120
        api.summary = { ...api.summary, total: 120 }
        api.exportRows = Array.from({ length: 120 }, (_, index) => listRow({ id: index + 1 }))
        global.URL.createObjectURL = vi.fn(() => 'blob:x')
        global.URL.revokeObjectURL = vi.fn()
        render(
            <MemoryRouter initialEntries={['/process/packages?guestPayment=paid']}>
                <BookingsPage />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByRole('button', { name: /export/i }))
        fireEvent.click(await screen.findByText('Export All'))
        await waitFor(() => expect(api.exportCalls).toHaveLength(2))
        expect(api.exportCalls[0]).toMatchObject({ page: 0, pageSize: 100, guestPayment: 'paid' })
        expect(api.exportCalls[1]).toMatchObject({ page: 1 })
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
        expect(screen.getByText(/1 of 5 done/)).toBeInTheDocument()
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

    test('the margin leaves out the GST in the price', () => {
        api.booking = { ...api.booking, tax: { mode: 'exclusive', rate: 5, taxable: 85714.29, gst: 4285.71 } }
        renderBooking()
        expect(screen.getByText('Price − GST − supplier costs')).toBeInTheDocument()
        expect(screen.getByText('₹65,714.29')).toBeInTheDocument()
        expect(screen.getByText('Share of price without GST')).toBeInTheDocument()
    })

    test('an invoice is issued after a look at what it will be, and opens once made', async () => {
        api.booking = { ...api.booking, tax: { mode: 'exclusive', rate: 5, taxable: 85714.29, gst: 4285.71 } }
        renderBooking()
        const invoice = screen.getByRole('region', { name: /^Invoice/ })
        expect(within(invoice).getByText(/No invoice yet/)).toBeInTheDocument()
        expect(
            within(invoice).getByText(
                /includes GST ₹4,285.71 \(taxable value ₹85,714.29\), so its invoice is a tax invoice/
            )
        ).toBeInTheDocument()
        fireEvent.click(within(invoice).getByRole('button', { name: 'Issue invoice' }))
        const dialog = await screen.findByRole('dialog')
        fireEvent.change(within(dialog).getByLabelText('Billed to (optional)'), { target: { value: 'ACME Pvt Ltd' } })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Issue invoice' }))
        await waitFor(() =>
            expect(api.createInvoice).toHaveBeenCalledWith({ packageId: 1, customerName: 'ACME Pvt Ltd' })
        )
    })

    test('a booking with no GST says its invoice is a bill of supply', () => {
        renderBooking()
        expect(
            screen.getByText(/No GST is charged on this booking, so its invoice is a bill of supply/)
        ).toBeInTheDocument()
    })

    test('an issued invoice is listed, and the booking is not offered a second', () => {
        api.invoices = [
            {
                id: 4,
                number: 'TTK/2627/00004',
                kind: 'TAX_INVOICE',
                status: 'ISSUED',
                total: 90000,
                gst: 4285.71,
                invoiceDate: '2026-10-13T00:00:00.000Z'
            }
        ]
        renderBooking()
        const invoice = screen.getByRole('region', { name: /^Invoice/ })
        expect(within(invoice).getByText('Tax invoice TTK/2627/00004 · ₹90,000.00')).toBeInTheDocument()
        expect(within(invoice).getByText(/13 Oct 2026 · includes GST ₹4,285.71/)).toBeInTheDocument()
        expect(within(invoice).queryByRole('button', { name: 'Issue invoice' })).not.toBeInTheDocument()
    })

    test('a cancelled invoice stays listed and the booking can be invoiced again', () => {
        api.invoices = [
            {
                id: 4,
                number: 'TTK/2627/00004',
                kind: 'BILL_OF_SUPPLY',
                status: 'CANCELLED',
                total: 90000,
                gst: 0,
                invoiceDate: '2026-10-13T00:00:00.000Z'
            }
        ]
        renderBooking()
        const invoice = screen.getByRole('region', { name: /^Invoice/ })
        expect(within(invoice).getByText('Cancelled')).toBeInTheDocument()
        expect(within(invoice).getByRole('button', { name: 'Issue invoice' })).toBeInTheDocument()
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

    test('a recorded guest payment waits for accounts: no receipt is offered until it is verified', async () => {
        api.addGuestPayment.mockReturnValueOnce({
            unwrap: () =>
                Promise.resolve({
                    data: { paymentId: 41, guestEmail: 'asha@example.com' },
                    message: 'Payment recorded — it counts once accounts verifies it'
                })
        })
        renderBooking()
        fireEvent.click(screen.getAllByRole('button', { name: 'Record a payment' })[0])
        fireEvent.click(screen.getByRole('button', { name: 'Save the payment' }))
        await waitFor(() => expect(api.addGuestPayment).toHaveBeenCalled())
        await waitFor(() => expect(api.snackbars).toContain('Payment recorded — it counts once accounts verifies it'))
        expect(screen.queryByRole('dialog', { name: 'Payment receipt' })).not.toBeInTheDocument()
    })

    test('a payment awaiting verification: its status, the amount waiting, and the receipt held back', () => {
        api.payments = [
            { id: 7, amount: '10000', paymentMethod: 'UPI', transactionId: 'UTR9', status: 'PENDING', hasProof: true }
        ]
        api.paymentSummary = { pendingAmount: 10000, canDecide: false }
        renderBooking()
        const payments = screen.getByRole('region', { name: 'Guest payments' })
        expect(within(payments).getByText('Awaiting verification')).toBeInTheDocument()
        expect(within(payments).getByText(/₹10,000 awaiting verification by accounts/)).toBeInTheDocument()
        expect(within(payments).getByRole('button', { name: 'Email receipt' })).toBeDisabled()
        expect(within(payments).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
        // ? sales cannot decide it
        expect(within(payments).queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument()
        expect(screen.getByText('Awaiting verification', { selector: 'p' })).toBeInTheDocument()
    })

    test('a rejected payment shows sales why, and can be corrected and resubmitted', () => {
        api.payments = [
            {
                id: 8,
                amount: '5000',
                paymentMethod: 'UPI',
                status: 'REJECTED',
                rejectionReason: 'UTR not in the bank statement',
                reviewedByName: 'Meera'
            }
        ]
        renderBooking()
        const payments = screen.getByRole('region', { name: 'Guest payments' })
        expect(within(payments).getByText('Rejected by Meera: UTR not in the bank statement')).toBeInTheDocument()
        expect(within(payments).getByRole('button', { name: 'Correct and resubmit' })).toBeInTheDocument()
    })

    test('accounts verifies a payment after seeing it beside its amount and transaction id', async () => {
        api.payments = [
            { id: 7, amount: '10000', paymentMethod: 'Cash', transactionId: 'R-1', status: 'PENDING', hasProof: false }
        ]
        api.paymentSummary = { pendingAmount: 10000, canDecide: true }
        renderBooking()
        const payments = screen.getByRole('region', { name: 'Guest payments' })
        fireEvent.click(within(payments).getByRole('button', { name: 'Verify' }))
        const dialog = await screen.findByRole('dialog', { name: 'Verify payment' })
        expect(within(dialog).getByText('R-1')).toBeInTheDocument()
        expect(within(dialog).getByText('No proof attached (cash).')).toBeInTheDocument()
        fireEvent.click(within(dialog).getByRole('button', { name: 'Verify payment' }))
        await waitFor(() => expect(api.verifyPayment).toHaveBeenCalledWith({ id: 7, reason: undefined }))
    })

    test('rejecting needs a reason', async () => {
        api.payments = [{ id: 7, amount: '10000', paymentMethod: 'UPI', status: 'PENDING', hasProof: true }]
        api.paymentSummary = { pendingAmount: 10000, canDecide: true }
        renderBooking()
        fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
        const dialog = await screen.findByRole('dialog', { name: 'Reject payment' })
        const confirm = within(dialog).getByRole('button', { name: 'Reject' })
        expect(confirm).toBeDisabled()
        fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Amount does not match' } })
        fireEvent.click(confirm)
        await waitFor(() => expect(api.rejectPayment).toHaveBeenCalledWith({ id: 7, reason: 'Amount does not match' }))
    })

    test('a verified payment can be reversed by accounts, not edited', () => {
        api.paymentSummary = { pendingAmount: 0, canDecide: true }
        renderBooking()
        const payments = screen.getByRole('region', { name: 'Guest payments' })
        expect(within(payments).getByRole('button', { name: 'Reverse' })).toBeInTheDocument()
        expect(within(payments).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
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
