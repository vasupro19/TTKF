import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const leadsSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === GET ALL LEADS ===
        getLeads: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getLeadsMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/leads${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['getLeads']
        }),

        // === GET LEAD BY ID ===
        getLeadById: build.query({
            query: id => ({
                url: `/leads/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['leadMasterById']
        }),

        // === CREATE LEAD ===
        createLead: build.mutation({
            query: payload => {
                const KEY = 'createLeadKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/leads/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getLeads']
        }),

        // === UPDATE LEAD ===
        updateLead: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateLeadKey'

                dispatchLoaderEvent(KEY)
                return {
                    url: `/leads/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getLeads', 'leadMasterById']
        }),
        shareLeadDetails: build.mutation({
            query: leadId => {
                const KEY = 'shareLeadDetailsKey'
                dispatchLoaderEvent(KEY)

                return {
                    url: `/leads/share-details/${leadId}`,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    })
})

export const {
    useGetLeadsQuery,
    useGetLeadByIdQuery,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useShareLeadDetailsMutation,
    endpoints: { getLeads, getLeadById }
} = leadsSlice
