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
        getLeadTimeline: build.query({
            query: id => ({
                url: `/leads/${id}/timeline`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['leadTimeline']
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
            invalidatesTags: ['getLeads', 'leadMasterById', 'leadTimeline']
        }),
        deleteLead: build.mutation({
            query: id => {
                const KEY = 'deleteLeadKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/leads/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getLeads', 'leadMasterById', 'leadTimeline']
        }),
        shareLeadDetails: build.mutation({
            // 🚀 Use ({ leadId, quotationNo }) to pull the properties out of the object
            query: arg => {
                const { leadId, quotationNo } = arg // Explicitly pull them out
                const KEY = 'shareLeadDetailsKey'
                dispatchLoaderEvent(KEY)

                return {
                    // Now ${leadId} will be the actual ID, not [object Object]
                    url: `/leads/share-details/${leadId}?quotationNo=${quotationNo}`,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        getLeadPreview: build.query({
            query: ({ leadId, quoteNo }) => ({
                url: `/leads/preview/${leadId}?quoteNo=${quoteNo}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['leadPreview']
        }),
        generateQuotationPdf: build.mutation({
            query: ({ leadId, quoteNo }) => ({
                url: `/leads/generate-pdf/${leadId}/${quoteNo}`,
                method: 'GET',
                responseHandler: response => response.blob()
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                const KEY = 'generatePdfKey'
                dispatchLoaderEvent(KEY)
                try {
                    await queryFulfilled
                } finally {
                    dispatchLoaderEvent(KEY, false)
                }
            }
        })
    })
})

export const {
    useGetLeadsQuery,
    useGetLeadByIdQuery,
    useGetLeadTimelineQuery,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
    useShareLeadDetailsMutation,
    useGenerateQuotationPdfMutation,
    endpoints: { getLeads, getLeadById, getLeadPreview, getLeadTimeline }
} = leadsSlice
