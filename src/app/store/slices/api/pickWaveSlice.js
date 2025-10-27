import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const pickWaveSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        dataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'dataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `outbound/pickWave${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['pickWave']
        }),
        getData: build.query({
            query: () => {
                const KEY = 'getDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pick/data',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        createPickWave: build.mutation({
            query: payload => {
                const KEY = 'createPickWaveLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pickWave',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pickWave']
        }),
        getPickWave: build.query({
            query: id => ({
                url: `/outbound/pickWave/show/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['pickWaveById']
        }),
        updatePickWave: build.mutation({
            query: ({ id, payload }) => {
                const KEY = 'updatePickWaveLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pickWave/update/${id}`,
                    method: 'PUT',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pickWaveById', 'pickWave']
        }),
        deactivatePickWave: build.mutation({
            query: id => {
                const KEY = `deactivatePickWaveDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pickWave/deactivate/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pickWaveById', 'pickWave']
        }),
        deletePickWave: build.mutation({
            query: id => {
                const KEY = `deletePickWaveLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pickWave/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pickWaveById', 'pickWave']
        })
    }),
    overrideExisting: false
})

export const {
    useCreatePickWaveMutation,
    useUpdatePickWaveMutation,
    useDeactivatePickWaveMutation,
    useDeletePickWaveMutation,
    endpoints: { dataTable, getPickWave, getData }
} = pickWaveSlice
