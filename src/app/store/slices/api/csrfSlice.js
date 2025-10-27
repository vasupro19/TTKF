import { apiSliceConfig } from './configSlice'

export const csrfSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        csrf: build.query({
            query: () => '/sanctum/csrf-cookie',
            credentials: 'include',
            providesTags: ['csrf']
        })
    }),
    overrideExisting: true
})

export const {
    endpoints: { csrf }
} = csrfSlice
