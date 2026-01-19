import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const guestSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === GET ALL LEADS ===

        // === GET LEAD BY ID ===
        getGuestTourById: build.query({
            query: id => ({
                url: `/guest-tour/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['guestMasterById']
        }),

        // === CREATE LEAD ===
        createGuestTour: build.mutation({
            query: payload => {
                const KEY = 'createLeadKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/guest-tour/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getguest']
        }),
        createSingleGuestTourItenary: build.mutation({
            query: payload => {
                const KEY = 'createSingle'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/guest-tour/single-itenary',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['guestMasterById']
        }),

        // === UPDATE LEAD ===
        updateGuestTour: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateLeadKey'

                dispatchLoaderEvent(KEY)
                return {
                    url: `/guest-tour/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['guestMasterById']
        }),
        removeGuestTourItenary: build.mutation({
            query: id => {
                const KEY = `removeGuestTourItenaryKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/guest-tour/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['guestMasterById', 'guestTour']
        })
    })
})

export const {
    useGetGuestTourByIdQuery,
    useCreateGuestTourMutation,
    useCreateSingleGuestTourItenaryMutation,
    useUpdateGuestTourMutation,
    useRemoveGuestTourItenaryMutation,
    endpoints: { getGuestTourById }
} = guestSlice
