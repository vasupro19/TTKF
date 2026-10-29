import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

const handle = async result => customResponseHandler({ result })

const kindUrl = kind => `/mail-templates/${encodeURIComponent(kind)}`

// ? the server answers a save or a reset with the kind as it is now: put it into the list at once, so the screen shows what was
// ? saved without waiting for the list to load again
const putKind = async ({ dispatch, queryFulfilled }) => {
    try {
        const { data: reply } = await queryFulfilled
        const kind = reply?.data
        if (!kind?.key) return
        dispatch(
            apiSliceConfig.util.updateQueryData('getMailTemplates', undefined, cached => {
                const kinds = cached?.data?.kinds
                if (!Array.isArray(kinds)) return
                cached.data.kinds = kinds.map(item => (item.key === kind.key ? kind : item))
            })
        )
    } catch (error) {
        // ? the save failed: nothing changed, and the screen shows why
    }
}

/**
 * The text of the emails the system sends, which an agency can word its own way (backend /v1/mail-templates). Only the agency's
 * admins and managers may use it: everyone else gets a 403. An agency's database that is not upgraded yet answers 409.
 */
export const mailTemplateSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ? → { data: { kinds: [{ key, label, audience, description, customised, updatedAt, updatedByName,
        // ?     theme (its own, or null when it follows the theme for all), themeUsed,
        // ?     slots: [{ key, label, help, multiline, optional, maxLength, default, value, customised }],
        // ?     placeholders: [{ name, description, sample }] }],
        // ?   themes: [{ key, label, description, swatch }], themeForAll, canChooseTheme } }
        getMailTemplates: build.query({
            query: () => ({ url: '/mail-templates', responseHandler: handle }),
            providesTags: ['MailTemplate']
        }),
        // `{ kind, slots }`: a string sets that slot, null puts it back to the default, a slot left out is not touched
        saveMailTemplate: build.mutation({
            query: ({ kind, slots }) => ({
                url: kindUrl(kind),
                method: 'PUT',
                body: { slots },
                responseHandler: handle
            }),
            invalidatesTags: ['MailTemplate'],
            onQueryStarted: (arg, api) => putKind(api)
        }),
        // `{ kind }`: every slot of the kind back to the default
        resetMailTemplate: build.mutation({
            query: ({ kind }) => ({ url: kindUrl(kind), method: 'DELETE', responseHandler: handle }),
            invalidatesTags: ['MailTemplate'],
            onQueryStarted: (arg, api) => putKind(api)
        }),
        // `{ kind, slots, theme }` → { data: { subject, html, theme }: the real email built from sample data with these texts, in
        // `theme` (else the one the kind goes out in); saves nothing
        previewMailTemplate: build.mutation({
            query: ({ kind, slots, theme }) => ({
                url: `${kindUrl(kind)}/preview`,
                method: 'POST',
                body: theme ? { slots, theme } : { slots },
                responseHandler: handle
            })
        }),
        // `{ kind, theme }`: kind is a kind of email or 'all'; theme a theme's key, or null to follow the theme for all (all: Classic)
        saveMailTheme: build.mutation({
            query: ({ kind, theme }) => ({
                url: `${kindUrl(kind)}/theme`,
                method: 'PUT',
                body: { theme },
                responseHandler: handle
            }),
            invalidatesTags: ['MailTemplate']
        }),
        // ? → { data: { themes: [{ key, label, description, swatch }] } }: for the send dialogs, open to anyone who sends email
        getMailThemes: build.query({
            query: () => ({ url: '/mail-templates/themes', responseHandler: handle }),
            keepUnusedDataFor: 3600
        })
    })
})

export const {
    useGetMailTemplatesQuery,
    useSaveMailTemplateMutation,
    useResetMailTemplateMutation,
    usePreviewMailTemplateMutation,
    useSaveMailThemeMutation,
    useGetMailThemesQuery
} = mailTemplateSlice
