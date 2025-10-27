import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const usersSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getUsers: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getUsersLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/user/clientUsers${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['userManagement']
        }),
        getDataForCreate: build.query({
            query: () => {
                const KEY = `getDataForCreateLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: '/admin/userManagement/data',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['userManagementData']
        }),
        getUserRoles: build.query({
            query: query => {
                const KEY = `getDataForRoles`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/role/client${query}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        }),
        createUser: build.mutation({
            query: payload => {
                const KEY = `createUserLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/user?clientId=${payload.client_id}`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['userManagement', 'userManagementData']
        }),
        getDataForUpdate: build.query({
            query: id => ({
                url: `/admin/userManagement/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['userManagementById']
        }),
        getUserMappedMenus: build.query({
            query: id => ({
                url: `/admin/userManagement/${id}/UserMapping`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['userManagementMappingById']
        }),
        storeUserMenuMapping: build.mutation({
            query: payload => ({
                url: '/admin/userManagement/storeUserMapping',
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            }),
            invalidatesTags: ['userManagement', 'userManagementData', 'userManagementById', 'userManagementMappingById']
        }),
        getTemplate: build.mutation({
            query: () => ({
                url: '/admin/userManagement/export',
                method: 'GET',
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        postUserExcel: build.mutation({
            query: payload => ({
                url: '/admin/userManagement/import',
                method: 'POST',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        deactivateUser: build.mutation({
            query: id => {
                const KEY = `deactivateUserLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/userManagement/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['userManagement', 'userManagementData', 'userManagementById', 'userManagementMappingById']
        })
    }),
    overrideExisting: false
})

export const {
    useGetUsersQuery,
    useGetDataForCreateQuery,
    useCreateUserMutation,
    useGetDataForUpdateQuery,
    useGetUserMappedMenusQuery,
    useStoreUserMenuMappingMutation,
    useGetTemplateMutation,
    usePostUserExcelMutation,
    useDeactivateUserMutation,
    useGetUserRolesQuery,
    endpoints: { getUsers, getDataForUpdate, getUserMappedMenus }
} = usersSlice
