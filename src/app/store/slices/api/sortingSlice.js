import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const sortingSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        sortingDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'sortingDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/sorting/putwall${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['sortingDataTable']
        }),
        createPutwall: build.mutation({
            query: payload => {
                const KEY = 'createPutwallLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/sorting/putwall',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['sortingDataTable']
        }),
        getGeneratePutwallTemplate: build.mutation({
            query: () => {
                const KEY = 'getGeneratePutwallTemplateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/sorting/putwall/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['sortingDataTable']
        }),
        uploadPutwallTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/sorting/putwall/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['sortingDataTable']
        }),
        removePutwallItem: build.mutation({
            query: payload => {
                const KEY = `removePutwallItemLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/sorting/putwall/deleteItems',
                    body: payload,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['sortingDataTable']
        }),
        // sorting process
        validateUID: build.query({
            query: id => {
                const KEY = 'validateSortingUIDLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/sorting/validateUid?uid=${id || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['validateSortingUID'],
            keepUnusedDataFor: 0
        }),
        scanAndValidatePutwall: build.mutation({
            query: data => {
                const KEY = 'scanPutwallLKEY'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/sorting/scanItem`,
                    body: data,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['scanAndValidatePutwall'],
            invalidatesTags: ['validateSortingUID']
        }),
        // putwall picking
        scanAndValidatePutwallForPicking: build.query({
            query: id => {
                const KEY = 'scanAndValidatePutwallForPickingLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/sorting/putwallPicking/scanPutwall?putwall=${id || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['scanAndValidatePutwallForPicking'],
            keepUnusedDataFor: 0
        }),
        scanAndValidateSortBinForPicking: build.query({
            query: ({ pId, bin }) => {
                const KEY = 'scanAndValidateSortBinForPickingLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/sorting/putwallPicking/scanSortBin?putwall_id=${pId || ''}&bin=${bin}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['scanAndValidateSortBinForPicking'],
            keepUnusedDataFor: 0
        })
    })
})
export const {
    endpoints: { sortingDataTable, validateUID, scanAndValidatePutwallForPicking, scanAndValidateSortBinForPicking },
    useCreatePutwallMutation,
    useGetGeneratePutwallTemplateMutation,
    useUploadPutwallTemplateMutation,
    useRemovePutwallItemMutation,
    useScanAndValidatePutwallMutation
} = sortingSlice
