import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

const handle = async result => customResponseHandler({ result })

/**
 * Where leads come in from on their own: the agency's enquiry mailboxes (read with an app password) and its
 * Facebook pages (connected with a Facebook login). The API never returns a password or a token.
 */
export const leadChannelsSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ---- email leads ----
        // `{ setUp, encryptionReady, users, mailboxes }`
        getLeadMailboxes: build.query({
            query: () => ({ url: '/lead-mailboxes', responseHandler: handle }),
            providesTags: ['LeadMailbox']
        }),
        // `{ email, password, host, port, secure, username?, id? }` — signs in, saves nothing
        testLeadMailbox: build.mutation({
            query: body => ({ url: '/lead-mailboxes/test', method: 'POST', body, responseHandler: handle })
        }),
        createLeadMailbox: build.mutation({
            query: body => ({ url: '/lead-mailboxes', method: 'POST', body, responseHandler: handle }),
            invalidatesTags: ['LeadMailbox']
        }),
        // a password left out is kept
        updateLeadMailbox: build.mutation({
            query: ({ id, ...body }) => ({
                url: `/lead-mailboxes/${id}`,
                method: 'PUT',
                body,
                responseHandler: handle
            }),
            invalidatesTags: ['LeadMailbox']
        }),
        syncLeadMailbox: build.mutation({
            query: id => ({ url: `/lead-mailboxes/${id}/sync`, method: 'POST', responseHandler: handle }),
            invalidatesTags: ['LeadMailbox']
        }),
        removeLeadMailbox: build.mutation({
            query: id => ({ url: `/lead-mailboxes/${id}`, method: 'DELETE', responseHandler: handle }),
            invalidatesTags: ['LeadMailbox']
        }),

        // ---- facebook leads ----
        // `{ appConfigured, stats, users, pages }` — each page with its live state from Facebook
        getFacebookOverview: build.query({
            query: () => ({ url: '/fb/overview', responseHandler: handle }),
            providesTags: ['FacebookPage']
        }),
        // the Facebook login link to send the browser to
        getFacebookConnectUrl: build.mutation({
            query: () => ({ url: '/fb/connect', responseHandler: handle })
        }),
        // the pages the user manages, after the Facebook login
        getFacebookSessionPages: build.query({
            query: session => ({ url: `/fb/connect/${session}`, responseHandler: handle })
        }),
        getFacebookSessionForms: build.query({
            query: ({ session, pageId }) => ({
                url: `/fb/connect/${session}/pages/${pageId}/forms`,
                responseHandler: handle
            })
        }),
        // `{ session, pageId, defaultAssignedTo, formIds }`
        connectFacebookPage: build.mutation({
            query: ({ session, ...body }) => ({
                url: `/fb/connect/${session}`,
                method: 'POST',
                body,
                responseHandler: handle
            }),
            invalidatesTags: ['FacebookPage']
        }),
        getFacebookPageForms: build.query({
            query: id => ({ url: `/fb/settings/${id}/forms`, responseHandler: handle })
        }),
        // `{ id, defaultAssignedTo?, formIds?, isActive? }`
        updateFacebookPage: build.mutation({
            query: ({ id, ...body }) => ({ url: `/fb/settings/${id}`, method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['FacebookPage']
        }),
        checkFacebookPage: build.mutation({
            query: id => ({ url: `/fb/settings/${id}/check`, method: 'POST', responseHandler: handle }),
            invalidatesTags: ['FacebookPage']
        }),
        disconnectFacebookPage: build.mutation({
            query: id => ({ url: `/fb/settings/${id}`, method: 'DELETE', responseHandler: handle }),
            invalidatesTags: ['FacebookPage']
        })
    })
})

export const {
    useGetLeadMailboxesQuery,
    useTestLeadMailboxMutation,
    useCreateLeadMailboxMutation,
    useUpdateLeadMailboxMutation,
    useSyncLeadMailboxMutation,
    useRemoveLeadMailboxMutation,
    useGetFacebookOverviewQuery,
    useGetFacebookConnectUrlMutation,
    useGetFacebookSessionPagesQuery,
    useGetFacebookSessionFormsQuery,
    useConnectFacebookPageMutation,
    useGetFacebookPageFormsQuery,
    useUpdateFacebookPageMutation,
    useCheckFacebookPageMutation,
    useDisconnectFacebookPageMutation
} = leadChannelsSlice
