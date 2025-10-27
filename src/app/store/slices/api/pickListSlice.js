import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const pickListSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        dataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'dataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['pickDataTable']
        }),
        getpickListData: build.query({
            query: () => {
                const KEY = 'getDataLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pick/data',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['pickList', 'pickDataTable']
        }),
        allocationDatatable: build.mutation({
            query: payload => {
                const KEY = 'allocationDatatableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pick/allocationDatatable',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['courierDropDown', 'channelDropDown', 'customerDropDown', 'pickList', 'pickDataTable']
        }),
        createPickList: build.mutation({
            query: payload => {
                const KEY = 'createPickListLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pick',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['courierDropDown', 'channelDropDown', 'customerDropDown', 'pickList', 'pickDataTable']
        }),
        getPickBulkCreateTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/pick/export`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            })
        }),
        uploadPickItemTemplate: build.mutation({
            query: payload => ({
                url: `/outbound/pick/import`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            })
        }),
        getPickListById: build.query({
            query: id => {
                const KEY = 'pickListById'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/show/${id}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        getPickListItemLocationDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'pickLocationDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/locationDatatable/${query}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            }
        }),
        getPickListSerialItemDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'pickSerialItemDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/serialItemDatatable/${query}`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            }
        }),
        getAssignedToMePickList: build.query({
            query: () => {
                const KEY = 'assignedToMePickListLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/assignedPick`,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            keepUnusedDataFor: 0,
            providesTags: ['getAssignedToMePickList']
        }),
        selfAssignPick: build.mutation({
            query: data => {
                const KEY = 'selfAssignReqLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/selfassignPick`,
                    method: 'POST',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['selfAssignPick'],
            invalidatesTags: ['scanBinForPick', 'getAssignedToMePickList']
        }),
        scanBinForPick: build.query({
            query: query => {
                const KEY = 'scanBinForPickLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/scanBin${query}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['scanBinForPick']
        }),
        getStorageLocation: build.query({
            query: query => {
                const KEY = 'getStorageLocationLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/pickZoneAddress${query}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['grtStorageLocation']
        }),
        getPickListItems: build.query({
            query: query => {
                const KEY = 'pickListItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/pickList${query}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['getPickListItems']
        }),
        scanPickItem: build.mutation({
            query: data => {
                const KEY = 'scanPickItemLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/scanItem`,
                    method: 'POST',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['pickScanItem']
        }),
        markPna: build.mutation({
            query: data => {
                const KEY = 'markPnaReqLKey'
                dispatchLoaderEvent(KEY)

                return {
                    url: `/outbound/pick/markAsPna`,
                    method: 'POST',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        pickPendencyDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'pickPendencyDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/pickPendency${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            }
        }),
        pickPendencyDetails: build.query({
            query: () => {
                const KEY = 'pickPendencyDetailsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/outbound/pick/pendencyDetail`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        assignPick: build.mutation({
            query: data => ({
                url: `/outbound/pick/assignPick`,
                method: 'POST',
                body: data,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['pickDataTable']
        }),
        unAssignPick: build.mutation({
            query: data => {
                const KEY = 'unAssignPickLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/outbound/pick/unAssignPick',
                    method: 'POST',
                    body: data,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pickDataTable']
        })
    }),
    overrideExisting: false
})
export const {
    endpoints: {
        getpickListData,
        dataTable,
        scanBinForPick,
        getStorageLocation,
        getPickListItems,
        getPickListItemLocationDataTable,
        getPickListSerialItemDataTable,
        pickPendencyDataTable
    },
    useAssignPickMutation,
    useUnAssignPickMutation,
    useAllocationDatatableMutation,
    useCreatePickListMutation,
    useGetPickBulkCreateTemplateMutation,
    useUploadPickItemTemplateMutation,
    useGetAssignedToMePickListQuery,
    useSelfAssignPickMutation,
    useScanPickItemMutation,
    useGetPickListByIdQuery,
    useMarkPnaMutation,
    usePickPendencyDetailsQuery
} = pickListSlice
