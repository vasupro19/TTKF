import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const gmailSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // === GMAIL CONFIG ENDPOINTS ===

        getGmailConfigs: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getGmailConfigsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/gmail${query || ''}`, // GET /gmail
                    keepUnusedDataFor: 10,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['GmailConfig']
        }),

        getGmailConfigById: build.query({
            query: id => ({
                url: `/gmail/${id}`, // GET /gmail/:id
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['GmailConfigById']
        }),

        createGmailConfig: build.mutation({
            query: payload => {
                const KEY = 'createGmailConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/gmail', // POST /gmail
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['GmailConfig']
        }),

        updateGmailConfig: build.mutation({
            query: ({ id, ...updateData }) => {
                const KEY = 'updateGmailConfigLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/gmail/${id}`, // PUT /gmail/:id
                    method: 'PUT',
                    body: updateData,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['GmailConfig', 'GmailConfigById']
        }),
        connectGmail: build.query({
            query: () => {
                const KEY = 'connectGmailLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: '/auth-url', // <== backend route for Gmail OAuth URL
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            }
        })
    })
})

// Export hooks
export const {
    useGetGmailConfigsQuery,
    useGetGmailConfigByIdQuery,
    useCreateGmailConfigMutation,
    useUpdateGmailConfigMutation,
    useConnectGmailQuery,

    endpoints: { getGmailConfigs, getGmailConfigById, connectGmail }
} = gmailSlice
