import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const packageSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === PACKAGE CLIENT ENDPOINTS ===
        getPackageClients: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getPackageClientsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // 🚨 Path updated for packages
                    url: `/campaign/package${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['PackageClient']
        }),
        getPackageClientById: build.query({
            query: id => ({
                url: `/campaign/package-all?columns[0][data]=id&columns[0][searchable]=true&columns[0][search][value]=${id}&start=0&length=1`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            transformResponse: response => ({
                ...response,
                data: response?.data?.[0] || null
            }),
            providesTags: ['PackageClientById']
        }),
        getAllPackagesClient: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getPackageAllClientsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // 🚨 Path updated for packages
                    url: `/campaign/package-all${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            // 🚨 Tag updated
            providesTags: ['PackageClient']
        }),
        createPackageClient: build.mutation({
            query: payload => {
                // 🚨 Key updated
                const KEY = 'createPackageClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // 🚨 Path updated
                    url: '/campaign/package',
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
                    url: `/campaign/package/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // 🚨 Tags updated
            invalidatesTags: ['PackageClient', 'PackageClientById']
        }),
        deletePackageClient: build.mutation({
            query: id => {
                const KEY = 'deletePackageClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/package/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['PackageClient', 'PackageClientById']
        })
    })
})

// Export hooks only for Package Client endpoints
export const {
    useGetPackageClientsQuery,
    useGetPackageClientByIdQuery,
    useGetAllPackagesClientQuery,
    useCreatePackageClientMutation,
    useUpdatePackageClientMutation,
    useDeletePackageClientMutation,

    // Export the endpoint reference itself if needed elsewhere
    endpoints: { getPackageClientById, getPackageClients }
} = packageSlice
