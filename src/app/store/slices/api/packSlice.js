import { customResponseHandler, dispatchLoaderEvent } from '../../helpers'
import { apiSliceConfig } from './configSlice'

export const packSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // pack setup
        getConfig: build.query({
            query: () => {
                const KEY = 'getPackConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pack/packConfig',
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            keepUnusedDataFor: 0,
            providesTags: ['packConfig']
        }),
        storeConfig: build.mutation({
            query: data => {
                const KEY = 'packConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pack/packConfig',
                    method: 'POST',
                    body: data,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['packConfig']
        }),
        // B2C pack
        scanPackItem: build.query({
            query: ({ uid, type = 'b2c', orderDetailId, boxId, tableNo }) => {
                const KEY = 'scanPackItemLKey'
                dispatchLoaderEvent(KEY)
                let query = `&uid=${uid}`
                if (type !== 'b2c') query += `&order_detail_id=${orderDetailId}&box_id=${boxId}`
                query += `&table_no=${tableNo}`

                return {
                    url: `/outbound/pack/scanItem?type=${type}${query}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['packItemDataTable']
        }),
        removePackItem: build.mutation({
            query: ({ uid, packDetailId, type = 'b2c' }) => {
                const KEY = 'removePackItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack/removeItem?type=${type}`,
                    method: 'POST',
                    body: {
                        uid,
                        pack_detail_id: packDetailId
                    },
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        packItemDataTable: build.query({
            query: query => {
                const KEY = 'packItemDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack/items/datatable${query}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            keepUnusedDataFor: 0,
            providesTags: ['packItemDataTable']
        }),
        boxViewDataTable: build.query({
            query: query => {
                const KEY = 'boxViewDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack/boxViewDatatable${query}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),

        packDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'packDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack${query}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            }
        }),
        closePack: build.mutation({
            query: data => {
                const KEY = 'closePackLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack`,
                    method: 'POST',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        showPackData: build.mutation({
            query: id => {
                const KEY = 'showPackDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack/show?id=${id}`,
                    method: 'POST',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        scanPackOrder: build.query({
            query: (orderNo, type = 'b2b') => {
                const KEY = 'scanPackOrderLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack/scanOrder?type=${type}&order_no=${orderNo}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            keepUnusedDataFor: 0
        }),
        closePackBox: build.mutation({
            query: data => {
                const KEY = 'closePackBoxLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pack/getBoxInfo`,
                    method: 'POST',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    }),
    overrideExisting: false
})

export const {
    useStoreConfigMutation,
    useClosePackMutation,
    useShowPackDataMutation,
    useClosePackBoxMutation,
    useRemovePackItemMutation,
    endpoints: { getConfig, packDataTable, packItemDataTable, boxViewDataTable, scanPackItem, scanPackOrder }
} = packSlice
