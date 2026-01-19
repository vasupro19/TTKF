import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const supplierSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getSuppliers: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getSuppliersMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/suppliers?${query || ''}`,
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['getSuppliers']
        }),
        getSupplierById: build.query({
            query: id => ({
                url: `/suppliers/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['agentMasterById']
        }),
        createSuppliers: build.mutation({
            query: payload => {
                const KEY = 'createCampaignKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/suppliers/',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['createSuppliers']
        }),
        updateSupplier: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateAgentMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/suppliers/${id}`,
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
    useCreateSuppliersMutation,
    useGetSuppliersQuery,
    useUpdateSupplierMutation,
    endpoints: { getSuppliers, getSupplierById }
} = supplierSlice
