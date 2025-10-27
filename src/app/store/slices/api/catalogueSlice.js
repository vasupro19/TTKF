import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const catalogueSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        dataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'dataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/itemProperty${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['itemProperty']
        }),
        getPropertyData: build.query({
            query: () => {
                const KEY = 'getPropertyDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/itemProperty/data',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['itemPropertyData']
        }),
        createProperty: build.mutation({
            query: payload => {
                const KEY = 'createPropertyLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/itemProperty',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['itemProperty', 'itemPropertyData']
        }),
        getProperty: build.query({
            query: id => ({
                url: `/master/itemProperty/${id}/show`,
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['itemPropertyById']
        }),
        deactivateProperty: build.mutation({
            query: id => ({
                url: `/master/itemProperty/${id}`,
                method: 'DELETE',
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['itemProperty', 'itemPropertyData', 'itemPropertyById']
        }),
        // format property or catalogue definition
        formatDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'formatDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/propertyMapping${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['propertyMapping']
        }),
        getFormatData: build.query({
            query: () => {
                const KEY = 'getFormatDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/propertyMapping/data',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['propertyMappingData']
        }),
        getFormatPropertyById: build.query({
            query: id => {
                const KEY = 'getFormatPropertyByIdLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/propertyMapping/${id}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['propertyMappingById']
        }),
        createFormatProperty: build.mutation({
            query: payload => {
                const KEY = 'createFormatPropertyLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/propertyMapping',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['propertyMappingById', 'propertyMappingData', 'propertyMapping']
        }),
        updateFormatProperty: build.mutation({
            query: payload => {
                const KEY = 'updateFormatPropertyLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/propertyMapping/${payload.id}`,
                    method: 'PUT',
                    body: payload.data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['propertyMappingById', 'propertyMappingData', 'propertyMapping']
        }),
        // sku creation
        skuDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'skuDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/itemMaster${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['itemMaster']
        }),
        getSkuById: build.query({
            query: id => ({
                url: `/master/itemMaster/${id}/show`,
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['itemMasterById']
        }),
        getSkuCustomProps: build.query({
            query: () => ({
                url: '/master/itemMaster/data',
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['itemMasterData']
        }),
        createSku: build.mutation({
            query: payload => {
                const KEY = 'createSkuLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/itemMaster',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['itemMasterData', 'itemMaster']
        }),
        updateSku: build.mutation({
            query: payload => {
                const KEY = 'updateSkuLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/itemMaster/update',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['itemMasterData', 'itemMasterById', 'itemMaster']
        }),
        getSkuExcel: build.mutation({
            query: () => {
                const KEY = 'getSkuExcelLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/itemMaster/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        uploadSkuExcel: build.mutation({
            query: payload => {
                const KEY = 'uploadSkuExcelLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/itemMaster/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['itemMaster']
        })
    }),
    overrideExisting: false
})

export const {
    endpoints: {
        dataTable,
        getProperty,
        getPropertyData,
        deactivateProperty,
        formatDataTable,
        getFormatData,
        getFormatPropertyById,
        getSkuCustomProps,
        getSkuById,
        skuDataTable
    },
    useGetPropertyDataQuery,
    useCreatePropertyMutation,
    useCreateFormatPropertyMutation,
    useUpdateFormatPropertyMutation,
    useCreateSkuMutation,
    useUpdateSkuMutation,
    useGetSkuExcelMutation,
    useUploadSkuExcelMutation
} = catalogueSlice
