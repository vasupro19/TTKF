import { apiSliceConfig } from './configSlice'

export const masterAdminApi = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        makeMasterAdmin: build.mutation({
            query: credentials => ({
                url: '/make-masster-admin',
                method: 'POST',
                body: credentials
            })
        })
    })
})

export const { useMakeMasterAdminMutation } = masterAdminApi
