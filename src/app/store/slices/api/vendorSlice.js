import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const vendorSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getVendors: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getVendorsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/vendor${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['vendor']
        }),
        getVendorsById: build.query({
            query: id => ({
                url: `/master/vendor/${id}/show`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['vendorById']
        }),
        getDataFromPinCode: build.query({
            query: code => ({
                url: `/master/vendor/fetchDataFromPincode/${code}`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        createVendor: build.mutation({
            query: payload => {
                const KEY = 'createVendorLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/vendor/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['vendor', 'vendorById']
        }),
        updateVendor: build.mutation({
            query: payload => {
                const KEY = 'updateVendorLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/vendor/update',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['vendor', 'vendorById']
        }),
        removeVendor: build.mutation({
            query: ({ id }) => {
                const KEY = 'removeVendorLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/vendor/delete/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['vendor', 'vendorById']
        }),
        getVendorTemplate: build.mutation({
            query: () => ({
                url: '/master/vendor/export',
                method: 'GET',
                responseHandler: result => customResponseHandler({ result })
            })
        }),
        uploadExcel: build.mutation({
            query: payload => ({
                url: '/master/vendor/import',
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['vendor', 'vendorById']
        })
    })
})

export const {
    useCreateVendorMutation,
    useUpdateVendorMutation,
    useRemoveVendorMutation,
    useGetVendorTemplateMutation,
    useUploadExcelMutation,
    endpoints: { getVendors, getVendorsById, getDataFromPinCode }
} = vendorSlice
