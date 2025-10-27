import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const commonApi = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        fetchFileAsBlob: build.query({
            async queryFn({ endpoint, name }) {
                try {
                    const baseUrl = import.meta.env.VITE_APP_BASE_URL
                    const response = await fetch(`${baseUrl}/imgs/${endpoint}`, {
                        responseType: 'blob'
                    })

                    if (!response.ok) {
                        throw new Error('Failed to fetch file')
                    }

                    const blob = await response.blob()
                    const file = new File([blob], name, { type: blob.type })

                    return { data: file }
                } catch (error) {
                    return { error: { message: error.message } }
                }
            }
        }),
        getItems: build.query({
            query: () => {
                const KEY = 'getItemsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/list/items`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['itemsList']
        }),
        getItemsList: build.query({
            query: query => ({
                url: `/select2/items${query}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['itemsListSearchable']
        }),
        getVendorsList: build.query({
            query: query => {
                const KEY = 'getVendorsListLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/vendors${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['vendorsList']
        }),
        getRejectReason: build.query({
            query: query => ({
                url: `/select2/rejectReasons${query || ''}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['rejectReason']
        }),
        getCouriers: build.query({
            query: () => {
                const KEY = 'getCouriersLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/list/couriers',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['couriers']
        }),
        getChannels: build.query({
            query: () => {
                const KEY = 'getChannelsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/list/channels',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['channels']
        }),
        getCustomers: build.query({
            query: query => {
                const KEY = 'getCustomersLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/customers${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['customersList']
        }),
        getPickers: build.query({
            query: query => ({
                url: `/list/pickers${query || ''}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['pickersList']
        })
    })
})

export const {
    useGetItemsQuery,
    endpoints: {
        getItems,
        getItemsList,
        fetchFileAsBlob,
        getVendorsList,
        getRejectReason,
        getCouriers,
        getChannels,
        getCustomers,
        getPickers
    }
} = commonApi
