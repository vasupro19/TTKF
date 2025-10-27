import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const gateEntrySlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        documentDropDown: build.query({
            query: query => {
                const KEY = 'documentDropDownLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `inbound/gateEntry/data${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['documentDropDown']
        }),
        getTransporterDropDown: build.mutation({
            query: query => {
                const KEY = 'getTransporterDropDownLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/transporters${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['transporterDropDown']
        }),
        getVendorDropDown: build.mutation({
            query: query => {
                const KEY = 'getVendorDropDownLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/select2/vendors${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['vendorDropDown']
        }),
        submitGateEntry: build.mutation({
            query: payload => {
                const KEY = 'submitGateEntryLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/inbound/gateEntry',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['gateEntry']
        }),
        gateEntryDataTable: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'gateEntryDataTableLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `inbound/gateEntry${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['gateEntry']
        }),
        getMarkAsCloseTemplate: build.mutation({
            query: query => {
                const KEY = 'getMarkAsCloseTemplateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/gateEntry/export${query || ''}`,
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        uploadMarkAsCloseTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/gateEntry/import`,
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['gateEntry']
        }),
        markVehicleRelease: build.mutation({
            query: payload => {
                const KEY = 'markVehicleReleaseLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/gateEntry/releaseVehicle`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['gateEntry']
        }),
        printGateEntryIds: build.mutation({
            query: payload => {
                const KEY = `printGateEntryIdsLKey${payload.gate_entry_id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/gateEntry/reprintBoxId`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['gateEntry']
        }),
        validateBoxId: build.mutation({
            query: id => ({
                url: `/inbound/mapBoxId/scanBoxId?ge_box_id=${id}`,
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['validateBoxId']
        }),
        mapBoxIds: build.mutation({
            query: payload => ({
                url: `/inbound/mapBoxId`,
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['gateEntry', 'validateBoxId']
        }),
        getMapBoxIdsTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/mapBoxId/export`,
                method: 'GET',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        postMapBoxIdsTemplate: build.mutation({
            query: payload => ({
                url: `/inbound/mapBoxId/import`,
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['gateEntry']
        }),
        getGateEntryDocuments: build.query({
            query: id => ({
                url: `/inbound/gateEntry/${id}/showDocuments`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['gateEntry'],
            providesTags: ['getGateEntryDocuments']
        }),
        uploadGateEntryDocuments: build.mutation({
            query: payload => ({
                url: `/inbound/gateEntry/updateOrCreateDocs`,
                method: 'POST',
                body: payload,
                responseHandler: result => customResponseHandler({ result })
            }),
            invalidatesTags: ['gateEntry', 'getGateEntryDocuments']
        }),
        getGateEntryDetails: build.query({
            query: id => ({
                url: `/inbound/gateEntry/${id}/show`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['gateEntry'],
            providesTags: ['showGateEntry']
        }),
        updateGateEntry: build.mutation({
            query: updateData => {
                const KEY = 'updateGateEntryLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/inbound/gateEntry/update`,
                    method: 'POST',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['gateEntry', 'showGateEntry']
        })
    })
})
export const {
    endpoints: {
        gateEntryDataTable,
        documentDropDown,
        getTransporterDropDown,
        getVendorDropDown,
        getGateEntryDocuments,
        getGateEntryDetails
    },
    useGetMarkAsCloseTemplateMutation,
    useUploadMarkAsCloseTemplateMutation,
    useMarkVehicleReleaseMutation,
    usePrintGateEntryIdsMutation,
    useSubmitGateEntryMutation,
    useUpdateGateEntryMutation,
    useUploadGateEntryDocumentsMutation,
    useMapBoxIdsMutation,
    useValidateBoxIdMutation,
    useGetMapBoxIdsTemplateMutation,
    usePostMapBoxIdsTemplateMutation
} = gateEntrySlice
