import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const guestSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ... existing guest tour endpoints ...

        // === GET PRICING BY GUEST TOUR ID ===
        getGuestTourPrice: build.query({
            query: ({ leadId, quotationNo }) => {
                // Double-check inside the query builder
                if (!leadId || !quotationNo) {
                    return '' // RTK Query will not execute if the query string is empty
                }
                return {
                    url: `/guest-tour-price/${leadId}?quotationNo=${quotationNo}`,
                    responseHandler: async result => customResponseHandler({ result })
                }
            },
            providesTags: (result, error, { leadId, quotationNo }) => [
                { type: 'guestTourPrice', id: `${leadId}-${quotationNo}` }
            ]
        }),

        // === UPSERT PRICING (Create/Update logic) ===
        upsertGuestTourPrice: build.mutation({
            query: payload => {
                const KEY = 'upsertPriceKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/guest-tour-price/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: (result, error, payload) => [
                { type: 'guestTourPrice', id: `${payload.leadId}-${payload.quotationNo}` }
            ]
        }),

        // === UPDATE PRICING BY ID ===
        updateGuestTourPrice: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updatePriceKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/guest-tour/price/update/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: (result, error, payload) => [
                { type: 'guestTourPrice', id: `${payload.leadId}-${payload.quotationNo}` }
            ]
        })
    })
})

export const {
    // Existing exports

    // New pricing exports
    useGetGuestTourPriceQuery,
    useUpsertGuestTourPriceMutation,
    useUpdateGuestTourPriceMutation,

    endpoints: { getGuestTourById, getGuestTourPrice }
} = guestSlice
