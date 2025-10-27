import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const pickConfigurationSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getConfig: build.query({
            query: () => ({
                url: `/outbound/pickConfig`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        createConfig: build.mutation({
            query: body => {
                const KEY = 'createConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pickConfig',
                    method: 'POST',
                    body,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    }),
    overrideExisting: false
})

export const {
    useCreateConfigMutation,
    endpoints: { getConfig }
} = pickConfigurationSlice
