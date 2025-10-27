import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const serialSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        serialDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getSerialLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/generateSerials${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['serial']
        }),
        getSerialById: build.query({
            query: id => ({
                url: `/master/generateSerials/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['serialById']
        }),
        generateRandomSerials: build.mutation({
            query: payload => {
                const KEY = 'generateRandomSerialsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/generateSerials/generate`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['serial', 'serialById']
        }),
        generateEanSkuSerials: build.mutation({
            query: payload => {
                const KEY = 'generateEanSkuSerialsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/generateSerials`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['serial', 'serialById']
        }),
        updateSerial: build.mutation({
            query: ({ id, ...updateData }) => ({
                url: `/master/generateSerials/${id}`,
                method: 'PUT',
                body: updateData,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['client', 'clientById', 'clientData']
        }),
        removeSerial: build.mutation({
            query: id => ({
                url: `/master/generateSerials/${id}`,
                method: 'DELETE',
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['client', 'clientById', 'clientData']
        }),
        getGenerateSerialTemplate: build.mutation({
            query: () => {
                const KEY = 'getGenerateSerialTemplateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/generateSerials/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client']
        }),
        uploadGenerateSerialTemplate: build.mutation({
            query: payload => {
                const KEY = 'uploadGenerateSerialTemplateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/generateSerials/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client']
        }),

        // Serial Mapping Endpoints
        submitSerialMapping: build.mutation({
            query: payload => {
                const KEY = 'submitSerialMappingLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/serialMapping',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['serial']
        }),
        getSerialMapping: build.mutation({
            query: () => {
                const KEY = 'getSerialMappingLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/serialMapping/export',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client']
        }),
        uploadSerialMapping: build.mutation({
            query: payload => {
                const KEY = 'uploadSerialMappingLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/serialMapping/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['client']
        }),
        getRemainingSerials: build.query({
            query: query => {
                const KEY = 'getRemainingSerialsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/remainingSerialPO${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        generatePOItemSerialPDF: build.mutation({
            query: payload => {
                const KEY = 'generatePOItemSerialPDFLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/generateSerials/po`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        reprintPoSerial: build.mutation({
            query: payload => {
                const KEY = `reprintPoSerialLKey${payload.po_detail_id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/purchaseOrder/generatePoSerial`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    })
})

export const {
    endpoints: { serialDataTable, getSerialById, getRemainingSerials },
    useGenerateRandomSerialsMutation,
    useGenerateEanSkuSerialsMutation,
    useUpdateSerialMutation,
    useRemoveSerialMutation,
    useGetGenerateSerialTemplateMutation,
    useUploadGenerateSerialTemplateMutation,

    // Serial Mapping Hooks
    useSubmitSerialMappingMutation,
    useUploadSerialMappingMutation,
    useGetSerialMappingMutation,
    useGeneratePOItemSerialPDFMutation,
    useReprintPoSerialMutation
} = serialSlice
