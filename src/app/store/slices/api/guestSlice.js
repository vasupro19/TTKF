import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const guestSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === GET ALL LEADS ===

        // === GET LEAD BY ID ===
        getGuestById: build.query({
            query: id => ({
                url: `/guest-detail/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['guestMasterById']
        }),

        // === CREATE LEAD ===
        createGuestDetail: build.mutation({
            query: payload => {
                const KEY = 'createLeadKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/guest-detail/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getguest']
        }),

        // === UPDATE LEAD ===
        updateGuestDetail: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateLeadKey'

                dispatchLoaderEvent(KEY)
                return {
                    url: `/guest-detail/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getguest', 'guestMasterById']
        })
    })
})

export const {
    useGetGuestByIdQuery,
    useCreateGuestDetailMutation,
    useUpdateGuestDetailMutation,
    endpoints: { getGuestById }
} = guestSlice
