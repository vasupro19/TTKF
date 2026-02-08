import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const confirmedServiceSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === GET ALL CONFIRMED SERVICES (Ledger) ===
        getConfirmedServices: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getConfirmedServicesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/package/confirmed-services${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['getConfirmedServices']
        }),

        // === RECORD SUPPLIER PAYMENT (Mutation) ===
        paySupplier: build.mutation({
            query: payload => {
                const KEY = 'paySupplierKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/package/supplier-payment',
                    method: 'POST',
                    body: payload, // Expected: serviceId, amount, paymentMethod, transactionId, paymentDate, remarks
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // Invalidates the ledger list to refresh balances automatically
            invalidatesTags: ['getConfirmedServices']
        }),

        // === GET PAYMENT HISTORY FOR A SERVICE ===
        getSupplierPaymentHistory: build.query({
            query: serviceId => {
                const KEY = 'getSupplierPaymentHistoryKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/process/supplier-payment-history/${serviceId}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['supplierPaymentHistory']
        }),

        // === UPDATE SERVICE DETAILS (PUT/PATCH) ===
        updateConfirmedService: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateServiceKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/process/confirmed-services/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getConfirmedServices']
        })
    })
})

export const {
    useGetConfirmedServicesQuery,
    usePaySupplierMutation,
    useGetSupplierPaymentHistoryQuery,
    useUpdateConfirmedServiceMutation,
    endpoints: { getConfirmedServices }
} = confirmedServiceSlice
