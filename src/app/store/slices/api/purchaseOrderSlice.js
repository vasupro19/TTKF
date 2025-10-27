import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const purchaseOrderSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        purchaseOrderDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'purchaseOrderDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/purchaseOrder${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['purchaseOrder']
        }),
        getPOById: build.mutation({
            query: id => ({
                url: `/inbound/purchaseOrder/${id}/fetchPoData`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['getPOById']
        }),
        getVendorsAndProducts: build.query({
            query: () => ({
                url: '/inbound/purchaseOrder/data',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['purchaseOrderVendors']
        }),
        getVendorAndProductById: build.query({
            query: query => ({
                url: `/inbound/purchaseOrder/show${query || ''}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['vendorById']
        }),
        createPurchaseOrder: build.mutation({
            query: payload => {
                const KEY = 'createPurchaseOrderLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/purchaseOrder/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['purchaseOrder', 'vendorById', 'purchaseOrderVendors']
        }),
        scanPOItem: build.mutation({
            query: payload => {
                const KEY = 'scanPOItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/purchaseOrder/scanItem',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['purchaseOrder', 'vendorById', 'purchaseOrderVendors', 'purchaseOrderItems']
        }),
        purchaseOrderItemDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'purchaseOrderItemDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/purchaseOrder/items/datatable${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['purchaseOrderItems']
        }),
        removePurchaseOrderItem: build.mutation({
            query: payload => {
                const KEY = `removePurchaseOrderItemLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/purchaseOrder/deleteItems',
                    body: payload,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['purchaseOrder', 'purchaseOrderItems']
        }),
        // updateSerial: build.mutation({
        //     query: ({ id, ...updateData }) => ({
        //         url: `/master/generateSerials/${id}`,
        //         method: 'PUT',
        //         body: updateData,
        //         responseHandler: async result => customResponseHandler({ result })
        //     }),
        //     invalidatesTags: ['client', 'clientById', 'clientData']
        // }),
        // removeSerial: build.mutation({
        //     query: id => ({
        //         url: `/master/generateSerials/${id}`,
        //         method: 'DELETE',
        //         responseHandler: async result => customResponseHandler({ result })
        //     }),
        //     invalidatesTags: ['client', 'clientById', 'clientData']
        // }),
        purchaseOrderItemTemplate: build.mutation({
            query: () => ({
                url: `/inbound/purchaseOrder/item/export`,
                method: 'GET',
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['purchaseOrder']
        }),
        uploadPurchaseOrderItemTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/purchaseOrder/item/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['purchaseOrder', 'purchaseOrderItems']
        }),
        getPOBulkCreateTemplate: build.mutation({
            query: () => ({
                url: `/inbound/purchaseOrder/export`,
                method: 'GET',
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['purchaseOrder']
        }),
        uploadPOBulkCreateTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/purchaseOrder/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['purchaseOrder', 'purchaseOrderItems']
        })
    })
})

export const {
    endpoints: { purchaseOrderDataTable, getVendorsAndProducts, getVendorAndProductById, purchaseOrderItemDataTable },
    useCreatePurchaseOrderMutation,
    useScanPOItemMutation,
    useGetPOByIdMutation,
    usePurchaseOrderItemTemplateMutation,
    useUploadPurchaseOrderItemTemplateMutation,
    useGetPOBulkCreateTemplateMutation,
    useUploadPOBulkCreateTemplateMutation,
    useRemovePurchaseOrderItemMutation
} = purchaseOrderSlice
