import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

/**
 * The trip (campaign) each quote of a lead is for — Himachal for Quote 1, Spiti for Quote 2. Its inclusions,
 * notes and bank details go on that quote's email, PDF and voucher.
 */
export const guestQuoteSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // `[{ quoteNo, campaignId }]` for the quotes whose trip was picked
        getGuestQuotes: build.query({
            query: leadId => ({
                url: `/guest-quote/lead/${leadId}`,
                responseHandler: async result => customResponseHandler({ result })
            })
        }),

        setGuestQuoteCampaign: build.mutation({
            query: payload => ({
                url: '/guest-quote/',
                method: 'PUT',
                body: payload,
                responseHandler: async result => customResponseHandler({ result })
            })
        })
    })
})

export const { useGetGuestQuotesQuery, useSetGuestQuoteCampaignMutation } = guestQuoteSlice
