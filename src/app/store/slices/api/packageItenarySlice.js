import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const packageItenarySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getPackageItenaryClients: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getPackageItenaryClientsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/package/itenary${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['PackageItenaryClient']
        }),
        getPackageClientItenaryById: build.query({
            query: id => ({
                url: `/campaign/package/itenary/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['PackageItenaryClientById']
        }),
        createPackageItenaryClient: build.mutation({
            query: payload => {
                const KEY = 'createPackageItenaryClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/campaign/package/itenary',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['PackageItenaryClient', 'PackageItenaryClientById']
        }),
        updatePackageItenaryClient: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updatePackageItenaryClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/package/itenary/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['PackageItenaryClient', 'PackageItenaryClientById']
        }),
        deletePackageItenaryClient: build.mutation({
            query: id => {
                const KEY = 'deletePackageItenaryClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/package/itenary/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['PackageItenaryClient', 'PackageItenaryClientById']
        }),
        downloadItineraryTemplate: build.query({
            query: () => ({
                url: '/itinerary/download-template',
                method: 'GET',
                responseHandler: response => response.blob() // 👈 Critical for binary files
            })
        })
    })
})

// Export hooks only for Package Client endpoints
export const {
    useGetPackageItenaryClientsQuery,
    useGetPackageClientItenaryByIdQuery,
    useCreatePackageItenaryClientMutation,
    useUpdatePackageItenaryClientMutation,
    useDeletePackageItenaryClientMutation,

    endpoints: { getPackageClientItenaryById, getPackageItenaryClients }
} = packageItenarySlice
