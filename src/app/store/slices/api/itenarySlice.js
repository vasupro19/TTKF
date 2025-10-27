import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const itenarySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === ITINERARY CLIENT ENDPOINTS ===
        getItenaryClients: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getItenaryClientsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/itenary${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['ItenaryClient']
        }),
        getItenaryClientById: build.query({
            query: id => ({
                url: `/itinerary-client/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['ItenaryClientById']
        }),
        createItenaryClient: build.mutation({
            query: payload => {
                const KEY = 'createItenaryClientKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/campaign/itenary/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['ItenaryClient']
        }),
        updateItenaryClient: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateItenaryClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/itinerary-client/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['ItenaryClient', 'ItenaryClientById']
        })
    })
})

// Export hooks and endpoint references
export const {
    useGetItenaryClientsQuery,
    useGetItenaryClientByIdQuery,
    useCreateItenaryClientMutation,
    useUpdateItenaryClientMutation,

    // Export the endpoint reference itself
    endpoints: { getItenaryClientById, getItenaryClients }
} = itenarySlice
