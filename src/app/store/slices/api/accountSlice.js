import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const accountSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getMasterClient: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getMasterClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/masterClient${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['masterClient']
        }),
        getMasterClientById: build.query({
            query: id => ({
                url: `/admin/masterClient/${id || ''}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['masterClientById']
        }),
        createMasterClient: build.mutation({
            query: payload => {
                const KEY = 'createMasterClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/admin/masterClient',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['masterClient', 'masterClientById']
        }),
        updateMasterClient: build.mutation({
            query: ({ id, formData }) => {
                const KEY = 'updateMasterClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/masterClient/${id}`,
                    method: 'POST',
                    body: formData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['masterClient', 'masterClientById']
        }),
        removeMasterClient: build.mutation({
            query: id => {
                const KEY = `removeMasterClientLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/masterClient/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['masterClient', 'masterClientById']
        })
    })
})

export const {
    useGetMasterClientQuery,
    endpoints: { getMasterClient, removeMasterClient, getMasterClientById },
    useCreateMasterClientMutation,
    useUpdateMasterClientMutation
} = accountSlice
