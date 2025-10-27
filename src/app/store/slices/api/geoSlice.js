import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const geoSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getCountry: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getCountryLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/country${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['country']
        }),
        deactivateCountry: build.mutation({
            query: id => {
                const KEY = 'deactivateCountryLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/country/delete/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['country']
        }),
        getStates: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getStatesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/state${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['state']
        }),
        getStatesByCountry: build.query({
            query: query => {
                const KEY = 'getStatesByCountryLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/city/fetchState?country_id=${query}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        getStateById: build.query({
            query: query => {
                const KEY = 'getStateByIdLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/state/${query}/show`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['stateById']
        }),
        createState: build.mutation({
            query: payload => {
                const KEY = 'createStateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/state/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['state', 'stateById']
        }),
        updateState: build.mutation({
            query: updateData => {
                const KEY = 'updateStateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/state/update`,
                    method: 'POST',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['state', 'stateById']
        }),
        uploadState: build.mutation({
            query: payload => {
                const KEY = 'uploadStateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/state/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['state']
        }),
        getStateTemplate: build.mutation({
            query: () => {
                const KEY = 'getStateTemplateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/state/export?format=xlsx',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        deactivateState: build.mutation({
            query: ({ id }) => {
                const KEY = 'deactivateStateLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/state/delete/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['state', 'stateById']
        }),
        getCity: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getCityLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/city${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['city']
        }),
        getCityById: build.query({
            query: query => {
                const KEY = 'getCityByIdLoader'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/city/${query}/show`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['cityById']
        }),
        getCityByStateId: build.query({
            query: id => {
                const KEY = 'getCityByStateIdLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pincode/fetchCity?state_id=${id}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        getCityTemplate: build.mutation({
            query: () => {
                const KEY = 'downloadCityLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/city/export?format=xlsx',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        createCity: build.mutation({
            query: payload => {
                const KEY = 'createCityLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/city/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['city', 'cityById']
        }),
        updateCity: build.mutation({
            query: payload => {
                const KEY = 'updateCityLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/city/update`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['city', 'cityById']
        }),
        uploadCity: build.mutation({
            query: payload => {
                const KEY = 'uploadCityLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/city/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        deactivateCity: build.mutation({
            query: id => {
                const KEY = `deactivateCityDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/city/delete/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['city', 'cityById']
        }),
        getPinCodeById: build.query({
            query: id => {
                const KEY = 'getPincodeByIdLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pincode/${id}/show`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTagtgs: ['pinCodeById']
        }),
        getPinCodes: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getPincodesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pincode${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['pinCode']
        }),
        createPinCode: build.mutation({
            query: payload => {
                const KEY = 'createPincodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/pincode/store',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pinCode', 'pinCodeById']
        }),
        updatePinCodes: build.mutation({
            query: updateData => {
                const KEY = 'updatePincodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pincode/update`,
                    method: 'POST',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pinCode', 'pinCodeById']
        }),
        uploadPinCodes: build.mutation({
            query: payload => {
                const KEY = 'uploadPincodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/pincode/import',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pinCode', 'pinCodeById']
        }),
        addPinCodesVendor: build.mutation({
            query: payload => {
                const KEY = 'addPinCodesVendorLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pincode/storeOnlinePincodes`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        deactivatePinCodes: build.mutation({
            query: id => {
                const KEY = `deactivatePincodeDL${id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/master/pincode/delete/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['pinCode', 'pinCodeById']
        }),
        getPinCodeTemplate: build.mutation({
            query: () => {
                const KEY = 'downloadPincodeLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/master/pincode/export?format=xlsx',
                    method: 'GET',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    })
})

export const {
    endpoints: {
        getCountry,
        deactivateCountry,
        getStates,
        deactivateState,
        getStatesByCountry,
        getCity,
        getCityById,
        deactivateCity,
        getPinCodes,
        dualResponse,
        getCityTemplate,
        getStateTemplate,
        getStateById,
        getCityByStateId,
        deactivatePinCodes,
        getPinCodeById
    },
    useGetCountryQuery,
    useGetStatesQuery,
    useGetCityQuery,
    useGetCityByIdQuery,
    useGetPinCodesQuery,
    useCreateStateMutation,
    useUpdateStateMutation,
    useUploadStateMutation,
    useGetCityTemplateMutation,
    useGetStateTemplateMutation,
    useDeactivateStateMutation,
    useCreateCityMutation,
    useUpdateCityMutation,
    useUploadCityMutation,
    useDeactivateCityMutation,
    useCreatePinCodeMutation,
    useUpdatePinCodesMutation,
    useUploadPinCodesMutation,
    useDeactivatePinCodesMutation,
    useGetPinCodeTemplateMutation,
    useAddPinCodesVendorMutation
} = geoSlice
