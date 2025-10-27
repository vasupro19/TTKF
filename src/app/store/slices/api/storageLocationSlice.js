import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const storageLocation = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ! BucketConfig
        bucketConfigDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'bucketConfigDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/bucketConfig${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['bucketConfig']
        }),
        getDataBucketConfig: build.mutation({
            query: () => {
                const KEY = 'getDataBucketConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/bucketConfig/data',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['bucketConfigData']
        }),
        createBucketConfig: build.mutation({
            query: payload => {
                const KEY = 'createBucketConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/bucketConfig',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['bucketConfigData', 'bucketConfig']
        }),
        getBucketConfigById: build.query({
            query: id => ({
                url: `/master/bucketConfig/${id}`,
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['bucketConfigById']
        }),
        updateBucketConfig: build.mutation({
            query: ({ id, data }) => {
                const KEY = 'updateBucketConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/bucketConfig/${id}`,
                    method: 'PUT',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['bucketConfig', 'bucketConfigById', 'bucketConfigData']
        }),
        deactivateBucketConfig: build.mutation({
            query: id => {
                const KEY = `deactivateBucketConfigDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/bucketConfig/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['bucketConfig', 'bucketConfigById', 'bucketConfigData']
        }),

        // ! zone
        storageZoneDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'storageZoneDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/storageZone${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['storageZone']
        }),
        getStorageZoneById: build.query({
            query: id => ({
                url: `/master/storageZone/${id}`,
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['storageZoneById']
        }),
        createStorageZone: build.mutation({
            query: payload => {
                const KEY = 'createStorageZoneLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/storageZone',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['storageZone', 'storageZoneById']
        }),
        updateStorageZone: build.mutation({
            query: ({ id, data }) => {
                const KEY = 'updateStorageZoneLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/storageZone/${id}`,
                    method: 'PUT',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['storageZone', 'storageZoneById']
        }),
        deactivateStorageZone: build.mutation({
            query: id => {
                const KEY = `deactivateStorageZoneDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/storageZone/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['storageZone', 'storageZoneById']
        }),

        // ! locationCode
        locationCodeDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'locationCodeDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/locationCode${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['locationCode']
        }),
        getDataLocationCode: build.mutation({
            query: () => {
                const KEY = 'getDataLocationCodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/locationCode/data',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['locationCodeData']
        }),
        getLocationCodeById: build.query({
            query: id => ({
                url: `/master/locationCode/show/${id}`,
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['locationCodeById']
        }),
        createLocationCode: build.mutation({
            query: payload => {
                const KEY = 'createLocationCodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/locationCode',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationCode', 'locationCodeById']
        }),
        updateLocationCode: build.mutation({
            query: ({ id, data }) => {
                const KEY = 'updateLocationCodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/locationCode/${id}`,
                    method: 'PUT',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationCode', 'locationCodeById', 'locationCodeData']
        }),
        deactivateLocationCode: build.mutation({
            query: id => {
                const KEY = `deactivateLocationCodeDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/locationCode/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['locationCode', 'locationCodeById', 'locationCodeData']
        }),
        getTemplateLocationCode: build.mutation({
            query: () => {
                const KEY = 'getTemplateLocationCodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/locationCode/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        uploadTemplateLocationCode: build.mutation({
            query: () => {
                const KEY = 'uploadTemplateLocationCodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/locationCode/import',
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),

        // ! Pallet
        palletDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'palletDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pallet${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['pallet']
        }),
        createPallet: build.mutation({
            query: payload => {
                const KEY = 'createPalletLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/pallet',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pallet']
        }),
        deactivatePallet: build.mutation({
            query: id => {
                const KEY = `deactivatePalletDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pallet/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pallet']
        }),
        getTemplatePallet: build.mutation({
            query: () => {
                const KEY = 'getTemplatePalletLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/pallet/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        uploadTemplatePallet: build.mutation({
            query: payload => {
                const KEY = 'uploadTemplatePalletLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/pallet/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pallet']
        }),

        // ! Bins
        binsDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'binsDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/bin${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['bins']
        }),
        createBins: build.mutation({
            query: payload => {
                const KEY = 'createBinsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/bin',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['bins']
        }),
        deactivateBins: build.mutation({
            query: id => {
                const KEY = `deactivateBinsDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/bin/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['bins']
        }),
        getTemplateBins: build.mutation({
            query: () => {
                const KEY = 'getTemplateBinsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/bin/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        uploadTemplateBins: build.mutation({
            query: payload => {
                const KEY = 'uploadTemplateBinsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/bin/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['bins']
        })
    }),
    overrideExisting: false
})

export const {
    endpoints: {
        // ? bucketConfig
        bucketConfigDataTable,
        getBucketConfigById,

        // ? zone
        storageZoneDataTable,
        getStorageZoneById,

        // ? Location Code
        locationCodeDataTable,
        getLocationCodeById,
        getDataLocationCode,

        // ? Pallet
        palletDataTable,

        // ? Bins
        binsDataTable
    },
    // ? bucketConfig
    useCreateBucketConfigMutation,
    useGetDataBucketConfigMutation,
    useUpdateBucketConfigMutation,
    useDeactivateBucketConfigMutation,

    // ? zone
    useCreateStorageZoneMutation,
    useUpdateStorageZoneMutation,
    useDeactivateStorageZoneMutation,

    // ? Location Code
    useCreateLocationCodeMutation,
    useUpdateLocationCodeMutation,
    useDeactivateLocationCodeMutation,
    useGetTemplateLocationCodeMutation,
    useUploadTemplateLocationCodeMutation,

    // ? Pallet
    useCreatePalletMutation,
    useDeactivatePalletMutation,
    useGetTemplatePalletMutation,
    useUploadTemplatePalletMutation,

    // ? Bins
    useCreateBinsMutation,
    useDeactivateBinsMutation,
    useGetTemplateBinsMutation,
    useUploadTemplateBinsMutation
} = storageLocation
