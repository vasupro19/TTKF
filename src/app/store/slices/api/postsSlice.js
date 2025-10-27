import { apiSliceConfig } from './configSlice'

export const postsSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getPosts: build.query({
            query: () => '/posts',
            providesTags: result =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Post', id })), { type: 'Post', id: 'POSTSLIST' }]
                    : [{ type: 'Post', id: 'POSTSLIST' }]
        })
    }),
    overrideExisting: false
})

export const { useGetPostsQuery } = postsSlice
