import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const agentSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getAgents: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getAgentMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/agent${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['agentMaster']
        }),
        getAgentById: build.query({
            query: id => ({
                url: `/agent/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['agentMasterById']
        }),
        createAgent: build.mutation({
            query: payload => {
                const KEY = 'createAgentMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/agent/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['agentMaster', 'agentMasterById']
        }),
        updateAgent: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateAgentMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/agent/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationMaster', 'locationMasterById']
        })
    })
})

export const {
    useGetAgentsQuery,
    useGetAgentByIdQuery,
    endpoints: { getAgentById, getAgents },
    useCreateAgentMutation,
    useUpdateAgentMutation
} = agentSlice
