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
            invalidatesTags: ['confirmedBooking']
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
            query: payload => ({
                url: '/package/guest-payment',
                method: 'POST',
                body: payload // packageId, amount, paymentMethod, transactionId, remarks
            }),
            // This invalidates the Package list so the 'guestPaidAmount' and 'status' refresh automatically
            invalidatesTags: ['ConfirmedPackage', 'PaymentHistory']
        }),
        sendVoucherEmail: build.mutation({
            query: packageId => ({
                url: `/package/send-email/${packageId}`,
                method: 'POST'
            })
            // No need to invalidate tags unless the status changes to "Voucher Sent"
        }),
        getGuestPaymentHistory: build.query({
            query: packageId => ({
                url: `/package/guest-payment-history/${packageId}`,
                method: 'GET'
            }),
            // Provides tags so the list refreshes if a new payment is added
            providesTags: (result, error, packageId) => [{ type: 'GuestPayment', id: packageId }]
        })
    })
})

export const {
    useGetConfirmedBookingQuery,
    useConvertPackageMutation,
    useUpdateConfirmedBookingMutation,
    useAddServiceToPackageMutation,
    useGetServicesByPackageQuery,
    useDeleteServiceMutation,
    useSendSupplierEmailMutation,
    useAddGuestPaymentMutation,
    useSendVoucherEmailMutation,
    useGetGuestPaymentHistoryQuery,
    endpoints: { getConfirmedBooking, convertPackage, getAllConfirmedPackages }
} = bookingSlice
