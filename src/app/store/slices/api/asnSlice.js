import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const asnSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        asnDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'asnDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/asn${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['asn']
        }),
        getPOByNo: build.mutation({
            query: id => ({
                url: `/inbound/asn/show?po_no=${id}`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['POByNo']
        }),
        getAsnById: build.mutation({
            query: id => ({
                url: `/inbound/asn/${id}/fetchAsnData`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['POByNo']
        }),
        getDropDownData: build.query({
            query: () => {
                const KEY = 'getDropDownDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/asn/data',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['asnDropDownData']
        }),
        createAsn: build.mutation({
            query: payload => {
                const KEY = 'createAsnLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/asn/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['asn', 'POByNo', 'asnDropDownData']
        }),
        scanAsnItem: build.mutation({
            query: payload => {
                const KEY = 'scanAsnItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/asn/scanItem',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['asn', 'POByNo', 'asnDropDownData', 'asnItems']
        }),
        asnItemDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'asnItemDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/asn/items/datatable${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['asnItems']
        }),
        removeAsnItem: build.mutation({
            query: payload => {
                const KEY = `removeAsnItemLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/asn/deleteItems',
                    body: payload,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['asn', 'asnItems']
        }),
        asnItemTemplate: build.mutation({
            query: () => ({
                url: `/inbound/asn/item/export`,
                method: 'GET',
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['asn']
        }),
        uploadAsnItemTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/asn/item/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['asn', 'asnItems']
        }),
        getAsnBulkCreateTemplate: build.mutation({
            query: () => ({
                url: `/inbound/asn/export`,
                method: 'GET',
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['asn']
        }),
        uploadAsnBulkCreateTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/asn/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['asn', 'asnItems']
        })
    })
})

export const {
    endpoints: { asnDataTable, getDropDownData, asnItemDataTable },
    useCreateAsnMutation,
    useScanAsnItemMutation,
    useAsnItemTemplateMutation,
    useUploadAsnItemTemplateMutation,
    useGetAsnBulkCreateTemplateMutation,
    useUploadAsnBulkCreateTemplateMutation,
    useRemoveAsnItemMutation,
    useGetPOByNoMutation,
    useGetAsnByIdMutation
} = asnSlice
