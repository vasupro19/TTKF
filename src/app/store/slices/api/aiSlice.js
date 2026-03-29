import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const aiSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
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
    endpoints: { getTravelImages }
} = aiSlice
