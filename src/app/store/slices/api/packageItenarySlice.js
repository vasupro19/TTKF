import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const packageItenarySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === PACKAGE CLIENT ENDPOINTS ===
        getPackageItenaryClients: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getPackageItenaryClientsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // 🚨 Path updated for packages
                    url: `/campaign/package/itenary${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            // 🚨 Tag updated
            providesTags: ['PackageClient']
        }),
        getPackageClientItenaryById: build.query({
            query: id => ({
                // 🚨 Path updated
                url: `/package-client/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            // 🚨 Tag updated
            providesTags: ['PackageClientById']
        }),
        createPackageItenaryClient: build.mutation({
            query: payload => {
                // 🚨 Key updated
                const KEY = 'createPackageItenaryClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // 🚨 Path updated
                    url: '/campaign/package/itenary',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // 🚨 Tag updated
            invalidatesTags: ['PackageClient']
        }),
        updatePackageClient: build.mutation({
            query: ({ id, ...updateData }) => {
                // 🚨 Key updated
                const KEY = 'updatePackageClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // 🚨 Path updated
                    url: `/package-client/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // 🚨 Tags updated
            invalidatesTags: ['PackageClient', 'PackageClientById']
        })
    })
})

// Export hooks only for Package Client endpoints
export const {
    useGetPackageItenaryClientsQuery,
    useGetPackageItenaryClientByIdQuery,
    useCreatePackageItenaryClientMutation,
    useUpdatePackageClientMutation,

    // Export the endpoint reference itself if needed elsewhere
    endpoints: { getPackageClientItenaryById, getPackageItenaryClients }
} = packageItenarySlice
