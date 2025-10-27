import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const putAwaySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        dataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'dataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/putaway${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            }
        }),
        itemsDataTable: build.query({
            query: query => ({
                url: `/inbound/putaway/items/datatable${query || ''}`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        getPutAwayById: build.query({
            query: id => ({
                url: `/inbound/putaway/${id}/show`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        validateFormBin: build.query({
            query: query => {
                const KEY = 'validateFormBinLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/putaway/validateFromBin${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['validateFormBin']
        }),
        pendingPutAwayItems: build.query({
            query: query => {
                const KEY = 'pendingPutAwayItemsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/putaway/pendingPutawayItems${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['pendingPutAwayItems']
        }),
        validateAddress: build.query({
            query: query => {
                const KEY = 'validateAddressLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/putaway/validateAddress${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['validateAddress']
        }),
        scanItem: build.mutation({
            query: payload => {
                const KEY = 'scanItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/putaway/scanItem`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['scanItem']
        }),
        submitPutAway: build.mutation({
            query: payload => ({
                url: '/inbound/putaway',
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['validateFormBin', 'validateAddress', 'scanItem']
        }),
        validateToBin: build.query({
            query: query => {
                const KEY = 'validateToBinLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/putaway/validateToBin${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['validateToBin']
        })
    })
})
export const {
    endpoints: {
        dataTable,
        itemsDataTable,
        getPutAwayById,
        validateFormBin,
        pendingPutAwayItems,
        validateAddress,
        validateToBin
    },
    useScanItemMutation,
    useSubmitPutAwayMutation
} = putAwaySlice
