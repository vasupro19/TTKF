import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const aiSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        assistAi: build.mutation({
            query: body => {
                const KEY = 'assistAiLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/ai/assist',
                    method: 'POST',
                    body,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        getTravelImages: build.query({
            query: keyword => {
                const KEY = 'getTravelImagesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/ai/assist?query=${encodeURIComponent(`${keyword} travel india`)}`,
                    keepUnusedDataFor: 300, // cache for 5 mins — same keyword won't refetch
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['travelImages']
        })
    })
})

export const {
    useAssistAiMutation,
    useGetTravelImagesQuery,
    endpoints: { getTravelImages }
} = aiSlice
