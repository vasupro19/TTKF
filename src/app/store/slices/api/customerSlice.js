import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const customerSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        dataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'dataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `master/customer${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['customer']
        }),
        createCustomer: build.mutation({
            query: payload => {
                const KEY = 'createCustomerLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/customer/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['customer', 'customerById']
        }),
        getCustomer: build.query({
            query: id => ({
                url: `/master/customer/${id}/show`,
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['customerById']
        }),
        updateCustomer: build.mutation({
            query: payload => {
                const KEY = 'updateCustomerLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/customer/update',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['customer', 'customerById']
        }),
        deactivateCustomer: build.mutation({
            query: ({ id }) => {
                const KEY = 'deactivateCustomerLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/customer/delete/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['customer', 'customerById']
        }),
        getExcel: build.mutation({
            query: () => ({
                url: '/master/customer/export',
                method: 'GET',
                responseHandler: result => customResponseHandler({ result })
            })
        }),
        uploadExcel: build.mutation({
            query: payload => ({
                url: '/master/customer/import',
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            })
        })
    }),
    overrideExisting: false
})

export const {
    endpoints: { dataTable, getCustomer },
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeactivateCustomerMutation,
    useGetExcelMutation,
    useUploadExcelMutation
} = customerSlice
