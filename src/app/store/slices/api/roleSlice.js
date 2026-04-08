import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

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
        getMainRoleById: build.query({
            query: id => ({
                url: `/role?id=${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            transformResponse: response => ({
                ...response,
                data: Array.isArray(response?.data) ? response.data[0] || null : response?.data || null
            }),
            providesTags: ['roleManagementById']
        }),
        createMainRole: build.mutation({
            query: payload => {
                const KEY = 'createMainRoleLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/role',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['roleManagement', 'roleManagementById']
        }),
        updateMainRole: build.mutation({
            query: ({ id, ...payload }) => {
                const KEY = 'updateMainRoleLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/role/${id}`,
                    method: 'PUT',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['roleManagement', 'roleManagementById']
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
        getClientRoleById: build.query({
            async queryFn(id, _api, _extraOptions, fetchWithBQ) {
                const result = await fetchWithBQ('/role/client')

                if (result.error) {
                    return { error: result.error }
                }

                const payload = await customResponseHandler({ result: result.data })
                const matchedRole = payload?.data?.find(role => Number(role.id) === Number(id)) || null

                return { data: { ...payload, data: matchedRole } }
            },
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
            invalidatesTags: ['clientRoleManagement', 'clientRoleManagementById']
        })
    })
})

export const {
    useGetMainRolesQuery,
    useGetMainRoleByIdQuery,
    useCreateMainRoleMutation,
    useUpdateMainRoleMutation,
    useGetClientRolesQuery,
    useGetClientRoleByIdQuery,
    useCreateClientRoleMutation,
    endpoints: { getMainRoles, getMainRoleById, getClientRoles, getClientRoleById }
} = roleSlice
