import { customResponseHandler, dispatchLoaderEvent } from '../../helpers'
import { apiSliceConfig } from './configSlice'

export const authApi = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        login: build.mutation({
            query: credentials => {
                const KEY = 'loginLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/auth/login',
                    method: 'POST',
                    body: credentials,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['getClientAccounts', 'getAuthUser']
        }),
        getMenu: build.query({
            query: userId => {
                const KEY = 'menuKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/menu?userId=${userId}`, // Pass the ID directly
                    method: 'GET',
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            // This allows you to manually trigger a refresh if needed
            providesTags: ['Menu']
        }),

        getAuthUser: build.query({
            query: () => ({
                url: '/auth/user',
                responseHandler: result => customResponseHandler({ result })
            }),
            keepUnusedDataFor: 0,
            providesTags: ['getAuthUser']
        }),
        logout: build.mutation({
            query: () => ({
                url: '/auth/logout'
            }),
            invalidatesTags: ['getAuthUser']
        }),
        forcedLogout: build.mutation({
            query: userId => ({
                url: `/force-logout/${userId}`,
                method: 'PUT'
            })
        }),
        logOutSession: build.mutation({
            query: ({ userId, sessionId }) => ({
                url: `/logOutSesion/${userId}`,
                method: 'PUT',
                body: { sessionId }
            }),
            invalidatesTags: ['getClientAccounts']
        }),
        getClientAccounts: build.query({
            query: () => {
                const KEY = 'getClientLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/clients',
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['getClientAccounts']
        }),
        changeClientAccount: build.mutation({
            query: payload => {
                const KEY = `changeClientAccountLKey${payload.client_id}`
                dispatchLoaderEvent(KEY)
                return {
                    url: '/client/change',
                    method: 'POST',
                    body: payload,
                    responseHandler: result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    }),
    overrideExisting: false
})

export const {
    useLoginMutation,
    useLogoutMutation,
    // useGetAuthUserMutation,
    useGetMenuQuery,
    useLazyGetMenuQuery,
    // useGetMenuConfigMutation,
    useForcedLogoutMutation,
    useLogOutSessionMutation,
    useGetClientAccountsQuery,
    useChangeClientAccountMutation,
    endpoints: { getClientAccounts, getAuthUser }
} = authApi
