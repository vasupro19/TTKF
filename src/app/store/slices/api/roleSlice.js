import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

// ? a role's screens open in the sidebar of whoever holds it, and show locked on their permissions page
const ROLE_CHANGED = ['clientRoleManagement', 'clientRoleManagementById', 'menu', 'Menu']

/**
 * The platform keeps two roles, ADMIN (the super admin) and CLIENT (an agency's own login); they can't be
 * created or changed (the API refuses). Each agency makes its own roles under /role/client.
 */
export const roleSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getMainRoles: build.query({
            query: () => {
                const KEY = 'getMainRolesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/role',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['roleManagement']
        }),
        getClientRoles: build.query({
            query: () => {
                const KEY = 'getClientRolesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/role/client',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            providesTags: ['clientRoleManagement']
        }),
        // ? every screen the agency may give a new role, and what each access level means
        getClientRoleMenus: build.query({
            query: () => ({
                url: '/role/client/menus',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['clientRoleManagementById']
        }),
        // ? one role, with every screen the agency may give marked when the role has it
        getClientRoleById: build.query({
            query: id => ({
                url: `/role/client/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['clientRoleManagementById']
        }),
        createClientRole: build.mutation({
            query: payload => {
                const KEY = 'createClientRoleLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/role/client',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ROLE_CHANGED
        }),
        updateClientRole: build.mutation({
            query: ({ id, ...payload }) => {
                const KEY = 'updateClientRoleLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/role/client/${id}`,
                    method: 'PUT',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ROLE_CHANGED
        }),
        deleteClientRole: build.mutation({
            query: id => {
                const KEY = 'deleteClientRoleLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/role/client/${id}`,
                    method: 'DELETE',
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ROLE_CHANGED
        })
    })
})

export const {
    useGetMainRolesQuery,
    useGetClientRolesQuery,
    useGetClientRoleMenusQuery,
    useGetClientRoleByIdQuery,
    useCreateClientRoleMutation,
    useUpdateClientRoleMutation,
    useDeleteClientRoleMutation,
    endpoints: { getMainRoles, getClientRoles, getClientRoleById }
} = roleSlice
