import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const supplierSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getSuppliers: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getSuppliersMasterLKey'
                dispatchLoaderEvent(KEY)
                return {
                    // ? callers pass '?type=Hotel&…' (the suppliers table) or 'type=Hotel' (the hotel and transport
                    // ? form): either way the address gets exactly one '?' — it read /suppliers??… or /supplierstype=…
                    url: `/suppliers${query ? `?${String(query).replace(/^\?+/, '')}` : ''}`,
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
