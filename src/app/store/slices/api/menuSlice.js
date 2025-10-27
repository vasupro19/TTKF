import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const menuSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        menuByConfig: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'menuByConfigKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/menu/permission${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['menu']
        }),
        updateMenuAccess: build.mutation({
            query: body => ({
                url: '/user/updateMenuConfig',
                method: 'POST',
                body
            }),
            invalidatesTags: ['menu']
        }),
        menuByConfigClient: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'menuByConfigKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/menu/permissionClient${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['menu']
        }),
        updateMenuAccessClient: build.mutation({
            query: body => ({
                url: '/user/updateMenuConfigClient',
                method: 'POST',
                body
            }),
            invalidatesTags: ['menu']
        })
    })
})
export const {
    useMenuByConfigQuery,
    useUpdateMenuAccessMutation,
    useUpdateMenuAccessClientMutation,
    useMenuByConfigClientQuery,
    endpoints: { menuByConfig }
} = menuSlice
