import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const rolePermissionSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getRolePermissions: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getRolePermissionsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/roleManagement${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['roleManagement']
        }),
        getRolePermissionsAndAccess: build.query({
            query: () => ({
                url: '/admin/roleManagement/data',
                responseHandler: result => customResponseHandler({ result })
            }),
            providesTags: ['roleManagementData']
        }),
        getRolePermissionsAndAccessForEdit: build.query({
            query: id => {
                const KEY = `getRolePermissionsAndAccessForEditLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/roleManagement/${id}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['roleManagementById']
        }),
        createRoleMenuPermissions: build.mutation({
            query: payload => {
                const KEY = `createRoleMenuPermissionsLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/roleManagement`,
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['roleManagement', 'roleManagementData', 'roleManagementById']
        }),
        removeRolePermission: build.mutation({
            query: id => {
                const KEY = `removeRolePermissionLKey`
                dispatchLoaderEvent(KEY)
                return {
                    url: `/admin/roleManagement/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['roleManagement', 'roleManagementData', 'roleManagementById']
        })
    })
})

export const {
    useGetRolePermissionsQuery,
    useGetRolePermissionsAndAccessQuery,
    useGetRolePermissionsAndAccessForEditQuery,
    useCreateRoleMenuPermissionsMutation,
    useRemoveRolePermissionMutation,
    endpoints: { getRolePermissions, getRolePermissionsAndAccess, getRolePermissionsAndAccessForEdit }
} = rolePermissionSlice
