import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const inventorySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        inventoryDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'inventoryDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inventory${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['inventoryDataTable']
        }),
        serialInventoryDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'serialInventoryDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inventory/serialInventory${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['serialInventoryDataTable']
        }),
        storageInventoryDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'storageInventoryDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inventory/storageInventory${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['storageInventoryDataTable']
        }),
        inventoryFilterCount: build.query({
            query: () => ({
                url: `/inventory/serialInventory/data`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['serialInventoryFilterCount'],
            keepUnusedDataFor: 0
        })
    }),
    overrideExisting: false
})

export const {
    endpoints: { inventoryDataTable, serialInventoryDataTable, storageInventoryDataTable, inventoryFilterCount }
} = inventorySlice
