import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const bookingSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === GET CONFIRMED BOOKING BY LEAD ID ===
        getConfirmedBooking: build.query({
            query: leadId => ({
                url: `/package/confirmed/${leadId}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['confirmedBooking']
        }),

        addServiceToPackage: build.mutation({
            query: payload => {
                const KEY = 'addServiceKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/package/supplier',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['confirmedBooking', 'ServiceList']
        }),

        // === CONVERT PACKAGE ===
        convertPackage: build.mutation({
            query: payload => {
                const KEY = 'convertPackageKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/package/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // ? the lead page's booking note reads 'ConfirmedPackage'; it stayed stale after booking
            invalidatesTags: ['confirmedBooking', 'ConfirmedPackage']
        }),

        // === UPDATE BOOKING DETAILS ===
        updateConfirmedBooking: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateBookingKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/update/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['confirmedBooking']
        }),

        // ? every booking (the dashboard's figures)
        getAllConfirmedPackages: build.query({
            query: (query = '') => ({
                url: `/package${typeof query === 'string' ? query : ''}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['confirmedBooking']
        }),

        getServicesByPackage: build.query({
            query: ({ packageId, type }) => ({
                url: `/package/supplier/${packageId}?type=${type}`,
                method: 'GET',
                // Note: GET requests usually don't trigger loader events in this pattern,
                // but adding it here if you want it tracked.
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['ServiceList']
        }),

        // === DELETE SERVICE ===
        deleteService: build.mutation({
            query: id => {
                const KEY = 'deleteServiceKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/supplier/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['ServiceList', 'confirmedBooking']
        }),

        // ? one page of the bookings list: `{ page, pageSize, stage, q }` → rows, how many match, and the chip counts
        getBookingsPage: build.query({
            query: ({ page = 0, pageSize = 25, stage = 'all', q = '' } = {}) => {
                const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
                if (stage && stage !== 'all') params.set('stage', stage)
                if (q) params.set('q', q)
                return {
                    url: `/package?${params.toString()}`,
                    responseHandler: async result => customResponseHandler({ result })
                }
            },
            providesTags: ['confirmedBooking']
        }),

        // === SEND SUPPLIER EMAIL ===
        // ? `{ id, kind: 'request' | 'amendment' | 'cancellation', previous, remove }` — or just the line's id for a request
        sendSupplierEmail: build.mutation({
            query: arg => {
                const { id, ...body } = typeof arg === 'object' ? arg : { id: arg }
                const KEY = 'sendSupplierEmailKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/supplier/email/${id}`,
                    method: 'POST',
                    body,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // ? a cancellation can take the line off the booking
            invalidatesTags: ['ServiceList', 'confirmedBooking']
        }),
        // ? the guest's receipt for one payment, once the agent has seen it
        sendGuestReceipt: build.mutation({
            query: paymentId => {
                const KEY = 'sendGuestReceiptKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/guest-payment/${paymentId}/receipt`,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        addGuestPayment: build.mutation({
            // ? the same key for every try of one payment, so a retry after a slow reply is not recorded twice
            query: ({ idempotencyKey, ...payload }) => ({
                url: '/package/guest-payment',
                method: 'POST',
                body: payload, // packageId, amount, paymentMethod, transactionId, remarks
                ...(idempotencyKey ? { headers: { 'x-idempotency-key': idempotencyKey } } : {})
            }),
            // This invalidates the Package list so the 'guestPaidAmount' and 'status' refresh automatically
            invalidatesTags: ['ConfirmedPackage', 'PaymentHistory', 'GuestPayment', 'confirmedBooking']
        }),
        sendVoucherEmail: build.mutation({
            query: packageId => ({
                url: `/package/send-email/${packageId}`,
                method: 'POST'
            }),
            // ? the booking becomes "Voucher Sent"
            invalidatesTags: ['confirmedBooking', 'ConfirmedPackage']
        }),
        sendGuestHotelConfirmationEmail: build.mutation({
            query: packageId => {
                const KEY = 'sendGuestHotelConfirmationEmailKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/send-email/${packageId}/hotel`,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        sendGuestTaxiConfirmationEmail: build.mutation({
            query: packageId => {
                const KEY = 'sendGuestTaxiConfirmationEmailKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/send-email/${packageId}/taxi`,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        // ? the booking request, amendment or cancellation to a hotel or transporter, exactly as it will be emailed:
        // ? `{ id, kind, previous }` (previous: to the supplier the line had before) — or just the line's id
        getSupplierEmailPreview: build.query({
            query: arg => {
                const { id, kind, previous } = typeof arg === 'object' ? arg : { id: arg }
                const params = new URLSearchParams()
                if (kind) params.set('kind', kind)
                if (previous) params.set('previous', '1')
                const search = params.toString()
                return {
                    url: `/package/supplier/email/${id}/preview${search ? `?${search}` : ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result })
                }
            }
        }),
        // ? the receipt for one guest payment, exactly as it will be emailed
        getGuestReceiptPreview: build.query({
            query: paymentId => ({
                url: `/package/guest-payment/${paymentId}/receipt/preview`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        // ? the guest's hotel ('hotel') or transport ('taxi') details, exactly as they will be emailed
        getGuestServicePreview: build.query({
            query: ({ packageId, kind }) => ({
                url: `/package/preview/${packageId}/${kind}`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        getConfirmedVoucherPreview: build.query({
            query: packageId => ({
                url: `/package/preview/${packageId}`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['confirmedVoucherPreview']
        }),
        downloadConfirmedVoucherPdf: build.mutation({
            query: packageId => ({
                url: `/package/download-pdf/${packageId}`,
                method: 'GET',
                responseHandler: response => response.blob()
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                const KEY = 'downloadConfirmedVoucherPdfKey'
                dispatchLoaderEvent(KEY)
                try {
                    await queryFulfilled
                } finally {
                    dispatchLoaderEvent(KEY, false)
                }
            }
        }),
        getGuestPaymentHistory: build.query({
            query: packageId => ({
                url: `/package/guest-payment-history/${packageId}`,
                method: 'GET'
            }),
            // Provides tags so the list refreshes if a new payment is added
            providesTags: (result, error, packageId) => [{ type: 'GuestPayment', id: packageId }]
        }),
        getPackageByLeadId: build.query({
            query: leadId => ({
                url: `/package/getPackagebyLead/${leadId}`,
                method: 'GET'
            }),
            // Provides tags so the list refreshes if a new payment is added
            providesTags: (result, error, packageId) => [{ type: 'ConfirmedPackage', id: packageId }]
        })
    })
})

export const {
    useGetConfirmedBookingQuery,
    useGetAllConfirmedPackagesQuery,
    useConvertPackageMutation,
    useUpdateConfirmedBookingMutation,
    useAddServiceToPackageMutation,
    useGetServicesByPackageQuery,
    useDeleteServiceMutation,
    useSendSupplierEmailMutation,
    useSendGuestReceiptMutation,
    useAddGuestPaymentMutation,
    useSendVoucherEmailMutation,
    useSendGuestHotelConfirmationEmailMutation,
    useSendGuestTaxiConfirmationEmailMutation,
    useDownloadConfirmedVoucherPdfMutation,
    useGetGuestPaymentHistoryQuery,
    useGetPackageByLeadIdQuery,
    useGetBookingsPageQuery,
    endpoints: {
        getConfirmedBooking,
        convertPackage,
        getAllConfirmedPackages,
        getConfirmedVoucherPreview,
        getSupplierEmailPreview,
        getGuestReceiptPreview,
        getGuestServicePreview
    }
} = bookingSlice
