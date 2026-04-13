import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

const FB_PAGE_BASE_URL = '/fb/pages'

export const facebookSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getFacebookPages: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getFacebookPagesLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/fb/settings${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['FacebookPage']
        }),

        getFacebookPageById: build.query({
            query: id => ({
                url: `${FB_PAGE_BASE_URL}/${id}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['FacebookPageById']
        }),

        createFacebookPage: build.mutation({
            query: payload => {
                const KEY = 'createFacebookPageLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/fb/settings',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['FacebookPage']
        }),

        updateFacebookPage: build.mutation({
            query: ({ id, ...payload }) => {
                const KEY = 'updateFacebookPageLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/fb/settings/${id}`,
                    method: 'PUT',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['FacebookPage', 'FacebookPageById']
        })
    })
})

export const {
    useGetFacebookPagesQuery,
    useGetFacebookPageByIdQuery,
    useCreateFacebookPageMutation,
    useUpdateFacebookPageMutation,
    endpoints: { getFacebookPages, getFacebookPageById }
} = facebookSlice
