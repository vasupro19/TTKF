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
                url: `/destination-client/${id}`,
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
                    url: `/destination-client/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['DestinationClient', 'DestinationClientById']
        })
    })
})

// Export hooks only for Destination Client endpoints
export const {
    useGetDestinationClientsQuery,
    useGetDestinationClientByIdQuery,
    useCreateDestinationClientMutation,
    useUpdateDestinationClientMutation,

    // Export the endpoint reference itself if needed elsewhere
    endpoints: { getDestinationClientById, getDestinationClients }
} = destinationSlice
