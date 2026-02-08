import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const destinationSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === DESTINATION CLIENT ENDPOINTS ===
        getDestinationClients: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getDestinationClientsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/destination${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['DestinationClient']
        }),
        getDestinationClientById: build.query({
            query: id => ({
                url: `/campaign/destination/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['DestinationClientById']
        }),
        createDestinationClient: build.mutation({
            query: payload => {
                const KEY = 'createDestinationClientKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/campaign/destination/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['DestinationClient']
        }),
        updateDestinationClient: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateDestinationClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/update/destination/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['DestinationClient', 'DestinationClientById']
        }),
        uploadDestinations: build.mutation({
            query: payload => {
                const KEY = 'uploadDestinationsKey'
                // Trigger global loader event based on your project's loading pattern
                dispatchLoaderEvent(KEY)

                return {
                    url: 'campaign/destination/upload-excel', // Ensure this matches your backend route
                    method: 'POST',
                    body: payload,
                    responseHandler: async result =>
                        customResponseHandler({
                            result,
                            requestKey: KEY
                        })
                }
            },
            // This tells RTK Query to refetch the destination list automatically
            invalidatesTags: ['getDestinations']
        })
    })
})

// Export hooks only for Destination Client endpoints
export const {
    useGetDestinationClientsQuery,
    useGetDestinationClientByIdQuery,
    useCreateDestinationClientMutation,
    useUpdateDestinationClientMutation,
    useUploadDestinationsMutation,

    // Export the endpoint reference itself if needed elsewhere
    endpoints: { getDestinationClientById, getDestinationClients }
} = destinationSlice
