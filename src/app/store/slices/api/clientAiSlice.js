import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

/**
 * A client's own AI keys and its daily allowance on the shared keys — super admin only. The API never returns a
 * key, only whether each is set and its last four characters.
 */
export const clientAiSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getClientAi: build.query({
            query: clientId => ({
                url: `/client/${clientId}/ai`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        // `{ id, keys: { gemini: 'new key' | null }, dailyLimit }` — a key left out is kept, null removes it
        saveClientAi: build.mutation({
            query: ({ id, ...body }) => ({
                url: `/client/${id}/ai`,
                method: 'PUT',
                body,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),
        // `{ id, provider, key? }` — tests the typed key, or the saved one
        testClientAiKey: build.mutation({
            query: ({ id, ...body }) => ({
                url: `/client/${id}/ai/test`,
                method: 'POST',
                body,
                responseHandler: async result => customResponseHandler({ result })
            })
        })
    })
})

export const { useGetClientAiQuery, useSaveClientAiMutation, useTestClientAiKeyMutation } = clientAiSlice
