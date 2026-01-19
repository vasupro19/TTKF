import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const guestSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ... existing guest tour endpoints ...

        // === GET PRICING BY GUEST TOUR ID ===
        getGuestTourPrice: build.query({
            query: guestTourId => ({
                url: `/guest-tour-price/${guestTourId}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['guestTourPrice']
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
            invalidatesTags: ['guestTourPrice']
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
            invalidatesTags: ['guestTourPrice']
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
