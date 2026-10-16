import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

const handle = async result => customResponseHandler({ result })

// ? `?a=1&b=2` from an object, leaving out what is empty
const queryOf = (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') query.set(key, value)
    })
    const text = query.toString()
    return text ? `?${text}` : ''
}

/**
 * GST, invoices and incentives: the agency's GST settings, how each quote charges GST, the invoices made from
 * bookings, and what each person sold and earned. See the API's Controllers/tax, guestQuote, invoice and incentive.
 */
export const gstSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ---- the agency's GST settings: `{ ready, profile, suggestions, states }`
        getTaxProfile: build.query({
            query: () => ({ url: '/tax/profile', responseHandler: handle }),
            providesTags: ['TaxProfile']
        }),
        updateTaxProfile: build.mutation({
            query: body => ({ url: '/tax/profile', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['TaxProfile', 'QuoteTax']
        }),

        // ---- how a quote charges GST: `{ ready, registered, defaultRate, guestState, quotes }`
        getQuoteTaxes: build.query({
            query: leadId => ({ url: `/guest-quote/tax/${leadId}`, responseHandler: handle }),
            providesTags: ['QuoteTax']
        }),
        // `{ leadId, quoteNo, mode: 'none' | 'exclusive' | 'inclusive', rate, placeOfSupply?, customerGstin?, … }`
        setQuoteTax: build.mutation({
            query: body => ({ url: '/guest-quote/tax', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['QuoteTax', 'guestTourPrice']
        }),

        // ---- invoices
        // ?month=YYYY-MM | ?from&to, ?status, ?q, ?page (from 0), ?pageSize → rows, count, summary
        getInvoices: build.query({
            query: (filters = {}) => ({ url: `/invoices${queryOf(filters)}`, responseHandler: handle }),
            providesTags: ['InvoiceList']
        }),
        getBookingInvoices: build.query({
            query: packageId => ({ url: `/invoices/booking/${packageId}`, responseHandler: handle }),
            providesTags: ['InvoiceList']
        }),
        // `{ packageId, description?, customerName?, customerAddress? }`
        createInvoice: build.mutation({
            query: body => ({ url: '/invoices', method: 'POST', body, responseHandler: handle }),
            invalidatesTags: ['InvoiceList']
        }),
        // `{ invoice, html, to, subject, from, fromNote }`
        getInvoicePreview: build.query({
            query: id => ({ url: `/invoices/${id}/preview`, responseHandler: handle }),
            providesTags: ['InvoiceList']
        }),
        downloadInvoicePdf: build.mutation({
            query: id => ({ url: `/invoices/${id}/pdf`, method: 'GET', responseHandler: response => response.blob() }),
            async onQueryStarted(arg, { queryFulfilled }) {
                const key = 'downloadInvoicePdfKey'
                dispatchLoaderEvent(key)
                try {
                    await queryFulfilled
                } finally {
                    dispatchLoaderEvent(key, false)
                }
            }
        }),
        emailInvoice: build.mutation({
            query: ({ id, ...body }) => ({
                url: `/invoices/${id}/email`,
                method: 'POST',
                body,
                responseHandler: handle
            })
        }),
        cancelInvoice: build.mutation({
            query: ({ id, reason }) => ({
                url: `/invoices/${id}/cancel`,
                method: 'POST',
                body: { reason },
                responseHandler: handle
            }),
            invalidatesTags: ['InvoiceList']
        }),

        // ---- incentives
        // ?month=YYYY-MM → `{ month, rows, totals }` (the agency's owner and admins)
        getIncentiveReport: build.query({
            query: (month = '') => ({ url: `/incentives/report${queryOf({ month })}`, responseHandler: handle }),
            providesTags: ['Incentives']
        }),
        // ?month, ?months → one person's month booking by booking, and their last months
        getIncentiveUser: build.query({
            query: ({ userId, month = '', months = 6 }) => ({
                url: `/incentives/user/${userId}${queryOf({ month, months })}`,
                responseHandler: handle
            }),
            providesTags: ['Incentives']
        }),
        // the signed-in person's own month; `canManage` says whether to show the whole team too
        getMyIncentives: build.query({
            query: ({ month = '', months = 6 } = {}) => ({
                url: `/incentives/me${queryOf({ month, months })}`,
                responseHandler: handle
            }),
            providesTags: ['Incentives']
        }),
        getIncentivePlans: build.query({
            query: () => ({ url: '/incentives/plans', responseHandler: handle }),
            providesTags: ['IncentivePlans']
        }),
        // `{ userId?, basis, rate, targetPackages?, bonusAmount?, effectiveFrom?, note? }`
        saveIncentivePlan: build.mutation({
            query: body => ({ url: '/incentives/plans', method: 'PUT', body, responseHandler: handle }),
            invalidatesTags: ['IncentivePlans', 'Incentives']
        }),
        deleteIncentivePlan: build.mutation({
            query: id => ({ url: `/incentives/plans/${id}`, method: 'DELETE', responseHandler: handle }),
            invalidatesTags: ['IncentivePlans', 'Incentives']
        })
    })
})

export const {
    useGetTaxProfileQuery,
    useUpdateTaxProfileMutation,
    useGetQuoteTaxesQuery,
    useSetQuoteTaxMutation,
    useGetInvoicesQuery,
    useGetBookingInvoicesQuery,
    useCreateInvoiceMutation,
    useGetInvoicePreviewQuery,
    useDownloadInvoicePdfMutation,
    useEmailInvoiceMutation,
    useCancelInvoiceMutation,
    useGetIncentiveReportQuery,
    useGetIncentiveUserQuery,
    useGetMyIncentivesQuery,
    useGetIncentivePlansQuery,
    useSaveIncentivePlanMutation,
    useDeleteIncentivePlanMutation
} = gstSlice
