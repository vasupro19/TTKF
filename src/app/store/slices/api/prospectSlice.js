import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

/**
 * The super admin's Prospects: travel agencies to sell Travelytics to, what was sent to each, and the sales mailbox
 * (TTKB Controllers/prospect.controller.js). The API never returns the mailbox password, only whether one is set.
 */
const handled = (extra = {}) => ({ responseHandler: async result => customResponseHandler({ result }), ...extra })

export const prospectSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // the list for ListPage: `?search[value]=…&status=…&region=…&priority=…&sequence=…&start=&length=`
        getProspects: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getProspectsLKey'
                dispatchLoaderEvent(KEY)
                return {
                    url: `/prospects${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            }
        }),
        getProspectSummary: build.query({
            query: () => handled({ url: '/prospects/summary' })
        }),
        getProspect: build.query({
            query: id => handled({ url: `/prospects/${id}` })
        }),
        importProspects: build.mutation({
            query: rows => handled({ url: '/prospects/import', method: 'POST', body: { rows } })
        }),
        addProspect: build.mutation({
            query: body => handled({ url: '/prospects', method: 'POST', body })
        }),
        updateProspect: build.mutation({
            query: ({ id, ...body }) => handled({ url: `/prospects/${id}`, method: 'PUT', body })
        }),
        removeProspect: build.mutation({
            query: id => handled({ url: `/prospects/${id}`, method: 'DELETE' })
        }),
        setProspectStatus: build.mutation({
            query: ({ id, status }) => handled({ url: `/prospects/${id}/status`, method: 'PATCH', body: { status } })
        }),
        // `{ id, subject?, body? }` — left out: the wording of the email it is due
        emailProspect: build.mutation({
            query: ({ id, ...body }) => handled({ url: `/prospects/${id}/email`, method: 'POST', body })
        }),
        prospectWhatsappOpened: build.mutation({
            query: id => handled({ url: `/prospects/${id}/whatsapp`, method: 'POST' })
        }),
        // `{ id, kind: 'note' | 'call', text }`
        addProspectActivity: build.mutation({
            query: ({ id, ...body }) => handled({ url: `/prospects/${id}/activity`, method: 'POST', body })
        }),
        setProspectSequence: build.mutation({
            query: ({ id, on }) => handled({ url: `/prospects/${id}/sequence`, method: 'POST', body: { on } })
        }),
        // the list's own query string: every matching agency that can be emailed goes on the automatic emails
        startProspectSequence: build.mutation({
            query: query => handled({ url: `/prospects/sequence${query || ''}`, method: 'POST' })
        }),
        getOutreachSettings: build.query({
            query: () => handled({ url: '/prospects/settings' })
        }),
        // a password left out is kept, '' removes it
        saveOutreachSettings: build.mutation({
            query: body => handled({ url: '/prospects/settings', method: 'PUT', body })
        }),
        testOutreachSettings: build.mutation({
            query: body => handled({ url: '/prospects/settings/test', method: 'POST', body })
        })
    })
})

export const {
    useGetProspectSummaryQuery,
    useGetProspectQuery,
    useImportProspectsMutation,
    useAddProspectMutation,
    useUpdateProspectMutation,
    useRemoveProspectMutation,
    useSetProspectStatusMutation,
    useEmailProspectMutation,
    useProspectWhatsappOpenedMutation,
    useAddProspectActivityMutation,
    useSetProspectSequenceMutation,
    useStartProspectSequenceMutation,
    useGetOutreachSettingsQuery,
    useSaveOutreachSettingsMutation,
    useTestOutreachSettingsMutation,
    endpoints: { getProspects }
} = prospectSlice
