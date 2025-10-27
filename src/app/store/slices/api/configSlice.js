import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'

const TAG_TYPES = [
    'masterClient',
    'masterClientById',
    'itemMaster',
    'itemMasterById',
    'itemMasterData',
    'bucketConfig',
    'bucketConfigById',
    'bucketConfigData',
    'itemProperty',
    'itemPropertyData',
    'itemPropertyById',
    'propertyMapping',
    'propertyMappingData',
    'propertyMappingById',
    'client',
    'clientById',
    'clientData',
    'locationForClient',
    'customer',
    'customerById',
    'country',
    'state',
    'stateById',
    'city',
    'cityById',
    'pinCode',
    'pinCodeById',
    'locationMaster',
    'locationMasterById',
    'roleManagement',
    'roleManagementData',
    'roleManagementById',
    'userManagement',
    'userManagementData',
    'userManagementById',
    'userManagementMappingById',
    'vendor',
    'vendorById'
]

export const apiSliceConfig = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_APP_BASE_URL,
        credentials: 'include'

        // prepareHeaders: (headers, { getState }) => {
        //     console.log(getState)
        //     // Access token (try Redux state first, then fallback to localStorage)
        //     const token = getState().auth?.user?.accessToken || localStorage.getItem('token')
        //     console.log(token, 'token')

        //     if (token) {
        //         headers.set('Authorization', `Bearer ${token}`)
        //     }

        //     // Optional: CSRF Token if your backend requires it
        //     // const xsrf = Cookies.get('XSRF-TOKEN')
        //     // if (xsrf) {
        //     //     headers.set('X-XSRF-TOKEN', xsrf)
        //     // }

        //     headers.set('Accept', 'application/json')
        //     return headers
        // }
        // headers: {
        //     Accept: 'application/json',
        //     'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
        // },
        // prepareHeaders: (headers, { getState }) => {
        //     // eslint-disable-next-line no-underscore-dangle
        //     const token = getState.auth?.user?._token || localStorage.getItem('token')
        //     if (token && import.meta.env.VITE_APP_ENV) {
        //         headers.set('Authorization', `Bearer ${token}`)
        //     }
        //     headers.set('X-XSRF-TOKEN', `${Cookies.get('XSRF-TOKEN')}`)

        //     return headers
        // }
    }),
    tagTypes: TAG_TYPES,
    endpoints: () => ({})
})

export default apiSliceConfig
