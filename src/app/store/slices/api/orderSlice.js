import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const orderSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getOrderData: build.query({
            query: () => {
                const KEY = 'getOrderDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/order/data`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['order']
        }),
        orderDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'orderDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/order${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['orderDataTable']
        }),
        orderItemDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'orderItemDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/order/items/datatable${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['orderItemDataTable']
        }),
        getPincodeInfo: build.query({
            query: query => {
                const KEY = 'getPincodeInfoLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/pincodes${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['getPincodeInfo']
        }),
        scanOrderItem: build.mutation({
            query: payload => {
                const KEY = 'scanOrderItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/order/scanItem',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['orderItemDataTable', 'orderDataTable']
        }),
        getCustomerDropDown: build.mutation({
            query: query => {
                const KEY = 'getCustomerDropDownLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/customers${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['customerDropDown']
        }),
        submitOrder: build.mutation({
            query: payload => {
                const KEY = 'submitOrderLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/order',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getPincodeInfo', 'order', 'customerDropDown', 'scanOrderItem', 'orderDataTable']
        }),
        orderItemTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/order/item/export`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['orderDataTable']
        }),
        getOrderBulkCreateTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/order/export`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['orderDataTable']
        }),
        uploadOrderBulkCreateTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/order/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['orderDataTable', 'orderItemDataTable']
        }),
        uploadOrderItemTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/order/item/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['orderDataTable', 'orderItemDataTable']
        }),
        getOrderById: build.mutation({
            query: id => {
                const KEY = 'getOrderByIdLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/order/${id}/show`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['getOrderById']
        }),
        removeOrderItem: build.mutation({
            query: payload => {
                const KEY = `removeOrderItemLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/order/deleteItems',
                    body: payload,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['orderDataTable', 'orderItemDataTable']
        })
    })
})
export const {
    endpoints: { getOrderData, getPincodeInfo, getCustomerDropDown, orderDataTable, orderItemDataTable },
    useScanOrderItemMutation,
    useSubmitOrderMutation,
    useGetOrderBulkCreateTemplateMutation,
    useOrderItemTemplateMutation,
    useUploadOrderBulkCreateTemplateMutation,
    useUploadOrderItemTemplateMutation,
    useGetOrderByIdMutation,
    useRemoveOrderItemMutation
} = orderSlice
