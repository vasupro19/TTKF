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

        getAllConfirmedPackages: build.query({
            query: () => ({
                url: '/package',
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

        // === SEND SUPPLIER EMAIL ===
        sendSupplierEmail: build.mutation({
            query: id => {
                const KEY = 'sendSupplierEmailKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/supplier/email/${id}`,
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
        // ? the booking request to a hotel or transporter, exactly as it will be emailed
        getSupplierEmailPreview: build.query({
            query: serviceId => ({
                url: `/package/supplier/email/${serviceId}/preview`,
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
    useAddGuestPaymentMutation,
    useSendVoucherEmailMutation,
    useSendGuestHotelConfirmationEmailMutation,
    useSendGuestTaxiConfirmationEmailMutation,
    useDownloadConfirmedVoucherPdfMutation,
    useGetGuestPaymentHistoryQuery,
    useGetPackageByLeadIdQuery,
    endpoints: {
        getConfirmedBooking,
        convertPackage,
        getAllConfirmedPackages,
        getConfirmedVoucherPreview,
        getSupplierEmailPreview
    }
} = bookingSlice
