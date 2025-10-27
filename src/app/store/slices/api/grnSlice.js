import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const grnSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        grnDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'grnDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `inbound/grn${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['grn']
        }),
        getGrnData: build.mutation({
            query: () => {
                const KEY = 'getGrnDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `inbound/grn/data`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['grn']
        }),
        postGrnSetup: build.mutation({
            query: payload => {
                const KEY = 'postGrnSetupLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/grnSetup`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['grn']
        }),
        scanBoxIdGateEntryId: build.query({
            query: query => ({
                url: `/inbound/grn/gateEntryData${query || ''}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['grn']
        }),
        scanAndValidateEAN: build.query({
            query: query => {
                const KEY = 'scanAndValidateEANLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/validateEAN${query || ''}`,
                    keepUnusedDataFor: 300,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        scanAndValidateUID: build.mutation({
            query: query => {
                const KEY = 'scanAndValidateUIDLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/validateUID${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        scanAndValidateBIN: build.mutation({
            query: query => {
                const KEY = 'scanAndValidateBINLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/validateBin${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        scanAndValidateRFID: build.query({
            query: query => {
                const KEY = 'scanAndValidateRFIDLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/validateRfid${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        scanGrnItem: build.mutation({
            query: payload => ({
                url: '/inbound/grn/scanItem',
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        generateUID: build.mutation({
            query: payload => {
                const KEY = 'generateUIDLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/grn/generateUID',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        getGrnById: build.query({
            query: id => {
                const KEY = 'GrnViewLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/${id}/show`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['GrnView']
        }),
        getGrnItemsDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'GrnItemsDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/grn/items/datatable${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['GrnViewItemsTable']
        })
    })
})
export const {
    endpoints: { grnDataTable, scanBoxIdGateEntryId, scanAndValidateEAN, scanAndValidateRFID, getGrnItemsDataTable },
    useGetGrnDataMutation,
    usePostGrnSetupMutation,
    useScanAndValidateBINMutation,
    useScanGrnItemMutation,
    useGenerateUIDMutation,
    useScanAndValidateUIDMutation,
    useGetGrnByIdQuery
} = grnSlice
