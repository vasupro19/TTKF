import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

/**
 * A client's mail server and its agency and supplier mailboxes — super admin only. The API never returns a
 * password, only whether one is set.
 */
export const clientMailSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getClientMail: build.query({
            query: clientId => ({
                url: `/client/${clientId}/mail`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        // `{ id, server: { host, port, secure }, agency: { email, password? }, supplier: { email, name, password? } }`
        // — a password left out is kept, '' removes it
        saveClientMail: build.mutation({
            query: ({ id, ...body }) => ({
                url: `/client/${id}/mail`,
                method: 'PUT',
                body,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        // `{ id, mailbox: 'agency' | 'supplier', server?, agency? | supplier? }` — signs in with what is on screen
        testClientMail: build.mutation({
            query: ({ id, ...body }) => ({
                url: `/client/${id}/mail/test`,
                method: 'POST',
                body,
                responseHandler: async result => customResponseHandler({ result })
            })
        })
    })
})

export const { useGetClientMailQuery, useSaveClientMailMutation, useTestClientMailMutation } = clientMailSlice
