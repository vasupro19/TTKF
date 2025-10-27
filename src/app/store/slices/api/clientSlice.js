import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const clientSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getClient: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/client${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['client']
        }),
        getClientById: build.query({
            query: id => ({
                url: `/admin/client/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['clientById']
        }),
        createClient: build.mutation({
            query: payload => {
                const KEY = 'createClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/client',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client', 'clientById', 'clientData']
        }),
        updateClient: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/client/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client', 'clientById', 'clientData']
        }),
        removeClient: build.mutation({
            query: id => {
                const KEY = `removeClientLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/client/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client', 'clientById', 'clientData']
        }),
        fetchLocations: build.mutation({
            query: () => ({
                url: '/list/locations',
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['locationForClient']
        }),
        fetchClients: build.mutation({
            query: () => ({
                url: '/admin/client/data',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['clientData']
        }),
        fetchCountries: build.mutation({
            query: (term = '') => ({
                url: `/select2/countries?term=${term}&limit=10&page=1`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        fetchStates: build.mutation({
            query: ({ countryId, term = '' }) => ({
                url: `/select2/states?country_id=${countryId}&term=${term}&limit=10&page=1`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        fetchCities: build.mutation({
            query: ({ stateId, term = '' }) => ({
                url: `/select2/cities?term=${term}&state_id=${stateId}&limit=10&page=1`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        fetchPincodeDetails: build.mutation({
            query: pincode => ({
                url: `/list/pincodes?pincode=${pincode}`,
                responseHandler: async result => customResponseHandler({ result })
            })
        })
    })
})

export const {
    useGetClientQuery,
    useGetClientByIdQuery,
    endpoints: { getClient, removeClient, getClientById },
    useCreateClientMutation,
    useUpdateClientMutation,
    useFetchLocationsMutation,
    useFetchClientsMutation,
    useFetchCountriesMutation,
    useFetchStatesMutation,
    useFetchCitiesMutation,
    useFetchPincodeDetailsMutation
} = clientSlice
