import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const locationSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getCampaigns: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getLocationMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['locationMaster']
        }),
        getCampaignById: build.query({
            query: id => ({
                url: `/campaign/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['locationMasterById']
        }),
        createCampaign: build.mutation({
            query: payload => {
                const KEY = 'createCampaignKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/campaign/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationMaster', 'locationMasterById']
        }),
        updateCampaign: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateLocationMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/update/${id}`,
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationMaster', 'locationMasterById']
        }),
        removeLocationMaster: build.mutation({
            query: id => {
                const KEY = `removeLocationMasterLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/campaign/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationMaster', 'locationMasterById']
        }),
        uploadCampaignsExcel: build.mutation({
            query: campaignsArray => ({
                url: '/campaign/upload-excel',
                method: 'POST',
                body: { campaigns: campaignsArray }
            }),
            // This forces the "Campaign List" to refresh automatically
            invalidatesTags: ['Campaigns']
        })
    })
})

export const {
    useGetCampaignsQuery,
    useGetCampaignByIdQuery,
    endpoints: { getCampaigns, removeLocationMaster, getCampaignById },
    useCreateCampaignMutation,
    useUpdateCampaignMutation,
    useUploadCampaignsExcelMutation
} = locationSlice
